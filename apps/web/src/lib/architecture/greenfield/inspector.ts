import type { Component, Contract } from "@coding-cad/architecture-ir";
import type { ValidationIssue } from "@coding-cad/architecture-validator";

/**
 * P3.5 Semantic Inspector view model.
 *
 * Projects a selected component's semantics (name, description, type,
 * capabilities, contracts) plus its validation issues. Edits emit explicit
 * field-specific commands (P3-D3); no generic JSON patch and no
 * width/height/color/border controls.
 *
 * P3.5 Semantic Inspector 视图模型。投影选中组件的 semantics（name、
 * description、type、capabilities、contracts）及其 validation issues。
 * 编辑只发显式 field-specific 命令（P3-D3）；无 generic JSON patch，
 * 无 width/height/color/border 控件。
 */

export interface InspectorViewModel {
  readonly componentId: string;
  readonly name: string;
  readonly description: string;
  readonly type?: string;
  readonly capabilities: readonly string[];
  readonly limitations: readonly string[];
  readonly contracts: readonly Contract[];
  readonly issues: readonly ValidationIssue[];
}

export function projectInspector(
  component: Component,
  issues: readonly ValidationIssue[]
): InspectorViewModel {
  return {
    componentId: component.id,
    name: component.name,
    description: component.description ?? "",
    type: component.type,
    capabilities: component.capabilities,
    limitations: component.limitations ?? [],
    contracts: component.contracts ?? [],
    issues: issues.filter((issue) =>
      issue.affectedComponent === component.id ||
      issue.affectedComponent === component.name
    )
  };
}
