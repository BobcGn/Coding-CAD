import { componentCapabilityRule } from "./rules/component-capability-rule.js";
import { componentLimitationRule } from "./rules/component-limitation-rule.js";
import { consistencyRule } from "./rules/consistency-rule.js";
import { dependencyRule } from "./rules/dependency-rule.js";
import { graphIntegrityRule } from "./rules/graph-integrity-rule.js";
import { scaleRule } from "./rules/scale-rule.js";
import type { ValidationRule } from "./rule.js";

export const builtinValidationRules: readonly ValidationRule[] = [
  graphIntegrityRule,
  componentCapabilityRule,
  componentLimitationRule,
  consistencyRule,
  dependencyRule,
  scaleRule
];
