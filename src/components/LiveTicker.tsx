import { PullRecord } from "../data/packs";

interface LiveTickerProps {
  pulls: PullRecord[];
}

function ago(isoString: string): string {
  try {
    const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  } catch {
    return "recently";
  }
}

export function LiveTicker({ pulls }: LiveTickerProps) {
  if (!pulls.length) return null;

  const items = [...pulls, ...pulls]; // duplicate for seamless loop

  return (
    <div className="border-t border-border bg-card overflow-hidden">
      <div className="flex items-center h-8">
        {/* Label */}
        <div className="flex-shrink-0 px-3 h-full flex items-center border-r border-border">
          <span className="text-[10px] text-muted-foreground tracking-widest font-mono uppercase">
            Recent Pulls
          </span>
        </div>

        {/* Scrolling track */}
        <div className="flex-1 overflow-hidden relative">
          <div
            className="flex gap-0 whitespace-nowrap"
            style={{ animation: "ticker 60s linear infinite" }}
          >
            {items.map((pull, i) => {
              const win = pull.fmv > pull.packPrice;
              const diff = pull.fmv - pull.packPrice;
              return (
                <div
                  key={`${pull.id}-${i}`}
                  className="inline-flex items-center gap-2 px-5 text-[11px] font-mono border-r border-border h-8 flex-shrink-0"
                >
                  <span className="text-muted-foreground">@{pull.user}</span>
                  <span className="text-foreground">{pull.cardName.slice(0, 24)}</span>
                  <span
                    className={`font-bold ${win ? "text-green-400" : "text-red-400"}`}
                  >
                    ${pull.fmv.toFixed(2)}
                  </span>
                  <span
                    className={`${win ? "text-green-400/50" : "text-red-400/50"}`}
                  >
                    {win ? "+" : ""}
                    {diff.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground/50">{ago(pull.timestamp)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
