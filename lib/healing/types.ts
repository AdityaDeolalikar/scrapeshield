export type FailureType =
  | "selector_missing"
  | "empty_result"
  | "schema_invalid"
  | "data_changed"
  | "page_structure_changed"
  | "unknown";

export type FailureSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export interface FailureAnalysis {
  failureType: FailureType;

  affectedField: string | null;

  oldSelector: string | null;

  severity: FailureSeverity;

  repairable: boolean;

  reason: string;
}