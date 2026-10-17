import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { DependencyDetector, type TechnologyInfo } from "./detector/dependency-detector.js";
import { DependencyGraphBuilder, type DependencyGraph } from "./graph/dependency-graph.js";
import { ArchitectureMapper, type RepositoryAnalysisEvidence } from "./mapper/architecture-mapper.js";
import { RepositoryScanner, type ScannerOptions } from "./repository/scanner.js";
import type { RepositorySnapshot, UnsupportedStructureReport } from "./repository/snapshot.js";
import { ModuleAnalyzer, type ImplementationModule } from "./structure/module-analyzer.js";

export interface RepositoryInspection {
  readonly snapshot: RepositorySnapshot;
  readonly technology: TechnologyInfo;
  readonly modules: readonly ImplementationModule[];
  readonly dependencyGraph: DependencyGraph;
  readonly unsupportedStructures?: readonly UnsupportedStructureReport[] | undefined;
  readonly isTruncated?: boolean | undefined;
  readonly truncationReason?: string | undefined;
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

  async inspect(rootPath: string, options: ScannerOptions = {}): Promise<RepositoryInspection> {
    const snapshot = await this.scanner.scan(rootPath, options);
    const technology = this.dependencyDetector.detect(snapshot.languages, snapshot.dependencies);
    const modules = await this.moduleAnalyzer.analyze(snapshot);
    const dependencyGraph = await this.dependencyGraphBuilder.build(snapshot, modules);
    const unsupportedStructures = [
      ...(snapshot.unsupportedStructures ?? []),
      ...(dependencyGraph.unsupportedReports ?? [])
    ];
    return {
      snapshot,
      technology,
      modules,
      dependencyGraph,
      unsupportedStructures,
      ...(snapshot.isTruncated ? { isTruncated: snapshot.isTruncated, truncationReason: snapshot.truncationReason } : {})
    };
  }

  async analyze(rootPath: string, options: ScannerOptions = {}): Promise<ArchitectureProject> {
    const inspection = await this.inspect(rootPath, options);
    return this.architectureMapper.map({
      ...inspection,
      unsupportedStructures: inspection.unsupportedStructures
    } satisfies RepositoryAnalysisEvidence);
  }
}

export async function analyzeRepository(rootPath: string, options: ScannerOptions = {}): Promise<ArchitectureProject> {
  return new ImplementationAnalyzer().analyze(rootPath, options);
}
