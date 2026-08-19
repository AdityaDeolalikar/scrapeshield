export const defaultScraperSelectors = {
  title: ".product_pod h3 a",
  price: ".price_color",
  availability: ".availability",
  rating: ".star-rating",
  productUrl: ".product_pod h3 a",
  imageUrl: ".image_container img",
} as const;

export type SelectorMap = Record<string, string>;
