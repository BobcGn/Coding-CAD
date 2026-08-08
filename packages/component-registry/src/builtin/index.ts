import { kafkaDefinition } from "./kafka.js";
import { mongodbDefinition } from "./mongodb.js";
import { postgresqlDefinition } from "./postgresql.js";
import { redisDefinition } from "./redis.js";
import { restApiDefinition } from "./rest-api.js";
import type { ComponentDefinition } from "../component-definition.js";

export const builtinComponentDefinitions: readonly ComponentDefinition[] = [
  postgresqlDefinition,
  redisDefinition,
  kafkaDefinition,
  mongodbDefinition,
  restApiDefinition
];

export {
  kafkaDefinition,
  mongodbDefinition,
  postgresqlDefinition,
  redisDefinition,
  restApiDefinition
};
