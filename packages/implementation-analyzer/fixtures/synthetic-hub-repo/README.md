# SYNTHETIC HUB BENCHMARK FIXTURE / 合成中心包基准测试仓库

> **WARNING / 警告**: This is a purely synthetic repository fixture generated for layout, performance, and scalability baselines with a central shared hub package, cross-tier calls, cycles, and bridge connectors. It is NOT a real repository. Do NOT present results from this fixture as real repository results.
> 本仓库是用于布局、性能与伸缩性基线的纯合成测试夹具，包含中心共享包、跨层调用、循环依赖与桥接模块，不是真实仓库。不得将本合成夹具的测试结果表述为真实仓库结果。

- Packages: 14
- Total modules: 57
- Central Hub: pkg-hub-core (depended on by 13 packages)
- Cycle: pkg-service-order <-> pkg-service-inventory
- Bridge: pkg-bridge-connector (pkg-legacy-crm -> modern services)
- Cross-tier: pkg-analytics-pipeline, pkg-audit-logging, pkg-service-billing
