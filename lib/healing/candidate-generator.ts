import * as cheerio from "cheerio";

import type {
  RepairCandidate,
} from "./types";

function escapeCssIdentifier(
  value: string,
): string {
  return value.replace(
    /([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~\s])/g,
    "\\$1",
  );
}

const FIELD_KEYWORDS: Record<
  string,
  string[]
> = {
  title: [
    "title",
    "name",
    "heading",
  ],

  price: [
    "price",
    "cost",
    "amount",
  ],

  currency: [
    "currency",
    "price",
  ],

  availability: [
    "availability",
    "available",
    "stock",
    "inventory",
  ],

  rating: [
    "rating",
    "stars",
    "review",
  ],

  product_url: [
    "product",
    "item",
    "book",
    "detail",
  ],

  image_url: [
    "image",
    "img",
    "thumbnail",
    "cover",
  ],
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .trim();
}

function matchesField(
  value: string,
  field: string,
) {
  const normalizedValue =
    normalize(value);

  const keywords =
    FIELD_KEYWORDS[field] ?? [];

  return keywords.some((keyword) =>
    normalizedValue.includes(keyword),
  );
}

function addCandidate(
  candidates: Map<string, RepairCandidate>,
  candidate: RepairCandidate,
) {
  if (!candidates.has(candidate.selector)) {
    candidates.set(
      candidate.selector,
      candidate,
    );
  }
}

export function generateRepairCandidates(
  html: string,
  field: string,
  oldSelector?: string | null,
): RepairCandidate[] {
  const $ = cheerio.load(html);

  const candidates =
    new Map<
      string,
      RepairCandidate
    >();

  /**
   * Search class names.
   */
  $("[class]").each((_, element) => {
    const classNames =
      $(element)
        .attr("class")
        ?.split(/\s+/)
        .filter(Boolean) ?? [];

    for (const className of classNames) {
      if (
        !matchesField(
          className,
          field,
        )
      ) {
        continue;
      }

      const selector = `.${escapeCssIdentifier(
        className,
      )}`;

      if (
        oldSelector === selector
      ) {
        continue;
      }

      addCandidate(candidates, {
        selector,
        field,
        source: "class",
        reason:
          `Class "${className}" appears semantically related to ${field}.`,
      });
    }
  });

  /**
   * Search IDs.
   */
  $("[id]").each((_, element) => {
    const id = $(element).attr("id");

    if (
      !id ||
      !matchesField(id, field)
    ) {
      return;
    }

    const selector = `#${CSS.escape(id)}`;

    if (oldSelector === selector) {
      return;
    }

    addCandidate(candidates, {
      selector,
      field,
      source: "id",
      reason:
        `Element ID "${id}" appears semantically related to ${field}.`,
    });
  });

  /**
   * Search common semantic attributes.
   */
  $("[data-testid], [data-field], [data-name], [aria-label]").each(
    (_, element) => {
      const attributes = [
        "data-testid",
        "data-field",
        "data-name",
        "aria-label",
      ];

      for (const attribute of attributes) {
        const value =
          $(element).attr(attribute);

        if (
          !value ||
          !matchesField(
            value,
            field,
          )
        ) {
          continue;
        }

        const selector =
          `[${attribute}="${CSS.escape(
            value,
          )}"]`;

        if (
          oldSelector === selector
        ) {
          continue;
        }

        addCandidate(candidates, {
          selector,
          field,
          source: "attribute",
          reason:
            `Attribute ${attribute}="${value}" appears related to ${field}.`,
        });
      }
    },
  );

  return Array.from(
    candidates.values(),
  ).slice(0, 30);
}

