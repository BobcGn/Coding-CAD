# Brownfield Architecture Pipeline Design / Brownfield 架构流水线设计说明

## 1. 做了什么 / What

- 设计并打通了 Brownfield 架构工作区端到端产品流水线：
  1. 打开仓库：用户通过 UI 输入或选择本地代码仓库路径；
  2. 宿主反演：SvelteKit 服务端路由安全调用 Node-only `@coding-cad/implementation-analyzer` 执行代码扫描与 AST 反演；
  3. 重建架构：生成标准的 `ArchitectureProject`（与 Greenfield 共享完全相同的单一事实源架构模型）；
  4. 语义布局：通过 `BrowserWorkerLayoutEngine`（ELK Web Worker 进程）计算分层语义布局，维持阶段 3 的零 fallback 门禁；
  5. 交互展示：Canvas 渲染组件与连接，独立管理缩放/视口/折叠等 ViewState；Inspector 通过 `evidence-codec` 展示来源类型、置信度（层级先验）、依赖种类及相对路径；提供模块与基础设施分组、折叠与隐藏计数指示；
- 新增安全路由端点 `POST /api/workspace/analyze-repository`，执行严格的宿主边界安全模型；
- 新增安全负控测试（路径遍历 `..`、根目录外符号链接、超限截断、敏感目录忽略、DTO 纯净性无源码正文）；
- 完善不支持结构与截断告警的界面提示。

- Designed and connected the end-to-end Brownfield Architecture Workspace pipeline:
  1. Open Repository: User provides or chooses a local repository root path in the UI.
  2. Host Analysis: SvelteKit server route securely calls the Node-only `@coding-cad/implementation-analyzer` for AST-accurate reverse engineering.
  3. Reconstruct Architecture: Emits a standard `ArchitectureProject` (identical single-source-of-truth model to Greenfield).
  4. Semantic Layout: Dispatches to `BrowserWorkerLayoutEngine` (ELK worker) for layout calculation, preserving the zero-fallback gate from Phase 3.
  5. Canvas & Inspector: Renders components and connections while isolating ViewState (zoom, pan, collapse); Inspector displays evidence provenance, Layer Priors, dependency kinds, and relative paths via `evidence-codec`; supports module/infra grouping, collapse/expand, and hidden counts;
- Added a secure server route endpoint `POST /api/workspace/analyze-repository` enforcing strict host boundary rules.
- Added negative security tests (path traversal, symlink escape, resource truncation, ignored directories, DTO purity without source code).
- Integrated unsupported structures and truncation warnings in the UI.

---

## 2. 为什么这么做 / Why

- 单一架构事实源契约：Brownfield 反演产物必须与 Greenfield 产物是同一类型的 `ArchitectureProject`，不得创建第二套架构模型或在 Layout/UI 层面引入分支逻辑。
- 架构状态与视图状态严格分离：缩放、视口位置、折叠展开属于视图状态（ViewState），存储于 `WorkspaceViewState`，绝不污染反演出的架构事实。
- 零静默降级：对于不支持的仓库结构、语言或截断情况，必须显式向上冒泡并在 DTO 与 UI 中明确提示，不得产出空图或静默丢边。
- 依赖方向合规：Node-only 的 `implementation-analyzer` 严格隔离在 SvelteKit 服务端路由内；浏览器端仅消费 JSON-serializable DTO 与带类型的编解码器。

- Single Source of Truth: Reverse-engineered Brownfield models must be standard `ArchitectureProject` instances, avoiding duplicate architecture models.
- Separation of Architecture & View State: Pan, zoom, and collapse state reside in `WorkspaceViewState`, never polluting architecture facts.
- Zero Silent Degradation: Unparseable syntax, unsupported layouts, or truncated scans must be surfaced explicitly in DTO and UI banners rather than failing silently.
- Proper Layering: Node-only analysis executes strictly behind SvelteKit server routes, and browser bundles receive pure DTOs.

---

## 3. 验证结果 / Verification

- 状态分类 / Status:
  - 已实现并验证：
    - 服务端安全路由与安全负控测试（路径穿越拦截、符号链接逃逸拦截、资源超限显式截断、忽略目录过滤、源码正文脱敏）；
    - 浏览器端组件与检查器证据展示（经由 `decodeComponentEvidence` 与 `decodeConnectionEvidence` 解码）；
    - 自动化单元与集成测试：`pnpm test` 全量通过；
  - 待后续步骤验证：步骤 4 的 Validator 导航与步骤 5 的真实浏览器 Playwright E2E。
- 风险与回退方式 / Risks & Rollback:
  - 风险：超大单体仓库若超过默认文件或时间上限，会产生截断提示。用户可按需分批或分目录分析。
  - 回退方式：`git revert <commit-hash>` 可独立回退 Brownfield 产品流水线路由与 UI 适配。

---

## 4. 宿主边界与安全模型 / Host Boundary & Security Model

### 4.1 Node-only Analyzer 宿主边界
`@coding-cad/implementation-analyzer` 依赖 Node.js 文件系统与 TypeScript Compiler API，**仅在 SvelteKit 服务端路由（`apps/web/src/routes/api/...`）内执行**，绝不被打包进客户端浏览器 Bundle。浏览器端仅消费标准化 `ArchitectureProject` 及安全的分析元数据 DTO。

### 4.2 现有 SvelteKit 路由现状与能力认定
经对 `apps/web/src/routes/api/` 的既有实现审计：
- 现有路由 `api/workspace` 与 `api/workspace/[id]` 仅在受控的固定工作区根目录（`WORKSPACE_ROOT`，默认为 `.coding-cad/`）下读写特定工作区快照；
- **现有路由此前没有任何读取任意本地文件目录的先例**；
- 因此，本次打开本地代码仓库是一项**新增的宿主能力**。该能力必须严格落实用户已批准的安全默认值，不得超出经授权的权限边界。

### 4.3 安全默认值落实机制
服务端路由 `POST /api/workspace/analyze-repository` 强制执行以下 8 项安全控制措施：

1. **仅本机访问（Loopback only）**：
   - 服务端路由校验请求来源的主机名与 IP 地址，仅允许来自 `localhost`、`127.0.0.1`、`::1` 的请求；拒绝任何外部非本机网络调用。
2. **用户显式指定根目录（Explicit Path）**：
   - 拒绝缺省遍历或系统根路径；用户必须显式提供合法的仓库绝对路径或相对于项目根的相对路径。
3. **真实路径规范化与目录逃逸防御（Realpath Containment）**：
   - 路径必须通过 `fs.realpath` 进行符号链接解引用与规范化解析；
   - 严格校验解析后的真实物理路径必须以指定根目录为前缀；
   - 任何包含 `..` 试图逃逸根目录的相对路径，或指向根目录外部的符号链接，均在分析前被直接拒绝（返回 400 Bad Request）。
4. **只读保证与零脚本执行（Read-only & No Script Execution）**：
   - 分析器全程只调用 `readFile`/`readdir`/`stat` 只读系统调用；
   - 绝不执行目标仓库内的任何 `npm scripts`、`install`、`postinstall` 或构建脚本，防止恶意代码注入执行。
5. **默认忽略安全敏感与缓存目录（Default Ignores）**：
   - 扫描器强制忽略以下目录与文件：
     - 版本控制：`.git`、`.svn`、`.hg`
     - 依赖与缓存：`node_modules`、`.turbo`、`.next`、`dist`、`build`、`coverage`、`target`、`vendor`
     - 密钥与环境变量：`.env*`、`*.pem`、`*.key`、`id_rsa*`
6. **资源上限与显式截断（Resource Caps & Explicit Truncation）**：
   - **单文件大小上限**：默认 2 MB。超过上限的文件跳过 AST 分析并记录截断说明；
   - **扫描文件总数上限**：默认 5,000 个源文件。达到上限时终止收集，显式在 DTO 的 `inspection.truncated` 字段中返回 `"hitLimit": "file-count"`，绝不静默丢弃；
   - **总耗时超时上限**：默认 30,000 ms（30 秒）。超时中断反演并返回显式截断状态。
7. **浏览器 DTO 脱敏（Browser DTO Purity）**：
   - 返回浏览器的 DTO 仅包含反演出的 `ArchitectureProject` 结构、组件名称、相对文件路径、导出的符号标识符及不支持结构报告；
   - **绝不返回源代码文本内容**，确保源码不流入浏览器内存或控制台。
8. **安全日志记录（Zero Source in Logs）**：
   - 服务端与分析器日志仅记录统计指标（耗时、模块数、连接数、忽略数），严禁在日志中输出源码正文或敏感配置信息。
