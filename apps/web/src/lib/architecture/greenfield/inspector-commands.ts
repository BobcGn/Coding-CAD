import type { ArchitectureCommand } from "../commands/architecture-command.js";

/**
 * P3.5 field-specific Inspector commands (P3-D3).
 *
 * Each command targets one semantic field of a component. There is no generic
 * JSON patch and no width/height/color/border editing. Commands are members of
 * ArchitectureCommand and flow through the Phase 2 command application; the
 * accepted IR is only replaced after validation and the Review gate.
 *
 * P3.5 field-specific Inspector 命令（P3-D3）。每个命令针对组件的一个语义
 * 字段；无 generic JSON patch，无 width/height/color/border 编辑。命令是
 * ArchitectureCommand 的成员，经 Phase 2 command application 流转；accepted
 * IR 只在 validation 与 Review gate 后替换。
 */

export type InspectorCommand = Extract<ArchitectureCommand, { readonly type: `inspector-${string}` }>;

export function describeInspectorCommand(command: InspectorCommand): string {
  switch (command.type) {
    case "inspector-update-description": return `Update description of ${command.componentId}`;
    case "inspector-update-type": return `Update type of ${command.componentId}`;
    case "inspector-add-capability": return `Add capability ${command.capability} to ${command.componentId}`;
    case "inspector-remove-capability": return `Remove capability ${command.capability} from ${command.componentId}`;
    case "inspector-add-limitation": return `Add limitation ${command.limitation} to ${command.componentId}`;
  }
}

