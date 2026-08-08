/**
 * Business domain model. Entities describe domain language and behavior, not
 * database tables or persistence layouts.
 */
export interface DomainModel {
  /**
   * Core business concepts. These are not persistence tables.
   */
  readonly entities: readonly DomainEntity[];

  readonly boundedContexts?: readonly BoundedContext[];
  readonly valueObjects?: readonly ValueObject[];
  readonly events?: readonly DomainEvent[];
}

/**
 * Boundary for a cohesive part of the business language.
 */
export interface BoundedContext {
  readonly id: string;
  readonly name: string;
  readonly responsibilities: readonly string[];
}

export interface DomainEntity {
  /**
   * Optional stable id for references. If omitted, tools may use `name`.
   */
  readonly id?: string;

  readonly name: string;
  readonly description?: string;
  readonly contextId?: string;
  readonly fields: readonly DomainField[];
  readonly relations?: readonly DomainRelation[];

  /**
   * Business rules that should remain true regardless of implementation.
   */
  readonly invariants?: readonly string[];
}

/**
 * Domain-level property. `type` names a domain or primitive concept, not a
 * database column type.
 */
export interface DomainField {
  readonly name: string;
  readonly type: string;
  readonly required?: boolean;
  readonly description?: string;
}

/**
 * Semantic relationship between domain entities.
 */
export interface DomainRelation {
  readonly name: string;
  readonly targetEntity: string;
  readonly type?: DomainRelationType;
  readonly description?: string;
}

export type DomainRelationType =
  | "one-to-one"
  | "one-to-many"
  | "many-to-one"
  | "many-to-many"
  | "references"
  | "owns";

/**
 * Immutable domain concept identified by its field values.
 */
export interface ValueObject {
  readonly id?: string;
  readonly name: string;
  readonly fields: readonly DomainField[];
}

/**
 * Business event that matters to the architecture.
 */
export interface DomainEvent {
  readonly id?: string;
  readonly name: string;
  readonly producer?: string;
  readonly payload?: readonly DomainField[];
  readonly meaning?: string;
}
