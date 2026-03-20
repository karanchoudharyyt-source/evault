import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCourtyardData } from "./hooks/use-courtyard-data";
import { StatsBar } from "./components/StatsBar";
import { LiveTicker } from "./components/LiveTicker";
import { PackTable } from "./components/PackTable";
import { Pack } from "./data/packs";

const queryClient = new QueryClient();

// ── Category colors ──────────────────────────────────────────────────────────
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

// ── Inner dashboard ───────────────────────────────────────────────────────────
function Dashboard() {
  const { data, isLoading, isError, refetch } = useCourtyardData();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeView, setActiveView] = useState<"packs" | "feed">("packs");

  // Derive category list from loaded packs
  const categories = data
    ? ["All", ...Array.from(new Set(data.packs.map((p) => p.category)))]
    : ["All"];

  // Filter packs by selected category
  const visiblePacks: Pack[] = data
    ? activeCategory === "All"
      ? data.packs
      : data.packs.filter((p) => p.category === activeCategory)
    : [];

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">

      {/* ── Top nav ── */}
      <header className="flex items-center gap-3 px-4 h-12 border-b border-border bg-card flex-shrink-0">
        {/* Brand */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-sm">
            ⚡
          </div>
          <div>
            <div className="font-bold text-base leading-none text-white">PackPulse</div>
            <div className="text-[8px] text-muted-foreground tracking-widest">
              COURTYARD EV TRACKER
            </div>
          </div>
        </div>

        {/* Header stats */}
        {data && (
          <>
            <div className="ml-3 px-2.5 py-1 border border-border rounded text-center">
              <div className="text-[7px] text-muted-foreground tracking-widest">+EV PACKS</div>
              <div className="font-bold text-base leading-none text-white">{data.posEV}</div>
            </div>
            <div className="px-2.5 py-1 border border-border rounded text-center">
              <div className="text-[7px] text-muted-foreground tracking-widest">AVG EV</div>
              <div className="font-bold text-base leading-none text-white">
                {(data.avgEV * 100).toFixed(1)}%
              </div>
            </div>
            <div className="px-2.5 py-1 border border-border rounded text-center">
              <div className="text-[7px] text-muted-foreground tracking-widest">PULLS</div>
              <div className="font-bold text-base leading-none text-white">{data.totalPulls}</div>
            </div>
          </>
        )}

        {/* Status badge */}
        <div className="flex items-center gap-1.5 ml-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isLoading
                ? "bg-yellow-400 animate-pulse"
                : isError
                ? "bg-red-400"
                : "bg-green-400"
            }`}
          />
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground">
            {isLoading ? "LOADING" : isError ? "ERROR" : "READY"}
          </span>
          {data && (
            <span className="text-[9px] text-muted-foreground/50 font-mono">
              · {data.isLive ? 'live data' : 'sample data'}
            </span>
          )}
        </div>

        {/* Refresh button */}
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="ml-auto px-3 py-1 border border-border rounded text-[10px] font-mono text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors disabled:opacity-40"
        >
          ↻ Refresh
        </button>
      </header>

      {/* ── Main body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-44 flex-shrink-0 border-r border-border bg-card flex flex-col overflow-hidden">
          <div className="px-2.5 pt-3 pb-1 text-[8px] text-muted-foreground tracking-widest font-mono">
            VIEW
          </div>
          <button
            onClick={() => setActiveView("packs")}
            className={`flex items-center gap-2 px-2.5 py-2 text-[11px] border-l-2 transition-all ${
              activeView === "packs"
                ? "border-green-400 text-foreground bg-white/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.02]"
            }`}
          >
            📊 All Packs
          </button>
          <button
            onClick={() => setActiveView("feed")}
            className={`flex items-center gap-2 px-2.5 py-2 text-[11px] border-l-2 transition-all ${
              activeView === "feed"
                ? "border-green-400 text-foreground bg-white/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.02]"
            }`}
          >
            📋 Recent Pulls
          </button>

          <div className="px-2.5 pt-4 pb-1 text-[8px] text-muted-foreground tracking-widest font-mono">
            CATEGORY
          </div>
          {categories.map((cat) => {
            const color = cat === "All" ? "#00ff87" : CAT_COLOR[cat] ?? "#888";
            const packs = data
              ? cat === "All"
                ? data.packs
                : data.packs.filter((p) => p.category === cat)
              : [];
            const posN = packs.filter((p) => p.evRatio >= 1).length;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex items-center gap-2 px-2.5 py-1.5 text-[11px] border-l-2 transition-all ${
                  isActive
                    ? "text-foreground bg-white/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/[0.02]"
                }`}
                style={{ borderLeftColor: isActive ? color : "transparent" }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: color }}
                />
                <span className="flex-1 text-left">{cat}</span>
                {posN > 0 && (
                  <span className="text-[9px] font-mono text-green-400 bg-green-400/10 px-1 rounded">
                    {posN}+
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Loading / error states */}
          {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="text-2xl">⚡</div>
              <div className="text-sm font-bold text-muted-foreground font-sans">
                Loading pack data...
              </div>
            </div>
          )}

          {isError && (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="text-sm font-bold text-red-400">Could not load data</div>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-green-400 text-black rounded font-bold text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* Packs view */}
          {data && activeView === "packs" && (
            <div className="flex-1 overflow-auto">
              <PackTable packs={visiblePacks} />
            </div>
          )}

          {/* Feed view */}
          {data && activeView === "feed" && (
            <div className="flex-1 overflow-auto p-2">
              <div className="flex flex-col gap-2">
                {data.recentPulls.map((pull) => {
                  const win = pull.fmv > pull.packPrice;
                  const diff = pull.fmv - pull.packPrice;
                  const hue = pull.user
                    .split("")
                    .reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
                  return (
                    <div
                      key={pull.id}
                      className="flex items-start gap-3 border border-border rounded-lg p-3 hover:bg-card transition-colors"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
                        style={{
                          background: `hsl(${hue},25%,12%)`,
                          border: `1px solid hsl(${hue},25%,20%)`,
                          color: `hsl(${hue},40%,55%)`,
                        }}
                      >
                        {pull.user.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[11px] font-semibold text-green-400">
                            @{pull.user}
                          </span>
                          <span className="text-[9px] text-muted-foreground border border-border rounded px-1.5 py-0.5 font-mono">
                            {pull.packName}
                          </span>
                        </div>
                        <div className="font-bold text-[13px] text-white truncate">
                          {pull.cardName}
                        </div>
                        {pull.grade && (
                          <div className="text-[9px] text-muted-foreground mt-0.5 font-mono">
                            {pull.grader} {pull.grade}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div
                          className={`font-bold text-sm font-mono ${
                            win ? "text-green-400" : "text-muted-foreground"
                          }`}
                        >
                          ${pull.fmv.toFixed(2)}
                        </div>
                        <div
                          className={`text-[9px] font-mono mt-0.5 ${
                            win ? "text-green-400/70" : "text-red-400"
                          }`}
                        >
                          {win ? "+" : ""}
                          {diff.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Stats bar */}
      {data && (
        <StatsBar
          totalPulls={data.totalPulls}
          posEV={data.posEV}
          avgEV={data.avgEV}
          bestPack={data.bestPack}
          lastUpdated={data.lastUpdated}
        />
      )}

      {/* Recent pulls ticker */}
      {data && <LiveTicker pulls={data.recentPulls} />}

      {/* Disclaimer */}
      <div className="px-4 py-2 border-t border-border bg-card text-center">
        <p className="text-[9px] text-muted-foreground">
          EV calculated from real Courtyard.io pulls. Not financial advice. Pack outcomes are random.
          EV is based on sample pull history — actual results will vary.
        </p>
      </div>
    </div>
  );
}

// ── Root with QueryClientProvider ─────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
