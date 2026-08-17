"use client";

import { FormEvent, useState } from "react";

interface ScraperFormProps {
  onCreated: () => void;
}

export function ScraperForm({ onCreated }: ScraperFormProps) {
  // const [name, setName] = useState("");
  // const [url, setUrl] = useState("");
  // const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [collectorId, setCollectorId] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    if (!name.trim()) {
      setError("Scraper name is required.");
      return;
    }

    if (!url.trim()) {
      setError("Scraper URL is required.");
      return;
    }

    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/scrapers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // body: JSON.stringify({
        //   name: name.trim(),
        //   url: url.trim(),
        //   description: description.trim() || undefined,
        // }),
        body: JSON.stringify({
          name: name.trim(),
          url: url.trim(),
          datasetId: collectorId.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ?? "Failed to create scraper.",
        );
      }

      // setName("");
      // setUrl("");
      // setDescription("");
      setName("");
      setUrl("");
      setCollectorId("");
      setDescription("");

      onCreated();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">
          Create scraper
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Add a website you want ScrapeShield to monitor.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label
            htmlFor="scraper-name"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Name
          </label>

          <input
            id="scraper-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Laptop Price Monitor"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-blue-500/50"
          />
        </div>

        <div>
          <label
            htmlFor="scraper-url"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Website URL
          </label>

          <input
            id="scraper-url"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/products"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-blue-500/50"
          />
        </div>
        <div>
          <label
            htmlFor="scraper-collector-id"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Bright Data Collector ID
          </label>

          <input
            id="scraper-collector-id"
            value={collectorId}
            onChange={(event) =>
              setCollectorId(event.target.value)
            }
            placeholder="c_msx2ztefhbwpo451v"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-blue-500/50"
          />

          <p className="mt-2 text-xs text-zinc-600">
            The Collector ID from Bright Data Scraper Studio.
          </p>
        </div>
        <div>
          <label
            htmlFor="scraper-description"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Description
          </label>

          <textarea
            id="scraper-description"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            placeholder="Extract product name, price and availability."
            rows={3}
            disabled={isSubmitting}
            className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-blue-500/50"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-blue-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Creating..." : "Create Scraper"}
        </button>
      </div>
    </form>
  );
}