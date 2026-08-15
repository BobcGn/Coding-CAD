/**
 * Pure, browser-safe exports of @coding-cad/workspace.
 *
 * This entry exports only modules with no Node built-in dependencies
 * (diff and version). It exists so browser bundles (P3-D1) can consume the
 * workspace diff/version logic without pulling in node:fs storage code.
 *
 * @coding-cad/workspace 的纯逻辑、browser-safe 导出入口。只导出不含 Node
 * 内建依赖的模块（diff 与 version）。浏览器 bundle（P3-D1）可以消费
 * workspace 的 diff/version 逻辑而不引入 node:fs 存储代码。
 */

export type { ArchitectureDiff, ChangedValue } from "./diff.js";
export { compareArchitectures } from "./diff.js";
export {
  assertArchitectureVersion,
  nextArchitectureVersion,
  type ArchitectureVersion
} from "./version.js";
