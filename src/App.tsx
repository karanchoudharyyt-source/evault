import { useState, useEffect, useCallback, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCourtyardData } from "./hooks/use-courtyard-data";
import { Pack, PullRecord } from "./data/packs";

const queryClient = new QueryClient();

const VAPID_PUBLIC_KEY = "QeEgkcUz5JkKnw2rANRItufqn1Oc1DcblY7dyuPCGrzLztocjn1LPdv_41RINN9MkTZcVS2aqtim9VRGcnPUng";

const CAT_COLOR: Record<string,string> = {
  Pokémon:"#ffd166",Baseball:"#4f8fff",Basketball:"#ff7f3f",
  Hockey:"#a0d8ef",Football:"#7fba00",Soccer:"#00e5ff",
  Sports:"#9f7aea",Magic:"#e040fb",Comics:"#ff5252",Watch:"#b0bec5",
};

const $f=(n:number)=>`$${(+n).toFixed(2)}`;
const $x=(n:number)=>`${(+n).toFixed(3)}x`;
const $p=(n:number)=>`${(+n*100).toFixed(1)}%`;
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

function Spark({trend,color,w=64,h=20}:{trend:"up"|"down"|"flat";color:string;w?:number;h?:number}){
  const pts=trend==="up"?`0,${h} ${w*.3},${h*.65} ${w*.65},${h*.3} ${w},${h*.05}`:
            trend==="down"?`0,${h*.05} ${w*.3},${h*.3} ${w*.65},${h*.65} ${w},${h}`:
            `0,${h*.52} ${w*.28},${h*.38} ${w*.55},${h*.57} ${w*.8},${h*.44} ${w},${h*.5}`;
  const cy=trend==="up"?h*.05:trend==="down"?h:h*.5;
  return(<svg width={w} height={h} style={{display:"block",flexShrink:0}}>
    <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    <circle cx={w} cy={cy} r="2.5" fill={color}/>
  </svg>);
}

function EVChart({pack}:{pack:Pack}){
  const color=evc(pack.evRatio);
  const N=24,base=pack.evRatio;
  const pts=Array.from({length:N},(_,i)=>{
    const p=i/(N-1),noise=(Math.sin(i*2.1+1)*0.05+Math.cos(i*1.4)*0.03)*(1-p*0.3);
    const tr=pack.trend==="up"?-0.18*(1-p):pack.trend==="down"?0.14*(1-p):0;
    return Math.max(0.2,base+noise+tr);
  });
  const mn=Math.min(...pts)*0.96,mx=Math.max(...pts)*1.04,rng=mx-mn||0.1;
  const W=290,H=88;
  const tx=(i:number)=>i/(N-1)*W,ty=(v:number)=>H-(v-mn)/rng*H;
  const path=pts.map((v,i)=>`${i===0?"M":"L"}${tx(i).toFixed(1)},${ty(v).toFixed(1)}`).join(" ");
  const by=ty(1.0);
  return(<svg width={W} height={H} style={{display:"block",overflow:"visible"}}>
    <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={color} stopOpacity=".2"/><stop offset="100%" stopColor={color} stopOpacity=".01"/>
    </linearGradient></defs>
    {by>2&&by<H-2&&<line x1="0" y1={by} x2={W} y2={by} stroke="rgba(255,255,255,.12)" strokeWidth="1" strokeDasharray="3,3"/>}
    <path d={path+` L${W},${H} L0,${H} Z`} fill="url(#cg)"/>
    <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    <circle cx={tx(N-1)} cy={ty(pts[N-1])} r="3" fill={color}/>
    <text x="3" y="11" fontSize="7" fill="rgba(255,255,255,.25)" fontFamily="monospace">{mx.toFixed(2)}x</text>
    <text x="3" y={H-2} fontSize="7" fill="rgba(255,255,255,.25)" fontFamily="monospace">{mn.toFixed(2)}x</text>
    {by>8&&by<H-8&&<text x={W-28} y={by-3} fontSize="7" fill="rgba(255,255,255,.25)" fontFamily="monospace">1.0x</text>}
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
.sb-btn{all:unset;display:flex;align-items:center;gap:7px;padding:7px 10px;font-size:11px;border-left:2px solid transparent;cursor:pointer;color:#3a5068;width:100%;transition:all .1s}
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
  useEffect(()=>{const t=setTimeout(onClose,4000);return()=>clearTimeout(t);},[onClose]);
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
// ─── Alert Panel (slide-in from right) ──────────────────────────────────────
function AlertPanel({
  open, onClose, packs, alerts, onToggle,
  swStatus, onEnableNotifs, alertType, setAlertType, isSubscribed
}:{
  open:boolean; onClose:()=>void; packs:Pack[]; alerts:Set<string>;
  onToggle:(id:string)=>void; swStatus:string; onEnableNotifs:()=>Promise<boolean>;
  alertType:string; setAlertType:(t:string)=>void; isSubscribed:boolean;
}){
  const M={fontFamily:"monospace"} as React.CSSProperties;
  const [enabling,setEnabling]=useState(false);
  const [step,setStep]=useState<"type"|"packs">("type");

  const handleEnable=async()=>{
    // Don't call setEnabling(true) here — it triggers a React re-render
    // which breaks the browser gesture chain and prevents the popup from firing
    const ok=await onEnableNotifs();
    setEnabling(!ok); // only update state AFTER permission request completes
    if(ok) setStep("type");
  };

  const TYPES=[
    {id:"smart", icon:"🔥", label:"Smart Alerts", color:"#00ff87",
     desc:"Only when buyback EV hits 1.2x+ — actual profit after ALL fees. Rare & valuable.",
     example:"🔥 Basketball Pro STRONG BUY — 1.38x buyback · $69 cash",
     badge:"RECOMMENDED", nopack:true},
    {id:"market", icon:"📊", label:"Market Alerts", color:"#4f8fff",
     desc:"Any pack goes +EV. Good for casual users — we watch everything.",
     example:"📊 4 packs are +EV now! Best: Basketball Pro 1.47x",
     badge:"NO SETUP", nopack:true},
    {id:"pack", icon:"🔔", label:"Pack Alerts", color:"#ffd166",
     desc:"Pick specific packs. Get notified when YOUR packs cross 1.0x EV.",
     example:"⚡ Pokémon Starter is +EV! EV: 1.21x · Cash: $25.50",
     badge:"CUSTOM", nopack:false},
    {id:"all", icon:"⚡", label:"All Alerts", color:"#c8dff0",
     desc:"Smart + Market + Pack alerts combined. Maximum coverage.",
     example:"All of the above",
     badge:"MAX", nopack:false},
  ];

  const selected=TYPES.find(t=>t.id===alertType)||TYPES[0];
  const showPackStep=(alertType==="pack"||alertType==="all")&&step==="packs";

  return(
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:99,opacity:open?1:0,pointerEvents:open?"all":"none",transition:"opacity .2s"}}/>

      {/* Panel */}
      <div style={{position:"fixed",top:0,right:0,bottom:0,width:340,background:"#07101f",borderLeft:"1px solid #122038",zIndex:100,display:"flex",flexDirection:"column",transform:open?"translateX(0)":"translateX(100%)",transition:"transform .25s cubic-bezier(.4,0,.2,1)"}}>

        {/* Header */}
        <div style={{padding:"13px 16px",borderBottom:"1px solid #122038",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:15,color:"#fff"}}>🔔 EV Alerts</div>
            <div style={{fontSize:9,color:"#3a5068",marginTop:2,...M}}>
              {isSubscribed?`Active · ${selected.label}`:"Set up alerts — free, no account needed"}
            </div>
          </div>
          {showPackStep&&<button onClick={()=>setStep("type")} style={{all:"unset" as any,cursor:"pointer",fontSize:9,color:"#3a5068",padding:"3px 8px",border:"1px solid #122038",borderRadius:5,...M}}>← Back</button>}
          <button onClick={onClose} style={{all:"unset" as any,cursor:"pointer",color:"#3a5068",width:22,height:22,border:"1px solid #122038",borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>✕</button>
        </div>

        {/* Notification status */}
        {swStatus!=="granted"&&(
          <div style={{padding:"10px 14px",borderBottom:"1px solid #122038",flexShrink:0}}>
            {swStatus==="denied"?(
              <div style={{background:"rgba(255,56,96,.06)",border:"1px solid rgba(255,56,96,.2)",borderRadius:8,padding:"9px 11px"}}>
                <div style={{fontWeight:700,fontSize:11,color:"#ff3860",marginBottom:4}}>⛔ Notifications Blocked</div>
                <div style={{fontSize:9,color:"#3a5068",lineHeight:1.5}}>Click the 🔒 lock in the address bar → Notifications → Allow → refresh the page.</div>
              </div>
            ):(
              <div style={{background:"rgba(255,209,102,.05)",border:"1px solid rgba(255,209,102,.2)",borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontWeight:700,fontSize:11,color:"#ffd166",marginBottom:5}}>Enable push notifications first</div>
                <p style={{fontSize:9,color:"#3a5068",lineHeight:1.5,marginBottom:8}}>
                  Your browser will show a one-time popup asking <strong style={{color:"#c8dff0"}}>"Allow notifications?"</strong> — click <strong style={{color:"#00ff87"}}>Allow</strong>. After that, alerts fire even when this tab is closed.
                </p>
                <button onClick={handleEnable} disabled={enabling}
                  style={{width:"100%",padding:"9px",background:enabling?"#1a2a3a":"#ffd166",color:"#000",border:"none",borderRadius:7,fontWeight:800,fontSize:12,cursor:"pointer",...M}}>
                  {enabling?"Setting up...":"🔔 Enable — browser will ask to Allow →"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Active status */}
        {swStatus==="granted"&&isSubscribed&&!showPackStep&&(
          <div style={{padding:"8px 14px",borderBottom:"1px solid #122038",flexShrink:0}}>
            <div style={{background:"rgba(0,255,135,.04)",border:"1px solid rgba(0,255,135,.15)",borderRadius:7,padding:"7px 10px",display:"flex",alignItems:"center",gap:8}}>
              <span className="ld" style={{width:5,height:5}}/>
              <span style={{fontSize:10,color:"#00ff87",fontWeight:700}}>Alerts Active</span>
              <span style={{fontSize:9,color:"#3a5068",...M}}>Server checks every 60s · works when closed</span>
            </div>
          </div>
        )}

        {/* STEP: Type selector */}
        {!showPackStep&&(
          <div style={{flex:1,overflowY:"auto",padding:"10px 14px",display:"flex",flexDirection:"column",gap:6}}>
            <div style={{fontSize:7,color:"#3a5068",letterSpacing:1.5,...M,marginBottom:4}}>CHOOSE YOUR ALERT TYPE</div>

            {TYPES.map(t=>{
              const active=alertType===t.id;
              return(
                <div key={t.id} onClick={()=>setAlertType(t.id)}
                  style={{border:`1px solid ${active?t.color+"55":"#122038"}`,borderRadius:9,padding:"11px 12px",cursor:"pointer",background:active?`${t.color}08`:"#0b1728",transition:"all .15s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:6}}>
                    <span style={{fontSize:18,flexShrink:0}}>{t.icon}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,fontSize:12,color:active?t.color:"#fff"}}>{t.label}</div>
                    </div>
                    <span style={{fontSize:7,fontWeight:800,color:t.color,background:`${t.color}15`,padding:"2px 6px",borderRadius:3,border:`1px solid ${t.color}33`,...M}}>{t.badge}</span>
                    <div style={{width:14,height:14,borderRadius:"50%",border:`2px solid ${active?t.color:"#3a5068"}`,background:active?t.color:"transparent",flexShrink:0}}/>
                  </div>
                  <div style={{fontSize:10,color:"#3a5068",lineHeight:1.4,marginBottom:active?6:0}}>{t.desc}</div>
                  {active&&(
                    <div style={{fontSize:9,color:t.color,opacity:.7,fontStyle:"italic",borderTop:`1px solid ${t.color}22`,paddingTop:5,lineHeight:1.4,...M}}>
                      e.g. "{t.example}"
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pack selection shortcut */}
            {(alertType==="pack"||alertType==="all")&&(
              <button onClick={()=>setStep("packs")}
                style={{all:"unset" as any,cursor:"pointer",marginTop:4,padding:"10px 12px",background:"#0b1728",border:"1px solid rgba(255,209,102,.25)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontWeight:700,fontSize:11,color:"#ffd166"}}>Select Packs to Watch</div>
                  <div style={{fontSize:9,color:"#3a5068",marginTop:2}}>
                    {alerts.size>0?`${alerts.size} pack${alerts.size!==1?"s":""} selected`:"No packs selected yet — tap to choose"}
                  </div>
                </div>
                <span style={{color:"#ffd166",fontSize:14}}>→</span>
              </button>
            )}

            {/* How it works */}
            <div style={{marginTop:6,padding:"10px 12px",background:"#060d18",border:"1px solid #122038",borderRadius:8}}>
              <div style={{fontSize:7,color:"#3a5068",letterSpacing:1.5,...M,marginBottom:7}}>HOW IT WORKS</div>
              {[
                ["🌐","Enable once","Browser saves your subscription to our server"],
                ["⏱️","Every 60s","Server fetches live Courtyard data automatically"],
                ["📐","EV calculated","Checks every pack against your alert settings"],
                ["📲","You get notified","Push to your phone/laptop even if browser is closed"],
              ].map(([ico,t,s])=>(
                <div key={t} style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
                  <span style={{fontSize:12,flexShrink:0}}>{ico}</span>
                  <div>
                    <span style={{fontSize:10,fontWeight:700,color:"#c8dff0"}}>{t} — </span>
                    <span style={{fontSize:9,color:"#3a5068"}}>{s}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{fontSize:8,color:"#2a4060",textAlign:"center" as const,...M,lineHeight:1.6}}>
              Free forever · No account · 1-click to turn off
            </div>
          </div>
        )}

        {/* STEP: Pack selector */}
        {showPackStep&&(
          <div style={{flex:1,overflowY:"auto",padding:"10px 14px",display:"flex",flexDirection:"column",gap:6}}>
            <div style={{fontSize:7,color:"#3a5068",letterSpacing:1.5,...M,marginBottom:4}}>
              SELECT PACKS TO WATCH ({alerts.size} selected)
            </div>
            {packs.map(p=>{
              const isOn=alerts.has(p.id);
              const evColor2=evc(p.evRatio),sg=sig(p.evRatio),d=dec(p);
              return(
                <div key={p.id} onClick={()=>onToggle(p.id)}
                  style={{border:`1px solid ${isOn?"rgba(255,209,102,.3)":"#122038"}`,borderRadius:9,padding:"10px 11px",cursor:"pointer",background:isOn?"rgba(255,209,102,.04)":"#0b1728",display:"flex",alignItems:"center",gap:9,transition:"all .15s"}}>
                  <img src={packImg(p.id)} alt="" style={{width:30,height:42,objectFit:"contain",flexShrink:0}}
                    onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:11,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const,marginBottom:3}}>{p.name}</div>
                    <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap" as const}}>
                      <span style={{fontWeight:800,fontSize:10,color:evColor2,...M}}>{$x(p.evRatio)}</span>
                      <span className="sig-badge" style={{color:sg.c,background:sg.bg,borderColor:sg.bd,fontSize:7}}>{sg.label}</span>
                    </div>
                    <div style={{fontSize:9,color:d.c,marginTop:2,opacity:.85,...M}}>{d.action}</div>
                  </div>
                  {/* Toggle */}
                  <div style={{width:38,height:22,borderRadius:11,border:`1px solid ${isOn?"rgba(255,209,102,.4)":"#122038"}`,background:isOn?"rgba(255,209,102,.15)":"#060d18",position:"relative",flexShrink:0,transition:"all .2s"}}
                    onClick={(e)=>{e.stopPropagation();onToggle(p.id);}}>
                    <div style={{position:"absolute",top:3,left:isOn?19:3,width:14,height:14,borderRadius:"50%",background:isOn?"#ffd166":"#3a5068",transition:"all .2s"}}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{padding:"8px 14px",borderTop:"1px solid #122038",flexShrink:0}}>
          <div style={{fontSize:8,color:"#2a4060",textAlign:"center" as const,...M}}>
            Alerts: once/hr per pack · No spam · Free
          </div>
        </div>
      </div>
    </>
  );
}


// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard(){
  const {data,isLoading,refetch}=useCourtyardData();
  const [tab,setTab]          =useState("all");
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
  const [alertType,setAlertTypeRaw] =useState("smart");
  const [swStatus,setSwStatus]      =useState<"unknown"|"granted"|"denied"|"unsupported">("unknown");
  const [pushSub,setPushSub]        =useState<PushSubscription|null>(null);
  const [isSubscribed,setIsSubscribed]=useState(false);
  const swRegistered                 =useRef(false);

  const addToast=(msg:string,type:"ok"|"warn"|"err"="ok")=>{
    const id=++toastId.current;
    setToasts(t=>[...t,{id,msg,type}]);
  };
  const removeToast=(id:number)=>setToasts(t=>t.filter(x=>x.id!==id));

  // Register service worker
  useEffect(()=>{
    if(swRegistered.current) return;
    swRegistered.current=true;
    if(!("serviceWorker" in navigator)||!("PushManager" in window)){setSwStatus("unsupported");return;}
    navigator.serviceWorker.register("/sw.js").then(reg=>{
      const p=Notification.permission;
      setSwStatus(p==="granted"?"granted":p==="denied"?"denied":"unknown");
      reg.pushManager.getSubscription().then(sub=>{
        if(sub){setPushSub(sub);setIsSubscribed(true);}
      });
    }).catch(()=>{});
  },[]);

  // Enable notifications — requestPermission MUST be called first before any setState
  // Otherwise React re-renders break the browser's user-gesture chain and popup never fires
  const enableNotifications=useCallback(async():Promise<boolean>=>{
    if(!("serviceWorker" in navigator)||!("Notification" in window)){
      addToast("Your browser doesn't support push notifications","err");
      return false;
    }
    try{
      // ⚠️ Call requestPermission IMMEDIATELY — no setState before this line
      // Browser only shows popup if called synchronously within a user click
      const perm=await Notification.requestPermission();
      
      if(perm==="denied"){
        setSwStatus("denied");
        addToast("Notifications blocked — click 🔒 in address bar → Notifications → Allow","warn");
        return false;
      }
      if(perm!=="granted"){
        addToast("Please click Allow when the browser asks","warn");
        return false;
      }
      
      // Permission granted — now do the rest
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
      addToast("✅ Notifications enabled! Choose your alert type below","ok");
      return true;
    }catch(e:any){
      addToast(`Notification setup failed: ${e.message}`,"err");
      return false;
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
          packIds,alertOnEv:true,alertOnBuyback:true,evThreshold:1.0,alertType:type,
        }),
      });
    }catch{}
  },[]);

  // Toggle per-pack alert (from card bell)
  const toggleAlert=useCallback(async(packId:string)=>{
    let sub=pushSub;
    if(swStatus!=="granted"||!sub){
      const ok=await enableNotifications();
      if(!ok) return;
      sub=await (async()=>{
        try{const reg=await navigator.serviceWorker.ready;return await reg.pushManager.getSubscription();}
        catch{return null;}
      })();
      if(!sub) return;
    }
    const next=new Set(alerts);
    next.has(packId)?next.delete(packId):next.add(packId);
    setAlerts(next);
    const packName=data?.packs.find(p=>p.id===packId)?.name??"pack";
    addToast(next.has(packId)?`🔔 Alert ON for ${packName}`:`🔕 Alert removed for ${packName}`,"ok");
    await saveSubscription(sub,Array.from(next),alertType);
  },[alerts,swStatus,pushSub,data,alertType,enableNotifications,saveSubscription]);

  // When alertType changes, re-save
  const setAlertType=useCallback(async(type:string)=>{
    setAlertTypeRaw(type);
    if(pushSub&&isSubscribed){
      await saveSubscription(pushSub,Array.from(alerts),type);
      addToast(`Alert type set to: ${type==="smart"?"🔥 Smart":type==="market"?"📊 Market":type==="pack"?"🔔 Pack":"⚡ All"}`,"ok");
    }
  },[pushSub,isSubscribed,alerts,saveSubscription]);

  // Countdown
  useEffect(()=>{
    const t=setInterval(()=>sCd(c=>{if(c<=1){refetch();return 60;}return c-1;}),1000);
    return()=>clearInterval(t);
  },[refetch]);

  const cats=data?["all",...Array.from(new Set(data.packs.map(p=>p.category)))] :["all"];
  const decScore=(p:Pack)=>{const d=dec(p);return d.action.includes("STRONG")?6:d.action.includes("✅")?5:d.action.includes("⚡")?4:d.action.includes("MAYBE")?3:d.action.includes("WAIT")?2:1;};
  const rows:Pack[]=data?[...data.packs].filter(p=>tab==="all"||p.category===tab).filter(p=>flt==="pos"?p.evRatio>=1:flt==="neg"?p.evRatio<1:true).sort((a,b)=>sort==="ev"?b.evRatio-a.evRatio:sort==="bb"?b.buybackEv-a.buybackEv:sort==="decision"?decScore(b)-decScore(a):sort==="wr"?b.winRate-a.winRate:a.price-b.price):[];
  const best=data?.packs[0];
  const budgetPacks=(b:number)=>data?.packs.filter(p=>p.price<=b).sort((a,c)=>decScore(c)-decScore(a)).slice(0,3)??[];
  const alertCount=alertType==="pack"||alertType==="all"?alerts.size:alertType==="smart"||alertType==="market"?1:0;

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#060d18",color:"#c8dff0"}}>
      <style>{CSS}</style>

      {/* TOASTS */}
      <div className="toast-wrap">
        {toasts.map(t=><Toast key={t.id} msg={t.msg} type={t.type} onClose={()=>removeToast(t.id)}/>)}
      </div>

      {/* ALERTS PANEL */}
      <AlertPanel
        open={alertsOpen} onClose={()=>setAlertsOpen(false)}
        packs={data?.packs??[]} alerts={alerts} onToggle={toggleAlert}
        swStatus={swStatus} onEnableNotifs={enableNotifications}
        alertType={alertType} setAlertType={setAlertType}
        isSubscribed={isSubscribed}
      />

      {/* TICKER */}
      {data&&data.recentPulls.length>0&&(
        <div className="ticker-wrap">
          <div className="ticker-lbl"><span className="ld"/>LIVE PULLS</div>
          <div style={{flex:1,overflow:"hidden"}}>
            <div className="ticker-track">
              {[...data.recentPulls,...data.recentPulls].map((p,i)=>{
                const win=p.fmv>p.packPrice;
                return(<div key={`${p.id}-${i}`} className="ticker-item">
                  <span style={{color:"#3a5068",fontSize:9}}>@{p.user}</span>
                  <span style={{color:"#c8dff0",fontWeight:600}}>{p.cardName.slice(0,20)}</span>
                  <span style={{color:win?"#00ff87":"#ff3860",fontWeight:800}}>{$f(p.fmv)}</span>
                  <span style={{color:win?"rgba(0,255,135,.5)":"rgba(255,56,96,.5)",fontSize:9}}>({win?"+":""}{$f(p.fmv-p.packPrice)})</span>
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
        <button onClick={()=>setAlertsOpen(true)} style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,padding:"4px 12px",background:isSubscribed?"rgba(255,209,102,.06)":"transparent",border:`1px solid ${isSubscribed?"rgba(255,209,102,.3)":"#122038"}`,borderRadius:7,cursor:"pointer",fontSize:9,color:isSubscribed?"#ffd166":"#3a5068",fontWeight:700,...M,flexShrink:0}}>
          {isSubscribed?"🔔 Alerts Active":"🔔 Set Alerts"}
        </button>
        <button onClick={()=>refetch()} disabled={isLoading} style={{marginLeft:"auto",padding:"4px 11px",background:"transparent",border:"1px solid #122038",borderRadius:5,fontSize:8,color:"#3a5068",cursor:"pointer",...M}}>↻ Refresh</button>
      </nav>

      {/* BODY */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* Sidebar */}
        <aside style={{width:178,flexShrink:0,borderRight:"1px solid #122038",background:"#07101f",display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"9px 10px 3px",fontSize:7,color:"#3a5068",letterSpacing:1.5,...M}}>WORKSPACE</div>
          {([
            ["packs","⚡","EV Terminal",""],
            ["budget","💰","Budget Advisor",""],
            ["feed","📋","Pull Feed",""],
            ["alerts","🔔","EV Alerts", isSubscribed?"LIVE":swStatus==="granted"?"ON":""]  /* panel */,
          ] as [string,string,string,string][]).map(([v,ico,lbl,badge])=>(
            <button key={v} className={`sb-btn${view===v?" on":""}`} onClick={()=>setView(v as any)}
              style={{borderLeftColor:view===v?v==="alerts"?"#ffd166":"#00ff87":"transparent",background:view===v?"rgba(255,255,255,.025)":"transparent"}}>
              {ico} {lbl}
              {badge&&<span style={{marginLeft:"auto",fontSize:7,fontWeight:700,color:v==="alerts"?"#ffd166":"#00ff87",background:v==="alerts"?"rgba(255,209,102,.1)":"rgba(0,255,135,.08)",padding:"1px 4px",borderRadius:3,...M}}>{badge}</span>}
            </button>
          ))}

          <div style={{padding:"9px 10px 3px",marginTop:4,fontSize:7,color:"#3a5068",letterSpacing:1.5,...M}}>MARKETS</div>
          {cats.map(c=>{
            const color=c==="all"?"#00ff87":CAT_COLOR[c]??"#888";
            const packs=data?(c==="all"?data.packs:data.packs.filter(p=>p.category===c)):[];
            const buyN=packs.filter(p=>dec(p).action.includes("BUY")).length;
            const active=tab===c;
            return(
              <button key={c} className={`sb-btn${active?" on":""}`} onClick={()=>{setTab(c);setView("packs");}}
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
                  {best&&(()=>{const sg=sig(best.evRatio);return(
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
                  );})()}
                </div>
              </div>

              {/* Category tabs */}
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderBottom:"1px solid #122038",background:"#07101f",flexShrink:0,overflowX:"auto" as const}}>
                {cats.map(c=>{
                  const packs=data?(c==="all"?data.packs:data.packs.filter(p=>p.category===c)):[];
                  return <button key={c} className={`cat-tab${tab===c?" on":""}`} onClick={()=>setTab(c)}>{c==="all"?"All":c} {packs.length}</button>;
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
                              <div style={{fontSize:10,color:"#3a5068"}}>${pack.price}.00 · {pack.totalPulls} pulls</div>
                            </div>
                            <button className={`bell${hasAlert?" on":""}`}
                              onClick={(e)=>{e.stopPropagation();toggleAlert(pack.id);}}
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
                            <div style={{background:"#060d18",borderRadius:6,padding:"7px 9px",border:`1px solid ${pack.buybackEv>=1?"rgba(255,209,102,.15)":"rgba(255,56,96,.1)"}`}}>
                              <div style={{fontSize:7,color:"#ffd166",...M,marginBottom:2}}>BUYBACK EV ★</div>
                              <div style={{fontWeight:800,fontSize:20,color:bbC,lineHeight:1,...M}}>{$x(pack.buybackEv)}</div>
                              <div style={{fontSize:8,color:"#3a5068",marginTop:2}}>≈{$f(pack.avgFmv*0.846)} cash</div>
                            </div>
                          </div>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                            <div>
                              <div style={{fontSize:7,color:"#3a5068",...M,marginBottom:2}}>CAL. EV</div>
                              <div style={{fontWeight:700,fontSize:14,color:evColor2,...M}}>{$f(pack.calibratedEv)}</div>
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
                              <Spark trend={pack.trend} color={evColor2}/>
                              <a href={`https://courtyard.io/vending-machine/${pack.id}`} target="_blank" rel="noreferrer"
                                onClick={(e)=>e.stopPropagation()}
                                style={{padding:"3px 9px",border:"1px solid rgba(0,255,135,.25)",borderRadius:5,fontSize:9,color:"#00ff87",fontWeight:700,textDecoration:"none",...M}}>
                                View ↗
                              </a>
                            </div>
                          </div>
                          <div style={{background:d.bg,border:`1px solid ${d.c}33`,borderRadius:6,padding:"6px 8px",display:"flex",alignItems:"center",gap:8}}>
                            <span style={{fontWeight:800,fontSize:11,color:d.c,...M,flexShrink:0,whiteSpace:"nowrap" as const}}>{d.action}</span>
                            <span style={{fontSize:9,color:d.c,opacity:.8,lineHeight:1.3}}>{d.reason.slice(0,52)}{d.reason.length>52?"…":""}</span>
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
                      {[["EV RATIO",$x(top.evRatio),top.evRatio>=1?"#00ff87":"#ff3860"],["BUYBACK EV",$x(top.buybackEv),top.buybackEv>=1?"#00ff87":"#ff3860"],["CASH OUT",$f(top.avgFmv*0.846),top.buybackEv>=1?"#00ff87":"#ff3860"],["WIN RATE",$p(top.winRate),top.winRate>=.5?"#00ff87":"#3a5068"]].map(([l,v,c])=>(
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
          )}

          {/* ═══ PULL FEED ═══ */}
          {data&&view==="feed"&&(
            <div style={{flex:1,overflowY:"auto",padding:10,display:"flex",flexDirection:"column",gap:6}}>
              <div style={{padding:"4px 2px 6px",fontSize:11,color:"#3a5068"}}>{data.recentPulls.length} most recent pulls from Courtyard.io</div>
              {(data.recentPulls as PullRecord[]).map(pull=>{
                const win=pull.fmv>pull.packPrice,diff=pull.fmv-pull.packPrice;
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
            const p=sel,d=dec(p),sg=sig(p.evRatio);
            const evColor2=evc(p.evRatio),bbC=p.buybackEv>=1?"#00ff87":"#ff3860";
            const trueCost=p.price*1.074,cashOut=p.avgFmv*0.846;
            const hasAlert=alerts.has(p.id);
            return(
              <div className="si" style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
                <div style={{padding:"11px 12px",borderBottom:"1px solid #122038",display:"flex",alignItems:"center",gap:9,flexShrink:0,background:"#060d18"}}>
                  <img src={packImg(p.id)} alt="" style={{width:28,height:40,objectFit:"contain"}} onError={(e)=>{(e.target as HTMLImageElement).style.display="none";}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:800,fontSize:14,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" as const}}>{p.name}</div>
                    <div style={{fontSize:9,color:"#3a5068",marginTop:1,...M}}>{p.category} · ${p.price}/pack · {p.totalPulls} pulls</div>
                  </div>
                  <button className={`bell${hasAlert?" on":""}`} onClick={()=>toggleAlert(p.id)}>{hasAlert?"🔔":"🔕"}</button>
                  <button className="dp-x" onClick={()=>setSel(null)}>✕</button>
                </div>
                <div className="dp-scroll">
                  <div style={{background:d.bg,border:`1px solid ${d.c}44`,borderRadius:8,padding:"12px 13px"}}>
                    <div style={{fontSize:7,color:d.c,letterSpacing:1.5,...M,fontWeight:700,marginBottom:5}}>SHOULD YOU PULL?</div>
                    <div style={{fontWeight:800,fontSize:18,color:d.c,...M,marginBottom:5}}>{d.action}</div>
                    <div style={{fontSize:11,color:d.c,opacity:.85,lineHeight:1.5}}>{d.reason}</div>
                  </div>
                  <div className="dp-sec">
                    <span className="dp-lbl">EV RATIO TREND · 1m</span>
                    <EVChart pack={p}/>
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
                        <div style={{fontSize:8,color:"#3a5068",marginTop:3,...M}}>{$f(p.calibratedEv)} avg</div>
                      </div>
                      <div className="dp-tile" style={{borderColor:p.buybackEv>=1?"rgba(255,209,102,.2)":"rgba(255,56,96,.15)"}}>
                        <span className="dp-tl">BUYBACK EV ★</span>
                        <div className="dp-tv" style={{color:bbC}}>{$x(p.buybackEv)}</div>
                        <div style={{fontSize:8,color:"#3a5068",marginTop:3,...M}}>{$f(cashOut)} cash</div>
                      </div>
                    </div>
                    <div className="dp-2">
                      <div className="dp-tile"><span className="dp-tl">WIN RATE</span><div className="dp-tv" style={{color:p.winRate>=.5?"#00ff87":"#3a5068"}}>{$p(p.winRate)}</div></div>
                      <div className="dp-tile"><span className="dp-tl">BEST PULL</span><div className="dp-tv" style={{color:"#00ff87"}}>{$f(p.bestPull)}</div></div>
                    </div>
                    <span className="sig-badge" style={{color:sg.c,background:sg.bg,borderColor:sg.bd,alignSelf:"flex-start" as const}}>{sg.label}</span>
                  </div>
                  <div className="dp-sec">
                    <span className="dp-lbl">💡 FEE BREAKDOWN — EXCLUSIVE</span>
                    <table className="fee-t"><tbody>
                      <tr><td>Advertised price</td><td style={{textAlign:"right" as const}}>{$f(p.price)}</td></tr>
                      <tr><td style={{color:"#ff3860"}}>Payment markup (+7.4%)</td><td style={{textAlign:"right" as const,color:"#ff3860"}}>{$f(trueCost)}</td></tr>
                      <tr><td>Average FMV won</td><td style={{textAlign:"right" as const,color:evColor2}}>{$f(p.avgFmv)}</td></tr>
                      <tr><td>Buyback offer (×0.90)</td><td style={{textAlign:"right" as const}}>{$f(p.avgFmv*0.9)}</td></tr>
                      <tr><td style={{color:"#ff3860"}}>Processing fee (−6%)</td><td style={{textAlign:"right" as const,color:"#ff3860"}}>−{$f(p.avgFmv*0.9*0.06)}</td></tr>
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
          })()}
        </div>
      </div>

      <div style={{padding:"4px 14px",borderTop:"1px solid #122038",background:"#07101f",textAlign:"center" as const}}>
        <span style={{fontSize:9,color:"#3a5068"}}>For educational purposes only. Not financial advice. Pack outcomes are random. Not affiliated with Courtyard.io.</span>
      </div>
    </div>
  );
}

export default function App(){
  return <QueryClientProvider client={queryClient}><Dashboard/></QueryClientProvider>;
}
