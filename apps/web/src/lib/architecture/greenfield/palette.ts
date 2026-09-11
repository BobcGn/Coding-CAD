import {
  createComponentRegistry,
  type ComponentCategory,
  type ComponentDefinition
} from "@coding-cad/component-registry";
import type { ComponentType } from "@coding-cad/architecture-ir";
import type { ArchitectureCommand } from "../commands/architecture-command.js";

/**
 * P3.4 Palette projection.
 *
 * Projects Component Registry definitions into browser-safe palette items and
 * produces Add/Remove/Connect commands that flow through the Phase 2 command
 * application. The Palette is a view over the Registry, never a second
 * component model.
 *
 * P3.4 Palette 投影。把 Component Registry 定义投影为 browser-safe palette
 * items，并产生经 Phase 2 command application 流转的 Add/Remove/Connect
 * 命令。Palette 是 Registry 的视图，绝不是第二套组件模型。
 */

export interface PaletteItem {
  readonly id: string;
  readonly name: string;
  readonly category: ComponentCategory;
  readonly description: string;
  readonly capabilities: readonly string[];
  readonly limitations: readonly string[];
}

export interface PaletteProjection {
  readonly items: readonly PaletteItem[];
}

export function projectPalette(registry = createComponentRegistry()): PaletteProjection {
  const items = registry.list().map<PaletteItem>((definition) => ({
    id: definition.id,
    name: definition.name,
    category: definition.category,
    description: definition.description,
    capabilities: definition.capabilities.map((capability) => capability.id),
    limitations: definition.limitations.map((limitation) => limitation.id)
  }));
  return { items };
}

/** Build an add-component command from a palette item (P3-D3: explicit command). */
export function toAddComponentCommand(item: PaletteItem): ArchitectureCommand {
  return {
    type: "add-component",
    component: {
      id: item.id,
      name: item.name,
      type: componentTypeFor(item.category),
      capabilities: [...item.capabilities]
    }
  };
}

function componentTypeFor(category: ComponentCategory): ComponentType {
  switch (category) {
    case "database": return "database";
    case "cache": return "cache";
    case "message-broker": return "queue";
    case "api": return "gateway";
    case "storage": return "storage";
    case "service": return "service";
    case "external-service": return "external-service";
    default: return "service";
  }
}

export type { ComponentDefinition };
