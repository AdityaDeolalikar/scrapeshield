import { z } from "zod";

/**
 * Schema for a single book returned by Bright Data.
 */
export const bookSchema = z.object({
  title: z.string().min(1),

  price: z.object({
    value: z.number().nonnegative(),
    currency: z.string().min(1),
    symbol: z.string().min(1),
  }),

  currency: z.string().min(1),

  availability: z.string().min(1),

  rating: z.string().min(1),

  product_url: z.string().url(),

  image_url: z.string().url(),
});

/**
 * Complete response returned by our Bright Data scraper.
 */
export const booksScraperResponseSchema = z.object({
  books: z
    .array(bookSchema)
    .min(1),

  input: z.object({
    url: z.string().url(),
  }),
});

export type Book = z.infer<
  typeof bookSchema
>;

export type BooksScraperResponse = z.infer<
  typeof booksScraperResponseSchema
>;