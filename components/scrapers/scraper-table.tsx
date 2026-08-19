"use client";

import Link from "next/link";
import type { Scraper } from "@/types/scraper";

interface ScraperTableProps {
  scrapers: Scraper[];
  isLoading: boolean;
  onRunScraper?: (scraperId: string) => void;
}

function getStatusClasses(status: Scraper["status"]) {
  switch (status) {
    case "healthy":
      return "bg-emerald-500/10 text-emerald-400";

    case "healing":
      return "bg-blue-500/10 text-blue-400";

    case "warning":
      return "bg-amber-500/10 text-amber-400";

    case "failed":
      return "bg-red-500/10 text-red-400";

    default:
      return "bg-zinc-500/10 text-zinc-400";
  }
}

export function ScraperTable({
  scrapers,
  isLoading,
  onRunScraper,
}: ScraperTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-zinc-500">
        Loading scrapers...
      </div>
    );
  }

  if (scrapers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
        <h3 className="font-medium text-white">
          No scrapers yet
        </h3>

        <p className="mt-2 text-sm text-zinc-500">
          Create your first scraper to start monitoring web data.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="border-b border-white/10 bg-white/[0.02]">
            <tr className="text-left text-xs uppercase tracking-wider text-zinc-500">
              <th className="px-5 py-4 font-medium">Scraper</th>
              <th className="px-5 py-4 font-medium">Status</th>
              <th className="px-5 py-4 font-medium">Health</th>
              <th className="px-5 py-4 font-medium">Success</th>
              <th className="px-5 py-4 font-medium">Version</th>
              <th className="px-5 py-4 font-medium">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5">
            {scrapers.map((scraper) => (
              <tr
                key={scraper.id}
                className="transition hover:bg-white/[0.02]"
              >
                <td className="px-5 py-5">
                  <Link
                    href={`/scrapers/${scraper.id}`}
                    className="group block"
                  >
                    <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
                      {scraper.name}
                    </p>

                    <p className="mt-1 max-w-xs truncate text-xs text-zinc-500">
                      {scraper.url}
                    </p>
                  </Link>
                </td>

                <td className="px-5 py-5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                      scraper.status,
                    )}`}
                  >
                    <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />

                    {scraper.status}
                  </span>
                </td>

                <td className="px-5 py-5">
                  <span className="font-medium text-white">
                    {scraper.healthScore}%
                  </span>
                </td>

                <td className="px-5 py-5">
                  <span className="text-zinc-300">
                    {scraper.successRate}%
                  </span>
                </td>

                <td className="px-5 py-5">
                  <span className="rounded-md bg-white/5 px-2 py-1 text-xs font-mono text-zinc-300">
                    {scraper.currentVersion}
                  </span>
                </td>

                <td className="px-5 py-5">
                  <div className="flex items-center gap-2">
                    {onRunScraper && (
                      <button
                        type="button"
                        onClick={() => onRunScraper(scraper.id)}
                        className="rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-3 py-1.5 text-xs font-medium transition cursor-pointer"
                      >
                        Run
                      </button>
                    )}
                    <Link
                      href={`/scrapers/${scraper.id}`}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/5 hover:text-white transition"
                    >
                      Details
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}