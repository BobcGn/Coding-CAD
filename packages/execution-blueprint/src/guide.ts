export interface AgentGuide {
  readonly systemContext: string;
  readonly architectureSummary: string;
  readonly decisions: readonly string[];
  readonly forbiddenChanges: readonly string[];
  readonly acceptanceCriteria: readonly string[];
}
