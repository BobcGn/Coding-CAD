import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { DependencyDetector, type TechnologyInfo } from "./detector/dependency-detector.js";
import { DependencyGraphBuilder, type DependencyGraph } from "./graph/dependency-graph.js";
import { ArchitectureMapper, type RepositoryAnalysisEvidence } from "./mapper/architecture-mapper.js";
import { RepositoryScanner } from "./repository/scanner.js";
import type { RepositorySnapshot } from "./repository/snapshot.js";
import { ModuleAnalyzer, type ImplementationModule } from "./structure/module-analyzer.js";

export interface RepositoryInspection {
  readonly snapshot: RepositorySnapshot;
  readonly technology: TechnologyInfo;
  readonly modules: readonly ImplementationModule[];
  readonly dependencyGraph: DependencyGraph;
}

export interface ImplementationAnalyzerDependencies {
  readonly scanner?: RepositoryScanner;
  readonly dependencyDetector?: DependencyDetector;
  readonly moduleAnalyzer?: ModuleAnalyzer;
  readonly dependencyGraphBuilder?: DependencyGraphBuilder;
  readonly architectureMapper?: ArchitectureMapper;
}

/** Coordinates evidence extraction and returns Architecture IR as the sole architecture model. */
export class ImplementationAnalyzer {
  private readonly scanner: RepositoryScanner;
  private readonly dependencyDetector: DependencyDetector;
  private readonly moduleAnalyzer: ModuleAnalyzer;
  private readonly dependencyGraphBuilder: DependencyGraphBuilder;
  private readonly architectureMapper: ArchitectureMapper;

  constructor(dependencies: ImplementationAnalyzerDependencies = {}) {
    this.scanner = dependencies.scanner ?? new RepositoryScanner();
    this.dependencyDetector = dependencies.dependencyDetector ?? new DependencyDetector();
    this.moduleAnalyzer = dependencies.moduleAnalyzer ?? new ModuleAnalyzer();
    this.dependencyGraphBuilder = dependencies.dependencyGraphBuilder ?? new DependencyGraphBuilder();
    this.architectureMapper = dependencies.architectureMapper ?? new ArchitectureMapper();
  }

  async inspect(rootPath: string): Promise<RepositoryInspection> {
    const snapshot = await this.scanner.scan(rootPath);
    const technology = this.dependencyDetector.detect(snapshot.languages, snapshot.dependencies);
    const modules = this.moduleAnalyzer.analyze(snapshot);
    const dependencyGraph = await this.dependencyGraphBuilder.build(snapshot, modules);
    return { snapshot, technology, modules, dependencyGraph };
  }

  async analyze(rootPath: string): Promise<ArchitectureProject> {
    const inspection = await this.inspect(rootPath);
    return this.architectureMapper.map(inspection satisfies RepositoryAnalysisEvidence);
  }
}

export async function analyzeRepository(rootPath: string): Promise<ArchitectureProject> {
  return new ImplementationAnalyzer().analyze(rootPath);
}
