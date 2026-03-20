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

function signal(ev: number) {
  if (ev >= 1.3) return { label: "GREAT VALUE", c: "#00ff87", bg: "rgba(0,255,135,.1)",  bd: "rgba(0,255,135,.25)" };
  if (ev >= 1.0) return { label: "GOOD VALUE",  c: "#4f8fff", bg: "rgba(79,143,255,.1)", bd: "rgba(79,143,255,.25)" };
  if (ev >= 0.9) return { label: "FAIR VALUE",  c: "#ffd166", bg: "rgba(255,209,102,.1)",bd: "rgba(255,209,102,.25)" };
  return           { label: "BELOW EV",    c: "#ff3860", bg: "rgba(255,56,96,.1)",   bd: "rgba(255,56,96,.25)" };
}

function ago(ts: string) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s/60)}m` : `${Math.floor(s/3600)}h`;
}
const $f = (n: number) => `$${(+n).toFixed(2)}`;
const $x = (n: number) => `${(+n).toFixed(3)}x`;
const packImg = (id: string) => `https://api.courtyard.io/configs/vending-machine/${id}/resources/sealed_pack.png`;

function Spark({ trend, color }: { trend: "up"|"down"|"flat"; color: string }) {
  const pts = trend==="up" ? "0,16 15,11 30,7 45,3 60,1" : trend==="down" ? "0,1 15,5 30,9 45,13 60,16" : "0,9 15,7 30,10 45,8 60,9";
  return <svg width="60" height="18"><polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/><circle cx="60" cy={trend==="up"?1:trend==="down"?16:9} r="2" fill={color}/></svg>;
}

const CSS = `
* { box-sizing:border-box; margin:0; padding:0; }
body { background:#060d18 !important; color:#c8dff0; font-family:'Space Grotesk',system-ui,sans-serif; }
::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-thumb{background:#122038;border-radius:2px}
.live-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#00ff87;box-shadow:0 0 7px rgba(0,255,135,.8);animation:lp 2s infinite}
@keyframes lp{0%,100%{opacity:1}50%{opacity:.25}}
.top-ticker{background:#07101f;border-bottom:1px solid #122038;height:34px;display:flex;align-items:center;overflow:hidden;flex-shrink:0}
.ticker-lbl{padding:0 12px;font-size:8px;font-weight:700;color:#00ff87;letter-spacing:1.5px;font-family:monospace;border-right:1px solid #122038;height:100%;display:flex;align-items:center;white-space:nowrap;flex-shrink:0;gap:6px}
.t-track{display:flex;white-space:nowrap;animation:tick 55s linear infinite}
.t-item{display:inline-flex;align-items:center;gap:7px;padding:0 16px;font-size:10px;border-right:1px solid #0e1e30;height:34px;font-family:monospace;flex-shrink:0}
@keyframes tick{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.nav{height:46px;display:flex;align-items:center;padding:0 14px;gap:9px;border-bottom:1px solid #122038;background:#07101f;flex-shrink:0}
.hstat{padding:3px 9px;border:1px solid #122038;border-radius:5px;text-align:center;flex-shrink:0}
.hstat-l{font-size:7px;color:#3a5068;letter-spacing:1px;font-family:monospace}
.hstat-v{font-weight:800;font-size:14px;line-height:1.2}
.hero{padding:12px 14px;border-bottom:1px solid #122038;flex-shrink:0;background:#07101f}
.hero-top{display:flex;align-items:flex-start;gap:16px;margin-bottom:12px}
.stat-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px}
.sc{background:#0b1728;border:1px solid #122038;border-radius:8px;padding:10px 12px}
.sc-l{font-size:7px;color:#3a5068;letter-spacing:1.2px;font-family:monospace;margin-bottom:4px}
.sc-v{font-weight:800;font-size:18px;line-height:1}
.sc-s{font-size:9px;color:#3a5068;margin-top:3px}
.best{background:#0b1728;border:1px solid #122038;border-radius:8px;padding:10px 14px;display:flex;align-items:center;gap:14px}
.best-nums{display:flex;gap:20px;flex:1}
.best-num{display:flex;flex-direction:column;gap:2px}
.best-num-l{font-size:7px;color:#3a5068;letter-spacing:1px;font-family:monospace}
.best-num-v{font-weight:800;font-size:16px;line-height:1}
.monitor-bar{display:flex;align-items:center;gap:8px;padding:6px 12px;border-bottom:1px solid #122038;background:#07101f;flex-shrink:0}
.tb{background:transparent;border:1px solid #122038;border-radius:4px;padding:3px 9px;font-size:8px;color:#3a5068;cursor:pointer;font-family:monospace;letter-spacing:.4px;transition:all .15s}
.tb:hover{color:#c8dff0;border-color:#1e3a50}
.tb.on{color:#00ff87;border-color:rgba(0,255,135,.3);background:rgba(0,255,135,.05)}
.toolbar{display:flex;align-items:center;gap:4px;padding:5px 12px;border-bottom:1px solid #122038;flex-shrink:0;flex-wrap:wrap;background:#07101f}
.pack-row{border-bottom:1px solid #0e1e30;transition:background .1s}
.pack-row:hover{background:rgba(255,255,255,.012)}
.pack-row:hover .pn{color:#00ff87 !important}
.pn{transition:color .1s}
.sig{display:inline-block;padding:2px 8px;border-radius:4px;font-size:8px;font-weight:800;letter-spacing:.7px;border:1px solid;font-family:monospace;white-space:nowrap}
.sb-btn{all:unset;display:flex;align-items:center;gap:7px;padding:6px 10px;font-size:11px;border-left:2px solid transparent;cursor:pointer;color:#3a5068;width:100%;transition:all .1s}
.sb-btn:hover{color:#c8dff0;background:rgba(255,255,255,.015)}
.sb-btn.on{color:#c8dff0}
.wr-bar{height:3px;border-radius:2px;background:#0e1e30;overflow:hidden;width:80px;margin-top:3px}
.wr-fill{height:100%;border-radius:2px}
@keyframes fi{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.fi{animation:fi .2s ease both}
.detail-panel{width:0;flex-shrink:0;border-left:1px solid #122038;background:#07101f;display:flex;flex-direction:column;overflow:hidden;transition:width .22s cubic-bezier(.4,0,.2,1)}
.detail-panel.open{width:310px}
.dp-scroll{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
.dp-sec{background:#0b1728;border:1px solid #122038;border-radius:8px;padding:11px;display:flex;flex-direction:column;gap:7px}
.dp-lbl{font-size:7px;letter-spacing:1.5px;color:#3a5068;font-family:monospace}
.dp-grid2{display:grid;grid-template-columns:1fr 1fr;gap:5px}
.dp-tile{background:#060d18;border:1px solid #122038;border-radius:6px;padding:7px 9px}
.dp-tile-l{font-size:7px;color:#3a5068;letter-spacing:1px;display:block;margin-bottom:2px;font-family:monospace}
.dp-tile-v{font-family:monospace;font-weight:800;font-size:15px;line-height:1}
.fee-tbl{width:100%;font-size:10px;border-collapse:collapse;font-family:monospace}
.fee-tbl td{padding:4px 0;border-bottom:1px solid #122038;color:#3a5068}
.fee-tbl tr.tot td{color:#c8dff0;font-weight:700;border:none}
.dp-close{cursor:pointer;color:#3a5068;width:20px;height:20px;border:1px solid #122038;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;transition:color .15s}
.dp-close:hover{color:#c8dff0}
.pack-row.selected{background:rgba(0,255,135,.04)}
`;


function Dashboard() {
  const { data, isLoading, refetch } = useCourtyardData();
  const [tab, setTab]    = useState("all");
  const [view, setView]  = useState<"packs"|"feed">("packs");
  const [sort, setSort]  = useState<"ev"|"bb"|"wr"|"price">("ev");
  const [flt, setFlt]    = useState<"all"|"pos"|"neg">("all");
  const [cd, setCd]      = useState(300);
  const [sel, setSel]    = useState<Pack|null>(null);

  useEffect(() => {
    const t = setInterval(() => setCd(c => { if (c<=1){refetch();return 300;} return c-1; }), 1000);
    return () => clearInterval(t);
  }, [refetch]);

  const cats = data ? ["all", ...Array.from(new Set(data.packs.map(p=>p.category)))] : ["all"];

  const rows: Pack[] = data ? [...data.packs]
    .filter(p => tab==="all" || p.category===tab)
    .filter(p => flt==="pos" ? p.evRatio>=1 : flt==="neg" ? p.evRatio<1 : true)
    .sort((a,b) => sort==="ev" ? b.evRatio-a.evRatio : sort==="bb" ? b.buybackEv-a.buybackEv : sort==="wr" ? b.winRate-a.winRate : a.price-b.price)
    : [];

  const best = data?.packs[0];
  const m = { fontFamily: "monospace" } as React.CSSProperties;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"#060d18", color:"#c8dff0" }}>
      <style>{CSS}</style>

      {/* LIVE TICKER */}
      {data && data.recentPulls.length > 0 && (
        <div className="top-ticker">
          <div className="ticker-lbl"><span className="live-dot"/>LIVE PULLS</div>
          <div style={{ flex:1, overflow:"hidden" }}>
            <div className="t-track">
              {[...data.recentPulls,...data.recentPulls].map((p,i) => {
                const win = p.fmv > p.packPrice;
                return (
                  <div key={`${p.id}-${i}`} className="t-item">
                    <span style={{ color:"#3a5068",fontSize:9 }}>@{p.user}</span>
                    <span style={{ color:"#c8dff0",fontWeight:600 }}>{p.cardName.slice(0,20)}</span>
                    <span style={{ color:win?"#00ff87":"#ff3860",fontWeight:800 }}>{$f(p.fmv)}</span>
                    <span style={{ color:win?"rgba(0,255,135,.55)":"rgba(255,56,96,.55)",fontSize:9 }}>({win?"+":""}{$f(p.fmv-p.packPrice)})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav className="nav">
        <div style={{ display:"flex",alignItems:"center",gap:7,flexShrink:0 }}>
          <div style={{ width:26,height:26,borderRadius:7,background:"linear-gradient(135deg,#00ff87,#4f8fff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13 }}>⚡</div>
          <div>
            <div style={{ fontWeight:800,fontSize:14,color:"#fff",lineHeight:1 }}>PackPulse</div>
            <div style={{ fontSize:7,color:"#3a5068",letterSpacing:1.5,...m }}>COURTYARD EV TRACKER</div>
          </div>
        </div>

        <div style={{ display:"flex",alignItems:"center",gap:5,marginLeft:10,padding:"2px 9px",border:"1px solid rgba(0,255,135,.2)",borderRadius:20,background:"rgba(0,255,135,.04)",flexShrink:0 }}>
          <span className="live-dot" style={{ width:5,height:5 }}/>
          <span style={{ fontSize:8,color:"#00ff87",fontWeight:700,letterSpacing:1,...m }}>
            {data?.isLive ? "LIVE" : "SAMPLE"} · {Math.floor(cd/60)}:{String(cd%60).padStart(2,"0")}
          </span>
        </div>

        {data && [
          { l:"+EV PACKS", v:`${data.posEV}/${data.packs.length}`, c:"#00ff87" },
          { l:"AVG EV",    v:$x(data.avgEV), c:data.avgEV>=1?"#00ff87":"#ff3860" },
          { l:"PULLS",     v:`${data.totalPulls}`, c:"#fff" },
        ].map(s => (
          <div key={s.l} className="hstat">
            <div className="hstat-l">{s.l}</div>
            <div className="hstat-v" style={{ color:s.c }}>{s.v}</div>
          </div>
        ))}

        <button onClick={() => refetch()} disabled={isLoading} style={{ marginLeft:"auto",padding:"4px 11px",background:"transparent",border:"1px solid #122038",borderRadius:5,fontSize:8,color:"#3a5068",cursor:"pointer",...m }}>↻ Refresh</button>
      </nav>

      {/* BODY */}
      <div style={{ flex:1,display:"flex",overflow:"hidden" }}>

        {/* Sidebar */}
        <aside style={{ width:172,flexShrink:0,borderRight:"1px solid #122038",background:"#07101f",display:"flex",flexDirection:"column",overflow:"hidden" }}>
          <div style={{ padding:"9px 10px 3px",fontSize:7,color:"#3a5068",letterSpacing:1.5,...m }}>WORKSPACE</div>
          {(["packs","feed"] as const).map(v => (
            <button key={v} className={`sb-btn${view===v?" on":""}`} onClick={() => setView(v)}
              style={{ borderLeftColor:view===v?"#00ff87":"transparent",background:view===v?"rgba(255,255,255,.025)":"transparent" }}>
              {v==="packs" ? <>⚡ EV Terminal</> : <>📋 Recent Pulls</>}
            </button>
          ))}
          <div style={{ padding:"9px 10px 3px",marginTop:4,fontSize:7,color:"#3a5068",letterSpacing:1.5,...m }}>MARKETS</div>
          {cats.map(c => {
            const color  = c==="all" ? "#00ff87" : CAT_COLOR[c] ?? "#888";
            const packs  = data ? (c==="all" ? data.packs : data.packs.filter(p=>p.category===c)) : [];
            const posN   = packs.filter(p=>p.evRatio>=1).length;
            const active = tab===c;
            return (
              <button key={c} className={`sb-btn${active?" on":""}`} onClick={() => setTab(c)}
                style={{ borderLeftColor:active?color:"transparent",background:active?"rgba(255,255,255,.025)":"transparent" }}>
                <span style={{ width:7,height:7,borderRadius:"50%",background:color,flexShrink:0,display:"inline-block" }}/>
                <span style={{ flex:1 }}>{c==="all"?"All Markets":c}</span>
                {posN>0 && <span style={{ fontSize:8,fontWeight:700,color:"#00ff87",background:"rgba(0,255,135,.08)",padding:"1px 4px",borderRadius:3,...m }}>{posN}+EV</span>}
              </button>
            );
          })}
          <div style={{ marginTop:"auto",padding:10,borderTop:"1px solid #122038" }}>
            <a href="https://courtyard.io" target="_blank" rel="noreferrer" style={{ display:"flex",alignItems:"center",gap:6,fontSize:10,color:"#3a5068",textDecoration:"none" }}>
              🔗 Open Courtyard.io
            </a>
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>

          {isLoading && (
            <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12 }}>
              <div style={{ fontSize:32 }}>⚡</div>
              <div style={{ fontSize:13,fontWeight:700,color:"#3a5068" }}>Loading live Courtyard data...</div>
            </div>
          )}

          {data && view==="packs" && (
            <div style={{ flex:1,display:"flex",flexDirection:"column",overflow:"hidden" }}>

              {/* COMPACT HERO — fixed height so table always visible */}
              <div style={{ padding:"10px 14px 10px",borderBottom:"1px solid #122038",flexShrink:0,background:"#07101f" }}>

                {/* Row 1: headline + CTA + stat cards */}
                <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <h1 style={{ fontWeight:800,fontSize:20,color:"#fff",lineHeight:1.1,letterSpacing:-0.5 }}>Stop buying packs blind.</h1>
                    <p style={{ fontSize:11,color:"#3a5068",marginTop:3 }}>
                      Real-time EV for every <a href="https://courtyard.io" target="_blank" rel="noreferrer" style={{ color:"#00ff87",textDecoration:"underline" }}>Courtyard.io</a> pack. See the real math before you rip.
                    </p>
                  </div>
                  {best && (
                    <a href={`https://courtyard.io/vending-machine/${best.id}`} target="_blank" rel="noreferrer"
                      style={{ padding:"10px 18px",background:"#00ff87",borderRadius:10,color:"#000",fontWeight:800,fontSize:13,textDecoration:"none",flexShrink:0,whiteSpace:"nowrap" as const }}>
                      Rip a Pack ↗
                    </a>
                  )}
                </div>

                {/* Row 2: 4 stat cards + best pack inline */}
                <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 2fr",gap:8 }}>
                  {[
                    { l:"+EV PACKS", v:`${data.posEV}/${data.packs.length}`, s:"above break-even", vc:"#00ff87" },
                    { l:"BEST EV NOW", v:$x(data.bestPack?.evRatio??0), s:data.bestPack?.name??"—", vc:"#00ff87" },
                    { l:"PULLS TRACKED", v:`${data.totalPulls}`, s:data.isLive?"from Courtyard.io":"sample data", vc:"#fff" },
                    { l:"MARKET AVG EV", v:$x(data.avgEV), s:data.avgEV>=1?"Market is healthy":"Below EV", vc:data.avgEV>=1?"#00ff87":"#ff3860" },
                  ].map(s => (
                    <div key={s.l} className="sc">
                      <div className="sc-l">{s.l}</div>
                      <div className="sc-v" style={{ color:s.vc }}>{s.v}</div>
                      <div className="sc-s">{s.s}</div>
                    </div>
                  ))}

                  {/* Best pack mini card */}
                  {best && (
                    <div className="best">
                      <img src={packImg(best.id)} alt="" style={{ width:36,height:50,objectFit:"contain",flexShrink:0 }}
                        onError={(e)=>{ (e.target as HTMLImageElement).style.display="none"; }} />
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:7,color:"#00ff87",letterSpacing:1.5,...m,marginBottom:3,fontWeight:700 }}>BEST VALUE RIGHT NOW</div>
                        <div style={{ fontWeight:800,fontSize:14,color:"#fff",marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const }}>{best.name}</div>
                        <div className="best-nums">
                          {[["EV RATIO",$x(best.evRatio),"#00ff87"],["CAL. EV",$f(best.calibratedEv),"#00ff87"],["PACK PRICE",`$${best.price}`,"#fff"],["BUYBACK",$x(best.buybackEv),best.buybackEv>=1?"#00ff87":"#ff3860"]].map(([l,v,c])=>(
                            <div key={l as string} className="best-num">
                              <span className="best-num-l">{l}</span>
                              <span className="best-num-v" style={{ color:c as string }}>{v}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {(() => { const sg=signal(best.evRatio); return <span className="sig" style={{ color:sg.c,background:sg.bg,borderColor:sg.bd }}>{sg.label}</span>; })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Pack monitor bar */}
              <div className="monitor-bar">
                <span style={{ fontSize:9,fontWeight:700,color:"#3a5068",...m }}>📊 PACK MONITOR</span>
                <span style={{ fontSize:8,color:"#3a5068",...m }}>{data.packs.length} packs · sorted by EV ratio · updates every 5min</span>
                <div style={{ marginLeft:"auto",display:"flex",alignItems:"center",gap:5 }}>
                  <span className="live-dot" style={{ width:5,height:5 }}/>
                  <span style={{ fontSize:8,color:"#00ff87",fontWeight:700,...m }}>LIVE DATA</span>
                </div>
              </div>

              {/* Toolbar */}
              <div className="toolbar">
                <button className={`tb${flt==="all"?" on":""}`} onClick={()=>setFlt("all")}>All Packs ({data.packs.length})</button>
                <button className={`tb${flt==="pos"?" on":""}`} onClick={()=>setFlt("pos")}>+EV Only</button>
                <button className={`tb${flt==="neg"?" on":""}`} onClick={()=>setFlt("neg")}>−EV Only</button>
                <span style={{ fontSize:8,color:"#3a5068",marginLeft:8,...m }}>SORT BY</span>
                {([["ev","EV Ratio"],["bb","Buyback"],["wr","Win Rate"],["price","Price"]] as [string,string][]).map(([k,l])=>(
                  <button key={k} className={`tb${sort===k?" on":""}`} onClick={()=>setSort(k as any)}>{l} ↕</button>
                ))}
              </div>

              {/* TABLE — gets remaining space */}
              <div style={{ flex:1,overflowY:"auto" }}>
                <table style={{ width:"100%",borderCollapse:"collapse",fontSize:11 }}>
                  <thead style={{ position:"sticky",top:0,zIndex:10,background:"#0b1728" }}>
                    <tr>
                      {[["#","left"],["PACK","left"],["PRICE","right"],["EV RATIO ↕","right"],["CAL. EV","right"],["WIN RATE","right"],["BUYBACK","right"],["POOL","right"],["TREND","center"],["SIGNAL","center"],["ACTION","right"]].map(([h,a],i)=>(
                        <th key={i} style={{ padding:"7px 10px",textAlign:a as any,borderBottom:"1px solid #122038",fontSize:8,letterSpacing:1.2,color:h.toString().includes("EV")?"#00ff87":"#3a5068",fontFamily:"monospace",whiteSpace:"nowrap" as const }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((pack,idx) => {
                      const sg   = signal(pack.evRatio);
                      const catC = CAT_COLOR[pack.category]??"#888";
                      const evC  = pack.evRatio>=1.3?"#00ff87":pack.evRatio>=1?"#4fd8a0":pack.evRatio>=0.9?"#ffd166":"#ff3860";
                      const bbC  = pack.buybackEv>=1?"#00ff87":"#ff3860";
                      return (
                        <tr key={pack.id} className={`pack-row fi${sel?.id===pack.id?" selected":""}`} onClick={()=>setSel(sel?.id===pack.id?null:pack)} style={{cursor:"pointer"}}>
                          <td style={{ padding:"10px 10px",color:"#3a5068",...m,fontWeight:700,fontSize:10 }}>#{idx+1}</td>
                          <td style={{ padding:"10px 6px 10px 10px" }}>
                            <div style={{ display:"flex",alignItems:"center",gap:9 }}>
                              <div style={{ width:40,height:40,borderRadius:7,overflow:"hidden",background:"#0b1728",border:"1px solid #122038",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                                <img src={packImg(pack.id)} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }}
                                  onError={(e)=>{const el=e.target as HTMLImageElement;el.style.display="none";if(el.parentElement)el.parentElement.innerHTML=`<span style="font-size:8px;font-weight:800;color:${catC}">${pack.category.slice(0,4)}</span>`;}} />
                              </div>
                              <div>
                                <div className="pn" style={{ fontWeight:700,fontSize:13,color:"#fff",lineHeight:1.2 }}>{pack.name}</div>
                                <div style={{ fontSize:9,color:"#3a5068",marginTop:2 }}>
                                  <span style={{ display:"inline-block",width:6,height:6,borderRadius:"50%",background:catC,marginRight:4,verticalAlign:"middle" }}/>
                                  {pack.category} · {pack.totalPulls} pulls
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:"10px",textAlign:"right",...m,fontWeight:600,color:"#3a5068" }}>${pack.price}.00</td>
                          <td style={{ padding:"10px",textAlign:"right" }}>
                            <div style={{ display:"flex",flexDirection:"column",alignItems:"flex-end",gap:1 }}>
                              <span style={{ fontWeight:800,fontSize:16,color:evC,lineHeight:1,...m }}>{$x(pack.evRatio)}</span>
                              <span style={{ fontSize:8,color:"#3a5068" }}>{pack.evRatio>=1?"▲":"▼"} x EV</span>
                            </div>
                          </td>
                          <td style={{ padding:"10px",textAlign:"right",...m,fontWeight:700,color:evC }}>{$f(pack.calibratedEv)}</td>
                          <td style={{ padding:"10px",textAlign:"right" }}>
                            <div style={{ display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end" }}>
                              <div style={{ display:"flex",gap:6,fontSize:10 }}>
                                <span style={{ color:"#3a5068" }}>Win rate</span>
                                <span style={{ ...m,fontWeight:700 }}>{(pack.winRate*100).toFixed(1)}%</span>
                              </div>
                              <div className="wr-bar"><div className="wr-fill" style={{ width:`${Math.min(pack.winRate*200,100)}%`,background:pack.evRatio>=1?"#00ff87":"#ffd166" }}/></div>
                            </div>
                          </td>
                          <td style={{ padding:"10px",textAlign:"right",...m,fontWeight:800,fontSize:13,color:bbC }}>{$x(pack.buybackEv)}</td>
                          <td style={{ padding:"10px",textAlign:"right",color:"#3a5068",...m,fontSize:9 }}>— / —</td>
                          <td style={{ padding:"10px",textAlign:"center" }}><Spark trend={pack.trend} color={evC}/></td>
                          <td style={{ padding:"10px",textAlign:"center" }}>
                            <span className="sig" style={{ color:sg.c,background:sg.bg,borderColor:sg.bd }}>{sg.label}</span>
                          </td>
                          <td style={{ padding:"10px",textAlign:"right" }}>
                            <a href={`https://courtyard.io/vending-machine/${pack.id}`} target="_blank" rel="noreferrer"
                              style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"4px 10px",border:"1px solid rgba(0,255,135,.25)",borderRadius:6,fontSize:9,color:"#00ff87",fontWeight:700,textDecoration:"none",background:"rgba(0,255,135,.04)",...m }}>
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

          {/* Feed */}
          {data && view==="feed" && (
            <div style={{ flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:6 }}>
              {(data.recentPulls as PullRecord[]).map(pull => {
                const win=pull.fmv>pull.packPrice, diff=pull.fmv-pull.packPrice;
                const hue=pull.user.split("").reduce((a,c)=>a+c.charCodeAt(0),0)%360;
                return (
                  <div key={pull.id} style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",border:"1px solid #122038",borderRadius:10,background:"#07101f" }} className="pack-row">
                    <div style={{ width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,background:`hsl(${hue},25%,10%)`,border:`1px solid hsl(${hue},25%,18%)`,color:`hsl(${hue},40%,55%)`,...m }}>
                      {pull.user.slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ display:"flex",alignItems:"center",gap:7,marginBottom:3,flexWrap:"wrap" as const }}>
                        <span style={{ fontSize:11,fontWeight:700,color:"#00cc6a" }}>@{pull.user}</span>
                        <span style={{ fontSize:9,color:"#3a5068",padding:"1px 5px",background:"#0b1728",border:"1px solid #122038",borderRadius:3,...m }}>{pull.packName}</span>
                        <span style={{ fontSize:9,color:"#3a5068",marginLeft:"auto",...m }}>{ago(pull.timestamp)}</span>
                      </div>
                      <div style={{ fontSize:13,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const }}>{pull.cardName}</div>
                      {pull.grade && <div style={{ fontSize:9,color:"#3a5068",marginTop:2,...m }}>{pull.grader} {pull.grade}</div>}
                    </div>
                    <div style={{ textAlign:"right",flexShrink:0 }}>
                      <div style={{ fontWeight:800,fontSize:14,color:win?"#00ff87":"#3a5068",...m }}>{$f(pull.fmv)}</div>
                      <div style={{ fontSize:9,color:win?"#00cc6a":"#ff3860",marginTop:2,...m }}>{win?"+":""}{$f(diff)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* DETAIL PANEL */}
        <div className={sel ? "detail-panel open" : "detail-panel"}>
          {sel && (()=>{
            const p=sel;
            const evC=p.evRatio>=1.3?"#00ff87":p.evRatio>=1?"#4fd8a0":p.evRatio>=0.9?"#ffd166":"#ff3860";
            const bbC=p.buybackEv>=1?"#00ff87":"#ff3860";
            const sg=signal(p.evRatio);
            const trueCost=p.price*1.074;
            const cashOut=p.avgFmv*0.9*0.94;
            return (<>
              <div style={{padding:"11px",borderBottom:"1px solid #122038",display:"flex",alignItems:"center",gap:9,flexShrink:0}}>
                <img src={packImg(p.id)} alt="" style={{width:26,height:38,objectFit:"contain"}} onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:800,fontSize:14,color:"#fff",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
                  <div style={{fontSize:9,color:"#3a5068",marginTop:2,fontFamily:"monospace"}}>{p.category} · ${p.price}/pack · {p.totalPulls} pulls</div>
                </div>
                <button className="dp-close" onClick={()=>setSel(null)}>✕</button>
              </div>
              <div className="dp-scroll">
                <div className="dp-sec">
                  <span className="dp-lbl">EXPECTED VALUE</span>
                  <div className="dp-grid2">
                    <div className="dp-tile" style={{borderColor:p.evRatio>=1?"rgba(0,255,135,.2)":"rgba(255,56,96,.15)"}}>
                      <span className="dp-tile-l">FMV EV</span>
                      <div className="dp-tile-v" style={{color:evC}}>{$x(p.evRatio)}</div>
                      <div style={{fontSize:8,color:"#3a5068",marginTop:3,fontFamily:"monospace"}}>{p.evRatio>=1?"+":"-"}{(Math.abs(p.avgFmv-p.price))} avg</div>
                    </div>
                    <div className="dp-tile" style={{borderColor:p.buybackEv>=1?"rgba(79,143,255,.2)":"rgba(255,56,96,.15)"}}>
                      <span className="dp-tile-l">BUYBACK EV</span>
                      <div className="dp-tile-v" style={{color:bbC}}>{$x(p.buybackEv)}</div>
                      <div style={{fontSize:8,color:"#3a5068",marginTop:3,fontFamily:"monospace"}}>≈{$f(cashOut)} cash</div>
                    </div>
                  </div>
                  <span className="sig" style={{color:sg.c,background:sg.bg,borderColor:sg.bd,alignSelf:"flex-start"}}>{sg.label}</span>
                </div>
                <div className="dp-sec">
                  <span className="dp-lbl">PACK STATS</span>
                  <div className="dp-grid2">
                    <div className="dp-tile"><span className="dp-tile-l">WIN RATE</span><div className="dp-tile-v" style={{color:p.winRate>=.5?"#00ff87":"#3a5068"}}>{(p.winRate*100).toFixed(1)}%</div></div>
                    <div className="dp-tile"><span className="dp-tile-l">BEST PULL</span><div className="dp-tile-v" style={{color:"#00ff87"}}>{$f(p.bestPull)}</div></div>
                    <div className="dp-tile"><span className="dp-tile-l">AVG FMV</span><div className="dp-tile-v" style={{color:evC}}>{$f(p.avgFmv)}</div></div>
                    <div className="dp-tile"><span className="dp-tile-l">CASH OUT</span><div className="dp-tile-v" style={{color:bbC}}>{$f(cashOut)}</div></div>
                  </div>
                </div>
                <div className="dp-sec">
                  <span className="dp-lbl">💡 FEE BREAKDOWN</span>
                  <table className="fee-tbl"><tbody>
                    <tr><td>Advertised price</td><td style={{textAlign:"right"}}>{(p.price)}</td></tr>
                    <tr><td>True cost (+7.4%)</td><td style={{textAlign:"right",color:"#ff3860"}}>{(trueCost)}</td></tr>
                    <tr><td>Avg FMV</td><td style={{textAlign:"right",color:evC}}>{$f(p.avgFmv)}</td></tr>
                    <tr><td>Buyback offer (×0.90)</td><td style={{textAlign:"right"}}>{$f(p.avgFmv*0.9)}</td></tr>
                    <tr><td>Processing fee (−6%)</td><td style={{textAlign:"right",color:"#ff3860"}}>−{(p.avgFmv*0.9*0.06)}</td></tr>
                    <tr className="tot"><td style={{color:"#c8dff0",paddingTop:6}}>Cash in hand</td><td style={{textAlign:"right",color:bbC,fontSize:15,paddingTop:6}}>{$f(cashOut)}</td></tr>
                  </tbody></table>
                </div>
                <a href={"https://courtyard.io/vending-machine/"+p.id} target="_blank" rel="noreferrer"
                  style={{display:"block",textAlign:"center",padding:"11px",borderRadius:8,fontWeight:800,fontSize:13,textDecoration:"none",background:p.evRatio>=1?"#00ff87":"#0b1728",color:p.evRatio>=1?"#000":"#3a5068",border:p.evRatio>=1?"none":"1px solid #122038"}}>
                  {p.evRatio>=1?"🟢 Buy on Courtyard →":"View on Courtyard →"}
                </a>
                <div style={{fontSize:8,color:"#3a5068",textAlign:"center",fontFamily:"monospace",lineHeight:1.6,padding:"4px 0"}}>For informational purposes only. Not financial advice.</div>
              </div>
            </>);
          })()}
        </div>

      </div>

      {/* Disclaimer */}
      <div style={{ padding:"4px 14px",borderTop:"1px solid #122038",background:"#07101f",textAlign:"center" }}>
        <span style={{ fontSize:9,color:"#3a5068" }}>For educational purposes only. Not financial advice. Pack outcomes are random. EV based on recent pull history — results will vary. Not affiliated with Courtyard.io.</span>
      </div>
    </div>
  );
}

export default function App() {
  return <QueryClientProvider client={queryClient}><Dashboard /></QueryClientProvider>;
}
