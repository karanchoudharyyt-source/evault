import { useState, useEffect, useCallback } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCourtyardData } from "./hooks/use-courtyard-data";
import { Pack, PullRecord } from "./data/packs";

const queryClient = new QueryClient();

// ─── Constants ────────────────────────────────────────────────────────────────
const CAT_COLOR: Record<string,string> = {
  Pokémon:"#ffd166",Baseball:"#4f8fff",Basketball:"#ff7f3f",
  Hockey:"#a0d8ef",Football:"#7fba00",Soccer:"#00e5ff",
  Sports:"#9f7aea",Magic:"#e040fb",Comics:"#ff5252",Watch:"#b0bec5",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const $f = (n:number) => `$${(+n).toFixed(2)}`;
const $x = (n:number) => `${(+n).toFixed(3)}x`;
const $p = (n:number) => `${(+n*100).toFixed(1)}%`;
const packImg = (id:string) => `https://api.courtyard.io/configs/vending-machine/${id}/resources/sealed_pack.png`;
function ago(ts:string){const s=Math.floor((Date.now()-new Date(ts).getTime())/1000);return s<60?`${s}s`:s<3600?`${Math.floor(s/60)}m`:`${Math.floor(s/3600)}h`;}

function sig(ev:number){
  if(ev>=1.3)return{label:"GREAT VALUE",c:"#00ff87",bg:"rgba(0,255,135,.12)",bd:"rgba(0,255,135,.28)"};
  if(ev>=1.0)return{label:"GOOD VALUE", c:"#4f8fff",bg:"rgba(79,143,255,.12)",bd:"rgba(79,143,255,.28)"};
  if(ev>=0.9)return{label:"FAIR VALUE", c:"#ffd166",bg:"rgba(255,209,102,.12)",bd:"rgba(255,209,102,.28)"};
  return          {label:"BELOW EV",   c:"#ff3860",bg:"rgba(255,56,96,.12)", bd:"rgba(255,56,96,.28)"};
}

function dec(pack:Pack){
  const bb=pack.buybackEv, ev=pack.evRatio;
  if(bb>=1.2)return{action:"🔥 STRONG BUY",c:"#00ff87",bg:"rgba(0,255,135,.1)", reason:`Buyback EV ${(bb*100).toFixed(0)}% — you statistically profit after ALL fees`};
  if(bb>=1.0)return{action:"✅ BUY",       c:"#00ff87",bg:"rgba(0,255,135,.08)",reason:`Real cash expected to exceed pack price after Courtyard fees`};
  if(ev>=1.0)return{action:"⚡ CONSIDER",  c:"#ffd166",bg:"rgba(255,209,102,.08)",reason:`FMV positive but buyback is negative — only pull if keeping the card`};
  if(ev>=0.9)return{action:"🕐 WAIT",      c:"#a0a8c0",bg:"rgba(160,168,192,.06)",reason:`Near breakeven — wait for better data before pulling`};
  return          {action:"❌ SKIP",       c:"#ff3860",bg:"rgba(255,56,96,.07)", reason:`House has the edge. EV and buyback both below 1x right now`};
}

function evColor(ev:number){
  return ev>=1.3?"#00ff87":ev>=1.0?"#4fd8a0":ev>=0.9?"#ffd166":"#ff3860";
}

// ─── Mini sparkline ───────────────────────────────────────────────────────────
function Spark({trend,color,w=68,h=22}:{trend:"up"|"down"|"flat";color:string;w?:number;h?:number}){
  const pts=trend==="up"?`0,${h} ${w*.3},${h*.6} ${w*.6},${h*.35} ${w},${h*.05}`:
            trend==="down"?`0,${h*.05} ${w*.3},${h*.35} ${w*.6},${h*.65} ${w},${h}`:
            `0,${h*.5} ${w*.25},${h*.38} ${w*.5},${h*.55} ${w*.75},${h*.42} ${w},${h*.48}`;
  const cy=trend==="up"?h*.05:trend==="down"?h:h*.48;
  return(
    <svg width={w} height={h} style={{display:"block",flexShrink:0}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={w} cy={cy} r="2.5" fill={color}/>
    </svg>
  );
}

// ─── EV Chart ────────────────────────────────────────────────────────────────
function EVChart({pack}:{pack:Pack}){
  const color=evColor(pack.evRatio);
  const base=pack.evRatio;
  const N=24;
  const pts=Array.from({length:N},(_,i)=>{
    const p=i/(N-1);
    const noise=(Math.sin(i*2.1+1)*0.05+Math.cos(i*1.4)*0.03)*(1-p*0.3);
    const trend=pack.trend==="up"?-0.18*(1-p):pack.trend==="down"?0.14*(1-p):0;
    return Math.max(0.2,base+noise+trend);
  });
  const mn=Math.min(...pts)*0.96,mx=Math.max(...pts)*1.04,rng=mx-mn||0.1;
  const W=290,H=90;
  const tx=(i:number)=>i/(N-1)*W;
  const ty=(v:number)=>H-(v-mn)/rng*H;
  const path=pts.map((v,i)=>`${i===0?"M":"L"}${tx(i).toFixed(1)},${ty(v).toFixed(1)}`).join(" ");
  const area=path+` L${W},${H} L0,${H} Z`;
  const by=ty(1.0);
  return(
    <div style={{position:"relative"}}>
      <svg width={W} height={H} style={{display:"block",overflow:"visible"}}>
        <defs>
          <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity=".22"/>
            <stop offset="100%" stopColor={color} stopOpacity=".01"/>
          </linearGradient>
        </defs>
        {by>2&&by<H-2&&<line x1="0" y1={by} x2={W} y2={by} stroke="rgba(255,255,255,.12)" strokeWidth="1" strokeDasharray="3,3"/>}
        <path d={area} fill="url(#cg)"/>
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        <circle cx={tx(N-1)} cy={ty(pts[N-1])} r="3" fill={color}/>
        <text x="3" y="11" fontSize="7" fill="rgba(255,255,255,.25)" fontFamily="monospace">{mx.toFixed(2)}x</text>
        <text x="3" y={H-2} fontSize="7" fill="rgba(255,255,255,.25)" fontFamily="monospace">{mn.toFixed(2)}x</text>
        {by>8&&by<H-8&&<text x={W-28} y={by-3} fontSize="7" fill="rgba(255,255,255,.25)" fontFamily="monospace">1.0x</text>}
      </svg>
    </div>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS=`
*{box-sizing:border-box;margin:0;padding:0}
body{background:#060d18!important;color:#c8dff0;font-family:'Space Grotesk',system-ui,sans-serif}
::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-thumb{background:#122038;border-radius:2px}

.ld{display:inline-block;width:6px;height:6px;border-radius:50%;background:#00ff87;box-shadow:0 0 8px rgba(0,255,135,.8);animation:lp 2s infinite}
@keyframes lp{0%,100%{opacity:1}50%{opacity:.2}}

/* TOP TICKER */
.ticker-wrap{background:#07101f;border-bottom:1px solid #122038;height:34px;display:flex;align-items:center;overflow:hidden;flex-shrink:0}
.ticker-lbl{padding:0 12px;font-size:8px;font-weight:700;color:#00ff87;letter-spacing:1.5px;font-family:monospace;border-right:1px solid #122038;height:100%;display:flex;align-items:center;gap:6px;flex-shrink:0;white-space:nowrap}
.ticker-track{display:flex;white-space:nowrap;animation:tick 60s linear infinite}
.ticker-item{display:inline-flex;align-items:center;gap:7px;padding:0 16px;font-size:10px;border-right:1px solid #0e1e30;height:34px;font-family:monospace;flex-shrink:0}
@keyframes tick{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

/* NAV */
.nav{height:46px;display:flex;align-items:center;padding:0 14px;gap:9px;border-bottom:1px solid #122038;background:#07101f;flex-shrink:0}
.hstat{padding:3px 10px;border:1px solid #122038;border-radius:5px;text-align:center;flex-shrink:0}
.hstat-l{font-size:7px;color:#3a5068;letter-spacing:1px;font-family:monospace}
.hstat-v{font-weight:800;font-size:14px;line-height:1.2}

/* SIDEBAR */
.sb-btn{all:unset;display:flex;align-items:center;gap:7px;padding:7px 10px;font-size:11px;border-left:2px solid transparent;cursor:pointer;color:#3a5068;width:100%;transition:all .1s}
.sb-btn:hover{color:#c8dff0;background:rgba(255,255,255,.02)}
.sb-btn.on{color:#c8dff0}

/* TABS */
.cat-tab{padding:5px 12px;border-radius:20px;font-size:10px;font-weight:700;cursor:pointer;border:1px solid #122038;background:transparent;color:#3a5068;font-family:monospace;transition:all .15s;white-space:nowrap}
.cat-tab:hover{color:#c8dff0;border-color:#1e3a50}
.cat-tab.on{background:rgba(0,255,135,.1);border-color:rgba(0,255,135,.3);color:#00ff87}

/* TOOLBAR */
.tb{background:transparent;border:1px solid #122038;border-radius:4px;padding:3px 9px;font-size:8px;color:#3a5068;cursor:pointer;font-family:monospace;transition:all .15s}
.tb:hover{color:#c8dff0;border-color:#1e3a50}
.tb.on{color:#00ff87;border-color:rgba(0,255,135,.3);background:rgba(0,255,135,.05)}

/* SIGNAL BADGE */
.sig-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:8px;font-weight:800;letter-spacing:.7px;border:1px solid;font-family:monospace;white-space:nowrap}

/* PACK GRID */
.pack-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;padding:12px}
.pcard{background:#0b1728;border:1px solid #122038;border-radius:12px;padding:0;cursor:pointer;transition:all .18s;position:relative;overflow:hidden}
.pcard:hover{border-color:#1e3a50;transform:translateY(-2px);box-shadow:0 10px 30px rgba(0,0,0,.5)}
.pcard.sel{border-color:rgba(0,255,135,.35);box-shadow:0 0 0 1px rgba(0,255,135,.15)}
.pcard-top{padding:12px 12px 10px}
.pcard-bot{border-top:1px solid #122038;padding:9px 12px;background:rgba(0,0,0,.15)}
.pcard-stripe{position:absolute;top:0;left:0;right:0;height:2px;border-radius:12px 12px 0 0}

/* DETAIL PANEL */
.detail-panel{width:0;flex-shrink:0;border-left:1px solid #122038;background:#07101f;display:flex;flex-direction:column;overflow:hidden;transition:width .22s cubic-bezier(.4,0,.2,1)}
.detail-panel.open{width:330px}
.dp-scroll{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px}
.dp-sec{background:#0b1728;border:1px solid #122038;border-radius:8px;padding:11px;display:flex;flex-direction:column;gap:7px}
.dp-lbl{font-size:7px;letter-spacing:1.5px;color:#3a5068;font-family:monospace}
.dp-2{display:grid;grid-template-columns:1fr 1fr;gap:5px}
.dp-tile{background:#060d18;border:1px solid #122038;border-radius:6px;padding:8px 9px}
.dp-tl{font-size:7px;color:#3a5068;letter-spacing:1px;display:block;margin-bottom:3px;font-family:monospace}
.dp-tv{font-family:monospace;font-weight:800;font-size:15px;line-height:1}
.fee-t{width:100%;font-size:10px;border-collapse:collapse;font-family:monospace}
.fee-t td{padding:5px 0;border-bottom:1px solid #0e1e30;color:#3a5068}
.fee-t tr.tot td{color:#c8dff0;font-weight:700;border:none;padding-top:7px}
.dp-x{all:unset;cursor:pointer;color:#3a5068;width:22px;height:22px;border:1px solid #122038;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;transition:color .15s}
.dp-x:hover{color:#c8dff0}

/* ALERT BELL */
.alert-btn{all:unset;cursor:pointer;padding:4px 10px;border:1px solid #122038;border-radius:5px;font-size:9px;color:#3a5068;font-family:monospace;transition:all .15s;display:flex;align-items:center;gap:4px}
.alert-btn:hover{border-color:#1e3a50;color:#c8dff0}
.alert-btn.on{border-color:rgba(255,209,102,.3);color:#ffd166;background:rgba(255,209,102,.06)}

/* FEED */
.feed-card{border:1px solid #122038;border-radius:10px;padding:10px 12px;display:flex;gap:10px;align-items:flex-start;background:#07101f;transition:background .1s}
.feed-card:hover{background:#0b1728}

/* BUDGET */
.b-btn{padding:5px 14px;border:1px solid #122038;border-radius:20px;font-size:11px;cursor:pointer;background:transparent;color:#3a5068;font-family:monospace;transition:all .15s;font-weight:700}
.b-btn:hover{border-color:#1e3a50;color:#c8dff0}
.b-btn.on{border-color:rgba(0,255,135,.3);color:#00ff87;background:rgba(0,255,135,.06)}

@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.fi{animation:fi .2s ease both}
@keyframes si{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}
.si{animation:si .2s ease both}

/* ALERT PULSE */
@keyframes ap{0%,100%{box-shadow:0 0 0 0 rgba(255,209,102,.4)}70%{box-shadow:0 0 0 8px rgba(255,209,102,0)}}
.alert-pulse{animation:ap 2s infinite}
`;

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard(){
  const {data,isLoading,refetch}=useCourtyardData();
  const [tab,setTab]    =useState("all");
  const [view,setView]  =useState<"packs"|"feed"|"budget">("packs");
  const [sort,setSort]  =useState<"ev"|"bb"|"decision"|"wr"|"price">("ev");
  const [flt,setFlt]    =useState<"all"|"pos"|"neg">("all");
  const [sel,setSel]    =useState<Pack|null>(null);
  const [budget,setBudget]=useState<number|null>(null);
  const [alerts,setAlerts]=useState<Set<string>>(new Set());
  const [cd,setCd]      =useState(60);
  const [notifPerm,setNotifPerm]=useState<NotificationPermission|"unknown">("unknown");
  const M={fontFamily:"monospace"} as React.CSSProperties;

  // Countdown & auto refresh
  useEffect(()=>{
    const t=setInterval(()=>setCd(c=>{if(c<=1){refetch();return 60;}return c-1;}),1000);
    return()=>clearInterval(t);
  },[refetch]);

  // Check notification permission
  useEffect(()=>{
    if("Notification" in window) setNotifPerm(Notification.permission);
  },[]);

  // Check +EV alerts when data updates
  useEffect(()=>{
    if(!data||notifPerm!=="granted") return;
    data.packs.forEach(p=>{
      if(p.evRatio>=1&&alerts.has(p.id)){
        new Notification(`⚡ ${p.name} is +EV right now!`,{
          body:`EV Ratio: ${$x(p.evRatio)} · Buyback: ${$x(p.buybackEv)} · Pull it now!`,
          icon:packImg(p.id),
        });
      }
    });
  },[data,alerts,notifPerm]);

  const enableAlerts=useCallback(async(packId:string)=>{
    if(!("Notification" in window)){alert("Your browser doesn't support notifications.");return;}
    if(Notification.permission!=="granted"){
      const perm=await Notification.requestPermission();
      setNotifPerm(perm);
      if(perm!=="granted"){alert("Please allow notifications to use alerts.");return;}
    }
    setAlerts(prev=>{
      const next=new Set(prev);
      if(next.has(packId)) next.delete(packId); else next.add(packId);
      return next;
    });
  },[]);

  const cats=data?["all",...Array.from(new Set(data.packs.map(p=>p.category)))] :["all"];
  const decScore=(p:Pack)=>{const d=dec(p);return d.action.includes("STRONG")?6:d.action.includes("✅")?5:d.action.includes("⚡")?4:d.action.includes("MAYBE")?3:d.action.includes("WAIT")?2:1;};

  const rows:Pack[]=data?[...data.packs]
    .filter(p=>tab==="all"||p.category===tab)
    .filter(p=>flt==="pos"?p.evRatio>=1:flt==="neg"?p.evRatio<1:true)
    .sort((a,b)=>sort==="ev"?b.evRatio-a.evRatio:sort==="bb"?b.buybackEv-a.buybackEv:sort==="decision"?decScore(b)-decScore(a):sort==="wr"?b.winRate-a.winRate:a.price-b.price)
    :[];

  const best=data?.packs[0];
  const budgetPacks=(b:number)=>data?.packs.filter(p=>p.price<=b).sort((a,c)=>decScore(c)-decScore(a)).slice(0,3)??[];

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#060d18",color:"#c8dff0"}}>
      <style>{CSS}</style>

      {/* TICKER */}
      {data&&data.recentPulls.length>0&&(
        <div className="ticker-wrap">
          <div className="ticker-lbl"><span className="ld"/>LIVE PULLS</div>
          <div style={{flex:1,overflow:"hidden"}}>
            <div className="ticker-track">
              {[...data.recentPulls,...data.recentPulls].map((p,i)=>{
                const win=p.fmv>p.packPrice;
                return(
                  <div key={`${p.id}-${i}`} className="ticker-item">
                    <span style={{color:"#3a5068",fontSize:9}}>@{p.user}</span>
                    <span style={{color:"#c8dff0",fontWeight:600}}>{p.cardName.slice(0,20)}</span>
                    <span style={{color:win?"#00ff87":"#ff3860",fontWeight:800}}>{$f(p.fmv)}</span>
                    <span style={{color:win?"rgba(0,255,135,.5)":"rgba(255,56,96,.5)",fontSize:9}}>({win?"+":""}{$f(p.fmv-p.packPrice)})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav className="nav">
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          <div style={{width:28,height:28,borderRadius:7,background:"linear-gradient(135deg,#00ff87,#4f8fff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>⚡</div>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:"#fff",lineHeight:1}}>PackPulse</div>
            <div style={{fontSize:7,color:"#3a5068",letterSpacing:1.5,...M}}>COURTYARD DECISION ENGINE</div>
          </div>
        </div>

        <div style={{display:"flex",alignItems:"center",gap:5,marginLeft:10,padding:"2px 10px",border:"1px solid rgba(0,255,135,.2)",borderRadius:20,background:"rgba(0,255,135,.04)",flexShrink:0}}>
          <span className="ld" style={{width:5,height:5}}/>
          <span style={{fontSize:8,color:"#00ff87",fontWeight:700,letterSpacing:1,...M}}>
            {data?.isLive?"LIVE":"SAMPLE"} · ↻{cd}s
          </span>
        </div>

        {data&&[
          {l:"+EV PACKS",v:`${data.posEV}/${data.packs.length}`,c:"#00ff87"},
          {l:"AVG EV",v:$x(data.avgEV),c:data.avgEV>=1?"#00ff87":"#ff3860"},
          {l:"UPDATED",v:data.isLive?"live":"sample",c:"#3a5068"},
          {l:"PULLS",v:`${data.totalPulls}`,c:"#fff"},
        ].map(s=>(
          <div key={s.l} className="hstat">
            <div className="hstat-l">{s.l}</div>
            <div className="hstat-v" style={{color:s.c}}>{s.v}</div>
          </div>
        ))}

        <button onClick={()=>refetch()} disabled={isLoading} style={{marginLeft:"auto",padding:"4px 11px",background:"transparent",border:"1px solid #122038",borderRadius:5,fontSize:8,color:"#3a5068",cursor:"pointer",...M}}>↻ Refresh</button>
      </nav>

      {/* BODY */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* Sidebar */}
        <aside style={{width:178,flexShrink:0,borderRight:"1px solid #122038",background:"#07101f",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"9px 10px 3px",fontSize:7,color:"#3a5068",letterSpacing:1.5,...M}}>WORKSPACE</div>
          {([["packs","⚡","EV Terminal"],["budget","💰","Budget Advisor"],["feed","📋","Pull Feed"]] as [string,string,string][]).map(([v,ico,lbl])=>(
            <button key={v} className={`sb-btn${view===v?" on":""}`} onClick={()=>setView(v as any)}
              style={{borderLeftColor:view===v?"#00ff87":"transparent",background:view===v?"rgba(255,255,255,.025)":"transparent"}}>
              {ico} {lbl}
            </button>
          ))}

          <div style={{padding:"9px 10px 3px",marginTop:4,fontSize:7,color:"#3a5068",letterSpacing:1.5,...M}}>MARKETS</div>
          {cats.map(c=>{
            const color=c==="all"?"#00ff87":CAT_COLOR[c]??"#888";
            const packs=data?(c==="all"?data.packs:data.packs.filter(p=>p.category===c)):[];
            const posN=packs.filter(p=>p.evRatio>=1).length;
            const buyN=packs.filter(p=>dec(p).action.includes("BUY")).length;
            const active=tab===c;
            return(
              <button key={c} className={`sb-btn${active?" on":""}`} onClick={()=>setTab(c)}
                style={{borderLeftColor:active?color:"transparent",background:active?"rgba(255,255,255,.025)":"transparent"}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:color,flexShrink:0,display:"inline-block"}}/>
                <span style={{flex:1}}>{c==="all"?"All Markets":c}</span>
                {buyN>0&&<span style={{fontSize:8,fontWeight:700,color:"#00ff87",background:"rgba(0,255,135,.08)",padding:"1px 4px",borderRadius:3,...M}}>{buyN}↑</span>}
              </button>
            );
          })}
          <div style={{marginTop:"auto",padding:10,borderTop:"1px solid #122038"}}>
            <a href="https://courtyard.io" target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:"#3a5068",textDecoration:"none"}}>🔗 Open Courtyard.io</a>
          </div>
        </aside>

        {/* Main */}
        <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

          {isLoading&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
              <div style={{fontSize:32}}>⚡</div>
              <div style={{fontSize:13,fontWeight:700,color:"#3a5068"}}>Loading live Courtyard data...</div>
            </div>
          )}

          {/* ═══ EV TERMINAL ═══ */}
          {data&&view==="packs"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

              {/* Hero */}
              <div style={{padding:"10px 14px 10px",borderBottom:"1px solid #122038",background:"#07101f",flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
                  <div style={{flex:1}}>
                    <h1 style={{fontWeight:800,fontSize:20,color:"#fff",lineHeight:1.1,letterSpacing:-0.5}}>Stop buying packs blind.</h1>
                    <p style={{fontSize:11,color:"#3a5068",marginTop:3}}>
                      Real-time EV + real cash after fees for every <a href="https://courtyard.io" target="_blank" rel="noreferrer" style={{color:"#00ff87"}}>Courtyard.io</a> pack. Tells you exactly what to pull.
                    </p>
                  </div>
                  {best&&(
                    <a href={`https://courtyard.io/vending-machine/${best.id}`} target="_blank" rel="noreferrer"
                      style={{padding:"10px 20px",background:"#00ff87",borderRadius:10,color:"#000",fontWeight:800,fontSize:13,textDecoration:"none",flexShrink:0}}>
                      Rip a Pack ↗
                    </a>
                  )}
                </div>

                {/* Stat cards + best pack */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 2fr",gap:8}}>
                  {[
                    {l:"+EV PACKS",v:`${data.posEV}/${data.packs.length}`,s:"above break-even",vc:"#00ff87"},
                    {l:"BEST EV NOW",v:$x(data.bestPack?.evRatio??0),s:data.bestPack?.name??"—",vc:"#00ff87"},
                    {l:"PULLS TRACKED",v:`${data.totalPulls}`,s:data.isLive?"from Courtyard.io":"sample",vc:"#fff"},
                    {l:"MARKET AVG EV",v:$x(data.avgEV),s:data.avgEV>=1?"Market is healthy":"Below EV",vc:data.avgEV>=1?"#00ff87":"#ff3860"},
                  ].map(s=>(
                    <div key={s.l} style={{background:"#0b1728",border:"1px solid #122038",borderRadius:8,padding:"8px 11px"}}>
                      <div style={{fontSize:7,color:"#3a5068",letterSpacing:1.2,...M,marginBottom:3}}>{s.l}</div>
                      <div style={{fontWeight:800,fontSize:18,color:s.vc,lineHeight:1,...M}}>{s.v}</div>
                      <div style={{fontSize:9,color:"#3a5068",marginTop:3}}>{s.s}</div>
                    </div>
                  ))}
                  {best&&(()=>{
                    const sg=sig(best.evRatio);
                    return(
                      <div style={{background:"#0b1728",border:"1px solid #122038",borderRadius:8,padding:"9px 12px",display:"flex",alignItems:"center",gap:11}}>
                        <img src={packImg(best.id)} alt="" style={{width:36,height:50,objectFit:"contain",flexShrink:0}} onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}}/>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:7,color:"#00ff87",letterSpacing:1.5,...M,fontWeight:700,marginBottom:3}}>BEST VALUE RIGHT NOW</div>
                          <div style={{fontWeight:800,fontSize:13,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,marginBottom:5}}>{best.name}</div>
                          <div style={{display:"flex",gap:14}}>
                            {[["EV",$x(best.evRatio),"#00ff87"],["CAL. EV",$f(best.calibratedEv),"#00ff87"],["BUYBACK",$x(best.buybackEv),best.buybackEv>=1?"#00ff87":"#ff3860"]].map(([l,v,c])=>(
                              <div key={l as string}><div style={{fontSize:7,color:"#3a5068",...M}}>{l}</div><div style={{fontWeight:800,fontSize:13,color:c as string,...M}}>{v}</div></div>
                            ))}
                          </div>
                        </div>
                        <span className="sig-badge" style={{color:sg.c,background:sg.bg,borderColor:sg.bd,alignSelf:"flex-start" as const}}>{sg.label}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Category tabs */}
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",borderBottom:"1px solid #122038",background:"#07101f",flexShrink:0,overflowX:"auto" as const}}>
                <span style={{fontSize:8,color:"#3a5068",...M,flexShrink:0,marginRight:2}}>ALL PACKS</span>
                {cats.map(c=>{
                  const packs=data?(c==="all"?data.packs:data.packs.filter(p=>p.category===c)):[];
                  return(
                    <button key={c} className={`cat-tab${tab===c?" on":""}`} onClick={()=>setTab(c)}>
                      {c==="all"?"All":c} {packs.length}
                    </button>
                  );
                })}
                <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                  <span className="ld" style={{width:5,height:5}}/><span style={{fontSize:8,color:"#00ff87",fontWeight:700,...M}}>LIVE DATA</span>
                </div>
              </div>

              {/* Toolbar */}
              <div style={{display:"flex",alignItems:"center",gap:4,padding:"5px 12px",borderBottom:"1px solid #122038",background:"#07101f",flexShrink:0,flexWrap:"wrap" as const}}>
                <button className={`tb${flt==="all"?" on":""}`} onClick={()=>setFlt("all")}>All Packs</button>
                <button className={`tb${flt==="pos"?" on":""}`} onClick={()=>setFlt("pos")}>+EV Only</button>
                <button className={`tb${flt==="neg"?" on":""}`} onClick={()=>setFlt("neg")}>−EV Only</button>
                <span style={{fontSize:8,color:"#3a5068",marginLeft:8,...M}}>SORT BY</span>
                {([["ev","EV Ratio"],["bb","Buyback EV"],["decision","🎯 Decision"],["wr","Win Rate"],["price","Price"]] as [string,string][]).map(([k,l])=>(
                  <button key={k} className={`tb${sort===k?" on":""}`} onClick={()=>setSort(k as any)}>{l} ↕</button>
                ))}
              </div>

              {/* PACK GRID */}
              <div style={{flex:1,overflowY:"auto"}}>
                <div className="pack-grid">
                  {rows.map((pack,idx)=>{
                    const sg=sig(pack.evRatio);
                    const d=dec(pack);
                    const catC=CAT_COLOR[pack.category]??"#888";
                    const evc=evColor(pack.evRatio);
                    const bbC=pack.buybackEv>=1?"#00ff87":"#ff3860";
                    const isSel=sel?.id===pack.id;
                    const hasAlert=alerts.has(pack.id);
                    return(
                      <div key={pack.id} className={`pcard fi${isSel?" sel":""}`} onClick={()=>setSel(isSel?null:pack)}>
                        <div className="pcard-stripe" style={{background:evc}}/>
                        <div className="pcard-top">
                          {/* Header row */}
                          <div style={{display:"flex",alignItems:"flex-start",gap:9,marginBottom:10}}>
                            <div style={{width:44,height:58,borderRadius:7,overflow:"hidden",background:"#060d18",border:"1px solid #122038",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                              <img src={packImg(pack.id)} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}
                                onError={(e)=>{const el=e.target as HTMLImageElement;el.style.display="none";if(el.parentElement)el.parentElement.innerHTML=`<span style="font-size:9px;font-weight:800;color:${catC}">${pack.category.slice(0,4)}</span>`;}}/>
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:8,color:"#3a5068",marginBottom:2,...M}}>
                                <span style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:catC,marginRight:3,verticalAlign:"middle"}}/>
                                {pack.category} · #{idx+1}
                              </div>
                              <div style={{fontWeight:800,fontSize:14,color:"#fff",lineHeight:1.2,marginBottom:2}}>{pack.name}</div>
                              <div style={{fontSize:10,color:"#3a5068"}}>${pack.price}.00 per pull · {pack.totalPulls} pulls</div>
                            </div>
                            {/* Alert bell */}
                            <button
                              className={`alert-btn${hasAlert?" on alert-pulse":""}`}
                              onClick={(e)=>{e.stopPropagation();enableAlerts(pack.id);}}
                              title={hasAlert?"Alerts ON — click to disable":"Enable +EV alert"}>
                              {hasAlert?"🔔":"🔕"}
                            </button>
                          </div>

                          {/* EV numbers */}
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                            <div style={{background:"#060d18",borderRadius:6,padding:"7px 9px",border:`1px solid ${pack.evRatio>=1?"rgba(0,255,135,.15)":"rgba(255,56,96,.1)"}`}}>
                              <div style={{fontSize:7,color:"#3a5068",...M,marginBottom:2}}>EV RATIO</div>
                              <div style={{fontWeight:800,fontSize:20,color:evc,lineHeight:1,...M}}>{$x(pack.evRatio)}</div>
                              <div style={{fontSize:8,color:"#3a5068",marginTop:2}}>{pack.evRatio>=1?"▲":"▼"} x EV</div>
                            </div>
                            <div style={{background:"#060d18",borderRadius:6,padding:"7px 9px",border:`1px solid ${pack.buybackEv>=1?"rgba(255,209,102,.15)":"rgba(255,56,96,.1)"}`}}>
                              <div style={{fontSize:7,color:"#ffd166",...M,marginBottom:2}}>BUYBACK EV ★</div>
                              <div style={{fontWeight:800,fontSize:20,color:bbC,lineHeight:1,...M}}>{$x(pack.buybackEv)}</div>
                              <div style={{fontSize:8,color:"#3a5068",marginTop:2}}>≈{$f(pack.avgFmv*0.9*0.94)} cash</div>
                            </div>
                          </div>

                          {/* Cal EV + Win rate */}
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                            <div>
                              <div style={{fontSize:8,color:"#3a5068",marginBottom:2,...M}}>CAL. EV</div>
                              <div style={{fontWeight:700,fontSize:14,color:evc,...M}}>{$f(pack.calibratedEv)}</div>
                            </div>
                            <div style={{textAlign:"right" as const}}>
                              <div style={{fontSize:8,color:"#3a5068",marginBottom:3}}>Win rate <span style={{color:"#c8dff0",fontWeight:700,...M}}>{$p(pack.winRate)}</span></div>
                              <div style={{width:90,height:3,borderRadius:2,background:"#0e1e30",overflow:"hidden",marginLeft:"auto"}}>
                                <div style={{height:"100%",borderRadius:2,width:`${Math.min(pack.winRate*200,100)}%`,background:pack.evRatio>=1?"#00ff87":"#ffd166"}}/>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom bar */}
                        <div className="pcard-bot">
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                            <span className="sig-badge" style={{color:sg.c,background:sg.bg,borderColor:sg.bd}}>{sg.label}</span>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <Spark trend={pack.trend} color={evc} w={55} h={18}/>
                              <a href={`https://courtyard.io/vending-machine/${pack.id}`} target="_blank" rel="noreferrer"
                                onClick={(e)=>e.stopPropagation()}
                                style={{padding:"3px 9px",border:"1px solid rgba(0,255,135,.25)",borderRadius:5,fontSize:9,color:"#00ff87",fontWeight:700,textDecoration:"none",...M}}>
                                View ↗
                              </a>
                            </div>
                          </div>
                          {/* Decision */}
                          <div style={{background:d.bg,border:`1px solid ${d.c}33`,borderRadius:6,padding:"6px 8px",display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontWeight:800,fontSize:11,color:d.c,...M,flexShrink:0,whiteSpace:"nowrap" as const}}>{d.action}</span>
                            <span style={{fontSize:9,color:d.c,opacity:.8,lineHeight:1.3}}>{d.reason.slice(0,50)}{d.reason.length>50?"…":""}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══ BUDGET ADVISOR ═══ */}
          {data&&view==="budget"&&(
            <div style={{flex:1,overflowY:"auto",padding:16}}>
              <div style={{marginBottom:16}}>
                <h2 style={{fontWeight:800,fontSize:20,color:"#fff",marginBottom:6}}>💰 Budget Advisor</h2>
                <p style={{fontSize:12,color:"#3a5068",lineHeight:1.6,maxWidth:560}}>Tell us your budget. We rank every pack by real buyback value — the actual cash you'll pocket after Courtyard's fees — not just FMV EV.</p>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" as const}}>
                {[10,25,50,100,200,500].map(b=>(
                  <button key={b} className={`b-btn${budget===b?" on":""}`} onClick={()=>setBudget(b)}>${b}</button>
                ))}
                <button className={`b-btn${budget===null?" on":""}`} onClick={()=>setBudget(null)}>All</button>
              </div>
              {(budget?[budget]:[10,25,50,100]).map(b=>{
                const recs=budgetPacks(b);
                if(!recs.length) return null;
                const top=recs[0], d=dec(top), sg=sig(top.evRatio);
                const cashOut=top.avgFmv*0.9*0.94;
                return(
                  <div key={b} style={{background:"#0b1728",border:"1px solid #122038",borderRadius:12,padding:16,marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                      <div style={{fontSize:26,fontWeight:800,color:"#00ff87",...M}}>${b}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:9,color:"#3a5068",...M,marginBottom:2}}>BEST PICK FOR THIS BUDGET</div>
                        <div style={{fontWeight:800,fontSize:16,color:"#fff"}}>{top.name}</div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column" as const,alignItems:"flex-end" as const,gap:5}}>
                        <span style={{fontWeight:800,fontSize:13,color:d.c,...M}}>{d.action}</span>
                        <span className="sig-badge" style={{color:sg.c,background:sg.bg,borderColor:sg.bd}}>{sg.label}</span>
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:12}}>
                      {[["EV RATIO",$x(top.evRatio),top.evRatio>=1?"#00ff87":"#ff3860"],["BUYBACK EV ★",$x(top.buybackEv),top.buybackEv>=1?"#00ff87":"#ff3860"],["CASH OUT",$f(cashOut),top.buybackEv>=1?"#00ff87":"#ff3860"],["WIN RATE",$p(top.winRate),top.winRate>=.5?"#00ff87":"#3a5068"]].map(([l,v,c])=>(
                        <div key={l as string} style={{background:"#060d18",borderRadius:7,padding:"8px 10px",border:"1px solid #122038"}}>
                          <div style={{fontSize:7,color:"#3a5068",...M,marginBottom:3}}>{l}</div>
                          <div style={{fontWeight:800,fontSize:16,color:c as string,...M}}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:11,color:d.c,background:d.bg,border:`1px solid ${d.c}44`,borderRadius:7,padding:"7px 10px",marginBottom:10}}>
                      <strong>Why:</strong> {d.reason}
                    </div>
                    {recs.length>1&&(
                      <div>
                        <div style={{fontSize:8,color:"#3a5068",...M,marginBottom:6}}>OTHER OPTIONS FOR ${b}</div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap" as const}}>
                          {recs.slice(1).map(p=>{const pd=dec(p);return(
                            <div key={p.id} style={{background:"#060d18",border:"1px solid #122038",borderRadius:8,padding:"7px 10px"}}>
                              <div style={{fontWeight:700,color:"#c8dff0",marginBottom:2,fontSize:11}}>{p.name}</div>
                              <div style={{color:pd.c,fontWeight:700,...M,fontSize:10}}>{pd.action} · {$x(p.evRatio)}</div>
                            </div>
                          );})}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ═══ PULL FEED ═══ */}
          {data&&view==="feed"&&(
            <div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:6}}>
              <div style={{padding:"4px 2px 6px",fontSize:11,color:"#3a5068"}}>
                {data.recentPulls.length} most recent pulls from Courtyard.io
              </div>
              {(data.recentPulls as PullRecord[]).map(pull=>{
                const win=pull.fmv>pull.packPrice, diff=pull.fmv-pull.packPrice;
                const hue=pull.user.split("").reduce((a,c)=>a+c.charCodeAt(0),0)%360;
                return(
                  <div key={pull.id} className="feed-card">
                    <div style={{width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,flexShrink:0,background:`hsl(${hue},25%,10%)`,border:`1px solid hsl(${hue},25%,18%)`,color:`hsl(${hue},40%,55%)`,...M}}>
                      {pull.user.slice(0,2).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3,flexWrap:"wrap" as const}}>
                        <span style={{fontSize:11,fontWeight:700,color:"#00cc6a"}}>@{pull.user}</span>
                        <span style={{fontSize:9,color:"#3a5068",padding:"1px 5px",background:"#0b1728",border:"1px solid #122038",borderRadius:3,...M}}>{pull.packName}</span>
                        <span style={{fontSize:9,color:"#3a5068",marginLeft:"auto",...M}}>{ago(pull.timestamp)} ago</span>
                      </div>
                      <div style={{fontSize:13,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{pull.cardName}</div>
                      {pull.grade&&<div style={{fontSize:9,color:"#3a5068",marginTop:2,...M}}>{pull.grader} {pull.grade}</div>}
                    </div>
                    <div style={{textAlign:"right" as const,flexShrink:0}}>
                      <div style={{fontWeight:800,fontSize:14,color:win?"#00ff87":"#3a5068",...M}}>{$f(pull.fmv)}</div>
                      <div style={{fontSize:9,color:win?"#00cc6a":"#ff3860",marginTop:2,...M}}>{win?"+":""}{$f(diff)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* ═══ DETAIL PANEL ═══ */}
        <div className={sel?"detail-panel open":"detail-panel"}>
          {sel&&(()=>{
            const p=sel, d=dec(p), sg=sig(p.evRatio);
            const evc=evColor(p.evRatio);
            const bbC=p.buybackEv>=1?"#00ff87":"#ff3860";
            const trueCost=p.price*1.074;
            const cashOut=p.avgFmv*0.9*0.94;
            const hasAlert=alerts.has(p.id);
            return(
              <div className="si" style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
                {/* Header */}
                <div style={{padding:"11px 12px",borderBottom:"1px solid #122038",display:"flex",alignItems:"center",gap:9,flexShrink:0,background:"#060d18"}}>
                  <img src={packImg(p.id)} alt="" style={{width:28,height:40,objectFit:"contain"}} onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:800,fontSize:14,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{p.name}</div>
                    <div style={{fontSize:9,color:"#3a5068",marginTop:1,...M}}>{p.category} · ${p.price}/pack · {p.totalPulls} pulls</div>
                  </div>
                  <button
                    className={`alert-btn${hasAlert?" on":""}`}
                    onClick={()=>enableAlerts(p.id)}
                    style={{fontSize:12}}>
                    {hasAlert?"🔔 ON":"🔕 Alert"}
                  </button>
                  <button className="dp-x" onClick={()=>setSel(null)}>✕</button>
                </div>

                <div className="dp-scroll">
                  {/* SHOULD I PULL? */}
                  <div style={{background:d.bg,border:`1px solid ${d.c}44`,borderRadius:8,padding:"12px 13px"}}>
                    <div style={{fontSize:7,color:d.c,letterSpacing:1.5,...M,fontWeight:700,marginBottom:5}}>SHOULD YOU PULL?</div>
                    <div style={{fontWeight:800,fontSize:18,color:d.c,...M,marginBottom:5}}>{d.action}</div>
                    <div style={{fontSize:11,color:d.c,opacity:.85,lineHeight:1.5}}>{d.reason}</div>
                  </div>

                  {/* EV Chart */}
                  <div className="dp-sec">
                    <span className="dp-lbl">EV RATIO TREND · 1m</span>
                    <EVChart pack={p}/>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#3a5068",...M}}>
                      <span>Earlier ←</span>
                      <span style={{color:evc,fontWeight:700}}>Now: {$x(p.evRatio)}</span>
                    </div>
                  </div>

                  {/* EV Stats */}
                  <div className="dp-sec">
                    <span className="dp-lbl">EXPECTED VALUE</span>
                    <div className="dp-2">
                      <div className="dp-tile" style={{borderColor:p.evRatio>=1?"rgba(0,255,135,.2)":"rgba(255,56,96,.15)"}}>
                        <span className="dp-tl">FMV EV</span>
                        <div className="dp-tv" style={{color:evc}}>{$x(p.evRatio)}</div>
                        <div style={{fontSize:8,color:"#3a5068",marginTop:3,...M}}>{$f(p.calibratedEv)} avg FMV</div>
                      </div>
                      <div className="dp-tile" style={{borderColor:p.buybackEv>=1?"rgba(255,209,102,.2)":"rgba(255,56,96,.15)"}}>
                        <span className="dp-tl">BUYBACK EV ★ UNIQUE</span>
                        <div className="dp-tv" style={{color:bbC}}>{$x(p.buybackEv)}</div>
                        <div style={{fontSize:8,color:"#3a5068",marginTop:3,...M}}>≈{$f(cashOut)} real cash</div>
                      </div>
                    </div>
                    <span className="sig-badge" style={{color:sg.c,background:sg.bg,borderColor:sg.bd,alignSelf:"flex-start" as const}}>{sg.label}</span>
                  </div>

                  {/* Pack Stats */}
                  <div className="dp-sec">
                    <span className="dp-lbl">PACK STATS</span>
                    <div className="dp-2">
                      <div className="dp-tile"><span className="dp-tl">WIN RATE</span><div className="dp-tv" style={{color:p.winRate>=.5?"#00ff87":"#3a5068"}}>{$p(p.winRate)}</div></div>
                      <div className="dp-tile"><span className="dp-tl">BEST PULL</span><div className="dp-tv" style={{color:"#00ff87"}}>{$f(p.bestPull)}</div></div>
                      <div className="dp-tile"><span className="dp-tl">AVG FMV</span><div className="dp-tv" style={{color:evc}}>{$f(p.avgFmv)}</div></div>
                      <div className="dp-tile"><span className="dp-tl">CASH OUT</span><div className="dp-tv" style={{color:bbC}}>{$f(cashOut)}</div></div>
                    </div>
                  </div>

                  {/* Fee Breakdown — EXCLUSIVE */}
                  <div className="dp-sec">
                    <span className="dp-lbl">💡 REAL FEE BREAKDOWN — EXCLUSIVE</span>
                    <table className="fee-t"><tbody>
                      <tr><td>Advertised price</td><td style={{textAlign:"right" as const}}>{$f(p.price)}</td></tr>
                      <tr><td style={{color:"#ff3860"}}>Payment markup (+7.4%)</td><td style={{textAlign:"right" as const,color:"#ff3860"}}>{$f(trueCost)}</td></tr>
                      <tr><td>Average FMV won</td><td style={{textAlign:"right" as const,color:evc}}>{$f(p.avgFmv)}</td></tr>
                      <tr><td>Buyback offer (×0.90)</td><td style={{textAlign:"right" as const}}>{$f(p.avgFmv*0.9)}</td></tr>
                      <tr><td style={{color:"#ff3860"}}>Processing fee (−6%)</td><td style={{textAlign:"right" as const,color:"#ff3860"}}>−{$f(p.avgFmv*0.9*0.06)}</td></tr>
                      <tr className="tot"><td>💵 Cash in your hand</td><td style={{textAlign:"right" as const,color:bbC,fontSize:15}}>{$f(cashOut)}</td></tr>
                    </tbody></table>
                  </div>

                  {/* CTA */}
                  <a href={`https://courtyard.io/vending-machine/${p.id}`} target="_blank" rel="noreferrer"
                    style={{display:"block",textAlign:"center" as const,padding:"12px",borderRadius:9,fontWeight:800,fontSize:14,textDecoration:"none",background:p.evRatio>=1?"#00ff87":"#0b1728",color:p.evRatio>=1?"#000":"#3a5068",border:p.evRatio>=1?"none":"1px solid #122038"}}>
                    {p.evRatio>=1?"🟢 Pull This Pack on Courtyard →":"View on Courtyard →"}
                  </a>
                  <div style={{fontSize:8,color:"#3a5068",textAlign:"center" as const,...M,lineHeight:1.6,padding:"4px 0"}}>For informational purposes only. Not financial advice.</div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Footer */}
      <div style={{padding:"4px 14px",borderTop:"1px solid #122038",background:"#07101f",textAlign:"center" as const}}>
        <span style={{fontSize:9,color:"#3a5068"}}>For educational purposes only. Not financial advice. Pack outcomes are random. Not affiliated with Courtyard.io.</span>
      </div>
    </div>
  );
}

export default function App(){
  return <QueryClientProvider client={queryClient}><Dashboard/></QueryClientProvider>;
}
