import {
  analyzeFailure,
} from "./analyzer";

const result =
  analyzeFailure({
    type: "schema_invalid",

    message:
      "Required field 'price' is missing from scraper output.",

    oldSelector:
      ".price_color",

    expectedRecords: 20,

    actualRecords: 20,
  });

console.log(
  JSON.stringify(
    result,
    null,
    2,
  ),
);