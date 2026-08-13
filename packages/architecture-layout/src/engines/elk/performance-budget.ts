export interface LayoutPerformanceBudget {
  readonly nodes: number;
  readonly edges: number;
  readonly p95Ms: number;
}

export const LAYOUT_PERFORMANCE_BUDGETS: readonly LayoutPerformanceBudget[] = [
  { nodes: 100, edges: 150, p95Ms: 250 },
  { nodes: 500, edges: 800, p95Ms: 1500 }
];

export const ELK_WORKER_GZIP_BUDGET_BYTES = 550 * 1024;
