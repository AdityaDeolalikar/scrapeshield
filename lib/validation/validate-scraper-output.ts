import {
  booksScraperResponseSchema,
} from "./scraper-output";

export interface ValidationSuccess {
  valid: true;
  recordsFound: number;
  data: unknown;
}

export interface ValidationFailure {
  valid: false;
  recordsFound: number;
  errors: Array<{
    path: string;
    message: string;
  }>;
}

export type ValidationResult =
  | ValidationSuccess
  | ValidationFailure;

export function validateScraperOutput(
  data: unknown,
): ValidationResult {
  const result =
    booksScraperResponseSchema.safeParse(data);

  if (result.success) {
    return {
      valid: true,
      recordsFound: result.data.books.length,
      data: result.data,
    };
  }

  return {
    valid: false,
    recordsFound: 0,
    errors: result.error.issues.map(
      (issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }),
    ),
  };
}