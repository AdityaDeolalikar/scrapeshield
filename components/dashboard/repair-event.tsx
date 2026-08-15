import type { Repair } from "@/types/repair";

interface RepairEventProps {
  repair: Repair;
}

export function RepairEvent({ repair }: RepairEventProps) {
  const isApproved = repair.status === "approved";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start gap-3">
        <div
          className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isApproved
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-blue-500/10 text-blue-400"
          }`}
        >
          {isApproved ? "✓" : "↻"}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-medium text-white">
              {isApproved
                ? "Scraper automatically repaired"
                : "Scraper healing in progress"}
            </h3>

            {repair.confidence !== undefined && (
              <span className="text-sm font-medium text-emerald-400">
                {repair.confidence}%
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-zinc-400">
            {repair.reason}
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg bg-red-500/5 p-3">
              <p className="text-xs text-zinc-500">Previous selector</p>

              <code className="mt-1 block break-all text-xs text-red-300">
                {repair.oldSelector}
              </code>
            </div>

            <div className="rounded-lg bg-emerald-500/5 p-3">
              <p className="text-xs text-zinc-500">New selector</p>

              <code className="mt-1 block break-all text-xs text-emerald-300">
                {repair.newSelector ?? "Generating..."}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}