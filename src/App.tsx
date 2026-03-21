import { useState, useEffect, useCallback, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, useUser, useClerk, SignInButton, UserButton } from "@clerk/clerk-react";
import { useCourtyardData } from "./hooks/use-courtyard-data";
import { Pack, PullRecord } from "./data/packs";
import LandingPage from "./LandingPage";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

const queryClient = new QueryClient();

const VAPID_PUBLIC_KEY = "BHKMKBK0jPmrj4TNW-LP7e9Y4LCPkeHpzJ_nNJEB4marLnzRdTJWKGlwnciZW_bFerWl35oEcopeh8YuD4Hofd0";

const CAT_COLOR: Record<string,string> = {
  Pokémon:"#ffd166",Baseball:"#4f8fff",Basketball:"#ff7f3f",
  Hockey:"#a0d8ef",Football:"#7fba00",Soccer:"#00e5ff",
  Sports:"#9f7aea",Magic:"#e040fb",Comics:"#ff5252",Watch:"#b0bec5",
};

const $f=(n:number|undefined)=>`$${(isNaN(+(n??0))?0:+(n??0)).toFixed(2)}`;
const $x=(n:number|undefined)=>`${(isNaN(+(n??0))?0:+(n??0)).toFixed(3)}x`;
const $p=(n:number|undefined)=>`${(isNaN(+(n??0))?0:+(n??0)*100).toFixed(1)}%`;
const safeN=(n:number|undefined):number=>isNaN(+(n??0))?0:+(n??0);
const packImg=(id:string)=>`https://api.courtyard.io/configs/vending-machine/${id}/resources/sealed_pack.png`;
function ago(ts:string){const s=Math.floor((Date.now()-new Date(ts).getTime())/1000);return s<60?`${s}s`:s<3600?`${Math.floor(s/60)}m`:`${Math.floor(s/3600)}h`;}

function sig(ev:number){
  if(ev>=1.3)return{label:"GREAT VALUE",c:"#00ff87",bg:"rgba(0,255,135,.12)",bd:"rgba(0,255,135,.28)"};
  if(ev>=1.0)return{label:"GOOD VALUE", c:"#4f8fff",bg:"rgba(79,143,255,.12)",bd:"rgba(79,143,255,.28)"};
  if(ev>=0.9)return{label:"FAIR VALUE", c:"#ffd166",bg:"rgba(255,209,102,.12)",bd:"rgba(255,209,102,.28)"};
  return          {label:"BELOW EV",   c:"#ff3860",bg:"rgba(255,56,96,.12)", bd:"rgba(255,56,96,.28)"};
}

function dec(pack:Pack){
  const bb=pack.buybackEv,ev=pack.evRatio;
  if(bb>=1.2)return{action:"🔥 STRONG BUY",c:"#00ff87",bg:"rgba(0,255,135,.1)",reason:`Buyback EV ${(bb*100).toFixed(0)}% — you statistically profit after ALL fees`};
  if(bb>=1.0)return{action:"✅ BUY",c:"#00ff87",bg:"rgba(0,255,135,.08)",reason:`Real cash expected to exceed pack price after all fees`};
  if(ev>=1.0)return{action:"⚡ CONSIDER",c:"#ffd166",bg:"rgba(255,209,102,.08)",reason:`FMV positive but buyback is negative — only pull if keeping the card`};
  if(ev>=0.9)return{action:"🕐 WAIT",c:"#a0a8c0",bg:"rgba(160,168,192,.06)",reason:`Near breakeven — wait for better conditions`};
  return          {action:"❌ SKIP",c:"#ff3860",bg:"rgba(255,56,96,.07)",reason:`House has the edge. EV and buyback both below 1x right now`};
}

function evc(ev:number){return ev>=1.3?"#00ff87":ev>=1.0?"#4fd8a0":ev>=0.9?"#ffd166":"#ff3860";}

function urlBase64ToUint8Array(b64:string){
  const b=b64.replace(/-/g,"+").replace(/_/g,"/");
  const raw=atob(b.padEnd(b.length+(4-b.length%4)%4,"="));
  return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));
}

// ─── Pro features list ──────────────────────────────────────────────────────
const PRO_FEATURES = [
  {icon:"🔔", title:"Push Alerts",       desc:"Instant alerts when packs go +EV — even when browser is closed"},
  {icon:"📈", title:"EV History Charts", desc:"Real TradingView-style charts — see exactly when EV shifted"},
  {icon:"💰", title:"Budget Advisor",    desc:"Best pack for any budget, ranked by real cash after fees"},
  {icon:"💡", title:"Fee Breakdown",     desc:"See the true cost with markup + every hidden fee exposed"},
  {icon:"🎯", title:"Buyback EV",        desc:"Real cash you'd actually get — not just FMV"},
  {icon:"⚡", title:"30s Updates",       desc:"Data refreshes every 30s vs 60s on free tier"},
];

// ─── Upgrade Modal ────────────────────────────────────────────────────────────
function UpgradeModal({onClose}:{onClose:()=>void}){
  const {user} = useUser();
  const [stats,setStats]   = useState<any>(null);
  const [loading,setLoading] = useState(false);
  const M={fontFamily:"monospace"} as React.CSSProperties;

  useEffect(()=>{
    fetch("/api/founding-stats").then(r=>r.json()).then(setStats).catch(()=>{});
  },[]);

  const handleUpgrade = async () => {
    if(!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/checkout",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({clerkUserId:user.id,email:user.primaryEmailAddress?.emailAddress}),
      });
      const {url}=await res.json();
      if(url) window.location.href=url;
    } catch(e){console.error(e);}
    finally{setLoading(false);}
  };

  const price     = stats?.currentPrice ?? 19;
  const remaining = stats?.foundingRemaining ?? 25;
  const tier      = stats?.currentTier ?? 'founding';
  const filled    = Math.max(0, 100 - remaining);
  const pct       = Math.round((filled/100)*100);
  const isFounding= tier==='early';

  // Tier labels & next price
  const tierMap:{[k:string]:{label:string;next:string;nextPrice:number}} = {
    early:    {label:"EARLY ACCESS",  next:"Growth ($49/mo)",    nextPrice:49},
    growth:   {label:"GROWTH",        next:"Standard ($99/mo)",  nextPrice:99},
    standard: {label:"STANDARD",      next:"",                   nextPrice:0},
  };
  const tm = tierMap[tier] ?? tierMap.founding;

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"12px"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#07101f",border:"1px solid #1a2f45",borderRadius:16,width:"100%",maxWidth:400,maxHeight:"92vh",overflowY:"auto",position:"relative"}}>

        {/* ── Header row ── */}
        <div style={{padding:"16px 18px 12px",borderBottom:"1px solid #0e1e30",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,background:"#07101f",zIndex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#00ff87",display:"inline-block"}}/>
            <span style={{fontSize:10,color:"#00ff87",fontWeight:700,...M,letterSpacing:.5}}>PACKPULSE PRO</span>
          </div>
          <button onClick={onClose} style={{all:"unset" as any,cursor:"pointer",color:"#3a5068",fontSize:16,lineHeight:1}}>✕</button>
        </div>

        {/* ── Price + bar ── */}
        <div style={{padding:"14px 18px",borderBottom:"1px solid #0e1e30"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <span style={{fontWeight:800,fontSize:38,color:"#00ff87",lineHeight:1,...M}}>${Math.round(price)}</span>
            <div>
              <div style={{fontSize:11,color:"#3a5068"}}>/month</div>
              {isFounding&&<div style={{fontSize:9,color:"#ffd166",...M}}>FOUNDING — locked for life</div>}
            </div>
            {isFounding&&<div style={{marginLeft:"auto",background:"rgba(255,209,102,.08)",border:"1px solid rgba(255,209,102,.2)",borderRadius:8,padding:"5px 10px",textAlign:"center" as const}}>
              <div style={{fontSize:8,color:"#3a5068",...M}}>NEXT PRICE</div>
              <div style={{fontSize:13,fontWeight:800,color:"#ffd166",...M}}>${tm.nextPrice}/mo</div>
            </div>}
          </div>
          {isFounding&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:9,marginBottom:4,...M}}>
                <span style={{color:"#3a5068"}}>{filled}/100 early access spots claimed</span>
                <span style={{color:remaining<=5?"#ff3860":"#ffd166",fontWeight:700}}>{remaining} left</span>
              </div>
              <div style={{height:4,background:"#122038",borderRadius:2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct}%`,background:"#00ff87",borderRadius:2}}/>
              </div>
            </>
          )}
        </div>

        {/* ── Features 2-col grid ── */}
        <div style={{padding:"12px 18px",borderBottom:"1px solid #0e1e30"}}>
          <div style={{fontSize:8,color:"#3a5068",letterSpacing:1.5,...M,marginBottom:8}}>WHAT YOU UNLOCK</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {[
              {icon:"🎯",name:"Buyback EV",desc:"Real cash after all fees"},
              {icon:"⚡",name:"BUY/WAIT/SKIP",desc:"Data-backed signal every pack"},
              {icon:"📈",name:"EV Charts",desc:"TradingView-style history"},
              {icon:"🔔",name:"Push Alerts",desc:"Works when browser is closed"},
              {icon:"💰",name:"Budget Advisor",desc:"Best pack for your budget"},
              {icon:"📊",name:"Full Pull Feed",desc:"All 50 live pulls + images"},
            ].map((f,i)=>(
              <div key={i} style={{background:"#0b1728",border:"1px solid #122038",borderRadius:8,padding:"8px 10px",display:"flex",gap:7,alignItems:"flex-start"}}>
                <span style={{fontSize:14,flexShrink:0}}>{f.icon}</span>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:10,color:"#fff",marginBottom:1}}>{f.name}</div>
                  <div style={{fontSize:9,color:"#3a5068",lineHeight:1.3}}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div style={{padding:"14px 18px"}}>
          {user?(
            <button onClick={handleUpgrade} disabled={loading}
              style={{width:"100%",padding:"13px",background:loading?"#1a2a3a":"#00ff87",color:"#000",border:"none",borderRadius:10,fontWeight:800,fontSize:14,cursor:loading?"not-allowed":"pointer",...M,marginBottom:10}}>
              {loading?"Redirecting...":isFounding?`Lock In $${Math.round(price)}/mo Early Access Rate →`:`Get Pro — $${Math.round(price)}/mo →`}
            </button>
          ):(
            <SignInButton mode="modal" forceRedirectUrl="/?upgrade=1">
              <button style={{width:"100%",padding:"13px",background:"#00ff87",color:"#000",border:"none",borderRadius:10,fontWeight:800,fontSize:14,cursor:"pointer",...M,marginBottom:10}}>
                Sign In to Upgrade →
              </button>
            </SignInButton>
          )}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:8,color:"#3a5068",...M}}>
            <span>✓ Cancel anytime</span>
            <span>✓ Instant access</span>
            <span>✓ 7-day refund</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pro Gate — wraps any pro-only feature ────────────────────────────────────
function ProGate({children, onUpgrade}:{children:React.ReactNode; onUpgrade:()=>void}){
  const {user,isLoaded} = useUser();
  if(!isLoaded) return null;
  const isPro = user?.publicMetadata?.plan && user.publicMetadata.plan !== 'free';
  if(isPro) return <>{children}</>;
  return(
    <div onClick={onUpgrade} style={{cursor:"pointer",position:"relative",filter:"blur(2px)",pointerEvents:"none",userSelect:"none" as const}}>
      {children}
      <div style={{position:"absolute",inset:0,background:"rgba(6,13,24,.7)",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,pointerEvents:"all"}}>
        <span style={{fontSize:10,color:"#00ff87",fontWeight:700,fontFamily:"monospace"}}>🔒 PRO</span>
      </div>
    </div>
  );
}

// ─── EV History hook ─────────────────────────────────────────────────────────
type HistPoint = {t:string;ev:number;buyback:number};
type HistData  = Record<string,HistPoint[]>;

function useEvHistory(){
  const [data,setData]=useState<HistData>({});
  useEffect(()=>{
    const load=async()=>{
      try{
        const r=await fetch("/api/ev-history?hours=24");
        if(r.ok){const j=await r.json();setData(j.data||{});}
      }catch{}
    };
    load();
    // Refresh every 2 minutes
    const t=setInterval(load,120_000);
    return()=>clearInterval(t);
  },[]);
  return data;
}

// Sparkline using real or fallback data
function Spark({packId,trend,color,w=64,h=20,histData}:{packId:string;trend:"up"|"down"|"flat";color:string;w?:number;h?:number;histData:HistData}){
  const hist=histData[packId];
  let points:number[];
  if(hist&&hist.length>=2){
    points=hist.slice(-20).map(p=>p.ev);
  } else {
    const pts_str=trend==="up"?[1,0.65,0.3,0.05]:trend==="down"?[0.05,0.3,0.65,1]:[0.52,0.38,0.57,0.44,0.5];
    points=pts_str.map(v=>v);
  }
  const mn=Math.min(...points),mx=Math.max(...points),rng=mx-mn||0.01;
  const path=points.map((v,i)=>{
    const x=(i/(points.length-1))*w;
    const y=h-(v-mn)/rng*h;
    return`${i===0?"M":"L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const lastY=h-(points[points.length-1]-mn)/rng*h;
  return(<svg width={w} height={h} style={{display:"block",flexShrink:0}}>
    <polyline points={points.map((v,i)=>`${(i/(points.length-1))*w},${h-(v-mn)/rng*h}`).join(" ")}
      fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    <circle cx={w} cy={lastY} r="2.5" fill={color}/>
  </svg>);
}

// Full EV chart using real historical data
function EVChart({pack,histData}:{pack:Pack;histData:HistData}){
  const color=evc(pack.evRatio);
  const hist=histData[pack.id];
  const W=290,H=88;

  if(!hist||hist.length<2){
    // Skeleton loader
    return(<svg width={W} height={H} style={{display:"block"}}>
      <rect width={W} height={H} fill="none"/>
      <text x={W/2} y={H/2} textAnchor="middle" fontSize="9" fill="#1e3a50" fontFamily="monospace">
        {hist?`1 data point — chart builds over time`:`Loading history...`}
      </text>
      <line x1="0" y1={H/2} x2={W} y2={H/2} stroke="#122038" strokeWidth="1" strokeDasharray="4,4"/>
    </svg>);
  }

  // Downsample to max 60 points for performance
  const step=Math.max(1,Math.floor(hist.length/60));
  const pts=hist.filter((_,i)=>i%step===0||i===hist.length-1).map(p=>p.ev);
  const mn=Math.min(...pts)*0.97,mx=Math.max(...pts)*1.03,rng=mx-mn||0.1;
  const tx=(i:number)=>i/(pts.length-1)*W;
  const ty=(v:number)=>H-(v-mn)/rng*H;
  const path=pts.map((v,i)=>`${i===0?"M":"L"}${tx(i).toFixed(1)},${ty(v).toFixed(1)}`).join(" ");
  const by=ty(1.0);

  // Time labels
  const firstT=new Date(hist[0].t);
  const lastT=new Date(hist[hist.length-1].t);
  const fmt=(d:Date)=>d.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});
  const spanH=Math.round((lastT.getTime()-firstT.getTime())/3_600_000);

  return(<svg width={W} height={H} style={{display:"block",overflow:"visible"}}>
    <defs>
      <linearGradient id={`cg-${pack.id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity=".2"/>
        <stop offset="100%" stopColor={color} stopOpacity=".01"/>
      </linearGradient>
    </defs>
    {by>4&&by<H-4&&<line x1="0" y1={by} x2={W} y2={by} stroke="rgba(255,255,255,.12)" strokeWidth="1" strokeDasharray="3,3"/>}
    <path d={path+` L${W},${H} L0,${H} Z`} fill={`url(#cg-${pack.id})`}/>
    <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    <circle cx={tx(pts.length-1)} cy={ty(pts[pts.length-1])} r="3" fill={color}/>
    <text x="3" y="10" fontSize="7" fill="rgba(255,255,255,.25)" fontFamily="monospace">{mx.toFixed(3)}x</text>
    <text x="3" y={H-2} fontSize="7" fill="rgba(255,255,255,.25)" fontFamily="monospace">{mn.toFixed(3)}x</text>
    {by>10&&by<H-10&&<text x={W-30} y={by-3} fontSize="7" fill="rgba(255,255,255,.3)" fontFamily="monospace">1.0x</text>}
    <text x="3" y={H-2} fontSize="7" fill="rgba(255,255,255,.15)" fontFamily="monospace" dy="-1">{fmt(firstT)}</text>
    <text x={W-3} y={H-2} fontSize="7" fill="rgba(255,255,255,.15)" fontFamily="monospace" textAnchor="end">{fmt(lastT)}</text>
    <text x={W/2} y={H-2} fontSize="7" fill="rgba(255,255,255,.2)" fontFamily="monospace" textAnchor="middle">{spanH}h</text>
  </svg>);
}

// ─── CSS ─────────────────────────────────────────────────────────────────────
const CSS=`
*{box-sizing:border-box;margin:0;padding:0}
body{background:#060d18!important;color:#c8dff0;font-family:'Space Grotesk',system-ui,sans-serif}
::-webkit-scrollbar{width:3px;height:3px}::-webkit-scrollbar-thumb{background:#122038;border-radius:2px}
.ld{display:inline-block;width:6px;height:6px;border-radius:50%;background:#00ff87;box-shadow:0 0 8px rgba(0,255,135,.8);animation:lp 2s infinite}
@keyframes lp{0%,100%{opacity:1}50%{opacity:.2}}
.ticker-wrap{background:#07101f;border-bottom:1px solid #122038;height:34px;display:flex;align-items:center;overflow:hidden;flex-shrink:0}
.ticker-lbl{padding:0 12px;font-size:8px;font-weight:700;color:#00ff87;letter-spacing:1.5px;font-family:monospace;border-right:1px solid #122038;height:100%;display:flex;align-items:center;gap:6px;flex-shrink:0;white-space:nowrap}
.ticker-track{display:flex;white-space:nowrap;animation:tick 60s linear infinite}
.ticker-item{display:inline-flex;align-items:center;gap:7px;padding:0 16px;font-size:10px;border-right:1px solid #0e1e30;height:34px;font-family:monospace;flex-shrink:0}
@keyframes tick{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
.nav{height:46px;display:flex;align-items:center;padding:0 14px;gap:9px;border-bottom:1px solid #122038;background:#07101f;flex-shrink:0}
.hstat{padding:3px 10px;border:1px solid #122038;border-radius:5px;text-align:center;flex-shrink:0}
.hstat-l{font-size:7px;color:#3a5068;letter-spacing:1px;font-family:monospace}
.hstat-v{font-weight:800;font-size:14px;line-height:1.2}
.sb-btn{all:unset;box-sizing:border-box;display:flex;align-items:center;gap:7px;padding:7px 12px;font-size:11px;border-left:2px solid transparent;cursor:pointer;color:#3a5068;width:100%;transition:all .1s;overflow:hidden}
.sb-btn:hover{color:#c8dff0;background:rgba(255,255,255,.02)}
.sb-btn.on{color:#c8dff0}
.cat-tab{padding:5px 12px;border-radius:20px;font-size:10px;font-weight:700;cursor:pointer;border:1px solid #122038;background:transparent;color:#3a5068;font-family:monospace;transition:all .15s;white-space:nowrap}
.cat-tab:hover{color:#c8dff0;border-color:#1e3a50}
.cat-tab.on{background:rgba(0,255,135,.1);border-color:rgba(0,255,135,.3);color:#00ff87}
.tb{background:transparent;border:1px solid #122038;border-radius:4px;padding:3px 9px;font-size:8px;color:#3a5068;cursor:pointer;font-family:monospace;transition:all .15s}
.tb:hover{color:#c8dff0;border-color:#1e3a50}
.tb.on{color:#00ff87;border-color:rgba(0,255,135,.3);background:rgba(0,255,135,.05)}
.sig-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:8px;font-weight:800;letter-spacing:.7px;border:1px solid;font-family:monospace;white-space:nowrap}
.pack-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(235px,1fr));gap:10px;padding:12px}
.pcard{background:#0b1728;border:1px solid #122038;border-radius:12px;cursor:pointer;transition:all .18s;position:relative;overflow:hidden}
.pcard:hover{border-color:#1e3a50;transform:translateY(-2px);box-shadow:0 10px 30px rgba(0,0,0,.5)}
.pcard.sel{border-color:rgba(0,255,135,.35);box-shadow:0 0 0 1px rgba(0,255,135,.15)}
.pcard-top{padding:12px 12px 10px}
.pcard-bot{border-top:1px solid #122038;padding:9px 12px;background:rgba(0,0,0,.15)}
.pcard-stripe{position:absolute;top:0;left:0;right:0;height:2px}
.bell{all:unset;cursor:pointer;width:28px;height:28px;border:1px solid #122038;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;transition:all .15s}
.bell:hover{border-color:#1e3a50;background:rgba(255,255,255,.03)}
.bell.on{border-color:rgba(255,209,102,.4);background:rgba(255,209,102,.08);animation:ap 2s infinite}
@keyframes ap{0%,100%{box-shadow:0 0 0 0 rgba(255,209,102,.35)}70%{box-shadow:0 0 0 6px rgba(255,209,102,0)}}
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
.feed-card{border:1px solid #122038;border-radius:10px;padding:10px 12px;display:flex;gap:10px;align-items:flex-start;background:#07101f;transition:background .1s}
.feed-card:hover{background:#0b1728}
.b-btn{padding:5px 14px;border:1px solid #122038;border-radius:20px;font-size:11px;cursor:pointer;background:transparent;color:#3a5068;font-family:monospace;transition:all .15s;font-weight:700}
.b-btn:hover{border-color:#1e3a50;color:#c8dff0}
.b-btn.on{border-color:rgba(0,255,135,.3);color:#00ff87;background:rgba(0,255,135,.06)}

/* TOGGLE SWITCH */
.toggle-wrap{display:flex;align-items:center;gap:10px;cursor:pointer}
.toggle{width:42px;height:24px;border-radius:12px;border:1px solid #122038;background:#060d18;position:relative;transition:all .2s;flex-shrink:0}
.toggle.on{background:rgba(0,255,135,.15);border-color:rgba(0,255,135,.4)}
.toggle::after{content:'';position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#3a5068;transition:all .2s}
.toggle.on::after{left:21px;background:#00ff87}
.toggle.yellow.on{background:rgba(255,209,102,.15);border-color:rgba(255,209,102,.4)}
.toggle.yellow.on::after{background:#ffd166}
.toggle.red.on{background:rgba(255,56,96,.15);border-color:rgba(255,56,96,.4)}
.toggle.red.on::after{background:#ff3860}

/* ALERT TYPE CARDS */
.atype-card{border:1px solid #122038;border-radius:10px;padding:14px 16px;cursor:pointer;transition:all .15s;background:#0b1728}
.atype-card:hover{border-color:#1e3a50}
.atype-card.on-green{border-color:rgba(0,255,135,.3);background:rgba(0,255,135,.04)}
.atype-card.on-blue{border-color:rgba(79,143,255,.3);background:rgba(79,143,255,.04)}
.atype-card.on-red{border-color:rgba(255,56,96,.3);background:rgba(255,56,96,.04)}
.atype-card.on-yellow{border-color:rgba(255,209,102,.3);background:rgba(255,209,102,.04)}

/* NOTIF PERMISSION BOX */
.perm-box{border-radius:12px;padding:20px;text-align:center}
.perm-btn{width:100%;padding:14px;border:none;border-radius:10px;font-weight:800;font-size:14px;cursor:pointer;font-family:monospace;transition:all .15s}
.perm-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
.perm-btn:active{transform:translateY(0)}

/* PACK WATCH LIST */
.watch-pack{border:1px solid #122038;border-radius:10px;padding:12px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all .15s}
.watch-pack:hover{border-color:#1e3a50;background:#0d1e35}
.watch-pack.on{border-color:rgba(255,209,102,.3);background:rgba(255,209,102,.04)}

/* TOAST */
.toast-wrap{position:fixed;bottom:20px;right:20px;z-index:999;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.toast{background:#0b1728;border:1px solid rgba(0,255,135,.25);border-radius:10px;padding:12px 16px;pointer-events:all;max-width:300px;animation:toastin .25s ease}
@keyframes toastin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

@keyframes fi{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
.fi{animation:fi .18s ease both}
@keyframes si{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}
.si{animation:si .2s ease both}
`;

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({msg,type,onClose}:{msg:string;type:"ok"|"warn"|"err";onClose:()=>void}){
  useEffect(()=>{const t=setTimeout(onClose,2500);return()=>clearTimeout(t);},[onClose]);
  const colors={ok:"#00ff87",warn:"#ffd166",err:"#ff3860"};
  const icons={ok:"✅",warn:"⚠️",err:"❌"};
  return(
    <div className="toast" style={{borderColor:`${colors[type]}44`}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:16}}>{icons[type]}</span>
        <div style={{flex:1,fontSize:11,color:"#c8dff0",lineHeight:1.5}}>{msg}</div>
        <button onClick={onClose} style={{all:"unset" as any,cursor:"pointer",color:"#3a5068",fontSize:14,paddingLeft:8}}>✕</button>
      </div>
    </div>
  );
}

// ─── ALERTS PAGE ─────────────────────────────────────────────────────────────
// ─── Alert Panel ─────────────────────────────────────────────────────────────
// Simple: enable once → get all alerts. Bell = toggle specific pack.
function AlertPanel({
  open, onClose, packs, alerts, onToggle, swStatus, onEnableNotifs, isSubscribed
}:{
  open:boolean; onClose:()=>void; packs:Pack[]; alerts:Set<string>;
  onToggle:(id:string)=>void; swStatus:string;
  onEnableNotifs:()=>Promise<boolean>; isSubscribed:boolean;
}){
  const M={fontFamily:"monospace"} as React.CSSProperties;

  return(
    <>
      <div style={{position:"fixed",top:80,right:0,bottom:0,width:360,background:"#07101f",borderLeft:"1px solid #122038",zIndex:100,display:"flex",flexDirection:"column",transform:open?"translateX(0)":"translateX(100%)",transition:"transform .25s cubic-bezier(.4,0,.2,1)",boxShadow:open?"-4px 0 20px rgba(0,0,0,.4)":"none"}}>
        {/* Header */}
        <div style={{padding:"13px 16px",borderBottom:"1px solid #122038",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:15,color:"#fff"}}>🔔 EV Alerts</div>
            <div style={{fontSize:9,color:"#3a5068",marginTop:2,...M}}>
              {isSubscribed?"Active — watching Courtyard every 60s":"Get notified when packs go +EV"}
            </div>
          </div>
          <button onClick={onClose} style={{all:"unset" as any,cursor:"pointer",color:"#3a5068",width:22,height:22,border:"1px solid #122038",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>✕</button>
        </div>

        {/* Status / Enable */}
        <div style={{padding:"10px 14px",borderBottom:"1px solid #122038",flexShrink:0}}>
          {swStatus==="granted"&&isSubscribed?(
            <div style={{background:"rgba(0,255,135,.04)",border:"1px solid rgba(0,255,135,.18)",borderRadius:8,padding:"9px 12px",display:"flex",alignItems:"center",gap:9}}>
              <span className="ld" style={{width:6,height:6}}/>
              <div>
                <div style={{fontWeight:700,fontSize:11,color:"#00ff87"}}>Notifications Active</div>
                <div style={{fontSize:9,color:"#3a5068",marginTop:1}}>Server checks Courtyard every 60s · alerts fire even when browser is closed</div>
              </div>
            </div>
          ):swStatus==="denied"?(
            <div style={{background:"rgba(255,56,96,.05)",border:"1px solid rgba(255,56,96,.2)",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontWeight:700,fontSize:11,color:"#ff3860",marginBottom:6}}>⛔ Notifications Blocked by Chrome</div>
              <div style={{fontSize:9,color:"#3a5068",lineHeight:1.7,marginBottom:8}}>
                Chrome remembered a previous "Block" — you need to unblock it once manually. Do this:
              </div>
              {[
                {n:"1", t:'Click the 🔒 lock icon in the address bar (left of the URL)'},
                {n:"2", t:'Click "Site settings"'},
                {n:"3", t:'Find "Notifications" → change to "Allow"'},
                {n:"4", t:'Refresh this page — button will appear'},
              ].map(s=>(
                <div key={s.n} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:5}}>
                  <span style={{width:16,height:16,borderRadius:"50%",background:"rgba(255,56,96,.15)",border:"1px solid rgba(255,56,96,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,color:"#ff3860",flexShrink:0,...M}}>{s.n}</span>
                  <span style={{fontSize:9,color:"#c8dff0",lineHeight:1.5}}>{s.t}</span>
                </div>
              ))}
              <div style={{display:"flex",gap:6,marginTop:8}}>
                <a href="chrome://settings/content/notifications" target="_blank" rel="noreferrer"
                  style={{flex:1,padding:"7px",background:"rgba(255,56,96,.1)",border:"1px solid rgba(255,56,96,.25)",borderRadius:6,fontSize:9,color:"#ff3860",fontWeight:700,textDecoration:"none",textAlign:"center" as const,...M}}>
                  Open Chrome Notification Settings ↗
                </a>
                <button onClick={()=>window.location.reload()}
                  style={{padding:"7px 12px",background:"#0b1728",border:"1px solid #122038",borderRadius:6,fontSize:9,color:"#3a5068",cursor:"pointer",fontWeight:700,...M}}>
                  Refresh ↺
                </button>
              </div>
            </div>
          ):(
            <div style={{background:"rgba(0,255,135,.04)",border:"1px solid rgba(0,255,135,.2)",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontWeight:700,fontSize:12,color:"#00ff87",marginBottom:5}}>⚡ Enable Push Notifications</div>
              <div style={{fontSize:9,color:"#3a5068",lineHeight:1.5,marginBottom:8}}>
                One click → browser asks to <strong style={{color:"#fff"}}>Allow</strong> → you're done. Get all alerts below automatically. Works even when this tab is closed.
              </div>
              <button onClick={onEnableNotifs}
                style={{width:"100%",padding:"10px",background:"#00ff87",color:"#000",border:"none",borderRadius:7,fontWeight:800,fontSize:12,cursor:"pointer",...M}}>
                Enable Notifications →
              </button>
            </div>
          )}
        </div>

        {/* Pack-specific alerts */}
        <div style={{flex:1,overflowY:"auto",padding:"10px 14px",display:"flex",flexDirection:"column",gap:5}}>
          {/* Auto alerts summary — compact */}
          <div style={{background:"#0b1728",border:"1px solid #122038",borderRadius:7,padding:"8px 10px",marginBottom:8}}>
            <div style={{fontSize:7,color:"#3a5068",letterSpacing:1.5,...M,marginBottom:5}}>YOU'LL GET AUTOMATICALLY</div>
            <div style={{display:"flex",flexDirection:"column" as const,gap:3}}>
              {[
                {e:"🔥",t:"Strong Buy",c:"#00ff87",s:"buyback ≥ 1.2x · profit after all fees"},
                {e:"📊",t:"Market Alert",c:"#4f8fff",s:"any pack +EV · summary"},
              ].map(a=>(
                <div key={a.t} style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:11}}>{a.e}</span>
                  <span style={{fontSize:10,fontWeight:700,color:a.c}}>{a.t}</span>
                  <span style={{fontSize:9,color:"#3a5068"}}>{a.s}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{fontSize:7,color:"#3a5068",letterSpacing:1.5,...M,marginBottom:4}}>
            SPECIFIC PACK ALERTS {alerts.size > 0 ? `(${alerts.size} selected)` : "(optional)"}
          </div>
          {packs.map(p=>{
            const isOn=alerts.has(p.id);
            const ec=p.evRatio>=1.3?"#00ff87":p.evRatio>=1?"#4fd8a0":p.evRatio>=0.9?"#ffd166":"#ff3860";
            const sg=p.evRatio>=1.3?"GREAT VALUE":p.evRatio>=1?"GOOD VALUE":p.evRatio>=0.9?"FAIR VALUE":"BELOW EV";
            const sgc=p.evRatio>=1.3?"#00ff87":p.evRatio>=1?"#4f8fff":p.evRatio>=0.9?"#ffd166":"#ff3860";
            return(
              <div key={p.id} onClick={()=>onToggle(p.id)}
                style={{border:`1px solid ${isOn?"rgba(0,255,135,.3)":"#122038"}`,borderRadius:8,padding:"9px 10px",cursor:"pointer",background:isOn?"rgba(0,255,135,.04)":"#0b1728",display:"flex",alignItems:"center",gap:9,transition:"all .15s"}}>
                <img src={`https://api.courtyard.io/configs/vending-machine/${p.id}/resources/sealed_pack.png`} alt=""
                  style={{width:26,height:36,objectFit:"contain",flexShrink:0}}
                  onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:11,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{p.name}</div>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginTop:2}}>
                    <span style={{fontWeight:700,fontSize:10,color:ec,...M}}>{(+p.evRatio).toFixed(3)}x</span>
                    <span style={{fontSize:7,fontWeight:700,color:sgc,background:`${sgc}18`,padding:"1px 5px",borderRadius:3,border:`1px solid ${sgc}33`,...M}}>{sg}</span>
                  </div>
                </div>
                {/* Toggle */}
                <div style={{width:36,height:20,borderRadius:10,border:`1px solid ${isOn?"rgba(0,255,135,.4)":"#122038"}`,background:isOn?"rgba(0,255,135,.12)":"#060d18",position:"relative",flexShrink:0,transition:"all .2s"}}>
                  <div style={{position:"absolute",top:3,left:isOn?18:3,width:12,height:12,borderRadius:"50%",background:isOn?"#00ff87":"#3a5068",transition:"all .2s"}}/>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{padding:"8px 14px",borderTop:"1px solid #122038",flexShrink:0,textAlign:"center" as const}}>
          <span style={{fontSize:8,color:"#2a4060",...M}}>Free forever · No account needed · 1-click to disable</span>
        </div>
      </div>
    </>
  );
}


// ─── Detail Panel Component ───────────────────────────────────────────────────
function DetailPanel({sel,isPro,alerts,histData,onClose,onUpgrade,onToggleAlert}:{
  sel:Pack|null; isPro:boolean; alerts:Set<string>;
  histData:any; onClose:()=>void; onUpgrade:()=>void;
  onToggleAlert:(id:string)=>void;
}){
  const M={fontFamily:"monospace"} as React.CSSProperties;
  if(!sel) return null;

  // Free users — upgrade prompt
  if(!isPro) return(
    <div className="si" style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={{padding:"11px 12px",borderBottom:"1px solid #122038",display:"flex",alignItems:"center",gap:9,flexShrink:0,background:"#060d18"}}>
        <img src={packImg(sel.id)} alt="" style={{width:28,height:40,objectFit:"contain"}} onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:800,fontSize:14,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{sel.name}</div>
          <div style={{fontSize:9,color:"#3a5068",marginTop:1,...M}}>EV: {$x(sel.evRatio)} · ${sel.price}/pack</div>
        </div>
        <button className="dp-x" onClick={onClose}>✕</button>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,padding:24,textAlign:"center" as const}}>
        <div style={{fontWeight:800,fontSize:18,color:"#fff"}}>Full Analysis is Pro</div>
        <div style={{fontSize:12,color:"#3a5068",maxWidth:260,lineHeight:1.6}}>
          Unlock Buyback EV, Decision Engine, EV history chart, fee breakdown, and push alerts for this pack.
        </div>
        {([
          {e:"🎯",t:"Buyback EV",d:"Real cash after ALL fees"},
          {e:"⚡",t:"BUY/WAIT/SKIP signal",d:"Data-backed decision"},
          {e:"📈",t:"EV history chart",d:"See when EV shifted"},
          {e:"💡",t:"Fee breakdown",d:"Every hidden cost exposed"},
        ] as {e:string;t:string;d:string}[]).map(f=>(
          <div key={f.t} style={{display:"flex",gap:10,alignItems:"center",width:"100%",maxWidth:260,textAlign:"left" as const}}>
            <span style={{fontSize:16}}>{f.e}</span>
            <div>
              <div style={{fontWeight:700,fontSize:11,color:"#fff"}}>{f.t}</div>
              <div style={{fontSize:9,color:"#3a5068"}}>{f.d}</div>
            </div>
            <span style={{marginLeft:"auto",color:"#00ff87",fontSize:12}}>✓</span>
          </div>
        ))}
        <button onClick={onUpgrade}
          style={{width:"100%",maxWidth:260,padding:"12px",background:"#00ff87",border:"none",borderRadius:10,fontWeight:800,fontSize:13,color:"#000",cursor:"pointer",fontFamily:"monospace"}}>
          ⚡ Unlock — $29/mo Early Access →
        </button>
        <div style={{fontSize:9,color:"#3a5068",fontFamily:"monospace"}}>$29/mo early access · First 100 users · Cancel anytime</div>
      </div>
    </div>
  );

  // Pro users — full analysis
  const p=sel, d=dec(p), sg=sig(p.evRatio);
  const evColor2=evc(p.evRatio), bbC=p.buybackEv>=1?"#00ff87":"#ff3860";
  const trueCost=p.price*1.074, cashOut=safeN(p.calEv??p.avgFmv)*0.846;
  const hasAlert=alerts.has(p.id);
  return(
    <div className="si" style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={{padding:"11px 12px",borderBottom:"1px solid #122038",display:"flex",alignItems:"center",gap:9,flexShrink:0,background:"#060d18"}}>
        <img src={packImg(p.id)} alt="" style={{width:28,height:40,objectFit:"contain"}} onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:800,fontSize:14,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{p.name}</div>
          <div style={{fontSize:9,color:"#3a5068",marginTop:1,...M}}>{p.categoryTitle??p.category} · ${p.price}/pack · {p.pullCount??p.totalPulls??0} pulls</div>
        </div>
        <button className={`bell${hasAlert?" on":""}`} onClick={()=>onToggleAlert(p.id)} title="Toggle alert">{hasAlert?"🔔":"🔕"}</button>
        <button className="dp-x" onClick={onClose}>✕</button>
      </div>
      <div className="dp-scroll">
        <div style={{background:d.bg,border:`1px solid ${d.c}44`,borderRadius:8,padding:"12px 13px"}}>
          <div style={{fontSize:7,color:d.c,letterSpacing:1.5,...M,fontWeight:700,marginBottom:5}}>SHOULD YOU PULL?</div>
          <div style={{fontWeight:800,fontSize:18,color:d.c,...M,marginBottom:5}}>{d.action}</div>
          <div style={{fontSize:11,color:d.c,opacity:.85,lineHeight:1.5}}>{d.reason}</div>
        </div>
        <div className="dp-sec">
          <span className="dp-lbl">EV RATIO TREND · 1m</span>
          <EVChart pack={p} histData={histData}/>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#3a5068",...M}}>
            <span>Earlier ←</span><span style={{color:evColor2,fontWeight:700}}>Now: {$x(p.evRatio)}</span>
          </div>
        </div>
        <div className="dp-sec">
          <span className="dp-lbl">EXPECTED VALUE</span>
          <div className="dp-2">
            <div className="dp-tile" style={{borderColor:p.evRatio>=1?"rgba(0,255,135,.2)":"rgba(255,56,96,.15)"}}>
              <span className="dp-tl">FMV EV</span>
              <div className="dp-tv" style={{color:evColor2}}>{$x(p.evRatio)}</div>
              <div style={{fontSize:8,color:"#3a5068",marginTop:3,...M}}>{$f(p.calEv??p.calibratedEv??0)} avg</div>
            </div>
            <div className="dp-tile" style={{borderColor:p.buybackEv>=1?"rgba(255,209,102,.2)":"rgba(255,56,96,.15)"}}>
              <span className="dp-tl">BUYBACK EV ★</span>
              <div className="dp-tv" style={{color:bbC}}>{$x(p.buybackEv)}</div>
              <div style={{fontSize:8,color:"#3a5068",marginTop:3,...M}}>{$f(cashOut)} cash</div>
            </div>
          </div>
          <div className="dp-2">
            <div className="dp-tile"><span className="dp-tl">WIN RATE</span><div className="dp-tv" style={{color:p.winRate>=.5?"#00ff87":"#3a5068"}}>{$p(p.winRate)}</div></div>
            <div className="dp-tile"><span className="dp-tl">AVG PULL VALUE</span><div className="dp-tv" style={{color:"#00ff87"}}>{$f(safeN(p.calEv??p.avgFmv))}</div></div>
          </div>
          <span className="sig-badge" style={{color:sg.c,background:sg.bg,borderColor:sg.bd,alignSelf:"flex-start" as const}}>{sg.label}</span>
        </div>
        <div className="dp-sec">
          <span className="dp-lbl">💡 FEE BREAKDOWN — EXCLUSIVE</span>
          <table className="fee-t"><tbody>
            <tr><td>Advertised price</td><td style={{textAlign:"right" as const}}>{$f(p.price)}</td></tr>
            <tr><td style={{color:"#ff3860"}}>Payment markup (+7.4%)</td><td style={{textAlign:"right" as const,color:"#ff3860"}}>{$f(trueCost)}</td></tr>
            <tr><td>Average FMV won</td><td style={{textAlign:"right" as const,color:evColor2}}>{$f(safeN(p.calEv??p.avgFmv))}</td></tr>
            <tr><td>Buyback offer (×0.90)</td><td style={{textAlign:"right" as const}}>{$f(safeN(p.calEv??p.avgFmv)*0.9)}</td></tr>
            <tr><td style={{color:"#ff3860"}}>Processing fee (−6%)</td><td style={{textAlign:"right" as const,color:"#ff3860"}}>−{$f(safeN(p.calEv??p.avgFmv)*0.9*0.06)}</td></tr>
            <tr className="tot"><td>💵 Cash in your hand</td><td style={{textAlign:"right" as const,color:bbC,fontSize:15}}>{$f(cashOut)}</td></tr>
          </tbody></table>
        </div>
        <a href={`https://courtyard.io/vending-machine/${p.id}`} target="_blank" rel="noreferrer"
          style={{display:"block",textAlign:"center" as const,padding:"12px",borderRadius:9,fontWeight:800,fontSize:14,textDecoration:"none",background:p.evRatio>=1?"#00ff87":"#0b1728",color:p.evRatio>=1?"#000":"#3a5068",border:p.evRatio>=1?"none":"1px solid #122038"}}>
          {p.evRatio>=1?"🟢 Pull This Pack on Courtyard →":"View on Courtyard →"}
        </a>
        <div style={{fontSize:8,color:"#3a5068",textAlign:"center" as const,...M,lineHeight:1.6}}>For informational purposes only. Not financial advice.</div>
      </div>
    </div>
  );
}

// ─── BestPackCard — used in hero section ─────────────────────────────────────
function BestPackCard({pack}:{pack:Pack}){
  const M={fontFamily:"monospace"} as React.CSSProperties;
  const sg=sig(pack.evRatio);
  return(
    <div style={{background:"#0b1728",border:"1px solid #122038",borderRadius:8,padding:"9px 12px",display:"flex",alignItems:"center",gap:11}}>
      <img src={packImg(pack.id)} alt="" style={{width:36,height:50,objectFit:"contain",flexShrink:0}} onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:7,color:"#00ff87",letterSpacing:1.5,...M,fontWeight:700,marginBottom:3}}>BEST VALUE RIGHT NOW</div>
        <div style={{fontWeight:800,fontSize:13,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,marginBottom:5}}>{pack.name}</div>
        <div style={{display:"flex",gap:14}}>
          {([["EV",$x(pack.evRatio),"#00ff87"],["CAL. EV",$f(pack.calEv??0),"#00ff87"],["BUYBACK",$x(pack.buybackEv),pack.buybackEv>=1?"#00ff87":"#ff3860"]] as [string,string,string][]).map(([l,v,c])=>(
            <div key={l}><div style={{fontSize:7,color:"#3a5068",...M}}>{l}</div><div style={{fontWeight:800,fontSize:13,color:c,...M}}>{v}</div></div>
          ))}
        </div>
      </div>
      <span className="sig-badge" style={{color:sg.c,background:sg.bg,borderColor:sg.bd,alignSelf:"flex-start" as const}}>{sg.label}</span>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard(){
  const {data,isLoading,refetch}=useCourtyardData();
  const {user, isLoaded:authLoaded} = useUser();
  const {openSignIn} = useClerk();
  const isPro = !!(user?.publicMetadata?.plan && user.publicMetadata.plan !== 'free');
  const [showUpgrade,setShowUpgrade] = useState(false);
  const [tab,setTab]          =useState("all");
  const histData               =useEvHistory();
  const [view,setView]         =useState<"packs"|"feed"|"budget">("packs");
  const [alertsOpen,setAlertsOpen]=useState(false);
  const [sort,setSort]         =useState<"ev"|"bb"|"decision"|"wr"|"price">("ev");
  const [flt,setFlt]           =useState<"all"|"pos"|"neg">("all");
  const [sel,setSel]           =useState<Pack|null>(null);
  const [budget,setBudget]     =useState<number|null>(null);
  const [cd,sCd]               =useState(60);
  const [toasts,setToasts]     =useState<{id:number;msg:string;type:"ok"|"warn"|"err"}[]>([]);
  const toastId                =useRef(0);
  const M={fontFamily:"monospace"} as React.CSSProperties;

  // Alert state
  const [alerts,setAlerts]          =useState<Set<string>>(new Set());
  const [swStatus,setSwStatus]      =useState<"unknown"|"granted"|"denied"|"unsupported">("unknown");
  const [pushSub,setPushSub]        =useState<PushSubscription|null>(null);
  const [isSubscribed,setIsSubscribed]=useState(false);
  const swRegistered                 =useRef(false);

  const addToast=(msg:string,type:"ok"|"warn"|"err"="ok")=>{
    const id=++toastId.current;
    const key=msg.slice(0,30); // dedup key
    setToasts(t=>{
      // Replace existing toast with same message, or keep max 2
      const without=t.filter(x=>x.msg.slice(0,30)!==key);
      return [...without.slice(-1),{id,msg,type}];
    });
  };
  const removeToast=(id:number)=>setToasts(t=>t.filter(x=>x.id!==id));

  // Register service worker + auto-sync subscription to Supabase on every load
  // This fixes the "notifications off after reopening" issue —
  // the browser keeps the subscription but Supabase may have lost it (DB wipe, etc.)
  useEffect(()=>{
    if(swRegistered.current) return;
    swRegistered.current=true;
    if(!("serviceWorker" in navigator)||!("PushManager" in window)){setSwStatus("unsupported");return;}
    navigator.serviceWorker.register("/sw.js").then(async reg=>{
      const p=Notification.permission;
      setSwStatus(p==="granted"?"granted":p==="denied"?"denied":"unknown");
      if(p!=="granted") return;

      const existingSub=await reg.pushManager.getSubscription();
      if(existingSub){
        const subKey=existingSub.options?.applicationServerKey;
        const currentKey=urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        let keyMatch=false;
        if(subKey){
          const subKeyBytes=new Uint8Array(subKey as ArrayBuffer);
          keyMatch=subKeyBytes.length===currentKey.length&&subKeyBytes.every((b,i)=>b===currentKey[i]);
        }

        if(!keyMatch){
          // VAPID key changed — unsubscribe and re-subscribe
          await existingSub.unsubscribe();
          try{
            const newSub=await reg.pushManager.subscribe({
              userVisibleOnly:true,
              applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });
            setPushSub(newSub);
            setIsSubscribed(true);
            const p256dh=btoa(String.fromCharCode(...new Uint8Array(newSub.getKey("p256dh")!)));
            const auth=btoa(String.fromCharCode(...new Uint8Array(newSub.getKey("auth")!)));
            fetch("/api/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},
              body:JSON.stringify({subscription:{endpoint:newSub.endpoint,keys:{p256dh,auth}},packIds:[],alertOnEv:true,alertOnBuyback:true,evThreshold:1.0,alertType:"all"})
            }).catch(()=>{});
          }catch(e){console.error("Re-subscribe failed:",e);}
          return;
        }

        // Key matches — update state
        setPushSub(existingSub);
        setIsSubscribed(true);

        // ALWAYS re-save to Supabase silently on every page load
        // Fixes: subscription lost from DB (wipe/clear), new device, etc.
        // We don't override packIds here — the API upserts so existing pack selections are preserved
        const p256dh=btoa(String.fromCharCode(...new Uint8Array(existingSub.getKey("p256dh")!)));
        const auth=btoa(String.fromCharCode(...new Uint8Array(existingSub.getKey("auth")!)));
        fetch("/api/subscribe-refresh",{method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({endpoint:existingSub.endpoint,p256dh,auth})
        }).catch(()=>{});
      }
    }).catch(()=>{});
  },[]);

  // Guard against multiple simultaneous calls
  const enablingRef = useRef(false);

  const enableNotifications=useCallback(async():Promise<boolean>=>{
    // Prevent multiple simultaneous calls (causes the toast spam)
    if(enablingRef.current) return false;
    if(!("serviceWorker" in navigator)||!("Notification" in window)){
      addToast("Your browser doesn't support push notifications","err");
      return false;
    }
    enablingRef.current=true;
    try{
      // ⚠️ requestPermission MUST be first — no setState before this
      const perm=await Notification.requestPermission();
      if(perm==="denied"){
        setSwStatus("denied");
        return false;
      }
      if(perm!=="granted"){
        return false;
      }
      setSwStatus("granted");
      const reg=await navigator.serviceWorker.ready;
      let sub=await reg.pushManager.getSubscription();
      if(!sub){
        sub=await reg.pushManager.subscribe({
          userVisibleOnly:true,
          applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }
      setPushSub(sub);
      setIsSubscribed(true);
      addToast("✅ Notifications enabled!","ok");
      return true;
    }catch(e:any){
      // Only show one toast, not multiple
      addToast("Setup failed — try refreshing the page","err");
      return false;
    }finally{
      enablingRef.current=false;
    }
  },[]);

  // Save subscription to Supabase
  const saveSubscription=useCallback(async(sub:PushSubscription,packIds:string[],type:string)=>{
    try{
      const p256dh=btoa(String.fromCharCode(...new Uint8Array(sub.getKey("p256dh")!)));
      const auth=btoa(String.fromCharCode(...new Uint8Array(sub.getKey("auth")!)));
      await fetch("/api/subscribe",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          subscription:{endpoint:sub.endpoint,keys:{p256dh,auth}},
          packIds,alertOnEv:true,alertOnBuyback:true,evThreshold:1.0,alertType:'all',
        }),
      });
    }catch{}
  },[]);

  // Bell on card — toggle this specific pack alert
  const toggleDebounce=useRef<Record<string,number>>({});
  const toggleAlert=useCallback(async(packId:string)=>{
    // Debounce: ignore clicks within 800ms of last click on same pack
    const now=Date.now();
    if(toggleDebounce.current[packId]&&now-toggleDebounce.current[packId]<800) return;
    toggleDebounce.current[packId]=now;
    if(swStatus!=="granted"||!pushSub){
      // Not set up — open panel so user can enable
      setAlertsOpen(true);
      addToast("Enable notifications first — click the button in the panel","warn");
      return;
    }
    const next=new Set(alerts);
    next.has(packId)?next.delete(packId):next.add(packId);
    setAlerts(next);
    const packName=data?.packs.find(p=>p.id===packId)?.name??"pack";
    // Bell toggle is silent — no toast popup covering cards
    await saveSubscription(pushSub,Array.from(next),'all');
  },[alerts,swStatus,pushSub,data,saveSubscription]);

  // Handle checkout success redirect
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    if(params.get('checkout')==='success'){
      addToast("🎉 Welcome to PackPulse Pro! All features unlocked.","ok");
      window.history.replaceState({},'','/');
    }
  },[]);

  // Handle checkout success/cancel redirect
  useEffect(()=>{
    const p=new URLSearchParams(window.location.search);
    if(p.get('checkout')==='success'){
      addToast("🎉 Welcome to PackPulse Pro! All features unlocked.","ok");
      window.history.replaceState({},'','/');
    } else if(p.get('upgrade')==='1'){
      setShowUpgrade(true);
      window.history.replaceState({},'','/');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  // Countdown
  useEffect(()=>{
    const t=setInterval(()=>sCd(c=>{if(c<=1){refetch();return 30;}return c-1;}),1000);
    return()=>clearInterval(t);
  },[refetch]);

  const cats=data?["all",...Array.from(new Set(data.packs.map(p=>p.category)))] :["all"];
  const catLabel=(c:string)=>{
    if(c==="all") return "All";
    // Use categoryTitle from pack if available
    const pack=data?.packs.find(p=>p.category===c);
    if(pack?.categoryTitle) return pack.categoryTitle;
    // Fallback mapping
    const m:Record<string,string>={pkmn:"Pokémon",magic_the_gathering:"Magic",limited_drop:"Limited",sports:"Sports",comics:"Comics",onepiece:"One Piece",wildcard:"Wildcard",watches:"Watches"};
    return m[c]??c.charAt(0).toUpperCase()+c.slice(1);
  };
  const decScore=(p:Pack)=>{const d=dec(p);return d.action.includes("STRONG")?6:d.action.includes("✅")?5:d.action.includes("⚡")?4:d.action.includes("MAYBE")?3:d.action.includes("WAIT")?2:1;};
  const rows:Pack[]=data?[...data.packs].filter(p=>tab==="all"||p.category===tab).filter(p=>flt==="pos"?p.evRatio>=1:flt==="neg"?p.evRatio<1:true).sort((a,b)=>sort==="ev"?b.evRatio-a.evRatio:sort==="bb"?b.buybackEv-a.buybackEv:sort==="decision"?decScore(b)-decScore(a):sort==="wr"?b.winRate-a.winRate:a.price-b.price):[];
  const best=data?.packs[0];
  const budgetPacks=(b:number)=>data?.packs.filter(p=>p.price<=b).sort((a,c)=>decScore(c)-decScore(a)).slice(0,3)??[];
  const alertCount=alerts.size;

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#060d18",color:"#c8dff0"}}>
      <style>{CSS}</style>

      {/* UPGRADE MODAL */}
      {showUpgrade&&<UpgradeModal onClose={()=>setShowUpgrade(false)}/>}

      {/* TOASTS */}
      <div className="toast-wrap">
        {toasts.map(t=><Toast key={t.id} msg={t.msg} type={t.type} onClose={()=>removeToast(t.id)}/>)}
      </div>

      {/* ALERTS PANEL */}
      <AlertPanel
        open={alertsOpen} onClose={()=>setAlertsOpen(false)}
        packs={data?.packs??[]} alerts={alerts} onToggle={toggleAlert}
        swStatus={swStatus} onEnableNotifs={enableNotifications}
        isSubscribed={isSubscribed}
      />

      {/* TICKER */}
      {data&&data.recentPulls.length>0&&(
        <div className="ticker-wrap">
          <div className="ticker-lbl"><span className="ld"/>LIVE PULLS</div>
          <div style={{flex:1,overflow:"hidden"}}>
            <div className="ticker-track">
              {[...data.recentPulls,...data.recentPulls].map((p,i)=>{
                const name=p.buyer??p.user??"anon";
                const title=p.title??p.cardName??"";
                const fmv=p.fmv??0;
                const packPrice=p.packPrice??50;
                const win=fmv>packPrice;
                return(<div key={`${p.id}-${i}`} className="ticker-item">
                  <span style={{color:"#3a5068",fontSize:9}}>@{name}</span>
                  <span style={{color:"#c8dff0",fontWeight:600}}>{title.slice(0,20)}</span>
                  <span style={{color:win?"#00ff87":"#ff3860",fontWeight:800}}>{$f(fmv)}</span>
                  <span style={{color:win?"rgba(0,255,135,.5)":"rgba(255,56,96,.5)",fontSize:9}}>({win?"+":""}{$f(fmv-packPrice)})</span>
                </div>);
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
          <span style={{fontSize:8,color:"#00ff87",fontWeight:700,letterSpacing:1,...M}}>{data?.isLive?"LIVE":"SAMPLE"} · ↻{cd}s</span>
        </div>
        {data&&[
          {l:"+EV PACKS",v:`${data.posEV}/${data.packs.length}`,c:"#00ff87"},
          {l:"AVG EV",v:$x(data.avgEV),c:data.avgEV>=1?"#00ff87":"#ff3860"},
          {l:"PULLS",v:`${data.totalPulls}`,c:"#fff"},
        ].map(s=>(
          <div key={s.l} className="hstat">
            <div className="hstat-l">{s.l}</div>
            <div className="hstat-v" style={{color:s.c}}>{s.v}</div>
          </div>
        ))}
        <button onClick={()=>refetch()} disabled={isLoading} style={{marginLeft:"auto",padding:"4px 11px",background:"transparent",border:"1px solid #122038",borderRadius:5,fontSize:8,color:"#3a5068",cursor:"pointer",...M}}>↻ Refresh</button>
        {/* Auth */}
        {authLoaded&&(user?(
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            {!isPro&&<button onClick={()=>setShowUpgrade(true)} style={{padding:"4px 10px",background:"rgba(0,255,135,.1)",border:"1px solid rgba(0,255,135,.3)",borderRadius:5,fontSize:9,color:"#00ff87",cursor:"pointer",fontWeight:700,...M}}>⚡ Upgrade</button>}
            <UserButton afterSignOutUrl="/" appearance={{elements:{userButtonAvatarBox:"w-7 h-7"}}}/>
          </div>
        ):(
          <SignInButton mode="modal">
            <button style={{padding:"4px 12px",background:"#00ff87",border:"none",borderRadius:5,fontSize:9,color:"#000",cursor:"pointer",fontWeight:800,...M}}>Sign In</button>
          </SignInButton>
        ))}
      </nav>

      {/* BODY */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* Sidebar */}
        <aside style={{width:210,flexShrink:0,borderRight:"1px solid #122038",background:"#07101f",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"9px 10px 3px",fontSize:7,color:"#3a5068",letterSpacing:1.5,...M}}>WORKSPACE</div>
          {([
            ["packs","⚡","EV Terminal"],
            ["budget","💰","Budget Advisor"],
            ["feed","📋","Pull Feed"],
          ] as [string,string,string][]).map(([v,ico,lbl])=>(
            <button key={v} className={`sb-btn${view===v?" on":""}`} onClick={()=>setView(v as any)}
              style={{borderLeftColor:view===v?"#00ff87":"transparent",background:view===v?"rgba(255,255,255,.025)":"transparent",color:view===v?"#c8dff0":"#3a5068"}}>
              <span style={{flexShrink:0}}>{ico}</span>
              <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,flex:1}}>{lbl}</span>
            </button>
          ))}
          {/* Alerts — opens side panel or upgrade */}
          <button className={`sb-btn${alertsOpen?" on":""}`} onClick={()=>isPro?setAlertsOpen(true):setShowUpgrade(true)}
            style={{borderLeftColor:alertsOpen?"#ffd166":"transparent",background:alertsOpen?"rgba(255,255,255,.025)":"transparent",color:alertsOpen?"#ffd166":"#3a5068"}}>
            <span style={{flexShrink:0}}>🔔</span>
            <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,flex:1}}>EV Alerts</span>
            {isSubscribed
              ? <span style={{flexShrink:0,fontSize:7,fontWeight:700,color:"#00ff87",background:"rgba(0,255,135,.12)",padding:"2px 5px",borderRadius:3,...M}}>LIVE</span>
              : <span style={{flexShrink:0,fontSize:7,fontWeight:700,color:"#ffd166",background:"rgba(255,209,102,.1)",padding:"2px 5px",borderRadius:3,...M}}>SET UP</span>
            }
          </button>

          <div style={{padding:"9px 10px 3px",marginTop:4,fontSize:7,color:"#3a5068",letterSpacing:1.5,...M}}>MARKETS</div>
          {cats.map(c=>{
            const color=c==="all"?"#00ff87":CAT_COLOR[c]??"#888";
            const packs=data?(c==="all"?data.packs:data.packs.filter(p=>p.category===c)):[];
            const buyN=packs.filter(p=>dec(p).action.includes("BUY")).length;
            const active=tab===c;
            return(
              <button key={c} className={`sb-btn${active?" on":""}`} onClick={()=>{setTab(c);setView("packs");}}
                style={{borderLeftColor:active?color:"transparent",background:active?"rgba(255,255,255,.025)":"transparent",color:active?"#c8dff0":"#3a5068"}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:color,flexShrink:0,display:"inline-block"}}/>
                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,flex:1}}>{c==="all"?"All Markets":catLabel(c)}</span>
                {buyN>0&&<span style={{flexShrink:0,fontSize:8,fontWeight:700,color:"#00ff87",background:"rgba(0,255,135,.08)",padding:"1px 4px",borderRadius:3,...M}}>{buyN}↑</span>}
              </button>
            );
          })}
          <div style={{marginTop:"auto",padding:10,borderTop:"1px solid #122038"}}>
            <a href="https://courtyard.io" target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:6,fontSize:10,color:"#3a5068",textDecoration:"none"}}>🔗 Open Courtyard.io</a>
          </div>
        </aside>

        {/* Main */}
        <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {isLoading&&(<div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12}}>
            <div style={{fontSize:32}}>⚡</div>
            <div style={{fontSize:13,fontWeight:700,color:"#3a5068"}}>Loading live Courtyard data...</div>
          </div>)}

          {/* ═══ EV TERMINAL ═══ */}
          {data&&view==="packs"&&(
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              {/* Hero */}
              <div style={{padding:"10px 14px",borderBottom:"1px solid #122038",background:"#07101f",flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:10}}>
                  <div style={{flex:1}}>
                    <h1 style={{fontWeight:800,fontSize:20,color:"#fff",lineHeight:1.1,letterSpacing:-0.5}}>Stop buying packs blind.</h1>
                    <p style={{fontSize:11,color:"#3a5068",marginTop:3}}>Real-time EV + real cash after fees for every <a href="https://courtyard.io" target="_blank" rel="noreferrer" style={{color:"#00ff87"}}>Courtyard.io</a> pack.</p>
                  </div>
                  {best&&<a href={`https://courtyard.io/vending-machine/${best.id}`} target="_blank" rel="noreferrer" style={{padding:"10px 20px",background:"#00ff87",borderRadius:10,color:"#000",fontWeight:800,fontSize:13,textDecoration:"none",flexShrink:0}}>Rip a Pack ↗</a>}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 2fr",gap:8}}>
                  {[
                    {l:"+EV PACKS",v:`${data.posEV}/${data.packs.length}`,s:"above break-even",vc:"#00ff87"},
                    {l:"BEST EV NOW",v:$x(data.bestPack?.evRatio??0),s:data.bestPack?.name??"—",vc:"#00ff87"},
                    {l:"PULLS TRACKED",v:`${data.totalPulls}`,s:data.isLive?"live data":"sample",vc:"#fff"},
                    {l:"MARKET AVG EV",v:$x(data.avgEV),s:data.avgEV>=1?"Market healthy":"Below EV",vc:data.avgEV>=1?"#00ff87":"#ff3860"},
                  ].map(s=>(
                    <div key={s.l} style={{background:"#0b1728",border:"1px solid #122038",borderRadius:8,padding:"8px 11px"}}>
                      <div style={{fontSize:7,color:"#3a5068",letterSpacing:1.2,...M,marginBottom:3}}>{s.l}</div>
                      <div style={{fontWeight:800,fontSize:18,color:s.vc,lineHeight:1,...M}}>{s.v}</div>
                      <div style={{fontSize:9,color:"#3a5068",marginTop:3}}>{s.s}</div>
                    </div>
                  ))}
                  {best&&<BestPackCard pack={best}/>}
                </div>
              </div>

              {/* Category tabs */}
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderBottom:"1px solid #122038",background:"#07101f",flexShrink:0,overflowX:"auto" as const}}>
                {cats.map(c=>{
                  const packs=data?(c==="all"?data.packs:data.packs.filter(p=>p.category===c)):[];
                  return <button key={c} className={`cat-tab${tab===c?" on":""}`} onClick={()=>setTab(c)}>{c==="all"?`All ${data?.packs.length??0}`:catLabel(c)} {c!=="all"&&<span style={{opacity:.5}}>{packs.length}</span>}</button>;
                })}
                <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,flexShrink:0}}>
                  <span className="ld" style={{width:5,height:5}}/><span style={{fontSize:8,color:"#00ff87",fontWeight:700,...M}}>LIVE</span>
                </div>
              </div>

              {/* Toolbar */}
              <div style={{display:"flex",alignItems:"center",gap:4,padding:"5px 12px",borderBottom:"1px solid #122038",background:"#07101f",flexShrink:0,flexWrap:"wrap" as const}}>
                <button className={`tb${flt==="all"?" on":""}`} onClick={()=>setFlt("all")}>All</button>
                <button className={`tb${flt==="pos"?" on":""}`} onClick={()=>setFlt("pos")}>+EV Only</button>
                <button className={`tb${flt==="neg"?" on":""}`} onClick={()=>setFlt("neg")}>−EV Only</button>
                <span style={{fontSize:8,color:"#3a5068",marginLeft:8,...M}}>SORT</span>
                {([["ev","EV Ratio"],["bb","Buyback"],["decision","🎯 Decision"],["wr","Win Rate"],["price","Price"]] as [string,string][]).map(([k,l])=>(
                  <button key={k} className={`tb${sort===k?" on":""}`} onClick={()=>setSort(k as any)}>{l} ↕</button>
                ))}
              </div>

              {/* PACK GRID */}
              <div style={{flex:1,overflowY:"auto"}}>
                <div className="pack-grid">
                  {rows.map((pack,idx)=>{
                    const sg=sig(pack.evRatio),d=dec(pack);
                    const catC=CAT_COLOR[pack.category]??"#888";
                    const evColor2=evc(pack.evRatio);
                    const bbC=pack.buybackEv>=1?"#00ff87":"#ff3860";
                    const isSel=sel?.id===pack.id,hasAlert=alerts.has(pack.id);
                    return(
                      <div key={pack.id} className={`pcard fi${isSel?" sel":""}`} onClick={()=>setSel(isSel?null:pack)}>
                        <div className="pcard-stripe" style={{background:evColor2}}/>
                        <div className="pcard-top">
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
                              <div style={{fontSize:10,color:"#3a5068"}}>${pack.price}.00 · {pack.pullCount??pack.totalPulls??0} pulls</div>
                            </div>
                            <button className={`bell${hasAlert?" on":""}`}
                              onClick={(e)=>{e.stopPropagation();isPro?toggleAlert(pack.id):setShowUpgrade(true);}}
                              title={hasAlert?"Alert ON":"Set alert"}>
                              {hasAlert?"🔔":"🔕"}
                            </button>
                          </div>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                            <div style={{background:"#060d18",borderRadius:6,padding:"7px 9px",border:`1px solid ${pack.evRatio>=1?"rgba(0,255,135,.15)":"rgba(255,56,96,.1)"}`}}>
                              <div style={{fontSize:7,color:"#3a5068",...M,marginBottom:2}}>EV RATIO</div>
                              <div style={{fontWeight:800,fontSize:20,color:evColor2,lineHeight:1,...M}}>{$x(pack.evRatio)}</div>
                              <div style={{fontSize:8,color:"#3a5068",marginTop:2}}>{pack.evRatio>=1?"▲ above":"▼ below"} break-even</div>
                            </div>
                            <div onClick={(e)=>{if(!isPro){e.stopPropagation();setShowUpgrade(true);}}} style={{background:"#060d18",borderRadius:6,padding:"7px 9px",border:`1px solid ${isPro&&pack.buybackEv>=1?"rgba(255,209,102,.15)":"rgba(255,56,96,.1)"}`,position:"relative",cursor:isPro?"default":"pointer"}}>
                              <div style={{fontSize:7,color:"#ffd166",...M,marginBottom:2}}>BUYBACK EV ★</div>
                              {isPro?(
                                <>
                                  <div style={{fontWeight:800,fontSize:20,color:bbC,lineHeight:1,...M}}>{$x(pack.buybackEv)}</div>
                                  <div style={{fontSize:8,color:"#3a5068",marginTop:2}}>≈{$f((pack.calEv??pack.avgFmv??0)*0.846)} cash</div>
                                </>
                              ):(
                                <>
                                  <div style={{fontWeight:800,fontSize:20,color:"#1e3a50",lineHeight:1,...M,filter:"blur(4px)",userSelect:"none" as const}}>0.000x</div>
                                  <div style={{fontSize:8,color:"#1e3a50",marginTop:2,filter:"blur(3px)",userSelect:"none" as const}}>≈$00.00 cash</div>
                                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:6}}>
                                    <span style={{fontSize:9,color:"#ffd166",fontWeight:700,...M}}>🔒 PRO</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                            <div>
                              <div style={{fontSize:7,color:"#3a5068",...M,marginBottom:2}}>CAL. EV</div>
                              <div style={{fontWeight:700,fontSize:14,color:evColor2,...M}}>{$f(pack.calEv??pack.calibratedEv??0)}</div>
                            </div>
                            <div style={{textAlign:"right" as const}}>
                              <div style={{fontSize:8,color:"#3a5068",marginBottom:3}}>Win rate <span style={{color:"#c8dff0",fontWeight:700,...M}}>{$p(pack.winRate)}</span></div>
                              <div style={{width:90,height:3,borderRadius:2,background:"#0e1e30",overflow:"hidden",marginLeft:"auto"}}>
                                <div style={{height:"100%",borderRadius:2,width:`${Math.min(pack.winRate*200,100)}%`,background:pack.evRatio>=1?"#00ff87":"#ffd166"}}/>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="pcard-bot">
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                            <span className="sig-badge" style={{color:sg.c,background:sg.bg,borderColor:sg.bd}}>{sg.label}</span>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <Spark packId={pack.id} trend={pack.trend} color={evColor2} histData={histData}/>
                              <a href={`https://courtyard.io/vending-machine/${pack.id}`} target="_blank" rel="noreferrer"
                                onClick={(e)=>e.stopPropagation()}
                                style={{padding:"3px 9px",border:"1px solid rgba(0,255,135,.25)",borderRadius:5,fontSize:9,color:"#00ff87",fontWeight:700,textDecoration:"none",...M}}>
                                View ↗
                              </a>
                            </div>
                          </div>
                          {isPro?(
                            <div style={{background:d.bg,border:`1px solid ${d.c}33`,borderRadius:6,padding:"6px 8px",display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontWeight:800,fontSize:11,color:d.c,...M,flexShrink:0,whiteSpace:"nowrap" as const}}>{d.action}</span>
                              <span style={{fontSize:9,color:d.c,opacity:.8,lineHeight:1.3}}>{d.reason.slice(0,52)}{d.reason.length>52?"…":""}</span>
                            </div>
                          ):(
                            <div onClick={(e)=>{e.stopPropagation();setShowUpgrade(true);}} style={{background:"rgba(0,255,135,.04)",border:"1px solid rgba(0,255,135,.15)",borderRadius:6,padding:"6px 8px",display:"flex",alignItems:"center",gap:8,cursor:"pointer"}}>
                              <span style={{fontWeight:800,fontSize:11,color:"#00ff87",...M,flexShrink:0}}>⚡ UPGRADE</span>
                              <span style={{fontSize:9,color:"#3a5068",lineHeight:1.3}}>Unlock BUY/WAIT/SKIP signals + Buyback EV</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══ BUDGET ADVISOR ═══ */}
          {data&&view==="budget"&&(!isPro?(
            <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,padding:24,textAlign:"center" as const}}>
              <div style={{fontWeight:800,fontSize:18,color:"#fff"}}>Budget Advisor is Pro</div>
              <div style={{fontSize:12,color:"#3a5068",maxWidth:320,lineHeight:1.6}}>
                Tell us your budget — we instantly find the best pack by real buyback EV. The actual cash in your hand after every fee.
              </div>
              {([
                {e:"💰",t:"Best pack per budget",d:"Ranked by real cash"},
                {e:"🎯",t:"Buyback EV",d:"After all fees"},
                {e:"⚡",t:"BUY/WAIT/SKIP",d:"Instant signal"},
                {e:"💡",t:"Fee breakdown",d:"Full cost exposed"},
              ] as {e:string;t:string;d:string}[]).map(f=>(
                <div key={f.t} style={{display:"flex",gap:10,alignItems:"center",width:"100%",maxWidth:280,textAlign:"left" as const,background:"#0b1728",border:"1px solid #122038",borderRadius:8,padding:"8px 12px"}}>
                  <span style={{fontSize:16,flexShrink:0}}>{f.e}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:11,color:"#fff"}}>{f.t}</div>
                    <div style={{fontSize:9,color:"#3a5068"}}>{f.d}</div>
                  </div>
                  <span style={{color:"#00ff87",fontSize:11}}>✓</span>
                </div>
              ))}
              <button onClick={()=>setShowUpgrade(true)}
                style={{width:"100%",maxWidth:280,padding:"12px",background:"#00ff87",border:"none",borderRadius:10,fontWeight:800,fontSize:13,color:"#000",cursor:"pointer",fontFamily:"monospace",marginTop:4}}>
                ⚡ Unlock — $29/mo Early Access →
              </button>
              <div style={{fontSize:9,color:"#3a5068",fontFamily:"monospace"}}>First 25 users · Cancel anytime · 7-day refund</div>
            </div>
          ):(
            <div style={{flex:1,overflowY:"auto",padding:16}}>
              <h2 style={{fontWeight:800,fontSize:20,color:"#fff",marginBottom:6}}>💰 Budget Advisor</h2>
              <p style={{fontSize:12,color:"#3a5068",lineHeight:1.6,maxWidth:560,marginBottom:16}}>Tell us your budget. We find the best pack ranked by real buyback EV — actual cash after all fees.</p>
              <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" as const}}>
                {[10,25,50,100,200,500].map(b=>(
                  <button key={b} className={`b-btn${budget===b?" on":""}`} onClick={()=>setBudget(b)}>${b}</button>
                ))}
                <button className={`b-btn${budget===null?" on":""}`} onClick={()=>setBudget(null)}>All</button>
              </div>
              {(budget?[budget]:[10,25,50,100]).map(b=>{
                const recs=budgetPacks(b);
                if(!recs.length) return null;
                const top=recs[0],d=dec(top),sg=sig(top.evRatio);
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
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:10}}>
                      {[["EV RATIO",$x(top.evRatio),top.evRatio>=1?"#00ff87":"#ff3860"],["BUYBACK EV",$x(top.buybackEv),top.buybackEv>=1?"#00ff87":"#ff3860"],["CASH OUT",$f(safeN(top.calEv??top.avgFmv)*0.846),top.buybackEv>=1?"#00ff87":"#ff3860"],["WIN RATE",$p(top.winRate),top.winRate>=.5?"#00ff87":"#3a5068"]].map(([l,v,c])=>(
                        <div key={l as string} style={{background:"#060d18",borderRadius:7,padding:"8px 10px",border:"1px solid #122038"}}>
                          <div style={{fontSize:7,color:"#3a5068",...M,marginBottom:3}}>{l}</div>
                          <div style={{fontWeight:800,fontSize:16,color:c as string,...M}}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:11,color:d.c,background:d.bg,border:`1px solid ${d.c}44`,borderRadius:7,padding:"7px 10px",marginBottom:recs.length>1?10:0}}>
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
          ))}

          {/* ═══ PULL FEED ═══ */}
          {data&&view==="feed"&&(
            <div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:6}}>
              <div style={{padding:"4px 2px 6px",fontSize:11,color:"#3a5068"}}>{data.recentPulls.length} most recent pulls from Courtyard.io — live feed</div>
              {(isPro ? data.recentPulls : data.recentPulls.slice(0,5)).map((pull,_pullIdx)=>{
                const name=pull.buyer??pull.user??"anon";
                const fmv=pull.fmv??0;
                const packId=pull.packId??"";
                const packObj=data.packs.find(p=>p.id===packId);
                const packPrice=pull.packPrice??packObj?.price??50;
                const win=fmv>packPrice,diff=fmv-packPrice;
                const hue=name.split("").reduce((a:number,c:string)=>a+c.charCodeAt(0),0)%360;
                const displayTitle=pull.title??pull.cardName??pull.packName??"";
                const timeStr=pull.txTime??pull.timestamp??"";
                const cardImg=pull.image??"";
                return(
                  <div key={pull.id} className="feed-card" style={{alignItems:"center"}}>
                    {/* Card image */}
                    {cardImg?(
                      <img src={cardImg} alt="" style={{width:44,height:60,objectFit:"contain",borderRadius:4,flexShrink:0,background:"#0b1728"}}
                        onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}}/>
                    ):(
                      <div style={{width:44,height:60,borderRadius:4,background:"#0b1728",border:"1px solid #122038",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"#3a5068",...M}}>IMG</div>
                    )}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap" as const}}>
                        <div style={{width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,flexShrink:0,background:`hsl(${hue},25%,10%)`,border:`1px solid hsl(${hue},25%,18%)`,color:`hsl(${hue},40%,55%)`,...M}}>
                          {name.slice(0,2).toUpperCase()}
                        </div>
                        <span style={{fontSize:11,fontWeight:700,color:"#00cc6a"}}>@{name}</span>
                        {packObj&&<span style={{fontSize:8,color:"#3a5068",padding:"1px 5px",background:"#0b1728",border:"1px solid #122038",borderRadius:3,...M}}>{packObj.name}</span>}
                        {timeStr&&<span style={{fontSize:8,color:"#3a5068",marginLeft:"auto",...M}}>{ago(timeStr)} ago</span>}
                      </div>
                      <div style={{fontSize:12,fontWeight:700,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{displayTitle}</div>
                      {pull.grade&&<div style={{fontSize:8,color:"#3a5068",marginTop:2,...M}}>{pull.grade}</div>}
                    </div>
                    <div style={{textAlign:"right" as const,flexShrink:0}}>
                      <div style={{fontWeight:800,fontSize:14,color:fmv>0?(win?"#00ff87":"#ff3860"):"#3a5068",...M}}>{fmv>0?$f(fmv):"—"}</div>
                      {fmv>0&&<div style={{fontSize:9,color:win?"#00cc6a":"#ff3860",marginTop:2,...M}}>{win?"+":""}{$f(diff)}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* ═══ DETAIL PANEL ═══ */}
        <div className={sel?"detail-panel open":"detail-panel"}>
          <DetailPanel
            sel={sel} isPro={isPro} alerts={alerts}
            histData={histData}
            onClose={()=>setSel(null)}
            onUpgrade={()=>setShowUpgrade(true)}
            onToggleAlert={toggleAlert}
          />
        </div>
      </div>

      <div style={{padding:"4px 14px",borderTop:"1px solid #122038",background:"#07101f",textAlign:"center" as const}}>
        <span style={{fontSize:9,color:"#3a5068"}}>For educational purposes only. Not financial advice. Pack outcomes are random. Not affiliated with Courtyard.io.</span>
      </div>
    </div>
  );
}

function AppRouter(){
  const [showApp, setShowApp] = useState(false);
  const { isLoaded, isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if(p.get('checkout')==='success' || p.get('upgrade')==='1') {
      setShowApp(true);
    }
  }, []);

  // Once signed in, always go to app
  useEffect(() => {
    if(isSignedIn && showApp) return; // already going to app
    if(isSignedIn) setShowApp(true);
  }, [isSignedIn]);

  if(!isLoaded) return(
    <div style={{height:"100vh",background:"#030810",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{fontFamily:"monospace",color:"#00ff87",fontSize:12,letterSpacing:2}}>LOADING...</div>
    </div>
  );

  // Show landing page — but "enter app" requires sign in
  if(!showApp) return(
    <LandingPage onEnterApp={()=>{
      if(isSignedIn) setShowApp(true);
      else openSignIn({ afterSignInUrl: "/?app=1" });
    }}/>
  );

  // Signed in → dashboard
  if(isSignedIn) return <Dashboard/>;

  // Not signed in but tried to access app → force sign in
  return(
    <div style={{height:"100vh",background:"#030810",display:"flex",flexDirection:"column" as const,alignItems:"center",justifyContent:"center",gap:20,fontFamily:"monospace"}}>
      <div style={{fontSize:28,fontWeight:800,color:"#fff",fontFamily:"Syne,sans-serif"}}>Sign in to continue</div>
      <div style={{fontSize:13,color:"#3a5068",marginBottom:8}}>PackPulse requires an account to access live EV data.</div>
      <SignInButton mode="modal" forceRedirectUrl="/?app=1">
        <button style={{padding:"13px 32px",background:"#00ff87",color:"#000",border:"none",borderRadius:9,fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"monospace"}}>
          Sign In / Create Account →
        </button>
      </SignInButton>
      <button onClick={()=>setShowApp(false)} style={{all:"unset" as any,cursor:"pointer",fontSize:12,color:"#3a5068"}}>
        ← Back to home
      </button>
    </div>
  );
}

export default function App(){
  return(
    <ClerkProvider publishableKey={CLERK_KEY}>
      <QueryClientProvider client={queryClient}>
        <AppRouter/>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
