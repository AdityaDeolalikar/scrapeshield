export interface ValidationResult {
  valid: boolean;
  recordsFound: number;
  expectedRecords: number;
  missingFields: string[];
  invalidRecords: number;
}

interface BookRecord {
  title?: unknown;
  price?: unknown;
  currency?: unknown;
  availability?: unknown;
  rating?: unknown;
  product_url?: unknown;
  image_url?: unknown;
}

const REQUIRED_FIELDS = [
  "title",
  "price",
  "currency",
  "availability",
  "rating",
  "product_url",
  "image_url",
] as const;

export function validateBookOutput(
  output: unknown,
  expectedRecords: number,
): ValidationResult {
  if (!output || typeof output !== "object") {
    return {
      valid: false,
      recordsFound: 0,
      expectedRecords,
      missingFields: [...REQUIRED_FIELDS],
      invalidRecords: 0,
    };
  }

  const books =
    "books" in output &&
    Array.isArray(output.books)
      ? output.books
      : [];

  const missingFields = new Set<string>();
  let invalidRecords = 0;

  for (const book of books) {
    if (!book || typeof book !== "object") {
      invalidRecords++;
      continue;
    }

    const record = book as BookRecord;

    for (const field of REQUIRED_FIELDS) {
      const value = record[field];

      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        missingFields.add(field);
      }
    }
  }

  const valid =
    books.length >= expectedRecords &&
    missingFields.size === 0 &&
    invalidRecords === 0;

  return {
    valid,
    recordsFound: books.length,
    expectedRecords,
    missingFields: [...missingFields],
    invalidRecords,
  };
}