import { useEffect, useRef, useState } from "react";
import { SignInButton, useUser } from "@clerk/clerk-react";

// ── Fake live ticker data ──────────────────────────────────────────────────────
const TICKER_ITEMS = [
  { user:"@silverdestiny",  card:"2023 Charizard ex SAR",         fmv:1240, pack:"Pokémon Master",  win:true  },
  { user:"@packrat_mike",   card:"2024 Dialga G Crosshatch",      fmv:180,  pack:"Pokémon Pro",     win:true  },
  { user:"@rippingwith3",   card:"2021 PSA 10 Mike Trout",        fmv:890,  pack:"Baseball Master", win:true  },
  { user:"@trustmrr",       card:"2019 Zion Williamson RC",       fmv:420,  pack:"Basketball Pro",  win:true  },
  { user:"@courtyard_vet",  card:"2020 Patrick Mahomes Gold",     fmv:310,  pack:"Football Master", win:true  },
  { user:"@limited_flip",   card:"2022 Pokémon VSTAR Universe",   fmv:95,   pack:"Pokémon Starter", win:false },
  { user:"@ev_hunter",      card:"1999 Base Set Charizard Holo",  fmv:4200, pack:"Pokémon Legend",  win:true  },
  { user:"@packwatch",      card:"2024 One Piece Law Alt Art",    fmv:280,  pack:"One Piece Master", win:true  },
  { user:"@blindpuller",    card:"2023 Mew ex SAR",               fmv:85,   pack:"Pokémon Basic",   win:false },
  { user:"@datacards",      card:"2022 Shohei Ohtani Auto",       fmv:650,  pack:"Baseball Ultra",  win:true  },
];

const FEATURES = [
  {
    icon: "◈",
    title: "Buyback EV",
    sub: "Real cash after every fee",
    desc: "Not just FMV. We calculate the actual dollar in your hand after Courtyard's 10% cut + 6% processing fee. The number that actually matters.",
    accent: "#00ff87",
  },
  {
    icon: "⚡",
    title: "Decision Engine",
    sub: "STRONG BUY / BUY / WAIT / SKIP",
    desc: "A data-backed signal on every single pack. Strong Buy means you statistically profit after every fee. Stop guessing — let the math decide.",
    accent: "#ffd166",
  },
  {
    icon: "◉",
    title: "EV History Charts",
    sub: "TradingView-style",
    desc: "See exactly when a pack's expected value shifted. Know if right now is the peak — or if you should wait two hours for better odds.",
    accent: "#4f8fff",
  },
  {
    icon: "◎",
    title: "Push Alerts",
    sub: "Works when browser is closed",
    desc: "Server checks every 30 seconds. The moment a pack crosses 1.2x buyback EV, you get a push notification — before anyone else acts.",
    accent: "#ff6b6b",
  },
  {
    icon: "◆",
    title: "Budget Advisor",
    sub: "Best pack for any budget",
    desc: "Tell us your budget. We instantly rank every pack by real buyback EV — the actual cash you'd walk away with, not the sticker price.",
    accent: "#c77dff",
  },
  {
    icon: "◇",
    title: "Fee Breakdown",
    sub: "Every hidden cost exposed",
    desc: "The full math: pack price, payment markup, average FMV, buyback haircut, processing fees. The breakdown Courtyard buries in the fine print.",
    accent: "#06d6a0",
  },
];

const STEPS = [
  { n:"01", title:"We track every pull", body:"Our system fetches Courtyard data every 30 seconds — pull values, odds shifts, pool changes — around the clock across all 51 active packs." },
  { n:"02", title:"We calibrate real EV", body:"Using decay-weighted averages across 5M+ tracked pulls, we calculate what each pack is actually worth right now. Not midpoints — real data." },
  { n:"03", title:"You buy with an edge", body:"Check the EV ratio and buyback signal before you rip. Above 1.0x? The math is in your favor. Below? Maybe wait an hour." },
];

// ── Animated counter ───────────────────────────────────────────────────────────
function Counter({ end, duration = 2000, suffix="" }:{ end:number; duration?:number; suffix?:string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setCount(Math.floor(ease * end));
        if (p < 1) requestAnimationFrame(tick);
        else setCount(end);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ── Main landing page ──────────────────────────────────────────────────────────
export default function LandingPage({ onEnterApp }:{ onEnterApp:()=>void }) {
  const { isSignedIn } = useUser();
  const [stats, setStats] = useState<any>(null);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/founding-stats").then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const price     = stats?.currentPrice ?? 29;
  const remaining = stats?.foundingRemaining ?? 100;
  const pct       = Math.round(((100 - remaining) / 100) * 100);

  return (
    <div style={{ background:"#030810", color:"#c8dff0", fontFamily:"'Space Mono', 'Courier New', monospace", overflowX:"hidden" }}>

      {/* ── Google Font ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Syne:wght@400;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-nav { position:fixed; top:0; left:0; right:0; z-index:100; padding:18px 32px; display:flex; align-items:center; justify-content:space-between; background:rgba(3,8,16,.85); backdrop-filter:blur(12px); border-bottom:1px solid rgba(255,255,255,.04); }

        .lp-logo { display:flex; align-items:center; gap:10px; text-decoration:none; }
        .lp-logo-mark { width:32px; height:32px; background:#00ff87; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:16px; color:#000; font-weight:700; }
        .lp-logo-text { font-size:16px; font-weight:700; color:#fff; letter-spacing:-.3px; font-family:'Syne',sans-serif; }

        .lp-nav-right { display:flex; align-items:center; gap:12px; }
        .lp-btn-ghost { padding:7px 16px; border:1px solid rgba(255,255,255,.15); background:transparent; color:#c8dff0; border-radius:6px; font-size:12px; cursor:pointer; font-family:inherit; transition:all .15s; }
        .lp-btn-ghost:hover { border-color:rgba(0,255,135,.4); color:#00ff87; }
        .lp-btn-cta { padding:8px 20px; background:#00ff87; color:#000; border:none; border-radius:6px; font-size:12px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .15s; }
        .lp-btn-cta:hover { background:#00e87a; transform:translateY(-1px); }

        .ticker-wrap { background:#070f1c; border-top:1px solid rgba(0,255,135,.1); border-bottom:1px solid rgba(0,255,135,.1); overflow:hidden; padding:10px 0; }
        .ticker-inner { display:flex; gap:48px; width:max-content; animation:tickerScroll 40s linear infinite; }
        @keyframes tickerScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .ticker-item { display:flex; align-items:center; gap:8px; white-space:nowrap; font-size:11px; }

        .section { padding:96px 32px; max-width:1100px; margin:0 auto; }
        .section-label { font-size:10px; letter-spacing:3px; color:#3a5068; margin-bottom:12px; text-transform:uppercase; }

        .feat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.05); border-radius:16px; overflow:hidden; }
        @media(max-width:768px){.feat-grid{grid-template-columns:1fr;}}
        .feat-card { background:#07101f; padding:28px; transition:background .2s; }
        .feat-card:hover { background:#0b1728; }

        .steps-row { display:grid; grid-template-columns:repeat(3,1fr); gap:32px; }
        @media(max-width:768px){.steps-row{grid-template-columns:1fr;gap:24px;}}

        .price-card { background:#070f1c; border:1px solid rgba(255,255,255,.08); border-radius:16px; padding:32px; max-width:420px; margin:0 auto; }
        .price-card.featured { border-color:rgba(0,255,135,.3); background:rgba(0,255,135,.03); }

        .lp-footer { border-top:1px solid rgba(255,255,255,.06); padding:32px; text-align:center; font-size:11px; color:#3a5068; }

        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation:fadeUp .7s ease forwards; }
        .fade-up-2 { animation:fadeUp .7s .15s ease forwards; opacity:0; }
        .fade-up-3 { animation:fadeUp .7s .3s ease forwards; opacity:0; }

        .glow-dot { width:6px; height:6px; border-radius:50%; background:#00ff87; display:inline-block; box-shadow:0 0 8px #00ff87; animation:pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1;box-shadow:0 0 8px #00ff87} 50%{opacity:.4;box-shadow:0 0 4px #00ff87} }

        .ev-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(0,255,135,.08); border:1px solid rgba(0,255,135,.2); border-radius:20px; padding:5px 14px; font-size:11px; color:#00ff87; margin-bottom:24px; }

        .hero-stat { text-align:center; }
        .hero-stat-val { font-size:36px; font-weight:700; color:#00ff87; font-family:'Syne',sans-serif; line-height:1; }
        .hero-stat-label { font-size:10px; color:#3a5068; margin-top:6px; letter-spacing:1.5px; text-transform:uppercase; }

        .mock-card { background:#07101f; border:1px solid #122038; border-radius:10px; padding:14px; }
        .mock-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
        .mock-label { font-size:9px; color:#3a5068; letter-spacing:1px; }
        .mock-val { font-size:14px; font-weight:700; font-family:'Syne',sans-serif; }
        .mock-badge { font-size:8px; padding:2px 8px; border-radius:4px; font-weight:700; }

        .cta-section { background:rgba(0,255,135,.04); border-top:1px solid rgba(0,255,135,.1); border-bottom:1px solid rgba(0,255,135,.1); padding:80px 32px; text-align:center; }
      `}</style>

      {/* ── NAV ── */}
      <nav className="lp-nav">
        <a className="lp-logo" href="/">
          <div className="lp-logo-mark">P</div>
          <span className="lp-logo-text">PackPulse</span>
        </a>
        <div className="lp-nav-right">
          <a href="#how" style={{color:"#3a5068",textDecoration:"none",fontSize:12}}>How it works</a>
          <a href="#pricing" style={{color:"#3a5068",textDecoration:"none",fontSize:12,marginRight:4}}>Pricing</a>
          {isSignedIn ? (
            <button className="lp-btn-cta" onClick={onEnterApp}>Open App →</button>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="lp-btn-ghost">Sign in</button>
              </SignInButton>
              <button className="lp-btn-cta" onClick={onEnterApp}>Get Access →</button>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <div style={{paddingTop:120,paddingBottom:0,textAlign:"center",padding:"120px 32px 0",maxWidth:900,margin:"0 auto"}}>
        <div className="ev-badge fade-up">
          <span className="glow-dot"/> LIVE · Tracking {" "}
          <span style={{fontWeight:700}}>51 packs</span> · Updated 30s ago
        </div>

        <h1 className="fade-up-2" style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(42px,7vw,80px)",fontWeight:800,color:"#fff",lineHeight:1.05,marginBottom:20,letterSpacing:"-2px"}}>
          Stop buying packs<br/>
          <span style={{color:"#00ff87"}}>blind.</span>
        </h1>

        <p className="fade-up-3" style={{fontSize:"clamp(14px,2vw,18px)",color:"#3a5068",lineHeight:1.7,maxWidth:560,margin:"0 auto 36px"}}>
          Real-time expected value for every Courtyard.io mystery pack.
          See the actual cash you'd get after all fees — before you rip.
        </p>

        <div className="fade-up-3" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,flexWrap:"wrap",marginBottom:64}}>
          <button className="lp-btn-cta" onClick={onEnterApp} style={{padding:"13px 28px",fontSize:14,borderRadius:8}}>
            Get Early Access — $29/mo →
          </button>
          <button onClick={onEnterApp} style={{padding:"13px 28px",fontSize:14,border:"1px solid rgba(255,255,255,.1)",borderRadius:8,color:"#c8dff0",background:"transparent",cursor:"pointer",fontFamily:"inherit",borderRadius:"8px"}}>
            See Live Data Free
          </button>
        </div>

        {/* Hero stats row */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:24,maxWidth:700,margin:"0 auto 64px",padding:"24px",background:"rgba(255,255,255,.02)",borderRadius:12,border:"1px solid rgba(255,255,255,.05)"}}>
          {[
            {val:51,     suffix:"",  label:"Packs tracked"},
            {val:5137564,suffix:"+", label:"Pulls analyzed"},
            {val:30,     suffix:"s", label:"Update speed"},
            {val:100,    suffix:"%", label:"Fee transparency"},
          ].map(s => (
            <div key={s.label} className="hero-stat">
              <div className="hero-stat-val"><Counter end={s.val} suffix={s.suffix}/></div>
              <div className="hero-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── LIVE TICKER ── */}
      <div className="ticker-wrap">
        <div className="ticker-inner" ref={tickerRef}>
          {[...TICKER_ITEMS,...TICKER_ITEMS].map((item,i)=>(
            <div key={i} className="ticker-item">
              <span style={{color:"#3a5068"}}>{item.user}</span>
              <span style={{color:"#c8dff0",fontWeight:700}}>{item.card}</span>
              <span style={{color:item.win?"#00ff87":"#ff3860",fontWeight:700}}>${item.fmv.toLocaleString()}</span>
              <span style={{color:"#1e3a50"}}>from {item.pack}</span>
              <span style={{color:"rgba(255,255,255,.1)"}}>·</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── MOCK DASHBOARD PREVIEW ── */}
      <div style={{maxWidth:900,margin:"72px auto",padding:"0 32px"}}>
        <div style={{background:"#07101f",border:"1px solid #122038",borderRadius:16,padding:24,position:"relative",overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#ff5f57"}}/>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#febc2e"}}/>
            <div style={{width:10,height:10,borderRadius:"50%",background:"#28c840"}}/>
            <span style={{marginLeft:8,fontSize:10,color:"#3a5068",fontFamily:"Space Mono,monospace"}}>packpulse.io/dashboard</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            {[
              {label:"EV PACKS",    val:"5/13",    sub:"above break-even",   c:"#00ff87"},
              {label:"BEST EV NOW", val:"2.686x",  sub:"Pokémon Pro Pack",   c:"#00ff87"},
              {label:"AVG EV",      val:"0.999x",  sub:"Market average",     c:"#ff3860"},
              {label:"PULLS TRACKED",val:"50",     sub:"live data",          c:"#fff"},
            ].map(s=>(
              <div key={s.label} className="mock-card">
                <div className="mock-label" style={{marginBottom:6}}>{s.label}</div>
                <div className="mock-val" style={{color:s.c,fontSize:20}}>{s.val}</div>
                <div style={{fontSize:9,color:"#3a5068",marginTop:4}}>{s.sub}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginTop:10}}>
            {[
              {name:"Pokémon Platinum Pack", ev:1.663, bb:1.407, signal:"STRONG BUY", sc:"#00ff87", sb:"rgba(0,255,135,.08)"},
              {name:"Basketball Pro Pack",   ev:1.354, bb:1.145, signal:"BUY",        sc:"#00ff87", sb:"rgba(0,255,135,.05)"},
              {name:"Pokémon Starter Pack",  ev:0.986, bb:0.834, signal:"WAIT",       sc:"#ffd166", sb:"rgba(255,209,102,.05)"},
            ].map(p=>(
              <div key={p.name} className="mock-card">
                <div style={{fontWeight:700,fontSize:11,color:"#fff",marginBottom:8}}>{p.name}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
                  <div>
                    <div className="mock-label">EV RATIO</div>
                    <div className="mock-val" style={{color:"#00ff87",fontSize:16}}>{p.ev}x</div>
                  </div>
                  <div>
                    <div className="mock-label">BUYBACK EV ★</div>
                    <div className="mock-val" style={{color:"#ffd166",fontSize:16}}>{p.bb}x</div>
                  </div>
                </div>
                <div style={{background:p.sb,border:`1px solid ${p.sc}33`,borderRadius:5,padding:"4px 8px",fontSize:9,color:p.sc,fontWeight:700}}>{p.signal}</div>
              </div>
            ))}
          </div>
          {/* Glow effect */}
          <div style={{position:"absolute",top:-60,right:-60,width:200,height:200,background:"radial-gradient(circle,rgba(0,255,135,.08) 0%,transparent 70%)",pointerEvents:"none"}}/>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="section">
        <div className="section-label">Features</div>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(28px,4vw,42px)",fontWeight:800,color:"#fff",marginBottom:48,letterSpacing:"-1px",lineHeight:1.1}}>
          Everything you need<br/>to buy smarter.
        </h2>
        <div className="feat-grid">
          {FEATURES.map((f,i)=>(
            <div key={i} className="feat-card">
              <div style={{fontSize:22,color:f.accent,marginBottom:14,fontWeight:700}}>{f.icon}</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:"#fff",marginBottom:4}}>{f.title}</div>
              <div style={{fontSize:10,color:f.accent,marginBottom:10,letterSpacing:.5}}>{f.sub}</div>
              <div style={{fontSize:12,color:"#3a5068",lineHeight:1.7}}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div id="how" className="section" style={{borderTop:"1px solid rgba(255,255,255,.04)"}}>
        <div className="section-label">How it works</div>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(28px,4vw,42px)",fontWeight:800,color:"#fff",marginBottom:56,letterSpacing:"-1px",lineHeight:1.1}}>
          Card counting,<br/>but for mystery packs.
        </h2>
        <div className="steps-row">
          {STEPS.map((s,i)=>(
            <div key={i} style={{position:"relative"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:48,fontWeight:800,color:"rgba(0,255,135,.07)",lineHeight:1,marginBottom:16}}>{s.n}</div>
              <div style={{width:40,height:2,background:"rgba(0,255,135,.3)",marginBottom:20}}/>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:18,color:"#fff",marginBottom:10}}>{s.title}</div>
              <div style={{fontSize:13,color:"#3a5068",lineHeight:1.7}}>{s.body}</div>
              {i<2&&<div style={{position:"absolute",top:36,right:-16,width:1,height:"60%",background:"rgba(255,255,255,.06)"}}/>}
            </div>
          ))}
        </div>
      </div>

      {/* ── PRICING ── */}
      <div id="pricing" className="section" style={{borderTop:"1px solid rgba(255,255,255,.04)"}}>
        <div className="section-label">Pricing</div>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(28px,4vw,42px)",fontWeight:800,color:"#fff",marginBottom:12,letterSpacing:"-1px",lineHeight:1.1}}>
          Lock in your rate<br/>before it goes up.
        </h2>
        <p style={{color:"#3a5068",fontSize:14,marginBottom:48}}>Price increases as more members join. Earlier is cheaper.</p>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,maxWidth:900,margin:"0 auto"}}>
          {/* Current tier */}
          <div style={{gridColumn:"span 3"}} />
          {[
            {label:"Early Access",  price:29, spots:"First 100 members",  current:true,  desc:"Lock in $29/mo for life. Price rises to $49 after 100 members."},
            {label:"Growth",        price:49, spots:"Members 101–200",     current:false, desc:"Available after Early Access fills. Still below the final price."},
            {label:"Standard",      price:99, spots:"200+ members",        current:false, desc:"Full price tier. Open to all after Growth tier fills."},
          ].map((p,i)=>(
            <div key={i} style={{
              background: p.current ? "rgba(0,255,135,.04)" : "#07101f",
              border: p.current ? "1px solid rgba(0,255,135,.3)" : "1px solid rgba(255,255,255,.07)",
              borderRadius:12,
              padding:24,
              position:"relative",
              opacity: !p.current ? .55 : 1,
            }}>
              {p.current && <div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:"#00ff87",color:"#000",fontSize:9,fontWeight:700,padding:"3px 12px",borderRadius:20,whiteSpace:"nowrap"}}>CURRENT TIER</div>}
              <div style={{fontSize:11,color:"#3a5068",marginBottom:8}}>{p.label}</div>
              <div style={{display:"flex",alignItems:"baseline",gap:4,marginBottom:6}}>
                <span style={{fontSize:36,fontWeight:800,color:p.current?"#00ff87":"#c8dff0",fontFamily:"'Syne',sans-serif"}}>${p.price}</span>
                <span style={{fontSize:12,color:"#3a5068"}}>/mo</span>
              </div>
              <div style={{fontSize:10,color:"#3a5068",marginBottom:12}}>{p.spots}</div>
              <div style={{fontSize:11,color:"#3a5068",lineHeight:1.6,marginBottom:p.current?16:0}}>{p.desc}</div>
              {p.current && (
                <>
                  <div style={{marginBottom:8}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:9,marginBottom:5}}>
                      <span style={{color:"#3a5068"}}>{100-remaining}/100 spots claimed</span>
                      <span style={{color:"#ffd166",fontWeight:700}}>{remaining} left</span>
                    </div>
                    <div style={{height:4,background:"#122038",borderRadius:2,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:"#00ff87",borderRadius:2}}/>
                    </div>
                  </div>
                  {isSignedIn ? (
                    <button onClick={onEnterApp} style={{width:"100%",padding:"12px",background:"#00ff87",border:"none",borderRadius:8,fontWeight:800,fontSize:13,color:"#000",cursor:"pointer",fontFamily:"inherit"}}>
                      Get Early Access →
                    </button>
                  ) : (
                      <button onClick={onEnterApp} style={{width:"100%",padding:"13px",background:"#00ff87",border:"none",borderRadius:8,fontWeight:800,fontSize:13,color:"#000",cursor:"pointer",fontFamily:"inherit"}}>
                        Get Early Access — $29/mo →
                      </button>
                  )}
                  <div style={{textAlign:"center",fontSize:9,color:"#3a5068",marginTop:8}}>Cancel anytime · Instant access · 7-day refund</div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Free tier note */}
        <div style={{textAlign:"center",marginTop:32,padding:"20px",background:"rgba(255,255,255,.02)",borderRadius:8,border:"1px solid rgba(255,255,255,.05)",maxWidth:500,margin:"32px auto 0"}}>
          <div style={{fontWeight:700,color:"#c8dff0",marginBottom:4,fontSize:13}}>Free account available</div>
          <div style={{fontSize:11,color:"#3a5068"}}>Create a free account to see live EV ratios. Upgrade to Pro to unlock Buyback EV, Decision Engine, push alerts, and everything that actually helps you profit.</div>
        </div>
      </div>

      {/* ── CTA SECTION ── */}
      <div className="cta-section">
        <div style={{maxWidth:560,margin:"0 auto"}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(28px,4vw,48px)",fontWeight:800,color:"#fff",marginBottom:16,letterSpacing:"-1px",lineHeight:1.1}}>
            The math doesn't lie.<br/>
            <span style={{color:"#00ff87"}}>Check it before you rip.</span>
          </div>
          <p style={{color:"#3a5068",fontSize:14,marginBottom:32,lineHeight:1.7}}>
            Real-time EV data for all 51 Courtyard packs. Free to start — upgrade when you're ready.
          </p>
          <button className="lp-btn-cta" onClick={onEnterApp} style={{padding:"15px 36px",fontSize:15,borderRadius:9}}>
            Get Early Access — $29/mo →
          </button>
          <div style={{marginTop:12,fontSize:11,color:"#3a5068",fontFamily:"Space Mono,monospace"}}>
            First 100 members lock in $29/mo · Free tier available
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:8}}>
          <div style={{width:20,height:20,background:"#00ff87",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#000",fontWeight:700}}>P</div>
          <span style={{color:"#c8dff0",fontWeight:700,fontFamily:"'Syne',sans-serif"}}>PackPulse</span>
        </div>
        <div style={{marginBottom:8}}>
          For educational purposes only · Not financial advice · Pack outcomes are random
        </div>
        <div>Not affiliated with Courtyard.io · © 2026 PackPulse</div>
      </footer>

    </div>
  );
}
