import { StatsCard } from "@/components/dashboard/stats-card";
import { ScraperCard } from "@/components/dashboard/scraper-card";
import { RepairEvent } from "@/components/dashboard/repair-event";
import { mockRepairs, mockScrapers } from "@/lib/mock-data";

export default function DashboardPage() {
  const activeScrapers = mockScrapers.length;

  const averageHealth =
    mockScrapers.reduce(
      (total, scraper) => total + scraper.healthScore,
      0,
    ) / activeScrapers;

  const averageSuccessRate =
    mockScrapers.reduce(
      (total, scraper) => total + scraper.successRate,
      0,
    ) / activeScrapers;

  const totalRecords = mockScrapers.reduce(
    (total, scraper) => total + scraper.recordsCount,
    0,
  );

  return (
    <main className="min-h-screen bg-[#08090a] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-10">
          <p className="text-sm font-medium text-blue-400">
            SCRAPESHIELD
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Scraper Overview
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Monitor your web scrapers, detect extraction failures,
            and automatically recover broken data pipelines.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Active Scrapers"
            value={activeScrapers.toString()}
            description="Currently monitored"
          />

          <StatsCard
            label="Average Health"
            value={`${averageHealth.toFixed(0)}%`}
            description="Across all scrapers"
          />

          <StatsCard
            label="Success Rate"
            value={`${averageSuccessRate.toFixed(1)}%`}
            description="Last 30 days"
          />

          <StatsCard
            label="Records Collected"
            value={totalRecords.toLocaleString()}
            description="Latest successful runs"
          />
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Your Scrapers
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Monitor extraction health and scraper versions.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {mockScrapers.map((scraper) => (
              <ScraperCard
                key={scraper.id}
                scraper={scraper}
              />
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Recent Self-Healing
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Automatic repairs performed by ScrapeShield.
            </p>
          </div>

          <div className="space-y-4">
            {mockRepairs.map((repair) => (
              <RepairEvent
                key={repair.id}
                repair={repair}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}