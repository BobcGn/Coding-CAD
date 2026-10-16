# ELK Browser Root Cause / ELK 浏览器根因

日期 / Date: 2026-10-16。分支 / Branch: codex/phase-3-greenfield-workspace。诊断基线 / Baseline: 2e4a500。

## Reproduction / 复现

运行 `python3 logs/validation/p3-closeout/elk-browser/diagnose.py`：先从源码重建Web及依赖，再分别启动dev与vite preview，以真实Chrome生成默认积分架构。临时Workspace与服务器自动清理。 / The script rebuilds sources, starts dev and production preview separately, generates the default architecture in real Chrome, and cleans temporary storage/servers.

- Dev: `Layout fallback: _Worker is not a constructor`; pageErrors=[]; five Canvas nodes / 5个节点。
- Production preview: `Layout fallback: H8 is not a constructor`; pageErrors=[]; five Canvas nodes / 5个节点。H8是压缩后符号，不是不同根因 / H8 is the minified equivalent.
- 原始证据 / Raw evidence: baseline-modes.json, baseline-build.txt, baseline-dev.png, baseline-preview.png。

## Import and worker boundary / 导入与Worker边界

`packages/architecture-layout`固定依赖elkjs 0.12.0。`src/engines/elk/elk-engine.ts`动态导入`elkjs/lib/elk.bundled.js`，normalize外层CJS/ESM default后构造ELK。`apps/web/src/lib/layout/worker/layout-worker.ts`在既有module Worker中调用同一engine；compiler passes仍在调用侧，符合D-010。Vite配置为worker.format=es，未特别配置ELK optimizeDeps。 / The fixed dependency is imported dynamically inside the existing solver-only module worker; caller-side compiler passes and public APIs are unchanged.

## Proven causal chain / 已验证因果链

elk.bundled.js内嵌的elk-worker.min.js初始化分支先检测“无document且有self”，安装`self.onmessage`，只有else分支才写入CommonJS的`module.exports.Worker`。在真实Web Worker中，前一条件成立，即使该代码正在Browserify的CommonJS模块中执行，仍不导出Worker。外层ELKNode随后读取`require('./elk-worker.min.js').Worker`得到undefined，再执行`new _Worker(url)`而失败。 / The embedded worker initializer prioritizes standalone-worker auto-attachment over its CommonJS export. In a module worker it overwrites self.onmessage and fails to export Worker; the outer ELKNode constructor then invokes an undefined constructor.

`_Worker`来自elkjs自身ELKNode包装器，不来自应用Worker类或外部web-worker依赖；production把它压缩为H8。既有应用catch会将异常变成LayoutResult.status=fallback，因此无pageerror且旧E2E仍通过。 / The symbol belongs to elkjs itself. The application catches the solver error and returns fallback, explaining the absence of page errors and prior green UI tests.

## Minimal experiment / 最小实验

运行 `node logs/validation/p3-closeout/elk-browser/entry-experiment.mjs`。同一个bundle在Node下成功，2节点/1条已路由边；在self=globalThis、无document的隔离VM中复现同一异常且原onmessage被覆盖；仅在内存将CJS导出分支前置后，2节点/1条已路由边成功，原onmessage不变。没有改动产品源码或node_modules来取得此证据。 / Identical bundle and graph succeed in Node, fail in a worker-equivalent VM, and succeed with preserved message ownership after an in-memory CJS-first guard correction.

实验初版用普通对象模拟self，缺少Worker内建对象，出现stackTraceLimit错误；修正为self=globalThis后才得到可用根因证据。输入也在对应realm构造，避免跨realm数组影响。 / An initial incomplete test scaffold lacked worker builtins; the final experiment uses the actual global object and creates graph inputs in the correct realm.

## Candidate fixes and choice / 候选修复与选择

1. normalize更多default层级：不解决内嵌模块未导出Worker，放弃。 / More default normalization does not repair the missing inner export.
2. 仅调整optimizeDeps或Vite transform：dev/production均复现，bundle环境分支本身错误；字符串transform容易遗漏模式，放弃。 / Bundler-only tuning risks mode-specific coverage and does not fix the guard itself.
3. 换solver、新增实际Worker或搬compiler：违反本任务边界，排除。 / Solver replacement, another physical worker or compiler relocation is prohibited.
4. **选择：对固定elkjs 0.12.0做可重复pnpm补丁，只让内嵌模块优先CommonJS导出，独立worker脚本场景仍保留auto-attach。** 不改变算法、版本、实际Worker数量、D-010边界或architecture-layout公开API。 / Choose a version-pinned reproducible pnpm patch that prefers CommonJS export while retaining standalone auto-attachment. No solver, version, physical-worker boundary or public API changes.

节点移动容差已有批准记录：`docs/architecture-layout.md`规定未受影响节点p95≤48px、max≤144px且无相对顺序翻转。无重叠按任务要求硬断言；交叉/语义层级指标若无批准阈值，只记录数据。 / Existing movement tolerances are explicit; no-overlap is mandatory, while metrics without approved thresholds are reported without invented pass lines.
