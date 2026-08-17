import {
  detectScraperFailure,
} from "./detector";

const healthyOutput = {
  books: [
    {
      title: "Book One",
      price: {
        value: 10,
      },
      currency: "£",
      availability: "In stock",
      rating: "Four",
      product_url: "https://example.com/book",
      image_url: "https://example.com/image.jpg",
    },
  ],
};

console.log(
  detectScraperFailure(
    healthyOutput,
    1,
  ),
);