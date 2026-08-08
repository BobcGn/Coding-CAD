import assert from "node:assert/strict";
import {
  createComponentRegistry,
  loadBuiltinComponents,
  InMemoryComponentRegistry,
  redisDefinition,
  type ComponentDefinition
} from "./index.js";

const registry = createComponentRegistry();

assert.equal(registry.list().length, 5);
assert.equal(registry.get("redis")?.name, "Redis");
assert.equal(registry.get("Redis")?.id, "redis");

const transactionalComponents = registry.searchByCapability("transaction");
assert.equal(transactionalComponents.some((component) => component.id === "postgresql"), true);

const strongConsistencyComponents = registry.searchByCapability("strong consistency");
assert.equal(strongConsistencyComponents.some((component) => component.id === "postgresql"), true);

assert.equal(redisDefinition.limitations.some((limitation) => limitation.id === "not-primary-storage"), true);

const customRegistry = new InMemoryComponentRegistry();
loadBuiltinComponents(customRegistry);
assert.equal(customRegistry.get("kafka")?.capabilities.some((capability) => capability.id === "event-stream"), true);

const restApi = registry.get("rest-api") as ComponentDefinition;
const serialized = JSON.stringify(restApi);
const parsed = JSON.parse(serialized) as ComponentDefinition;
assert.equal(parsed.capabilities.some((capability) => capability.id === "http-interface"), true);

console.log("component-registry tests passed");
