import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCourtyardData } from "./hooks/use-courtyard-data";
import { Pack, PullRecord } from "./data/packs";

const queryClient = new QueryClient();

const CAT_COLOR: Record<string, string> = {
  Pokémon: "#ffd166", Baseball: "#4f8fff", Basketball: "#ff7f3f",
  Hockey: "#a0d8ef", Football: "#7fba00", Soccer: "#00e5ff",
  Sports: "#9f7aea", Magic: "#e040fb", Comics: "#ff5252", Watch: "#b0bec5",
};

const CAT_EMOJI: Record<string, string> = {
  Pokémon: "⚡", Baseball: "⚾", Basketball: "🏀",
  Hockey: "🏒", Football: "🏈", Soccer: "⚽",
  Sports: "🏆", Magic: "🔮", Comics: "💥", Watch: "⌚",
};

function getSignal(ev: number): { label: string; color: string; bg: string; border: string } {
  if (ev >= 1.3) return { label: "GREAT VALUE", color: "#00ff87", bg: "rgba(0,255,135,.1)", border: "rgba(0,255,135,.25)" };
  if (ev >= 1.0) return { label: "GOOD VALUE",  color: "#4f8fff", bg: "rgba(79,143,255,.1)", border: "rgba(79,143,255,.25)" };
  if (ev >= 0.9) return { label: "FAIR VALUE",  color: "#ffd166", bg: "rgba(255,209,102,.1)", border: "rgba(255,209,102,.25)" };
  return              { label: "BELOW EV",    color: "#ff3860", bg: "rgba(255,56,96,.1)",  border: "rgba(255,56,96,.25)"  };
}

function ago(ts: string) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}

const $f = (n: number) => `$${(+n).toFixed(2)}`;
const $x = (n: number) => `${(+n).toFixed(3)}x`;

function packImg(id: string) {
  return `https://api.courtyard.io/configs/vending-machine/${id}/resources/sealed_pack.png`;
}

function Spark({ trend, color }: { trend: "up" | "down" | "flat"; color: string }) {
  const pts = trend === "up"   ? "0,16 15,12 30,7 45,3 60,1"
            : trend === "down" ? "0,1 15,4 30,8 45,12 60,16"
            :                   "0,9 15,7 30,10 45,8 60,9";
  const cy  = trend === "up" ? 1 : trend === "down" ? 16 : 9;
  return (
    <svg width="60" height="18">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="60" cy={cy} r="2" fill={color} />
    </svg>
  );
}

// ── CSS (injected once) ───────────────────────────────────────────────────────
const CSS = `
  :root {
    --bg: #060d18;
    --bg1: #080f1c;
    --bg2: #0c1524;
    --bg3: #101c2e;
    --border: #122038;
    --text: #d0dff0;
    --muted: #3a5068;
    --green: #00ff87;
    --green2: #00cc6a;
    --red: #ff3860;
    --blue: #4f8fff;
    --yellow: #ffd166;
    --font-display: 'Space Grotesk', system-ui, sans-serif;
    --font-mono: 'Fira Code', 'Courier New', monospace;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--bg) !important; color: var(--text); font-family: var(--font-display); }
  ::-webkit-scrollbar { width: 3px; height: 3px; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
  
  .live-dot { display:inline-block; width:6px; height:6px; border-radius:50%; background:var(--green); box-shadow:0 0 8px rgba(0,255,135,.8); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
  
  .top-ticker { background:var(--bg1); border-bottom:1px solid var(--border); height:38px; display:flex; align-items:center; overflow:hidden; }
  .ticker-lbl { padding:0 12px; font-size:9px; font-weight:700; color:var(--green); letter-spacing:1.5px; font-family:var(--font-mono); border-right:1px solid var(--border); height:100%; display:flex; align-items:center; white-space:nowrap; flex-shrink:0; }
  .ticker-track { display:flex; white-space:nowrap; animation:ticker 60s linear infinite; }
  .ticker-item { display:inline-flex; align-items:center; gap:8px; padding:0 18px; font-size:10px; border-right:1px solid var(--border); height:38px; font-family:var(--font-mono); flex-shrink:0; }
  @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }

  .nav { height:48px; display:flex; align-items:center; padding:0 16px; gap:10px; border-bottom:1px solid var(--border); background:var(--bg1); flex-shrink:0; }
  
  .stat-card { background:var(--bg2); border:1px solid var(--border); border-radius:10px; padding:14px 18px; flex:1; }
  .stat-card-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px; margin-bottom:8px; }
  
  .best-card { background:var(--bg2); border:1px solid var(--border); border-radius:12px; padding:20px 24px; margin:0 16px; }
  
  .tb-btn { background:transparent; border:1px solid var(--border); border-radius:4px; padding:4px 10px; font-size:9px; color:var(--muted); cursor:pointer; font-family:var(--font-mono); letter-spacing:.5px; transition:all .15s; }
  .tb-btn:hover { color:var(--text); border-color:var(--muted); }
  .tb-btn.on { color:var(--green); border-color:rgba(0,255,135,.3); background:rgba(0,255,135,.06); }
  
  .pack-row { border-bottom:1px solid var(--border); transition:background .12s; cursor:default; }
  .pack-row:hover { background:rgba(255,255,255,.015); }
  .pack-row:hover .pname { color:var(--green) !important; }
  .pname { transition:color .12s; }
  
  .sig { display:inline-block; padding:3px 9px; border-radius:4px; font-size:9px; font-weight:800; letter-spacing:.8px; border:1px solid; font-family:var(--font-mono); white-space:nowrap; }
  
  .sb-btn { all:unset; display:flex; align-items:center; gap:7px; padding:7px 10px; font-size:11px; border-left:2px solid transparent; cursor:pointer; color:var(--muted); width:100%; transition:all .1s; }
  .sb-btn:hover { color:var(--text); background:rgba(255,255,255,.02); }
  .sb-btn.on { color:var(--text); }
  
  @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
  .fade-in { animation:fadeIn .25s ease both; }
`;

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const { data, isLoading, refetch } = useCourtyardData();
  const [tab, setTab]     = useState<string>("all");
  const [view, setView]   = useState<"packs" | "feed">("packs");
  const [sort, setSort]   = useState<"ev" | "bb" | "wr" | "price">("ev");
  const [filter, setFilter] = useState<"all" | "pos" | "neg">("all");
  const [cd, setCd]       = useState(300);

  useEffect(() => {
    const t = setInterval(() => setCd(c => {
      if (c <= 1) { refetch(); return 300; }
      return c - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [refetch]);

  const cats = data ? ["all", ...Array.from(new Set(data.packs.map(p => p.category)))] : ["all"];

  const rows: Pack[] = data ? [...data.packs]
    .filter(p => tab === "all" || p.category === tab)
    .filter(p => filter === "pos" ? p.evRatio >= 1 : filter === "neg" ? p.evRatio < 1 : true)
    .sort((a, b) =>
      sort === "ev"    ? b.evRatio - a.evRatio :
      sort === "bb"    ? b.buybackEv - a.buybackEv :
      sort === "wr"    ? b.winRate - a.winRate :
      a.price - b.price
    ) : [];

  const best = data?.packs[0];

  const S: React.CSSProperties = { fontFamily: "var(--font-mono)" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <style>{CSS}</style>

      {/* ── TOP TICKER ── */}
      {data && data.recentPulls.length > 0 && (
        <div className="top-ticker">
          <div className="ticker-lbl"><span className="live-dot" style={{ marginRight: 6 }} />LIVE PULLS</div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <div className="ticker-track">
              {[...data.recentPulls, ...data.recentPulls].map((p, i) => {
                const win  = p.fmv > p.packPrice;
                return (
                  <div key={`${p.id}-${i}`} className="ticker-item">
                    <span style={{ color: "var(--muted)", fontSize: 9 }}>@{p.user}</span>
                    <span style={{ color: "var(--text)", fontWeight: 600 }}>{p.cardName.slice(0, 22)}</span>
                    <span style={{ color: win ? "var(--green)" : "var(--red)", fontWeight: 800 }}>{$f(p.fmv)}</span>
                    <span style={{ color: win ? "rgba(0,255,135,.6)" : "rgba(255,56,96,.6)", fontSize: 9 }}>
                      ({win ? "+" : ""}{$f(p.fmv - p.packPrice)})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── NAV ── */}
      <nav className="nav">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#00ff87,#4f8fff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#fff", lineHeight: 1 }}>PackPulse</div>
            <div style={{ fontSize: 7, color: "var(--muted)", letterSpacing: 1.5, ...S }}>COURTYARD EV TRACKER</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: 14, padding: "3px 10px", border: "1px solid rgba(0,255,135,.2)", borderRadius: 20, background: "rgba(0,255,135,.05)", flexShrink: 0 }}>
          <span className="live-dot" style={{ width: 5, height: 5 }} />
          <span style={{ fontSize: 9, color: "var(--green)", fontWeight: 700, letterSpacing: 1, ...S }}>
            {data?.isLive ? "LIVE" : "SAMPLE"} · {Math.floor(cd / 60)}:{String(cd % 60).padStart(2, "0")}
          </span>
        </div>

        {data && (
          <>
            {[
              { l: "+EV PACKS", v: `${data.posEV}/${data.packs.length}`, c: "var(--green)" },
              { l: "AVG EV", v: $x(data.avgEV), c: data.avgEV >= 1 ? "var(--green)" : "var(--red)" },
              { l: "PULLS", v: `${data.totalPulls}`, c: "#fff" },
            ].map(s => (
              <div key={s.l} style={{ padding: "3px 10px", border: "1px solid var(--border)", borderRadius: 6, textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 7, color: "var(--muted)", letterSpacing: 1, ...S }}>{s.l}</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: s.c, lineHeight: 1.2 }}>{s.v}</div>
              </div>
            ))}
          </>
        )}

        <button onClick={() => refetch()} disabled={isLoading} style={{ marginLeft: "auto", padding: "4px 12px", background: "transparent", border: "1px solid var(--border)", borderRadius: 5, fontSize: 9, color: "var(--muted)", cursor: "pointer", ...S }}>↻ Refresh</button>
      </nav>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Sidebar */}
        <aside style={{ width: 176, flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--bg1)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "10px 10px 4px", fontSize: 7, color: "var(--muted)", letterSpacing: 1.5, ...S }}>WORKSPACE</div>

          {(["packs", "feed"] as const).map(v => (
            <button key={v} className={`sb-btn${view === v ? " on" : ""}`}
              onClick={() => setView(v)}
              style={{ borderLeftColor: view === v ? "var(--green)" : "transparent", background: view === v ? "rgba(255,255,255,.03)" : "transparent" }}>
              {v === "packs" ? <>⚡ <span>EV Terminal</span></> : <>📋 <span>Recent Pulls</span></>}
            </button>
          ))}

          <div style={{ padding: "10px 10px 4px", marginTop: 6, fontSize: 7, color: "var(--muted)", letterSpacing: 1.5, ...S }}>MARKETS</div>
          {cats.map(c => {
            const color   = c === "all" ? "var(--green)" : CAT_COLOR[c] ?? "#888";
            const emoji   = c === "all" ? "⚡" : CAT_EMOJI[c] ?? "📦";
            const packs   = data ? (c === "all" ? data.packs : data.packs.filter(p => p.category === c)) : [];
            const posN    = packs.filter(p => p.evRatio >= 1).length;
            const active  = tab === c;
            return (
              <button key={c} className={`sb-btn${active ? " on" : ""}`} onClick={() => setTab(c)}
                style={{ borderLeftColor: active ? (c === "all" ? "var(--green)" : CAT_COLOR[c] ?? "#888") : "transparent", background: active ? "rgba(255,255,255,.03)" : "transparent" }}>
                <span style={{ fontSize: 13 }}>{emoji}</span>
                <span style={{ flex: 1 }}>{c === "all" ? "All Markets" : c}</span>
                {posN > 0 && <span style={{ fontSize: 8, fontWeight: 700, color: "var(--green)", background: "rgba(0,255,135,.08)", padding: "1px 5px", borderRadius: 3, ...S }}>{posN}+EV {posN}</span>}
              </button>
            );
          })}

          <div style={{ marginTop: "auto", padding: 10, borderTop: "1px solid var(--border)" }}>
            <a href="https://courtyard.io" target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--muted)", textDecoration: "none" }}>
              🔗 Open Courtyard.io
            </a>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Loading */}
          {isLoading && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <div style={{ fontSize: 32 }}>⚡</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)" }}>Loading live Courtyard data...</div>
            </div>
          )}

          {/* Packs view */}
          {data && view === "packs" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

              {/* Hero */}
              <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 24, alignItems: "stretch", marginBottom: 16 }}>
                  {/* Big headline */}
                  <div style={{ flex: 2 }}>
                    <h1 style={{ fontWeight: 800, fontSize: 28, color: "#fff", lineHeight: 1.1, letterSpacing: -1, marginBottom: 8 }}>
                      Stop buying packs blind.
                    </h1>
                    <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
                      Real-time expected value tracking for every <a href="https://courtyard.io" target="_blank" rel="noreferrer" style={{ color: "var(--green)", textDecoration: "underline" }}>Courtyard.io</a> mystery pack. See the real math before you rip.
                    </p>
                  </div>
                  {/* Rip CTA */}
                  {best && (
                    <a href={`https://courtyard.io/vending-machine/${best.id}`} target="_blank" rel="noreferrer"
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "14px 22px", background: "var(--green)", borderRadius: 12, color: "#000", fontWeight: 800, fontSize: 16, textDecoration: "none", flexShrink: 0, gap: 2 }}>
                      <span>Rip a</span><span>Pack ↗</span>
                    </a>
                  )}
                </div>

                {/* Stat cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
                  {[
                    { icon: "⚡", label: "+EV PACKS", val: `${data.posEV}/${data.packs.length}`, sub: "above break-even", vc: "var(--green)", bg: "rgba(0,255,135,.08)" },
                    { icon: "📈", label: "BEST EV RIGHT NOW", val: $x(data.bestPack?.evRatio ?? 0), sub: data.bestPack?.name ?? "—", vc: "var(--green)", bg: "rgba(0,255,135,.05)" },
                    { icon: "📊", label: "PULLS TRACKED", val: `${data.totalPulls}`, sub: data.isLive ? "from Courtyard.io" : "sample data", vc: "#fff", bg: "rgba(255,255,255,.03)" },
                    { icon: "🎯", label: "MARKET AVG EV", val: $x(data.avgEV), sub: data.avgEV >= 1 ? "Market is healthy" : "Market below EV", vc: data.avgEV >= 1 ? "var(--green)" : "var(--red)", bg: data.avgEV >= 1 ? "rgba(0,255,135,.05)" : "rgba(255,56,96,.05)" },
                  ].map(s => (
                    <div key={s.label} style={{ background: s.bg, border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 18 }}>{s.icon}</span>
                        <span style={{ fontSize: 8, color: "var(--muted)", letterSpacing: 1.2, fontWeight: 700, ...S }}>{s.label}</span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 22, color: s.vc, lineHeight: 1, marginBottom: 3 }}>{s.val}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)" }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Best pack card */}
                {best && (
                  <div className="best-card">
                    <div style={{ fontSize: 9, color: "var(--green)", letterSpacing: 2, fontWeight: 700, ...S, marginBottom: 8 }}>BEST VALUE RIGHT NOW</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                      <img src={packImg(best.id)} alt="" style={{ width: 48, height: 64, objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 20, color: "#fff", marginBottom: 8 }}>{best.name}</div>
                        <div style={{ display: "flex", gap: 32 }}>
                          <div><div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 1, ...S }}>EV RATIO</div><div style={{ fontWeight: 800, fontSize: 20, color: "var(--green)" }}>{$x(best.evRatio)}</div></div>
                          <div><div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 1, ...S }}>CAL. EV</div><div style={{ fontWeight: 800, fontSize: 20, color: "var(--green)" }}>{$f(best.calibratedEv)}</div></div>
                          <div><div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 1, ...S }}>PACK PRICE</div><div style={{ fontWeight: 800, fontSize: 20, color: "#fff" }}>${best.price}.00</div></div>
                          <div><div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 1, ...S }}>BUYBACK EV</div><div style={{ fontWeight: 800, fontSize: 20, color: best.buybackEv >= 1 ? "var(--green)" : "var(--red)" }}>{$x(best.buybackEv)}</div></div>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                        {(() => { const sig = getSignal(best.evRatio); return <span className="sig" style={{ color: sig.color, background: sig.bg, borderColor: sig.border }}>{sig.label}</span>; })()}
                        <a href={`https://courtyard.io/vending-machine/${best.id}`} target="_blank" rel="noreferrer"
                          style={{ fontSize: 11, color: "var(--green)", textDecoration: "none", ...S }}>View Details → ↗</a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pack Monitor header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0, background: "var(--bg1)" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: 1, ...S }}>📊 PACK MONITOR</span>
                <span style={{ fontSize: 9, color: "var(--muted)", ...S }}>{data.packs.length} packs · sorted by EV ratio</span>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
                  <span className="live-dot" style={{ width: 5, height: 5 }} />
                  <span style={{ fontSize: 9, color: "var(--green)", fontWeight: 700, ...S }}>LIVE DATA</span>
                </div>
              </div>

              {/* Toolbar */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderBottom: "1px solid var(--border)", flexShrink: 0, flexWrap: "wrap" as const }}>
                <button className={`tb-btn${filter === "all" ? " on" : ""}`} onClick={() => setFilter("all")}>All Packs ({data.packs.length})</button>
                <button className={`tb-btn${filter === "pos" ? " on" : ""}`} onClick={() => setFilter("pos")}>+EV Only</button>
                <button className={`tb-btn${filter === "neg" ? " on" : ""}`} onClick={() => setFilter("neg")}>−EV Only</button>
                <span style={{ fontSize: 8, color: "var(--muted)", marginLeft: 8, ...S }}>SORT BY</span>
                {([["ev","EV Ratio"],["bb","Buyback"],["wr","Win Rate"],["price","Price"]] as [string,string][]).map(([k,l]) => (
                  <button key={k} className={`tb-btn${sort === k ? " on" : ""}`} onClick={() => setSort(k as any)}>{l} ↕</button>
                ))}
              </div>

              {/* Table */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead style={{ position: "sticky", top: 0, zIndex: 10, background: "var(--bg2)" }}>
                    <tr>
                      {["#","PACK","PRICE","EV RATIO ↕","CAL. EV","WIN RATE","BUYBACK","POOL","TREND","SIGNAL","ACTION"].map((h,i) => (
                        <th key={i} style={{ padding: "8px 12px", textAlign: i > 2 ? "right" : "left", borderBottom: "1px solid var(--border)", fontSize: 8, letterSpacing: 1.2, color: h.includes("EV") ? "var(--green)" : "var(--muted)", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" as const }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((pack, idx) => {
                      const sig     = getSignal(pack.evRatio);
                      const catC    = CAT_COLOR[pack.category] ?? "#888";
                      const evC     = pack.evRatio >= 1.3 ? "#00ff87" : pack.evRatio >= 1 ? "#4fd8a0" : pack.evRatio >= 0.9 ? "#ffd166" : "#ff3860";
                      const bbC     = pack.buybackEv >= 1 ? "#00ff87" : "#ff3860";
                      return (
                        <tr key={pack.id} className="pack-row fade-in">
                          <td style={{ padding: "12px", color: "var(--muted)", ...S, fontWeight: 700 }}>#{idx+1}</td>
                          <td style={{ padding: "12px 12px 12px 6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 44, height: 44, borderRadius: 8, overflow: "hidden", background: "var(--bg3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <img src={packImg(pack.id)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  onError={(e) => {
                                    const el = e.target as HTMLImageElement;
                                    el.style.display = "none";
                                    if (el.parentElement) el.parentElement.innerHTML = `<span style="font-size:8px;font-weight:800;color:${catC}">${pack.category.slice(0,4)}</span>`;
                                  }} />
                              </div>
                              <div>
                                <div className="pname" style={{ fontWeight: 700, fontSize: 13, color: "#fff", lineHeight: 1.2 }}>{pack.name}</div>
                                <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 3 }}>
                                  <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: catC, marginRight: 4, verticalAlign: "middle" }} />
                                  {pack.category} · {pack.totalPulls} pulls
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px", textAlign: "right", ...S, fontWeight: 600, color: "var(--muted)" }}>${pack.price}.00</td>
                          <td style={{ padding: "12px", textAlign: "right" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                              <span style={{ fontWeight: 800, fontSize: 17, color: evC, lineHeight: 1, ...S }}>{$x(pack.evRatio)}</span>
                              <span style={{ fontSize: 8, color: "var(--muted)" }}>{pack.evRatio >= 1 ? "▲" : "▼"} x EV</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px", textAlign: "right", ...S, fontWeight: 700, color: evC }}>{$f(pack.calibratedEv)}</td>
                          <td style={{ padding: "12px", textAlign: "right", minWidth: 120 }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                              <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 10 }}>
                                <span style={{ color: "var(--muted)" }}>Win rate</span>
                                <span style={{ ...S, fontWeight: 700 }}>{(pack.winRate * 100).toFixed(1)}%</span>
                              </div>
                              <div style={{ width: 90, height: 4, borderRadius: 2, background: "var(--bg3)", overflow: "hidden" }}>
                                <div style={{ height: "100%", borderRadius: 2, width: `${Math.min(pack.winRate * 200, 100)}%`, background: pack.evRatio >= 1 ? "#00ff87" : "#ffd166" }} />
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px", textAlign: "right", ...S, fontWeight: 800, fontSize: 14, color: bbC }}>{$x(pack.buybackEv)}</td>
                          <td style={{ padding: "12px", textAlign: "right" }}>
                            <div style={{ fontSize: 9, color: "var(--muted)", ...S }}>— / —</div>
                          </td>
                          <td style={{ padding: "12px", textAlign: "right" }}>
                            <Spark trend={pack.trend} color={evC} />
                          </td>
                          <td style={{ padding: "12px", textAlign: "right" }}>
                            <span className="sig" style={{ color: sig.color, background: sig.bg, borderColor: sig.border }}>{sig.label}</span>
                          </td>
                          <td style={{ padding: "12px", textAlign: "right" }}>
                            <a href={`https://courtyard.io/vending-machine/${pack.id}`} target="_blank" rel="noreferrer"
                              style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "4px 10px", border: "1px solid rgba(0,255,135,.25)", borderRadius: 6, fontSize: 10, color: "var(--green)", fontWeight: 700, textDecoration: "none", background: "rgba(0,255,135,.04)", ...S }}>
                              View ↗
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Feed view */}
          {data && view === "feed" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {(data.recentPulls as PullRecord[]).map(pull => {
                const win  = pull.fmv > pull.packPrice;
                const diff = pull.fmv - pull.packPrice;
                const hue  = pull.user.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
                return (
                  <div key={pull.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 10, background: "var(--bg1)" }} className="pack-row">
                    <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, background: `hsl(${hue},25%,12%)`, border: `1px solid hsl(${hue},25%,20%)`, color: `hsl(${hue},40%,55%)`, ...S }}>
                      {pull.user.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green2)" }}>@{pull.user}</span>
                        <span style={{ fontSize: 9, color: "var(--muted)", padding: "1px 6px", background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 3, ...S }}>{pull.packName}</span>
                        <span style={{ fontSize: 9, color: "var(--muted)", marginLeft: "auto", ...S }}>{ago(pull.timestamp)}</span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{pull.cardName}</div>
                      {pull.grade && <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 2, ...S }}>{pull.grader} {pull.grade}</div>}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: win ? "var(--green)" : "var(--muted)", ...S }}>{$f(pull.fmv)}</div>
                      <div style={{ fontSize: 9, color: win ? "var(--green2)" : "var(--red)", marginTop: 2, ...S }}>{win ? "+" : ""}{$f(diff)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Disclaimer */}
      <div style={{ padding: "5px 16px", borderTop: "1px solid var(--border)", background: "var(--bg1)", textAlign: "center" }}>
        <span style={{ fontSize: 9, color: "var(--muted)" }}>For educational purposes only. Not financial advice. Pack outcomes are random. EV based on recent pull history — results will vary. Not affiliated with Courtyard.io.</span>
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
