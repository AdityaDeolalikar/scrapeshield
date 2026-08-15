import type { Scraper } from "@/types/scraper";
import type { Repair } from "@/types/repair";

export const mockScrapers: Scraper[] = [
  {
    id: "scraper_001",
    name: "Laptop Price Monitor",
    url: "https://example-store.com/laptops",
    status: "healthy",
    healthScore: 96,
    successRate: 98.7,
    recordsCount: 1284,
    currentVersion: "v2.1",
    lastRunAt: "2 minutes ago",
    createdAt: "2026-08-15T07:00:00.000Z",
  },
  {
    id: "scraper_002",
    name: "Mobile Price Tracker",
    url: "https://example-store.com/mobiles",
    status: "healing",
    healthScore: 74,
    successRate: 91.2,
    recordsCount: 842,
    currentVersion: "v1.4",
    lastRunAt: "8 minutes ago",
    createdAt: "2026-08-14T10:00:00.000Z",
  },
  {
    id: "scraper_003",
    name: "Monitor Inventory",
    url: "https://example-store.com/monitors",
    status: "healthy",
    healthScore: 99,
    successRate: 99.4,
    recordsCount: 426,
    currentVersion: "v3.0",
    lastRunAt: "12 minutes ago",
    createdAt: "2026-08-12T09:00:00.000Z",
  },
  {
    id: "scraper_004",
    name: "Keyboard Availability",
    url: "https://example-store.com/keyboards",
    status: "failed",
    healthScore: 38,
    successRate: 72.1,
    recordsCount: 0,
    currentVersion: "v1.2",
    lastRunAt: "18 minutes ago",
    createdAt: "2026-08-10T08:00:00.000Z",
  },
];

export const mockRepairs: Repair[] = [
  {
    id: "repair_001",
    scraperId: "scraper_001",
    runId: "run_1001",
    status: "approved",
    failureType: "selector_missing",
    oldSelector: ".product-card .price",
    newSelector: '[data-testid="product-price"]',
    confidence: 96,
    reason:
      "The price element moved from a class-based selector to a data-testid attribute.",
    createdAt: "2026-08-15T07:30:00.000Z",
    completedAt: "2026-08-15T07:31:00.000Z",
  },
  {
    id: "repair_002",
    scraperId: "scraper_002",
    runId: "run_1002",
    status: "testing",
    failureType: "page_structure_changed",
    oldSelector: ".product-grid .card",
    newSelector: ".products-list [data-product]",
    confidence: 82,
    reason:
      "The product listing container changed after a layout redesign.",
    createdAt: "2026-08-15T07:40:00.000Z",
  },
];