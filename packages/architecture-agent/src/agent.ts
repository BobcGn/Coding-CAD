import { generateDSL } from "@coding-cad/architecture-dsl";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import {
  builtinComponentDefinitions,
  createComponentRegistry,
  type ComponentDefinition,
  type ComponentRegistry
} from "@coding-cad/component-registry";
import {
  ArchitectureValidator,
  type ValidationResult
} from "@coding-cad/architecture-validator";
import type { AgentContext } from "./context.js";
import type { LLMProvider } from "./llm/provider.js";
import { MockLLMProvider } from "./llm/mock-provider.js";
import {
  HeuristicRequirementAnalyzer,
  type RequirementAnalyzer
} from "./requirement/analyzer.js";
import {
  HeuristicDecisionMaker,
  type DecisionMaker
} from "./reasoning/decision-maker.js";
import {
  HeuristicArchitecturePlanner,
  type ArchitecturePlanner
} from "./planner/planner.js";
import {
  ValidatorFeedbackRefinementLoop,
  type RefinementLoop
} from "./validation/refinement-loop.js";
import { architectureSystemPrompt } from "./prompts/architecture-system-prompt.js";

export interface ArchitectureAgentOptions {
  readonly llmProvider?: LLMProvider;
  readonly requirementAnalyzer?: RequirementAnalyzer;
  readonly decisionMaker?: DecisionMaker;
  readonly planner?: ArchitecturePlanner;
  readonly refinementLoop?: RefinementLoop;
  readonly registry?: ComponentRegistry;
  readonly validator?: ArchitectureValidator;
}

export class ArchitectureAgent {
  private readonly llmProvider: LLMProvider;
  private readonly requirementAnalyzer: RequirementAnalyzer;
  private readonly decisionMaker: DecisionMaker;
  private readonly planner: ArchitecturePlanner;
  private readonly refinementLoop: RefinementLoop;
  private readonly registry: ComponentRegistry;
  private readonly validator: ArchitectureValidator;

  constructor(options: ArchitectureAgentOptions = {}) {
    this.llmProvider = options.llmProvider ?? new MockLLMProvider();
    this.requirementAnalyzer = options.requirementAnalyzer ?? new HeuristicRequirementAnalyzer();
    this.decisionMaker = options.decisionMaker ?? new HeuristicDecisionMaker();
    this.planner = options.planner ?? new HeuristicArchitecturePlanner({
      decisionMaker: this.decisionMaker
    });
    this.refinementLoop = options.refinementLoop ?? new ValidatorFeedbackRefinementLoop();
    this.registry = options.registry ?? createComponentRegistry();
    this.validator = options.validator ?? new ArchitectureValidator(undefined, {
      registry: this.registry
    });
  }

  async design(requirement: string): Promise<ArchitectureProject> {
    const context = await this.createContext(requirement);
    const analysis = await this.requirementAnalyzer.analyze(context.requirement);

    await this.llmProvider.generate(`${architectureSystemPrompt}\n\nRequirement:\n${context.requirement}`);

    const draft = await this.planner.plan(analysis);
    const validation = this.validator.validate(draft);
    const refined = await this.refinementLoop.refine(draft, validation);
    const refinedValidation = this.validator.validate(refined);

    if (!refinedValidation.valid) {
      return {
        ...refined,
        decisions: [
          ...refined.decisions,
          {
            title: "Keep unresolved validation feedback visible",
            context: refinedValidation.summary,
            decision: "Return the Architecture IR with validator feedback preserved in decisions for human review.",
            alternatives: ["Hide unresolved validator findings", "Generate source code anyway"],
            rationale: "Architecture Agent must not bypass validation. Returning IR keeps the design reviewable without pretending unresolved issues are fixed."
          }
        ]
      };
    }

    return refined;
  }

  validate(architecture: ArchitectureProject): ValidationResult {
    return this.validator.validate(architecture);
  }

  toDsl(architecture: ArchitectureProject): string {
    return generateDSL(architecture);
  }

  private async createContext(requirement: string): Promise<AgentContext> {
    return {
      requirement,
      availableComponents: this.availableComponents()
    };
  }

  private availableComponents(): readonly ComponentDefinition[] {
    const registered = this.registry.list();
    return registered.length > 0 ? registered : builtinComponentDefinitions;
  }
}
