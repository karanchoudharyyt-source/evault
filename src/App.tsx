import { useState, useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCourtyardData } from "./hooks/use-courtyard-data";
import { Pack, PullRecord } from "./data/packs";

const queryClient = new QueryClient();

// ─── Helpers ─────────────────────────────────────────────────────────────────
const CAT_COLOR: Record<string, string> = {
  Pokémon:"#ffd166",Baseball:"#4f8fff",Basketball:"#ff7f3f",
  Hockey:"#a0d8ef",Football:"#7fba00",Soccer:"#00e5ff",
  Sports:"#9f7aea",Magic:"#e040fb",Comics:"#ff5252",Watch:"#b0bec5",
};

function signal(ev: number) {
  if (ev >= 1.3) return { label:"GREAT VALUE", c:"#00ff87", bg:"rgba(0,255,135,.12)", bd:"rgba(0,255,135,.3)" };
  if (ev >= 1.0) return { label:"GOOD VALUE",  c:"#4f8fff", bg:"rgba(79,143,255,.12)",bd:"rgba(79,143,255,.3)" };
  if (ev >= 0.9) return { label:"FAIR VALUE",  c:"#ffd166", bg:"rgba(255,209,102,.12)",bd:"rgba(255,209,102,.3)" };
  return            { label:"BELOW EV",    c:"#ff3860", bg:"rgba(255,56,96,.12)",  bd:"rgba(255,56,96,.3)" };
}

function decision(pack: Pack): { action: string; color: string; bg: string; reason: string } {
  const bb = pack.buybackEv;
  const ev = pack.evRatio;
  const wr = pack.winRate;
  if (bb >= 1.2) return { action:"🔥 STRONG BUY", color:"#00ff87", bg:"rgba(0,255,135,.15)", reason:`Buyback EV ${(bb*100).toFixed(0)}% — you statistically profit even after all fees` };
  if (bb >= 1.0) return { action:"✅ BUY", color:"#00ff87", bg:"rgba(0,255,135,.1)", reason:`Positive buyback EV — real cash expected to exceed pack price` };
  if (ev >= 1.1 && bb >= 0.9) return { action:"⚡ CONSIDER", color:"#ffd166", bg:"rgba(255,209,102,.1)", reason:`Good FMV EV but buyback fees hurt — only pull if keeping the card` };
  if (ev >= 1.0) return { action:"⚠️ MAYBE", color:"#ffd166", bg:"rgba(255,209,102,.08)", reason:`FMV positive but buyback negative — risky if you plan to sell back` };
  if (wr >= 0.5) return { action:"🕐 WAIT", color:"#a0a0c0", bg:"rgba(160,160,192,.08)", reason:`Below EV but decent win rate — wait for better conditions` };
  return { action:"❌ SKIP", color:"#ff3860", bg:"rgba(255,56,96,.08)", reason:`Below EV across the board — house has the edge right now` };
}

const $f = (n: number) => `$${(+n).toFixed(2)}`;
const $x = (n: number) => `${(+n).toFixed(3)}x`;
const $p = (n: number) => `${(+n*100).toFixed(1)}%`;
const packImg = (id: string) => `https://api.courtyard.io/configs/vending-machine/${id}/resources/sealed_pack.png`;
function ago(ts: string) { const s=Math.floor((Date.now()-new Date(ts).getTime())/1000); return s<60?`${s}s`:s<3600?`${Math.floor(s/60)}m`:`${Math.floor(s/3600)}h`; }

// ─── Mini sparkline ───────────────────────────────────────────────────────────
function Spark({ trend, color, width=70, height=24 }: { trend:"up"|"down"|"flat"; color:string; width?:number; height?:number }) {
  const pts = trend==="up" ? `0,${height} ${width*.25},${height*.7} ${width*.5},${height*.45} ${width*.75},${height*.2} ${width},${height*.05}`
            : trend==="down" ? `0,${height*.05} ${width*.25},${height*.2} ${width*.5},${height*.45} ${width*.75},${height*.7} ${width},${height}`
            : `0,${height*.5} ${width*.25},${height*.4} ${width*.5},${height*.55} ${width*.75},${height*.45} ${width},${height*.5}`;
  const cy = trend==="up"?height*.05:trend==="down"?height:height*.5;
  return (
    <svg width={width} height={height} style={{display:"block",flexShrink:0}}>
      <defs><linearGradient id={`g${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
        <stop offset="100%" stopColor={color} stopOpacity="0"/>
      </linearGradient></defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={width} cy={cy} r="2.5" fill={color}/>
    </svg>
  );
}

// ─── EV Bar chart (simulated history) ────────────────────────────────────────
function EVChart({ pack }: { pack: Pack }) {
  const color = pack.evRatio>=1 ? "#00ff87" : "#ff3860";
  const base  = pack.evRatio;
  // generate 20 synthetic history points that end at current EV
  const points = Array.from({length:20},(_,i)=>{
    const progress = i/19;
    const noise    = (Math.sin(i*2.3)*0.06 + Math.cos(i*1.7)*0.04) * (1-progress*0.5);
    const trend    = pack.trend==="up" ? -0.15*(1-progress) : pack.trend==="down" ? 0.12*(1-progress) : 0;
    return Math.max(0.3, base + noise + trend);
  });
  const min=Math.min(...points)*0.97, max=Math.max(...points)*1.03, range=max-min||0.1;
  const W=280, H=80;
  const toX=(i:number)=>i/(points.length-1)*W;
  const toY=(v:number)=>H-(v-min)/range*H;
  const pathD=points.map((v,i)=>`${i===0?"M":"L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
  const areaD=pathD+` L${W},${H} L0,${H} Z`;
  const breakY=toY(1.0);
  return (
    <svg width={W} height={H} style={{display:"block",overflow:"visible"}}>
      <defs>
        <linearGradient id="evgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      {/* Break-even line */}
      {breakY>0 && breakY<H && (
        <line x1="0" y1={breakY} x2={W} y2={breakY} stroke="rgba(255,255,255,.15)" strokeWidth="1" strokeDasharray="4,3"/>
      )}
      <path d={areaD} fill="url(#evgrad)"/>
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={toX(points.length-1)} cy={toY(points[points.length-1])} r="3" fill={color}/>
      {/* Labels */}
      <text x="2" y="10" fontSize="7" fill="rgba(255,255,255,.3)" fontFamily="monospace">{max.toFixed(2)}x</text>
      <text x="2" y={H-2} fontSize="7" fill="rgba(255,255,255,.3)" fontFamily="monospace">{min.toFixed(2)}x</text>
      {breakY>5 && breakY<H-5 && <text x={W-24} y={breakY-3} fontSize="7" fill="rgba(255,255,255,.3)" fontFamily="monospace">1.0x</text>}
    </svg>
  );
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{background:#060d18!important;color:#c8dff0;font-family:'Space Grotesk',system-ui,sans-serif}
::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-thumb{background:#122038;border-radius:2px}
.live-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#00ff87;box-shadow:0 0 8px rgba(0,255,135,.8);animation:lp 2s infinite}
@keyframes lp{0%,100%{opacity:1}50%{opacity:.25}}
.top-ticker{background:#07101f;border-bottom:1px solid #122038;height:34px;display:flex;align-items:center;overflow:hidden;flex-shrink:0}
.ticker-lbl{padding:0 12px;font-size:8px;font-weight:700;color:#00ff87;letter-spacing:1.5px;font-family:monospace;border-right:1px solid #122038;height:100%;display:flex;align-items:center;gap:6px;flex-shrink:0}
.t-track{display:flex;white-space:nowrap;animation:tick 55s linear infinite}
.t-item{display:inline-flex;align-items:center;gap:7px;padding:0 16px;font-size:10px;border-right:1px solid #0e1e30;height:34px;font-family:monospace;flex-shrink:0}
@keyframes tick{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.nav{height:46px;display:flex;align-items:center;padding:0 14px;gap:9px;border-bottom:1px solid #122038;background:#07101f;flex-shrink:0}
.hstat{padding:3px 9px;border:1px solid #122038;border-radius:5px;text-align:center;flex-shrink:0}
.hstat-l{font-size:7px;color:#3a5068;letter-spacing:1px;font-family:monospace}
.hstat-v{font-weight:800;font-size:14px;line-height:1.2}
.sb-btn{all:unset;display:flex;align-items:center;gap:7px;padding:7px 10px;font-size:11px;border-left:2px solid transparent;cursor:pointer;color:#3a5068;width:100%;transition:all .1s}
.sb-btn:hover{color:#c8dff0;background:rgba(255,255,255,.02)}
.sb-btn.on{color:#c8dff0}
.tb{background:transparent;border:1px solid #122038;border-radius:4px;padding:3px 9px;font-size:8px;color:#3a5068;cursor:pointer;font-family:monospace;transition:all .15s}
.tb:hover{color:#c8dff0;border-color:#1e3a50}
.tb.on{color:#00ff87;border-color:rgba(0,255,135,.3);background:rgba(0,255,135,.05)}
.sig{display:inline-block;padding:2px 8px;border-radius:4px;font-size:8px;font-weight:800;letter-spacing:.7px;border:1px solid;font-family:monospace;white-space:nowrap}

/* PACK GRID */
.pack-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;padding:14px}
.pack-card{background:#0b1728;border:1px solid #122038;border-radius:12px;padding:14px;cursor:pointer;transition:all .15s;position:relative;overflow:hidden}
.pack-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;opacity:0;transition:opacity .2s}
.pack-card:hover{border-color:#1e3a50;background:#0d1e35;transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,0,0,.4)}
.pack-card:hover::before,.pack-card.selected::before{opacity:1}
.pack-card.selected{border-color:rgba(0,255,135,.3);background:#0d1e35}
.pack-card-img{width:48px;height:64px;object-fit:contain;border-radius:6px;flex-shrink:0}
.pack-name{font-weight:800;font-size:14px;color:#fff;line-height:1.2;margin-bottom:2px}
.pack-sub{font-size:9px;color:#3a5068;margin-bottom:8px}
.ev-big{font-family:monospace;font-weight:800;font-size:22px;line-height:1}
.ev-label{font-size:8px;color:#3a5068;font-family:monospace;margin-top:1px}

/* DECISION BANNER */
.decision-banner{border-radius:8px;padding:8px 12px;display:flex;align-items:center;gap:10px;margin-top:8px;border:1px solid}
.decision-action{font-weight:800;font-size:12px;white-space:nowrap;font-family:monospace}
.decision-reason{font-size:10px;opacity:.75;line-height:1.4}

/* DETAIL PANEL */
.detail-panel{width:0;flex-shrink:0;border-left:1px solid #122038;background:#07101f;display:flex;flex-direction:column;overflow:hidden;transition:width .22s cubic-bezier(.4,0,.2,1)}
.detail-panel.open{width:340px}
.dp-scroll{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
.dp-sec{background:#0b1728;border:1px solid #122038;border-radius:8px;padding:11px;display:flex;flex-direction:column;gap:7px}
.dp-lbl{font-size:7px;letter-spacing:1.5px;color:#3a5068;font-family:monospace;margin-bottom:2px}
.dp-grid2{display:grid;grid-template-columns:1fr 1fr;gap:5px}
.dp-tile{background:#060d18;border:1px solid #122038;border-radius:6px;padding:8px 10px}
.dp-tile-l{font-size:7px;color:#3a5068;letter-spacing:1px;display:block;margin-bottom:3px;font-family:monospace}
.dp-tile-v{font-family:monospace;font-weight:800;font-size:16px;line-height:1}
.fee-tbl{width:100%;font-size:10px;border-collapse:collapse;font-family:monospace}
.fee-tbl td{padding:5px 0;border-bottom:1px solid #0e1e30;color:#3a5068}
.fee-tbl tr.tot td{color:#c8dff0;font-weight:700;border:none;padding-top:7px}
.dp-close{cursor:pointer;color:#3a5068;width:22px;height:22px;border:1px solid #122038;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;transition:color .15s;background:transparent}
.dp-close:hover{color:#c8dff0;border-color:#1e3a50}

/* BUDGET TOOL */
.budget-section{background:#07101f;border-top:1px solid #122038;padding:10px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0;flex-wrap:wrap}
.budget-btn{padding:4px 12px;border:1px solid #122038;border-radius:20px;font-size:10px;cursor:pointer;background:transparent;color:#3a5068;font-family:monospace;transition:all .15s}
.budget-btn:hover{border-color:#1e3a50;color:#c8dff0}
.budget-btn.on{border-color:rgba(0,255,135,.3);color:#00ff87;background:rgba(0,255,135,.06)}
.budget-rec{display:flex;align-items:center;gap:8px;padding:6px 10px;background:#0b1728;border:1px solid #122038;border-radius:8px;font-size:11px;flex:1}

/* FEED */
.feed-card{border:1px solid #122038;border-radius:10px;padding:10px 12px;display:flex;gap:10px;align-items:flex-start;background:#07101f;transition:background .1s}
.feed-card:hover{background:#0b1728}

/* EMPTY */
.empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;flex:1;color:#3a5068}

@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.fi{animation:fi .18s ease both}
@keyframes si{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:none}}
.si{animation:si .22s ease both}
`;

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard() {
  const { data, isLoading, refetch } = useCourtyardData();
  const [tab, setTab]    = useState("all");
  const [view, setView]  = useState<"packs"|"feed"|"budget">("packs");
  const [sort, setSort]  = useState<"ev"|"bb"|"decision"|"wr"|"price">("decision");
  const [flt, setFlt]    = useState<"all"|"pos"|"neg">("all");
  const [sel, setSel]    = useState<Pack|null>(null);
  const [budget, setBudget] = useState<number|null>(null);
  const [cd, setCd]      = useState(300);
  const m = { fontFamily:"monospace" } as React.CSSProperties;

  useEffect(()=>{
    const t=setInterval(()=>setCd(c=>{if(c<=1){refetch();return 300;}return c-1;}),1000);
    return ()=>clearInterval(t);
  },[refetch]);

  const cats = data ? ["all",...Array.from(new Set(data.packs.map(p=>p.category)))] : ["all"];

  const decisScore = (p:Pack) => {
    const d = decision(p);
    if (d.action.includes("STRONG")) return 6;
    if (d.action.includes("✅")) return 5;
    if (d.action.includes("⚡")) return 4;
    if (d.action.includes("MAYBE")) return 3;
    if (d.action.includes("WAIT")) return 2;
    return 1;
  };

  const rows: Pack[] = data ? [...data.packs]
    .filter(p=>tab==="all"||p.category===tab)
    .filter(p=>flt==="pos"?p.evRatio>=1:flt==="neg"?p.evRatio<1:true)
    .sort((a,b)=>
      sort==="ev"     ? b.evRatio-a.evRatio :
      sort==="bb"     ? b.buybackEv-a.buybackEv :
      sort==="decision"?decisScore(b)-decisScore(a) :
      sort==="wr"     ? b.winRate-a.winRate :
      a.price-b.price
    ) : [];

  const best = data?.packs[0];

  // Budget recommendations
  const budgetPacks = (b:number) => data?.packs
    .filter(p=>p.price<=b)
    .sort((a,c)=>decisScore(c)-decisScore(a))
    .slice(0,3) ?? [];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#060d18",color:"#c8dff0"}}>
      <style>{CSS}</style>

      {/* TOP TICKER */}
      {data && data.recentPulls.length>0 && (
        <div className="top-ticker">
          <div className="ticker-lbl"><span className="live-dot"/>LIVE PULLS</div>
          <div style={{flex:1,overflow:"hidden"}}>
            <div className="t-track">
              {[...data.recentPulls,...data.recentPulls].map((p,i)=>{
                const win=p.fmv>p.packPrice;
                return (
                  <div key={`${p.id}-${i}`} className="t-item">
                    <span style={{color:"#3a5068",fontSize:9}}>@{p.user}</span>
                    <span style={{color:"#c8dff0",fontWeight:600}}>{p.cardName.slice(0,20)}</span>
                    <span style={{color:win?"#00ff87":"#ff3860",fontWeight:800}}>{$f(p.fmv)}</span>
                    <span style={{color:win?"rgba(0,255,135,.55)":"rgba(255,56,96,.55)",fontSize:9}}>({win?"+":""}{$f(p.fmv-p.packPrice)})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav className="nav">
        <div style={{display:"flex",alignItems:"center",gap:7,flexShrink:0}}>
          <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#00ff87,#4f8fff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>⚡</div>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:"#fff",lineHeight:1}}>PackPulse</div>
            <div style={{fontSize:7,color:"#3a5068",letterSpacing:1.5,...m}}>COURTYARD DECISION ENGINE</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5,marginLeft:10,padding:"2px 10px",border:"1px solid rgba(0,255,135,.2)",borderRadius:20,background:"rgba(0,255,135,.04)",flexShrink:0}}>
          <span className="live-dot" style={{width:5,height:5}}/>
          <span style={{fontSize:8,color:"#00ff87",fontWeight:700,letterSpacing:1,...m}}>
            {data?.isLive?"LIVE":"SAMPLE"} · {Math.floor(cd/60)}:{String(cd%60).padStart(2,"0")}
          </span>
        </div>
        {data && [
          {l:"+EV PACKS",v:`${data.posEV}/${data.packs.length}`,c:"#00ff87"},
          {l:"AVG EV",v:$x(data.avgEV),c:data.avgEV>=1?"#00ff87":"#ff3860"},
          {l:"PULLS",v:`${data.totalPulls}`,c:"#fff"},
        ].map(s=>(
          <div key={s.l} className="hstat">
            <div className="hstat-l">{s.l}</div>
            <div className="hstat-v" style={{color:s.c}}>{s.v}</div>
          </div>
        ))}
        <button onClick={()=>refetch()} disabled={isLoading} style={{marginLeft:"auto",padding:"4px 11px",background:"transparent",border:"1px solid #122038",borderRadius:5,fontSize:8,color:"#3a5068",cursor:"pointer",...m}}>↻ Refresh</button>
      </nav>

      {/* BODY */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* Sidebar */}
        <aside style={{width:178,flexShrink:0,borderRight:"1px solid #122038",background:"#07101f",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"9px 10px 3px",fontSize:7,color:"#3a5068",letterSpacing:1.5,...m}}>WORKSPACE</div>
          {([
            ["packs","⚡","EV Terminal"],
            ["budget","💰","Budget Advisor"],
            ["feed","📋","Recent Pulls"],
          ] as [string,string,string][]).map(([v,ico,lbl])=>(
            <button key={v} className={`sb-btn${view===v?" on":""}`} onClick={()=>setView(v as any)}
              style={{borderLeftColor:view===v?"#00ff87":"transparent",background:view===v?"rgba(255,255,255,.025)":"transparent"}}>
              {ico} {lbl}
            </button>
          ))}

          <div style={{padding:"9px 10px 3px",marginTop:4,fontSize:7,color:"#3a5068",letterSpacing:1.5,...m}}>MARKETS</div>
          {cats.map(c=>{
            const color=c==="all"?"#00ff87":CAT_COLOR[c]??"#888";
            const packs=data?(c==="all"?data.packs:data.packs.filter(p=>p.category===c)):[];
            const posN=packs.filter(p=>p.evRatio>=1).length;
            const buyN=packs.filter(p=>decision(p).action.includes("BUY")||decision(p).action.includes("STRONG")).length;
            const active=tab===c;
            return (
              <button key={c} className={`sb-btn${active?" on":""}`} onClick={()=>setTab(c)}
                style={{borderLeftColor:active?color:"transparent",background:active?"rgba(255,255,255,.025)":"transparent"}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:color,flexShrink:0,display:"inline-block"}}/>
                <span style={{flex:1}}>{c==="all"?"All Markets":c}</span>
                {buyN>0 && <span style={{fontSize:8,fontWeight:700,color:"#00ff87",background:"rgba(0,255,135,.08)",padding:"1px 4px",borderRadius:3,...m}}>{buyN}↑</span>}
              </button>
            );
          })}

          <div style={{marginTop:"auto",padding:10,borderTop:"1px solid #122038"}}>
            <a href="https://courtyard.io" target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:"#3a5068",textDecoration:"none"}}>
              🔗 Open Courtyard.io
            </a>
          </div>
        </aside>

        {/* Main */}
        <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {isLoading && (
            <div className="empty">
              <div style={{fontSize:32}}>⚡</div>
              <div style={{fontSize:13,fontWeight:700}}>Loading live data...</div>
            </div>
          )}

          {/* ── EV TERMINAL ── */}
          {data && view==="packs" && (
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

              {/* Compact hero */}
              <div style={{padding:"12px 14px 10px",borderBottom:"1px solid #122038",background:"#07101f",flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
                  <div style={{flex:1}}>
                    <h1 style={{fontWeight:800,fontSize:20,color:"#fff",letterSpacing:-0.5,lineHeight:1.1}}>
                      Stop buying packs blind.
                    </h1>
                    <p style={{fontSize:11,color:"#3a5068",marginTop:3}}>
                      Real-time EV + buyback math for every <a href="https://courtyard.io" target="_blank" rel="noreferrer" style={{color:"#00ff87",textDecoration:"underline"}}>Courtyard.io</a> pack. Tells you exactly what to pull.
                    </p>
                  </div>
                  {best && (
                    <a href={`https://courtyard.io/vending-machine/${best.id}`} target="_blank" rel="noreferrer"
                      style={{padding:"10px 18px",background:"#00ff87",borderRadius:10,color:"#000",fontWeight:800,fontSize:13,textDecoration:"none",flexShrink:0,whiteSpace:"nowrap" as const}}>
                      Rip a Pack ↗
                    </a>
                  )}
                </div>

                {/* Stats + best pack */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 2fr",gap:8}}>
                  {[
                    {l:"+EV PACKS",v:`${data.posEV}/${data.packs.length}`,s:"above break-even",vc:"#00ff87"},
                    {l:"BEST EV NOW",v:$x(data.bestPack?.evRatio??0),s:data.bestPack?.name??"—",vc:"#00ff87"},
                    {l:"PULLS TRACKED",v:`${data.totalPulls}`,s:data.isLive?"live from Courtyard":"sample",vc:"#fff"},
                    {l:"MARKET AVG EV",v:$x(data.avgEV),s:data.avgEV>=1?"Market is healthy":"Market below EV",vc:data.avgEV>=1?"#00ff87":"#ff3860"},
                  ].map(s=>(
                    <div key={s.l} style={{background:"#0b1728",border:"1px solid #122038",borderRadius:8,padding:"9px 11px"}}>
                      <div style={{fontSize:7,color:"#3a5068",letterSpacing:1.2,...m,marginBottom:4}}>{s.l}</div>
                      <div style={{fontWeight:800,fontSize:18,color:s.vc,lineHeight:1}}>{s.v}</div>
                      <div style={{fontSize:9,color:"#3a5068",marginTop:3}}>{s.s}</div>
                    </div>
                  ))}
                  {best && (
                    <div style={{background:"#0b1728",border:"1px solid #122038",borderRadius:8,padding:"9px 12px",display:"flex",alignItems:"center",gap:12}}>
                      <img src={packImg(best.id)} alt="" style={{width:36,height:50,objectFit:"contain",flexShrink:0}} onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:7,color:"#00ff87",letterSpacing:1.5,...m,fontWeight:700,marginBottom:3}}>BEST VALUE RIGHT NOW</div>
                        <div style={{fontWeight:800,fontSize:13,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,marginBottom:5}}>{best.name}</div>
                        <div style={{display:"flex",gap:14}}>
                          {[["EV",$x(best.evRatio),"#00ff87"],["CAL. EV",$f(best.calibratedEv),"#00ff87"],["BUYBACK",$x(best.buybackEv),best.buybackEv>=1?"#00ff87":"#ff3860"]].map(([l,v,c])=>(
                            <div key={l as string}><div style={{fontSize:7,color:"#3a5068",...m}}>{l}</div><div style={{fontWeight:800,fontSize:13,color:c as string,...m}}>{v}</div></div>
                          ))}
                        </div>
                      </div>
                      {(()=>{const sg=signal(best.evRatio);return <span className="sig" style={{color:sg.c,background:sg.bg,borderColor:sg.bd,alignSelf:"flex-start" as const}}>{sg.label}</span>;})()}
                    </div>
                  )}
                </div>
              </div>

              {/* Monitor bar + toolbar */}
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderBottom:"1px solid #122038",background:"#07101f",flexShrink:0,flexWrap:"wrap" as const}}>
                <span style={{fontSize:9,fontWeight:700,color:"#3a5068",...m}}>📊 PACK MONITOR</span>
                <span style={{fontSize:8,color:"#3a5068",...m}}>{rows.length} packs</span>
                <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5}}>
                  <span className="live-dot" style={{width:5,height:5}}/><span style={{fontSize:8,color:"#00ff87",fontWeight:700,...m}}>LIVE DATA</span>
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:4,padding:"5px 12px",borderBottom:"1px solid #122038",background:"#07101f",flexShrink:0,flexWrap:"wrap" as const}}>
                <button className={`tb${flt==="all"?" on":""}`} onClick={()=>setFlt("all")}>All ({data.packs.length})</button>
                <button className={`tb${flt==="pos"?" on":""}`} onClick={()=>setFlt("pos")}>+EV Only</button>
                <button className={`tb${flt==="neg"?" on":""}`} onClick={()=>setFlt("neg")}>−EV Only</button>
                <span style={{fontSize:8,color:"#3a5068",marginLeft:8,...m}}>SORT</span>
                {([["decision","🎯 Decision"],["ev","EV Ratio"],["bb","Buyback EV"],["wr","Win Rate"],["price","Price"]] as [string,string][]).map(([k,l])=>(
                  <button key={k} className={`tb${sort===k?" on":""}`} onClick={()=>setSort(k as any)}>{l} ↕</button>
                ))}
              </div>

              {/* CARD GRID */}
              <div style={{flex:1,overflowY:"auto"}}>
                <div className="pack-grid">
                  {rows.map((pack,idx)=>{
                    const sg  = signal(pack.evRatio);
                    const dec = decision(pack);
                    const catC = CAT_COLOR[pack.category]??"#888";
                    const evC  = pack.evRatio>=1.3?"#00ff87":pack.evRatio>=1?"#4fd8a0":pack.evRatio>=0.9?"#ffd166":"#ff3860";
                    const isSelected = sel?.id===pack.id;
                    return (
                      <div key={pack.id} className={`pack-card fi${isSelected?" selected":""}`}
                        style={{"--card-color":evC} as any}
                        onClick={()=>setSel(isSelected?null:pack)}>
                        <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:evC,borderRadius:"12px 12px 0 0"}}/>

                        {/* Card header */}
                        <div style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:10}}>
                          <div style={{width:44,height:60,borderRadius:6,overflow:"hidden",background:"#060d18",border:"1px solid #122038",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                            <img src={packImg(pack.id)} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}
                              onError={(e)=>{const el=e.target as HTMLImageElement;el.style.display="none";if(el.parentElement)el.parentElement.innerHTML=`<span style="font-size:9px;font-weight:800;color:${catC}">${pack.category.slice(0,4)}</span>`;}}/>
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{fontSize:8,color:"#3a5068",marginBottom:2}}>
                              <span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:catC,marginRight:3,verticalAlign:"middle"}}/>
                              {pack.category} · #{idx+1}
                            </div>
                            <div className="pack-name">{pack.name}</div>
                            <div style={{fontSize:10,color:"#3a5068"}}>${pack.price}.00 per pull</div>
                          </div>
                        </div>

                        {/* EV numbers row */}
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                          <div style={{background:"#060d18",borderRadius:6,padding:"7px 9px",border:`1px solid ${pack.evRatio>=1?"rgba(0,255,135,.15)":"rgba(255,56,96,.12)"}`}}>
                            <div style={{fontSize:7,color:"#3a5068",...m,marginBottom:2}}>FMV EV</div>
                            <div style={{fontWeight:800,fontSize:18,color:evC,lineHeight:1,...m}}>{$x(pack.evRatio)}</div>
                            <div style={{fontSize:8,color:"#3a5068",marginTop:2}}>{pack.evRatio>=1?"▲":"▼"} x EV</div>
                          </div>
                          <div style={{background:"#060d18",borderRadius:6,padding:"7px 9px",border:`1px solid ${pack.buybackEv>=1?"rgba(79,143,255,.15)":"rgba(255,56,96,.12)"}`}}>
                            <div style={{fontSize:7,color:"#ffd166",...m,marginBottom:2}}>BUYBACK EV</div>
                            <div style={{fontWeight:800,fontSize:18,color:pack.buybackEv>=1?"#4f8fff":"#ff3860",lineHeight:1,...m}}>{$x(pack.buybackEv)}</div>
                            <div style={{fontSize:8,color:"#3a5068",marginTop:2}}>≈{$f(pack.avgFmv*0.9*0.94)} cash</div>
                          </div>
                        </div>

                        {/* Win rate + sparkline */}
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                          <div>
                            <div style={{fontSize:8,color:"#3a5068",marginBottom:3}}>Win rate <span style={{color:"#c8dff0",fontWeight:700,...m}}>{$p(pack.winRate)}</span></div>
                            <div style={{width:90,height:3,borderRadius:2,background:"#0e1e30",overflow:"hidden"}}>
                              <div style={{height:"100%",borderRadius:2,width:`${Math.min(pack.winRate*200,100)}%`,background:pack.evRatio>=1?"#00ff87":"#ffd166"}}/>
                            </div>
                          </div>
                          <Spark trend={pack.trend} color={evC} width={60} height={22}/>
                        </div>

                        {/* Decision banner */}
                        <div className="decision-banner" style={{background:dec.bg,borderColor:dec.color+"44"}}>
                          <span className="decision-action" style={{color:dec.color}}>{dec.action}</span>
                          <span className="decision-reason" style={{color:dec.color}}>{dec.reason.slice(0,55)}{dec.reason.length>55?"…":""}</span>
                        </div>

                        {/* Signal + pulls */}
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8}}>
                          <span className="sig" style={{color:sg.c,background:sg.bg,borderColor:sg.bd}}>{sg.label}</span>
                          <span style={{fontSize:9,color:"#3a5068",...m}}>{pack.totalPulls} pulls · Click for details</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── BUDGET ADVISOR ── */}
          {data && view==="budget" && (
            <div style={{flex:1,overflowY:"auto",padding:16}}>
              <div style={{marginBottom:16}}>
                <h2 style={{fontWeight:800,fontSize:20,color:"#fff",marginBottom:6}}>💰 Budget Advisor</h2>
                <p style={{fontSize:12,color:"#3a5068",lineHeight:1.6}}>Tell us your budget. We'll tell you the best pack to pull right now — ranked by real buyback value, not just EV.</p>
              </div>

              <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" as const}}>
                {[10,25,50,100,200,500].map(b=>(
                  <button key={b} className={`budget-btn${budget===b?" on":""}`} onClick={()=>setBudget(b)}>${b}</button>
                ))}
                <button className={`budget-btn${budget===null?" on":""}`} onClick={()=>setBudget(null)}>All budgets</button>
              </div>

              {(budget ? [budget] : [10,25,50,100,200]).map(b=>{
                const recs = budgetPacks(b);
                if (!recs.length) return null;
                const top = recs[0];
                const dec = decision(top);
                return (
                  <div key={b} style={{background:"#0b1728",border:"1px solid #122038",borderRadius:12,padding:16,marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                      <div style={{fontSize:24,fontWeight:800,color:"#00ff87",...m}}>${b}</div>
                      <div>
                        <div style={{fontSize:9,color:"#3a5068",...m,marginBottom:2}}>BEST PICK FOR THIS BUDGET</div>
                        <div style={{fontWeight:800,fontSize:16,color:"#fff"}}>{top.name}</div>
                      </div>
                      <div style={{marginLeft:"auto",display:"flex",flexDirection:"column" as const,alignItems:"flex-end" as const,gap:4}}>
                        <span style={{fontWeight:800,fontSize:14,color:dec.color,...m}}>{dec.action}</span>
                        {(()=>{const sg=signal(top.evRatio);return <span className="sig" style={{color:sg.c,background:sg.bg,borderColor:sg.bd}}>{sg.label}</span>;})()}
                      </div>
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
                      {[["EV RATIO",$x(top.evRatio),top.evRatio>=1?"#00ff87":"#ff3860"],["BUYBACK EV",$x(top.buybackEv),top.buybackEv>=1?"#00ff87":"#ff3860"],["CASH OUT",$f(top.avgFmv*0.9*0.94),top.buybackEv>=1?"#00ff87":"#ff3860"],["WIN RATE",$p(top.winRate),top.winRate>=.5?"#00ff87":"#3a5068"]].map(([l,v,c])=>(
                        <div key={l as string} style={{background:"#060d18",borderRadius:7,padding:"8px 10px",border:"1px solid #122038"}}>
                          <div style={{fontSize:7,color:"#3a5068",...m,marginBottom:3}}>{l}</div>
                          <div style={{fontWeight:800,fontSize:16,color:c as string,...m}}>{v}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{fontSize:11,color:dec.color,background:dec.bg,border:`1px solid ${dec.color}44`,borderRadius:7,padding:"7px 10px"}}>
                      <strong>Why:</strong> {dec.reason}
                    </div>

                    {recs.length>1 && (
                      <div style={{marginTop:10}}>
                        <div style={{fontSize:8,color:"#3a5068",...m,marginBottom:6}}>OTHER OPTIONS</div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap" as const}}>
                          {recs.slice(1).map(p=>{
                            const d=decision(p);
                            return (
                              <div key={p.id} style={{background:"#060d18",border:"1px solid #122038",borderRadius:8,padding:"7px 10px",fontSize:11}}>
                                <div style={{fontWeight:700,color:"#c8dff0",marginBottom:2}}>{p.name}</div>
                                <div style={{color:d.color,fontWeight:700,...m,fontSize:10}}>{d.action} · {$x(p.evRatio)}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── FEED ── */}
          {data && view==="feed" && (
            <div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:6}}>
              <div style={{padding:"4px 2px 8px",fontSize:12,color:"#3a5068"}}>Showing the {data.recentPulls.length} most recent pulls from Courtyard.io</div>
              {(data.recentPulls as PullRecord[]).map(pull=>{
                const win=pull.fmv>pull.packPrice, diff=pull.fmv-pull.packPrice;
                const hue=pull.user.split("").reduce((a,c)=>a+c.charCodeAt(0),0)%360;
                return (
                  <div key={pull.id} className="feed-card">
                    <div style={{width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,background:`hsl(${hue},25%,10%)`,border:`1px solid hsl(${hue},25%,18%)`,color:`hsl(${hue},40%,55%)`,...m}}>
                      {pull.user.slice(0,2).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3,flexWrap:"wrap" as const}}>
                        <span style={{fontSize:11,fontWeight:700,color:"#00cc6a"}}>@{pull.user}</span>
                        <span style={{fontSize:9,color:"#3a5068",padding:"1px 5px",background:"#0b1728",border:"1px solid #122038",borderRadius:3,...m}}>{pull.packName}</span>
                        <span style={{fontSize:9,color:"#3a5068",marginLeft:"auto",...m}}>{ago(pull.timestamp)} ago</span>
                      </div>
                      <div style={{fontSize:13,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{pull.cardName}</div>
                      {pull.grade&&<div style={{fontSize:9,color:"#3a5068",marginTop:2,...m}}>{pull.grader} {pull.grade}</div>}
                    </div>
                    <div style={{textAlign:"right" as const,flexShrink:0}}>
                      <div style={{fontWeight:800,fontSize:14,color:win?"#00ff87":"#3a5068",...m}}>{$f(pull.fmv)}</div>
                      <div style={{fontSize:9,color:win?"#00cc6a":"#ff3860",marginTop:2,...m}}>{win?"+":""}{$f(diff)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* DETAIL PANEL */}
        <div className={sel?"detail-panel open":"detail-panel"}>
          {sel&&(()=>{
            const p=sel;
            const dec=decision(p);
            const evC=p.evRatio>=1.3?"#00ff87":p.evRatio>=1?"#4fd8a0":p.evRatio>=0.9?"#ffd166":"#ff3860";
            const bbC=p.buybackEv>=1?"#00ff87":"#ff3860";
            const sg=signal(p.evRatio);
            const trueCost=p.price*1.074;
            const cashOut=p.avgFmv*0.9*0.94;
            return (
              <div className="si" style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
                {/* Header */}
                <div style={{padding:"11px 12px",borderBottom:"1px solid #122038",display:"flex",alignItems:"center",gap:9,flexShrink:0,background:"#07101f"}}>
                  <img src={packImg(p.id)} alt="" style={{width:28,height:40,objectFit:"contain"}} onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:800,fontSize:14,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{p.name}</div>
                    <div style={{fontSize:9,color:"#3a5068",marginTop:1,...m}}>{p.category} · ${p.price}/pack · {p.totalPulls} pulls</div>
                  </div>
                  <button className="dp-close" onClick={()=>setSel(null)}>✕</button>
                </div>

                <div className="dp-scroll">
                  {/* Decision */}
                  <div style={{background:dec.bg,border:`1px solid ${dec.color}44`,borderRadius:8,padding:"11px 12px"}}>
                    <div style={{fontSize:7,color:dec.color,letterSpacing:1.5,...m,fontWeight:700,marginBottom:6}}>SHOULD YOU PULL?</div>
                    <div style={{fontWeight:800,fontSize:17,color:dec.color,marginBottom:5,...m}}>{dec.action}</div>
                    <div style={{fontSize:11,color:dec.color,opacity:.85,lineHeight:1.5}}>{dec.reason}</div>
                  </div>

                  {/* EV Chart */}
                  <div className="dp-sec">
                    <span className="dp-lbl">EV RATIO TREND (SIMULATED · 1m)</span>
                    <div style={{padding:"4px 0"}}>
                      <EVChart pack={p}/>
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#3a5068",...m}}>
                      <span>Earlier</span>
                      <span style={{color:evC,fontWeight:700}}>Now: {$x(p.evRatio)}</span>
                    </div>
                  </div>

                  {/* EV Stats */}
                  <div className="dp-sec">
                    <span className="dp-lbl">EXPECTED VALUE</span>
                    <div className="dp-grid2">
                      <div className="dp-tile" style={{borderColor:p.evRatio>=1?"rgba(0,255,135,.2)":"rgba(255,56,96,.15)"}}>
                        <span className="dp-tile-l">FMV EV</span>
                        <div className="dp-tile-v" style={{color:evC}}>{$x(p.evRatio)}</div>
                        <div style={{fontSize:8,color:"#3a5068",marginTop:3,...m}}>{$f(p.calibratedEv)} avg FMV</div>
                      </div>
                      <div className="dp-tile" style={{borderColor:p.buybackEv>=1?"rgba(79,143,255,.2)":"rgba(255,56,96,.15)"}}>
                        <span className="dp-tile-l">BUYBACK EV <span style={{fontSize:6,background:"rgba(255,209,102,.1)",color:"#ffd166",padding:"1px 3px",borderRadius:2}}>REAL $</span></span>
                        <div className="dp-tile-v" style={{color:bbC}}>{$x(p.buybackEv)}</div>
                        <div style={{fontSize:8,color:"#3a5068",marginTop:3,...m}}>≈{$f(cashOut)} cash</div>
                      </div>
                    </div>
                    <span className="sig" style={{color:sg.c,background:sg.bg,borderColor:sg.bd,alignSelf:"flex-start" as const}}>{sg.label}</span>
                  </div>

                  {/* Stats */}
                  <div className="dp-sec">
                    <span className="dp-lbl">PACK STATS</span>
                    <div className="dp-grid2">
                      <div className="dp-tile"><span className="dp-tile-l">WIN RATE</span><div className="dp-tile-v" style={{color:p.winRate>=.5?"#00ff87":"#3a5068"}}>{$p(p.winRate)}</div></div>
                      <div className="dp-tile"><span className="dp-tile-l">BEST PULL</span><div className="dp-tile-v" style={{color:"#00ff87"}}>{$f(p.bestPull)}</div></div>
                      <div className="dp-tile"><span className="dp-tile-l">AVG FMV</span><div className="dp-tile-v" style={{color:evC}}>{$f(p.avgFmv)}</div></div>
                      <div className="dp-tile"><span className="dp-tile-l">CASH OUT</span><div className="dp-tile-v" style={{color:bbC}}>{$f(cashOut)}</div></div>
                    </div>
                  </div>

                  {/* Fee Breakdown */}
                  <div className="dp-sec">
                    <span className="dp-lbl">💡 REAL FEE BREAKDOWN</span>
                    <table className="fee-tbl"><tbody>
                      <tr><td>Advertised price</td><td style={{textAlign:"right" as const}}>{$f(p.price)}</td></tr>
                      <tr><td>True cost (+7.4% markup)</td><td style={{textAlign:"right" as const,color:"#ff3860"}}>{$f(trueCost)}</td></tr>
                      <tr><td>Average FMV won</td><td style={{textAlign:"right" as const,color:evC}}>{$f(p.avgFmv)}</td></tr>
                      <tr><td>Buyback offer (×0.90)</td><td style={{textAlign:"right" as const}}>{$f(p.avgFmv*0.9)}</td></tr>
                      <tr><td>Processing fee (−6%)</td><td style={{textAlign:"right" as const,color:"#ff3860"}}>−{$f(p.avgFmv*0.9*0.06)}</td></tr>
                      <tr className="tot"><td>💵 Cash in your hand</td><td style={{textAlign:"right" as const,color:bbC,fontSize:15}}>{$f(cashOut)}</td></tr>
                    </tbody></table>
                  </div>

                  {/* CTA */}
                  <a href={`https://courtyard.io/vending-machine/${p.id}`} target="_blank" rel="noreferrer"
                    style={{display:"block",textAlign:"center" as const,padding:"12px",borderRadius:8,fontWeight:800,fontSize:14,textDecoration:"none",background:p.evRatio>=1?"#00ff87":"#0b1728",color:p.evRatio>=1?"#000":"#3a5068",border:p.evRatio>=1?"none":"1px solid #122038",marginTop:2}}>
                    {p.evRatio>=1?"🟢 Pull This Pack on Courtyard →":"View on Courtyard →"}
                  </a>
                  <div style={{fontSize:8,color:"#3a5068",textAlign:"center" as const,...m,lineHeight:1.6,padding:"4px 0"}}>For informational purposes only. Not financial advice.</div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{padding:"4px 14px",borderTop:"1px solid #122038",background:"#07101f",textAlign:"center" as const}}>
        <span style={{fontSize:9,color:"#3a5068"}}>For educational purposes only. Not financial advice. Pack outcomes are random. EV based on recent pull history — results will vary. Not affiliated with Courtyard.io.</span>
      </div>
    </div>
  );
}

export default function App() {
  return <QueryClientProvider client={queryClient}><Dashboard /></QueryClientProvider>;
}
