import { useState } from "react";
import { Pack } from "../data/packs";

interface PackTableProps {
  packs: Pack[];
}

type SortKey = "evRatio" | "buybackEv" | "winRate" | "price" | "totalPulls";

const CAT_COLOR: Record<string, string> = {
  Pokémon: "#ffd166",
  Baseball: "#4f8fff",
  Basketball: "#ff7f3f",
  Hockey: "#a0d8ef",
  Football: "#7fba00",
  Soccer: "#00e5ff",
  Sports: "#9f7aea",
  Magic: "#e040fb",
  Comics: "#ff5252",
  Watch: "#b0bec5",
};

function Sparkline({ trend }: { trend: "up" | "down" | "flat" }) {
  const color =
    trend === "up" ? "#00ff87" : trend === "down" ? "#ff3860" : "#44446a";
  const points =
    trend === "up"
      ? "0,20 12,16 24,12 36,8 48,4 60,2"
      : trend === "down"
      ? "0,2 12,6 24,10 36,14 48,18 60,20"
      : "0,11 12,10 24,12 36,10 48,11 60,10";
  return (
    <svg width="60" height="22" className="block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx="60"
        cy={trend === "up" ? 2 : trend === "down" ? 20 : 10}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

export function PackTable({ packs }: PackTableProps) {
  const [sort, setSort] = useState<SortKey>("evRatio");
  const [asc, setAsc] = useState(false);

  function handleSort(key: SortKey) {
    if (sort === key) setAsc((a) => !a);
    else { setSort(key); setAsc(false); }
  }

  const sorted = [...packs].sort((a, b) => {
    let av: number, bv: number;
    if (sort === "price") { av = a.price; bv = b.price; }
    else if (sort === "evRatio") { av = a.evRatio; bv = b.evRatio; }
    else if (sort === "buybackEv") { av = a.buybackEv; bv = b.buybackEv; }
    else if (sort === "winRate") { av = a.winRate; bv = b.winRate; }
    else { av = a.totalPulls; bv = b.totalPulls; }
    return asc ? av - bv : bv - av;
  });

  function Th({ label, sortKey }: { label: string; sortKey: SortKey }) {
    const active = sort === sortKey;
    return (
      <th className="px-2.5 py-2 text-left border-b border-border">
        <button
          onClick={() => handleSort(sortKey)}
          className={`text-[8px] font-mono tracking-widest transition-colors ${
            active ? "text-green-400" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {label} {active ? (asc ? "↑" : "↓") : "↕"}
        </button>
      </th>
    );
  }

  if (!sorted.length) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm font-mono">
        No packs match this filter
      </div>
    );
  }

  return (
    <table className="w-full border-collapse text-[11px]">
      <thead className="sticky top-0 z-10 bg-background/95 backdrop-blur">
        <tr>
          <th className="px-2.5 py-2 text-left border-b border-border w-48">
            <span className="text-[8px] font-mono tracking-widest text-muted-foreground">PACK</span>
          </th>
          <Th label="PRICE" sortKey="price" />
          <Th label="FMV EV" sortKey="evRatio" />
          <th className="px-2.5 py-2 text-left border-b border-border">
            <button
              onClick={() => handleSort("buybackEv")}
              className={`text-[8px] font-mono tracking-widest transition-colors ${
                sort === "buybackEv" ? "text-green-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              BUYBACK EV{" "}
              <span className="text-[7px] bg-yellow-400/10 text-yellow-400 px-1 rounded">
                REAL CASH
              </span>{" "}
              {sort === "buybackEv" ? (asc ? "↑" : "↓") : "↕"}
            </button>
          </th>
          <Th label="WIN RATE" sortKey="winRate" />
          <th className="px-2.5 py-2 text-left border-b border-border">
            <span className="text-[8px] font-mono tracking-widest text-muted-foreground">AVG FMV</span>
          </th>
          <th className="px-2.5 py-2 text-left border-b border-border">
            <span className="text-[8px] font-mono tracking-widest text-muted-foreground">CASH OUT</span>
          </th>
          <th className="px-2.5 py-2 text-left border-b border-border">
            <span className="text-[8px] font-mono tracking-widest text-muted-foreground">BEST PULL</span>
          </th>
          <Th label="PULLS" sortKey="totalPulls" />
          <th className="px-2.5 py-2 text-left border-b border-border">
            <span className="text-[8px] font-mono tracking-widest text-muted-foreground">TREND</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((pack) => {
          const posEV = pack.evRatio >= 1;
          const posBB = pack.buybackEv >= 1;
          const evColor = posEV ? "text-green-400" : "text-red-400";
          const bbColor = posBB ? "text-blue-400" : "text-red-400";
          const catColor = CAT_COLOR[pack.category] ?? "#888";
          const cashOut = pack.avgFmv * 0.9 * 0.94;

          return (
            <tr
              key={pack.id}
              className="border-b border-border hover:bg-white/[0.012] transition-colors"
            >
              {/* Pack name */}
              <td className="px-2.5 py-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className="w-0.5 self-stretch rounded-full flex-shrink-0"
                    style={{ background: catColor, minHeight: "28px" }}
                  />
                  <div>
                    <div className="font-bold text-[12px] text-white leading-tight">
                      {pack.name}
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">
                      {pack.category} · ${pack.price}/pack
                    </div>
                  </div>
                </div>
              </td>

              {/* Price */}
              <td className="px-2.5 py-2.5 font-mono text-muted-foreground">
                ${pack.price}
              </td>

              {/* FMV EV */}
              <td className="px-2.5 py-2.5">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                    posEV
                      ? "bg-green-400/10 text-green-400"
                      : "bg-red-400/10 text-red-400"
                  }`}
                >
                  {posEV ? "+" : ""}
                  {((pack.evRatio - 1) * 100).toFixed(1)}%
                </span>
              </td>

              {/* Buyback EV */}
              <td className="px-2.5 py-2.5">
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                    posBB
                      ? "bg-blue-400/10 text-blue-400"
                      : "bg-red-400/10 text-red-400"
                  }`}
                >
                  {posBB ? "+" : ""}
                  {((pack.buybackEv - 1) * 100).toFixed(1)}%
                </span>
              </td>

              {/* Win rate */}
              <td className="px-2.5 py-2.5 font-mono">
                <span
                  className={
                    pack.winRate >= 0.5 ? "text-green-400 font-semibold" : "text-muted-foreground"
                  }
                >
                  {(pack.winRate * 100).toFixed(1)}%
                </span>
              </td>

              {/* Avg FMV */}
              <td className={`px-2.5 py-2.5 font-mono font-semibold ${evColor}`}>
                ${pack.avgFmv.toFixed(2)}
              </td>

              {/* Cash out */}
              <td className={`px-2.5 py-2.5 font-mono font-semibold ${bbColor}`}>
                ${cashOut.toFixed(2)}
              </td>

              {/* Best pull */}
              <td className="px-2.5 py-2.5 font-mono text-green-400">
                ${pack.bestPull.toFixed(2)}
              </td>

              {/* Pulls */}
              <td className="px-2.5 py-2.5 font-mono text-muted-foreground">
                {pack.totalPulls}
              </td>

              {/* Trend */}
              <td className="px-2.5 py-2.5">
                <Sparkline trend={pack.trend} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
