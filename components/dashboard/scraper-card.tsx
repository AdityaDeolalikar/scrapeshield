import type { Scraper } from "@/types/scraper";
import { ScraperStatus } from "./scraper-status";

interface ScraperCardProps {
  scraper: Scraper;
}

export function ScraperCard({ scraper }: ScraperCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium text-white">{scraper.name}</h3>

          <p className="mt-1 max-w-md truncate text-xs text-zinc-500">
            {scraper.url}
          </p>
        </div>

        <ScraperStatus status={scraper.status} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-zinc-500">Health</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {scraper.healthScore}%
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">Records</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {scraper.recordsCount.toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-xs text-zinc-500">Version</p>
          <p className="mt-1 text-lg font-semibold text-white">
            {scraper.currentVersion}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
        <span className="text-xs text-zinc-500">
          Last run {scraper.lastRunAt}
        </span>

        <button
          type="button"
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/5 hover:text-white"
        >
          View details
        </button>
      </div>
    </div>
  );
}