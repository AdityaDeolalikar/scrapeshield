import type { ScraperStatus } from "@/types/scraper";

interface ScraperStatusProps {
  status: ScraperStatus;
}

const statusConfig: Record<
  ScraperStatus,
  {
    label: string;
    className: string;
  }
> = {
  healthy: {
    label: "Healthy",
    className: "bg-emerald-500/10 text-emerald-400",
  },
  warning: {
    label: "Warning",
    className: "bg-amber-500/10 text-amber-400",
  },
  failed: {
    label: "Failed",
    className: "bg-red-500/10 text-red-400",
  },
  healing: {
    label: "Healing",
    className: "bg-blue-500/10 text-blue-400",
  },
};

export function ScraperStatus({ status }: ScraperStatusProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}