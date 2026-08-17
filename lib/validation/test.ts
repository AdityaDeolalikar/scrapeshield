import { validateScraperOutput } from "./validate-scraper-output";

const validData = {
  books: [
    {
      title: "A Light in the Attic",

      price: {
        value: 51.77,
        currency: "GBP",
        symbol: "£",
      },

      currency: "£",

      availability: "In stock",

      rating: "Three",

      product_url:
        "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",

      image_url:
        "https://books.toscrape.com/media/cache/example.jpg",
    },
  ],

  input: {
    url: "https://books.toscrape.com/",
  },
};

console.log(
  JSON.stringify(
    validateScraperOutput(validData),
    null,
    2,
  ),
);