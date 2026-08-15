interface StatsCardProps {
  label: string;
  value: string;
  description?: string;
}

export function StatsCard({
  label,
  value,
  description,
}: StatsCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm text-zinc-400">{label}</p>

      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
        {value}
      </p>

      {description && (
        <p className="mt-2 text-xs text-zinc-500">{description}</p>
      )}
    </div>
  );
}