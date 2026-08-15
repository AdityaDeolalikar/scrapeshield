export type ScraperStatus = "healthy" | "warning" | "failed" | "healing";

export interface Scraper {
  id: string;
  name: string;
  url: string;
  status: ScraperStatus;
  healthScore: number;
  successRate: number;
  recordsCount: number;
  currentVersion: string;
  lastRunAt: string;
  createdAt: string;
}

export interface ScraperRun {
  id: string;
  scraperId: string;
  status: "success" | "failed" | "healing";
  recordsFound: number;
  durationMs: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
}