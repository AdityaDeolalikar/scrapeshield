import * as cheerio from "cheerio";

import type {
  CandidateTestResult,
} from "./types";

interface CandidateInput {
  selector: string;
  field: string;
}

interface ExtractedValue {
  raw: string;
  normalized: string;
  valid: boolean;
}

function normalizeText(
  value: string,
): string {
  return value
    .replace(/\s+/g, " ")
    .trim();
}

function extractPrice(
  value: string,
): ExtractedValue {
  const raw =
    normalizeText(value);

  /**
   * Supports values such as:
   *
   * £51.77
   * $51.77
   * €51.77
   * 51.77
   * INR 51.77
   */
  const match = raw.match(
    /[-+]?\d+(?:[.,]\d{1,2})?/,
  );

  if (!match) {
    return {
      raw,
      normalized: raw,
      valid: false,
    };
  }

  const normalized =
    match[0].replace(",", ".");

  const numericValue =
    Number(normalized);

  return {
    raw,
    normalized,
    valid:
      Number.isFinite(numericValue) &&
      numericValue >= 0,
  };
}

function extractValue(
  value: string,
  field: string,
): ExtractedValue {
  const raw =
    normalizeText(value);

  if (!raw) {
    return {
      raw,
      normalized: "",
      valid: false,
    };
  }

  switch (field) {
    case "price":
      return extractPrice(raw);

    case "title":
      return {
        raw,
        normalized: raw,
        valid: raw.length >= 2,
      };

    case "availability":
      return {
        raw,
        normalized: raw,
        valid: raw.length >= 2,
      };

    case "rating":
      return {
        raw,
        normalized: raw,
        valid: raw.length >= 1,
      };

    case "currency":
      return {
        raw,
        normalized: raw,
        valid: raw.length >= 1,
      };

    default:
      return {
        raw,
        normalized: raw,
        valid: true,
      };
  }
}

export function testCandidate(
  html: string,
  candidate: CandidateInput,
  expectedRecords: number,
): CandidateTestResult {
  const $ = cheerio.load(html);

  const elements = $(
    candidate.selector,
  );

  const matchCount =
    elements.length;

  let validValueCount = 0;

  elements.each((_, element) => {
    const text =
      $(element).text();

    const extracted =
      extractValue(
        text,
        candidate.field,
      );

    if (extracted.valid) {
      validValueCount++;
    }
  });

  const coverage =
    expectedRecords > 0
      ? Math.min(
          validValueCount /
            expectedRecords,
          1,
        )
      : 0;

  const matchQuality =
    expectedRecords > 0
      ? Math.min(
          matchCount /
            expectedRecords,
          1,
        )
      : 0;

  /**
   * 70% of the score comes from
   * semantically valid extracted values.
   *
   * 30% comes from matching the
   * expected record count.
   */
  const score =
    coverage * 0.7 +
    matchQuality * 0.3;

  return {
    selector:
      candidate.selector,

    field:
      candidate.field,

    matchCount,

    nonEmptyCount:
      validValueCount,

    coverage,

    score,

    valid:
      coverage >= 0.9 &&
      validValueCount > 0,
  };
}