import { Pack } from "../data/packs";

interface StatsBarProps {
  totalPulls: number;
  posEV: number;
  avgEV: number;
  bestPack: Pack | null;
  lastUpdated: string;
}

function formatTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function StatsBar({
  totalPulls,
  posEV,
  avgEV,
  bestPack,
  lastUpdated,
}: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
      <div className="bg-card px-6 py-4">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">
          Sample Pulls
        </p>
        <p className="text-2xl font-bold text-foreground">{totalPulls}</p>
      </div>

      <div className="bg-card px-6 py-4">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">
          +EV Packs
        </p>
        <p className="text-2xl font-bold text-green-400">{posEV}</p>
      </div>

      <div className="bg-card px-6 py-4">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">
          Avg EV
        </p>
        <p className="text-2xl font-bold text-foreground">
          {(avgEV * 100).toFixed(1)}%
        </p>
      </div>

      <div className="bg-card px-6 py-4">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-1">
          Top Pack
        </p>
        <p className="text-lg font-bold text-foreground truncate">
          {bestPack ? bestPack.name : "—"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Updated {formatTime(lastUpdated)}
        </p>
      </div>
    </div>
  );
}
