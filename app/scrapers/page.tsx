"use client";

import { useCallback, useEffect, useState } from "react";

import { ScraperForm } from "@/components/scrapers/scraper-form";
import { ScraperTable } from "@/components/scrapers/scraper-table";
import type { Scraper } from "@/types/scraper";

export default function ScrapersPage() {
  const [scrapers, setScrapers] = useState<Scraper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchScrapers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/scrapers", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ?? "Failed to load scrapers.",
        );
      }

      setScrapers(result.data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load scrapers.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchScrapers();
  }, [fetchScrapers]);

  const handleRunScraper = async (scraperId: string) => {
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scraperId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to execute scraper");
      }
      await fetchScrapers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute scraper");
    }
  };

  return (
    <main className="min-h-screen bg-[#08090a] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10">
          <p className="text-sm font-medium text-blue-400">
            SCRAPESHIELD
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Scrapers
              </h1>

              <p className="mt-2 text-sm text-zinc-400">
                Create and monitor the web scrapers powering your
                data pipelines.
              </p>
            </div>

            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-400">
              {scrapers.length} scraper
              {scrapers.length === 1 ? "" : "s"}
            </span>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <section>
            <ScraperForm onCreated={fetchScrapers} />
          </section>

          <section>
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <ScraperTable
              scrapers={scrapers}
              isLoading={isLoading}
              onRunScraper={handleRunScraper}
            />
          </section>
        </div>
      </div>
    </main>
  );
}