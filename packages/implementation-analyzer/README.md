# `@coding-cad/implementation-analyzer`

`implementation-analyzer` 将已有源代码仓库逆向映射为 Coding CAD 的 `ArchitectureProject`，回答“软件当前是什么结构”。它服务于 Brownfield 项目理解，不是代码审查器、IDE、Linter 或 Compiler。

`implementation-analyzer` reverse-engineers an existing source repository into Coding CAD `ArchitectureProject`, answering “what structure does this software have now?” It supports brownfield understanding and is not a code reviewer, IDE, linter, or compiler.

## 数据流 / Data Flow

```text
Source Repository
  -> RepositorySnapshot
  -> technology + module + dependency evidence
  -> Architecture Mapper
  -> ArchitectureProject
```

Architecture IR 是唯一架构表示。`RepositoryInspection`、module 和 dependency graph 只保存检测证据与不确定性，不构成第二套架构模型。

Architecture IR is the sole architecture representation. `RepositoryInspection`, modules, and dependency graphs only preserve detection evidence and uncertainty; they are not a second architecture model.

## 第一阶段能力 / Phase-One Capabilities

- 扫描仓库文件并忽略 `.git`、`node_modules`、`dist`、`build` 和 coverage 等生成目录。
- 识别语言、配置文件和 `package.json` 等依赖 manifest。
- 优先识别 TypeScript/JavaScript、NestJS、Express、Prisma、TypeORM、PostgreSQL 和 Redis。
- 通过 `src/` 目录和 `*.service.ts` 推断逻辑模块。
- 通过相对 import 推断模块依赖，通过 package import 推断数据库和缓存连接。
- 输出可直接交给 Validator、Review、Workspace 和其他现有 IR 消费者的 `ArchitectureProject`。

- Scan repository files while excluding generated directories such as `.git`, `node_modules`, `dist`, `build`, and coverage.
- Detect languages, configuration files, and dependency manifests such as `package.json`.
- Prioritize TypeScript/JavaScript, NestJS, Express, Prisma, TypeORM, PostgreSQL, and Redis.
- Infer logical modules from `src/` directories and `*.service.ts` files.
- Infer module dependencies from relative imports and database/cache connections from package imports.
- Emit `ArchitectureProject` for existing Validator, Review, Workspace, and other IR consumers.

## 使用 / Usage

```ts
import { analyzeRepository, ImplementationAnalyzer } from "@coding-cad/implementation-analyzer";

const architecture = await analyzeRepository("/path/to/repository");

const analyzer = new ImplementationAnalyzer();
const evidence = await analyzer.inspect("/path/to/repository");
```

## 边界 / Boundaries

第一阶段不进行完整 AST 理解、AI 代码解释、代码审查、Architecture IR 修改、代码生成或自动修复。检测结果允许不确定，confidence 仅表达证据强度，不会把推断伪装成人工确认的事实。

Phase one does not perform full AST understanding, AI code explanation, code review, Architecture IR mutation, code generation, or automatic remediation. Detection may be uncertain; confidence expresses evidence strength without presenting inference as human-confirmed fact.
