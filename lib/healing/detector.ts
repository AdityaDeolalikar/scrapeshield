import {
  validateBookOutput,
  type ValidationResult,
} from "./validator";

export interface FailureDetection {
  hasFailure: boolean;
  type:
    | "selector_missing"
    | "empty_result"
    | "schema_invalid"
    | "data_changed"
    | "page_structure_changed"
    | "unknown";
  message: string;
  validation: ValidationResult;
}

export function detectScraperFailure(
  output: unknown,
  expectedRecords: number,
): FailureDetection {
  const validation = validateBookOutput(
    output,
    expectedRecords,
  );

  if (validation.recordsFound === 0) {
    return {
      hasFailure: true,
      type: "empty_result",
      message:
        "Scraper returned zero records.",
      validation,
    };
  }

  if (validation.missingFields.length > 0) {
    return {
      hasFailure: true,
      type: "schema_invalid",
      message:
        `Required fields are missing: ${validation.missingFields.join(", ")}`,
      validation,
    };
  }

  if (
    validation.recordsFound <
    validation.expectedRecords
  ) {
    return {
      hasFailure: true,
      type: "data_changed",
      message:
        `Expected at least ${validation.expectedRecords} records but received ${validation.recordsFound}.`,
      validation,
    };
  }

  if (validation.invalidRecords > 0) {
    return {
      hasFailure: true,
      type: "schema_invalid",
      message:
        `${validation.invalidRecords} records have an invalid structure.`,
      validation,
    };
  }

  return {
    hasFailure: false,
    type: "unknown",
    message: "Scraper output is healthy.",
    validation,
  };
}