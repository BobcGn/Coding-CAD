# `@coding-cad/workspace`

`workspace` provides project-level lifecycle management around Architecture IR. It preserves architecture snapshots and lifecycle evidence without becoming a source repository, Git replacement, Agent runtime, or deployment system.

Architecture IR remains the source of truth. A workspace stores immutable point-in-time copies of that IR and relates validation results, execution blueprints, and architecture decision records to explicit lifecycle versions.

## MVP API

```ts
import { Workspace } from "@coding-cad/workspace";

const workspace = await Workspace.create("./.coding-cad", architectureProject);
await workspace.saveSnapshot(nextArchitectureProject);

const current = workspace.loadLatestArchitecture();
const diff = workspace.compareVersions(1, 2);
await workspace.addDecision(architectureDecision);
const report = workspace.exportReport();
```

The file storage adapter writes one `workspace.json` document atomically inside the supplied directory. `ArchitectureProject.version` remains the IR schema version; the numeric snapshot version is the workspace's architecture lifecycle version.

## Boundaries

- Depends on the public contracts of `architecture-ir`, `architecture-validator`, and `execution-blueprint`.
- Stores blueprints exactly as generated; it does not duplicate blueprint generation.
- Does not render Agent instructions or add another Agent adapter.
- Does not invoke or manage external Coding Agents.
- Does not inspect source code or replace Git history.
