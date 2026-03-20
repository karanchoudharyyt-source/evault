import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCourtyardData } from "./hooks/use-courtyard-data";
import { Pack, PullRecord } from "./data/packs";

const queryClient = new QueryClient();

// ─── Constants ───────────────────────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  Pokémon: "#ffd166", Baseball: "#4f8fff", Basketball: "#ff7f3f",
  Hockey: "#a0d8ef", Football: "#7fba00", Soccer: "#00e5ff",
  Sports: "#9f7aea", Magic: "#e040fb", Comics: "#ff5252", Watch: "#b0bec5",
};

function getSignal(evRatio: number): { label: string; cls: string } {
  if (evRatio >= 1.3) return { label: "GREAT VALUE", cls: "sig-great" };
  if (evRatio >= 1.0) return { label: "GOOD VALUE",  cls: "sig-good"  };
  if (evRatio >= 0.9) return { label: "FAIR VALUE",  cls: "sig-fair"  };
  return                    { label: "BELOW EV",    cls: "sig-below" };
}

function ago(ts: string) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

const $f = (n: number) => `$${(+n).toFixed(2)}`;
const $x = (n: number) => `${(+n).toFixed(3)}x`;

// ─── Pack image URL ───────────────────────────────────────────────────────────
function packImg(id: string) {
  return `https://api.courtyard.io/configs/vending-machine/${id}/resources/sealed_pack.png`;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Spark({ trend }: { trend: "up" | "down" | "flat" }) {
  const color = trend === "up" ? "#00ff87" : trend === "down" ? "#ff3860" : "#3a3a5c";
  const pts   = trend === "up"   ? "0,18 15,13 30,9 45,5 60,1"
              : trend === "down" ? "0,1 15,5 30,9 45,13 60,18"
              :                   "0,10 15,8 30,11 45,9 60,10";
  const cy    = trend === "up" ? 1 : trend === "down" ? 18 : 10;
  return (
    <svg width="60" height="20" style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="60" cy={cy} r="2.5" fill={color} />
    </svg>
  );
}

// ─── Main app ────────────────────────────────────────────────────────────────
function Dashboard() {
  const { data, isLoading, isError, refetch } = useCourtyardData();
  const [tab, setTab]   = useState<"all" | string>("all");
  const [view, setView] = useState<"packs" | "feed">("packs");
  const [sort, setSort] = useState<"ev" | "bb" | "wr" | "price" | "pulls">("ev");
  const [filter, setFilter] = useState<"all" | "pos" | "neg">("all");
  const [countdown, setCountdown] = useState(300);

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { refetch(); return 300; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [refetch]);

  const cats = data ? ["all", ...Array.from(new Set(data.packs.map(p => p.category)))] : ["all"];

  const visiblePacks: Pack[] = data ? [...data.packs]
    .filter(p => tab === "all" || p.category === tab)
    .filter(p => filter === "pos" ? p.evRatio >= 1 : filter === "neg" ? p.evRatio < 1 : true)
    .sort((a, b) =>
      sort === "ev"    ? b.evRatio - a.evRatio :
      sort === "bb"    ? b.buybackEv - a.buybackEv :
      sort === "wr"    ? b.winRate - a.winRate :
      sort === "price" ? a.price - b.price :
      b.totalPulls - a.totalPulls
    ) : [];

  const best = data?.packs[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "hsl(var(--background))", color: "hsl(var(--foreground))", fontFamily: "var(--font-sans)" }}>

      {/* ── TOP NAV ── */}
      <nav style={{ height: 52, flexShrink: 0, display: "flex", alignItems: "center", padding: "0 16px", gap: 10, borderBottom: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg,#00ff87,#4f8fff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#fff", lineHeight: 1, letterSpacing: -0.3 }}>PackPulse</div>
            <div style={{ fontSize: 7, color: "hsl(var(--muted-foreground))", letterSpacing: 1.5, fontFamily: "var(--font-mono)" }}>COURTYARD EV TRACKER</div>
          </div>
        </div>

        {/* Live badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 12, padding: "3px 10px", border: "1px solid rgba(0,255,135,.2)", borderRadius: 20, background: "rgba(0,255,135,.06)" }}>
          <span className="live-dot" style={{ width: 6, height: 6 }} />
          <span style={{ fontSize: 9, color: "#00ff87", fontWeight: 700, letterSpacing: 1, fontFamily: "var(--font-mono)" }}>
            {data?.isLive ? "LIVE" : "SAMPLE"} · ↻ {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
          </span>
        </div>

        {/* Stats */}
        {data && <>
          {[
            { l: "+EV PACKS", v: `${data.posEV}/${data.packs.length}`, c: "#00ff87" },
            { l: "AVG EV", v: $x(data.avgEV), c: data.avgEV >= 1 ? "#00ff87" : "#ff3860" },
            { l: "PULLS", v: data.totalPulls, c: "#fff" },
          ].map(s => (
            <div key={s.l} style={{ padding: "3px 10px", border: "1px solid hsl(var(--border))", borderRadius: 6, textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 7, color: "hsl(var(--muted-foreground))", letterSpacing: 1, fontFamily: "var(--font-mono)" }}>{s.l}</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: s.c as string, lineHeight: 1.2 }}>{s.v}</div>
            </div>
          ))}
        </>}

        <button onClick={() => refetch()} disabled={isLoading} style={{ marginLeft: "auto", padding: "4px 12px", background: "transparent", border: "1px solid hsl(var(--border))", borderRadius: 5, fontSize: 9, color: "hsl(var(--muted-foreground))", cursor: "pointer", fontFamily: "var(--font-mono)" }}>
          ↻ Refresh
        </button>
      </nav>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Sidebar */}
        <aside style={{ width: 176, flexShrink: 0, borderRight: "1px solid hsl(var(--border))", background: "hsl(var(--card))", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "10px 10px 5px", fontSize: 7, color: "hsl(var(--muted-foreground))", letterSpacing: 1.5, fontFamily: "var(--font-mono)" }}>VIEW</div>
          {(["packs", "feed"] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ all: "unset", display: "flex", alignItems: "center", gap: 6, padding: "7px 10px", fontSize: 11, borderLeft: `2px solid ${view === v ? "#00ff87" : "transparent"}`, color: view === v ? "#fff" : "hsl(var(--muted-foreground))", background: view === v ? "rgba(255,255,255,.03)" : "transparent", cursor: "pointer" }}>
              {v === "packs" ? "📊 All Packs" : "📋 Recent Pulls"}
            </button>
          ))}

          <div style={{ padding: "10px 10px 5px", marginTop: 6, fontSize: 7, color: "hsl(var(--muted-foreground))", letterSpacing: 1.5, fontFamily: "var(--font-mono)" }}>MARKETS</div>
          {cats.map(c => {
            const color = c === "all" ? "#00ff87" : CAT_COLOR[c] ?? "#888";
            const packs = data ? (c === "all" ? data.packs : data.packs.filter(p => p.category === c)) : [];
            const posN  = packs.filter(p => p.evRatio >= 1).length;
            const active = tab === c;
            return (
              <button key={c} onClick={() => setTab(c)} style={{ all: "unset", display: "flex", alignItems: "center", gap: 7, padding: "6px 10px", fontSize: 11, borderLeft: `2px solid ${active ? color : "transparent"}`, color: active ? "#fff" : "hsl(var(--muted-foreground))", cursor: "pointer", background: active ? "rgba(255,255,255,.025)" : "transparent" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
                <span style={{ flex: 1 }}>{c === "all" ? "All" : c}</span>
                {posN > 0 && <span style={{ fontSize: 8, fontWeight: 700, color: "#00ff87", background: "rgba(0,255,135,.08)", padding: "1px 4px", borderRadius: 3, fontFamily: "var(--font-mono)" }}>{posN}+</span>}
              </button>
            );
          })}

          <div style={{ marginTop: "auto", padding: 10, borderTop: "1px solid hsl(var(--border))" }}>
            <a href="https://courtyard.io" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "hsl(var(--muted-foreground))", textDecoration: "none" }}>
              <span>🔗</span> Open Courtyard.io
            </a>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Loading */}
          {isLoading && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ fontSize: 28 }}>⚡</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--muted-foreground))" }}>Loading live Courtyard data...</div>
            </div>
          )}

          {/* Error */}
          {isError && !data && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ fontSize: 28 }}>⚠️</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#ff3860" }}>Could not load data</div>
              <button onClick={() => refetch()} style={{ padding: "8px 20px", background: "#00ff87", border: "none", borderRadius: 8, color: "#000", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Retry</button>
            </div>
          )}

          {/* Content */}
          {data && (
            <>
              {view === "packs" && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                  {/* Hero best pack */}
                  {best && (
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid hsl(var(--border))", background: "linear-gradient(135deg,rgba(0,255,135,.04),transparent)", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
                      <img src={packImg(best.id)} alt={best.name} style={{ width: 40, height: 56, objectFit: "contain", borderRadius: 4 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <div>
                        <div style={{ fontSize: 9, color: "#00ff87", letterSpacing: 1.5, fontWeight: 700, fontFamily: "var(--font-mono)" }}>BEST VALUE RIGHT NOW</div>
                        <div style={{ fontSize: 17, fontWeight: 800, color: "#fff", letterSpacing: -0.5, marginTop: 2 }}>{best.name}</div>
                        <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
                          <span style={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }}>EV Ratio <span style={{ color: "#00ff87", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{$x(best.evRatio)}</span></span>
                          <span style={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }}>Cal. EV <span style={{ color: "#fff", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{$f(best.calibratedEv)}</span></span>
                          <span style={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }}>Buyback <span style={{ color: best.buybackEv >= 1 ? "#00ff87" : "#ff3860", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{$x(best.buybackEv)}</span></span>
                        </div>
                      </div>
                      <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                        <span className={`signal-badge ${getSignal(best.evRatio).cls}`}>{getSignal(best.evRatio).label}</span>
                        <a href={`https://courtyard.io/vending-machine/${best.id}`} target="_blank" rel="noreferrer" style={{ padding: "6px 14px", background: "#00ff87", borderRadius: 7, color: "#000", fontWeight: 800, fontSize: 12, textDecoration: "none" }}>Rip a Pack ↗</a>
                      </div>
                    </div>
                  )}

                  {/* Toolbar */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderBottom: "1px solid hsl(var(--border))", flexShrink: 0, flexWrap: "wrap" }}>
                    {(["all", "pos", "neg"] as const).map(f => (
                      <button key={f} onClick={() => setFilter(f)} className={`toolbar-btn${filter === f ? " on" : ""}`}>
                        {f === "all" ? "All Packs" : f === "pos" ? "+EV Only" : "−EV Only"}
                      </button>
                    ))}
                    <span style={{ fontSize: 8, color: "hsl(var(--muted-foreground))", letterSpacing: 1, marginLeft: 8, fontFamily: "var(--font-mono)" }}>SORT</span>
                    {([["ev", "EV Ratio"], ["bb", "Buyback"], ["wr", "Win Rate"], ["price", "Price"], ["pulls", "Pulls"]] as [string, string][]).map(([k, l]) => (
                      <button key={k} onClick={() => setSort(k as any)} className={`toolbar-btn${sort === k ? " on" : ""}`}>{l} ↕</button>
                    ))}
                  </div>

                  {/* Table */}
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    {visiblePacks.length === 0 ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 120, color: "hsl(var(--muted-foreground))", fontSize: 12 }}>No packs match this filter</div>
                    ) : (
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                        <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "hsl(var(--card))" }}>
                          <tr>
                            <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid hsl(var(--border))", fontSize: 8, letterSpacing: 1.5, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)", width: 40 }}>#</th>
                            <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid hsl(var(--border))", fontSize: 8, letterSpacing: 1.5, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)" }}>PACK</th>
                            <th style={{ padding: "8px 12px", textAlign: "right", borderBottom: "1px solid hsl(var(--border))", fontSize: 8, letterSpacing: 1.5, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)" }}>PRICE</th>
                            <th style={{ padding: "8px 12px", textAlign: "right", borderBottom: "1px solid hsl(var(--border))", fontSize: 8, letterSpacing: 1.5, color: "#00ff87", fontFamily: "var(--font-mono)" }}>EV RATIO</th>
                            <th style={{ padding: "8px 12px", textAlign: "right", borderBottom: "1px solid hsl(var(--border))", fontSize: 8, letterSpacing: 1.5, color: "#00ff87", fontFamily: "var(--font-mono)" }}>CAL. EV</th>
                            <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid hsl(var(--border))", fontSize: 8, letterSpacing: 1.5, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)", minWidth: 130 }}>WIN RATE</th>
                            <th style={{ padding: "8px 12px", textAlign: "center", borderBottom: "1px solid hsl(var(--border))", fontSize: 8, letterSpacing: 1.5, color: "#ffd166", fontFamily: "var(--font-mono)" }}>BUYBACK <span style={{ fontSize: 7, background: "rgba(255,209,102,.1)", color: "#ffd166", padding: "1px 4px", borderRadius: 2 }}>REAL CASH</span></th>
                            <th style={{ padding: "8px 12px", textAlign: "center", borderBottom: "1px solid hsl(var(--border))", fontSize: 8, letterSpacing: 1.5, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)" }}>SIGNAL</th>
                            <th style={{ padding: "8px 12px", textAlign: "center", borderBottom: "1px solid hsl(var(--border))", fontSize: 8, letterSpacing: 1.5, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)" }}>TREND</th>
                            <th style={{ padding: "8px 12px", textAlign: "right", borderBottom: "1px solid hsl(var(--border))", fontSize: 8, letterSpacing: 1.5, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)" }}>ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visiblePacks.map((pack, idx) => {
                            const sig = getSignal(pack.evRatio);
                            const catColor = CAT_COLOR[pack.category] ?? "#888";
                            const evColor = pack.evRatio >= 1.3 ? "#00ff87" : pack.evRatio >= 1 ? "#4fd8a0" : pack.evRatio >= 0.9 ? "#ffd166" : "#ff3860";
                            const bbColor = pack.buybackEv >= 1 ? "#00ff87" : "#ff3860";
                            return (
                              <tr key={pack.id} className="pack-row" style={{ borderBottom: "1px solid hsl(var(--border))", cursor: "default" }}>
                                <td style={{ padding: "10px 12px", color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700 }}>#{idx + 1}</td>
                                <td style={{ padding: "10px 12px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                      <img src={packImg(pack.id)} alt={pack.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                        onError={(e) => {
                                          const el = e.target as HTMLImageElement;
                                          el.style.display = "none";
                                          if (el.parentElement) el.parentElement.innerHTML = `<span style="font-size:8px;font-weight:800;color:hsl(var(--muted-foreground))">${pack.category.slice(0,4).toUpperCase()}</span>`;
                                        }} />
                                    </div>
                                    <div>
                                      <div className="pack-name" style={{ fontWeight: 700, fontSize: 13, color: "#fff", lineHeight: 1.2 }}>{pack.name}</div>
                                      <div style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", marginTop: 2 }}>
                                        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: catColor, marginRight: 4, verticalAlign: "middle" }} />
                                        {pack.category} · {pack.totalPulls} pulls
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 600, color: "hsl(var(--muted-foreground))" }}>${pack.price}</td>
                                <td style={{ padding: "10px 12px", textAlign: "right" }}>
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 16, color: evColor, lineHeight: 1 }}>{$x(pack.evRatio)}</span>
                                    <span style={{ fontSize: 9, color: "hsl(var(--muted-foreground))" }}>{pack.evRatio >= 1 ? "▲" : "▼"} EV</span>
                                  </div>
                                </td>
                                <td style={{ padding: "10px 12px", textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 700, color: evColor }}>{$f(pack.calibratedEv)}</td>
                                <td style={{ padding: "10px 12px" }}>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9 }}>
                                      <span style={{ color: "hsl(var(--muted-foreground))" }}>Win Rate</span>
                                      <span style={{ fontWeight: 700, fontFamily: "var(--font-mono)" }}>{(pack.winRate * 100).toFixed(1)}%</span>
                                    </div>
                                    <div style={{ height: 4, borderRadius: 2, background: "hsl(var(--secondary))", overflow: "hidden" }}>
                                      <div style={{ height: "100%", borderRadius: 2, width: `${Math.min(pack.winRate * 100 * 2, 100)}%`, background: pack.evRatio >= 1 ? "#00ff87" : "#ffd166", transition: "width .4s" }} />
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: "10px 12px", textAlign: "center", fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: 14, color: bbColor }}>{$x(pack.buybackEv)}</td>
                                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                                  <span className={`signal-badge ${sig.cls}`}>{sig.label}</span>
                                </td>
                                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                                  <Spark trend={pack.trend} />
                                </td>
                                <td style={{ padding: "10px 12px", textAlign: "right" }}>
                                  <a href={`https://courtyard.io/vending-machine/${pack.id}`} target="_blank" rel="noreferrer" style={{ display: "inline-block", padding: "5px 12px", border: "1px solid rgba(0,255,135,.3)", borderRadius: 6, fontSize: 10, color: "#00ff87", fontWeight: 700, textDecoration: "none", background: "rgba(0,255,135,.05)", fontFamily: "var(--font-mono)" }}>View ↗</a>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {view === "feed" && (
                <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {(data.recentPulls as PullRecord[]).map(pull => {
                    const win  = pull.fmv > pull.packPrice;
                    const diff = pull.fmv - pull.packPrice;
                    const hue  = pull.user.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
                    return (
                      <div key={pull.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", border: "1px solid hsl(var(--border))", borderRadius: 10, background: "hsl(var(--card))" }} className="pack-row">
                        <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, background: `hsl(${hue},25%,12%)`, border: `1px solid hsl(${hue},25%,20%)`, color: `hsl(${hue},40%,55%)`, fontFamily: "var(--font-mono)" }}>
                          {pull.user.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#00cc6a" }}>@{pull.user}</span>
                            <span style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", padding: "1px 6px", background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))", borderRadius: 3, fontFamily: "var(--font-mono)" }}>{pull.packName}</span>
                            <span style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", marginLeft: "auto", fontFamily: "var(--font-mono)" }}>{ago(pull.timestamp)}</span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pull.cardName}</div>
                          {pull.grade && <div style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", marginTop: 2, fontFamily: "var(--font-mono)" }}>{pull.grader} {pull.grade}</div>}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 15, color: win ? "#00ff87" : "hsl(var(--muted-foreground))", fontFamily: "var(--font-mono)" }}>{$f(pull.fmv)}</div>
                          <div style={{ fontSize: 9, color: win ? "#00cc6a" : "#ff3860", marginTop: 2, fontFamily: "var(--font-mono)" }}>{win ? "+" : ""}{$f(diff)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── STATS BAR ── */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", flexShrink: 0, borderTop: "1px solid hsl(var(--border))" }}>
          {[
            { l: "PULLS TRACKED", v: data.totalPulls, sub: data.isLive ? "from Courtyard.io" : "sample data", vc: "#fff" },
            { l: "+EV PACKS", v: data.posEV, sub: "above break-even", vc: "#00ff87" },
            { l: "BEST EV RIGHT NOW", v: $x(data.bestPack?.evRatio ?? 0), sub: data.bestPack?.name ?? "—", vc: "#00ff87" },
            { l: "MARKET AVG EV", v: $x(data.avgEV), sub: data.avgEV >= 1 ? "Market is healthy" : "Market is below EV", vc: data.avgEV >= 1 ? "#00ff87" : "#ff3860" },
          ].map((s, i) => (
            <div key={i} style={{ padding: "12px 16px", borderRight: i < 3 ? "1px solid hsl(var(--border))" : "none", background: "hsl(var(--card))" }}>
              <div style={{ fontSize: 8, color: "hsl(var(--muted-foreground))", letterSpacing: 1.5, fontFamily: "var(--font-mono)", marginBottom: 4 }}>{s.l}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.vc, lineHeight: 1, fontFamily: "var(--font-mono)" }}>{s.v}</div>
              <div style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── TICKER ── */}
      {data && data.recentPulls.length > 0 && (
        <div style={{ height: 32, flexShrink: 0, borderTop: "1px solid hsl(var(--border))", background: "hsl(var(--card))", overflow: "hidden", display: "flex", alignItems: "center" }}>
          <div style={{ padding: "0 10px", fontSize: 8, color: "#00ff87", letterSpacing: 1.5, flexShrink: 0, borderRight: "1px solid hsl(var(--border))", height: "100%", display: "flex", alignItems: "center", fontFamily: "var(--font-mono)", fontWeight: 700 }}>LIVE PULLS</div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div className="ticker-track">
              {[...data.recentPulls, ...data.recentPulls].map((pull, i) => {
                const win = pull.fmv > pull.packPrice;
                return (
                  <div key={`${pull.id}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0 18px", fontSize: 10, borderRight: "1px solid hsl(var(--border))", height: 32, fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                    <span style={{ color: "hsl(var(--muted-foreground))" }}>@{pull.user}</span>
                    <span style={{ color: "#fff" }}>{pull.cardName.slice(0, 22)}</span>
                    <span style={{ fontWeight: 700, color: win ? "#00ff87" : "#ff3860" }}>{$f(pull.fmv)}</span>
                    <span style={{ color: win ? "rgba(0,255,135,.5)" : "rgba(255,56,96,.5)" }}>{win ? "+" : ""}{$f(pull.fmv - pull.packPrice)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ padding: "4px 16px", borderTop: "1px solid hsl(var(--border))", background: "hsl(var(--card))", textAlign: "center" }}>
        <span style={{ fontSize: 9, color: "hsl(var(--muted-foreground))", fontFamily: "var(--font-sans)" }}>
          For educational purposes only. Not financial advice. Pack outcomes are random. EV based on recent pull history — actual results will vary. Not affiliated with Courtyard.io.
        </span>
      </div>

    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}
