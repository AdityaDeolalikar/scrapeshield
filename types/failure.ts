export type FailureType =
  | "selector_missing"
  | "empty_result"
  | "schema_invalid"
  | "data_changed"
  | "page_structure_changed"
  | "unknown";

export interface ScraperFailure {
  id: string;
  scraperId: string;
  runId: string;
  type: FailureType;
  message: string;
  oldSelector?: string;
  expectedRecords?: number;
  actualRecords?: number;
  detectedAt: string;
}