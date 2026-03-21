import { useEffect, useRef, useState } from "react";
import { SignInButton, useUser } from "@clerk/clerk-react";

const TICKER_ITEMS = [
  { user:"@silverdestiny4121", card:"2024 Charizard ex SAR",         fmv:1240, pack:"Pokémon Master",  win:true  },
  { user:"@callyh101992",     card:"2024 Dialga G Crosshatch",       fmv:180,  pack:"Pokémon Pro",     win:true  },
  { user:"@bhuson7",          card:"2021 PSA 10 Mike Trout",         fmv:890,  pack:"Baseball Master", win:true  },
  { user:"@trustmrr",         card:"2019 Zion Williamson RC",        fmv:420,  pack:"Basketball Pro",  win:true  },
  { user:"@ferociouspave9385",card:"2020 Patrick Mahomes Gold",      fmv:310,  pack:"Football Master", win:true  },
  { user:"@wisefate2286",     card:"2022 Pokémon Sword & Shield",    fmv:67,   pack:"Pokémon Starter", win:false },
  { user:"@infernalcolos3255",card:"1999 Base Set Charizard Holo",   fmv:4200, pack:"Pokémon Legend",  win:true  },
  { user:"@jhome13",          card:"2024 One Piece Law Alt Art",     fmv:280,  pack:"One Piece Master",win:true  },
  { user:"@limitedanime7838", card:"Magic: The Gathering Final FF",  fmv:6,    pack:"MTG Sealed",     win:false },
  { user:"@cy_backz",         card:"2022 Shohei Ohtani PSA 10",     fmv:650,  pack:"Baseball Ultra",  win:true  },
];

const REAL_PULLS = [
  { card:"Houndoom Aquapolis",   price:1089, pack:"$99 pack",  img:"https://static.courtyard.io/graded-cards-renders/PSA%20132189300/render_front.webp" },
  { card:"Dialga G Crosshatch",  price:160,  pack:"$100 pack", img:"https://static.courtyard.io/graded-cards-renders/BGS%2046126820/render_front.webp" },
  { card:"Pheromosa & Buzzwole", price:113,  pack:"$50 pack",  img:"https://static.courtyard.io/graded-cards-renders/PSA%20132117882/render_front.webp" },
  { card:"Mew Galarian Gallery", price:110,  pack:"$50 pack",  img:"https://static.courtyard.io/graded-cards-renders/PSA%20131988773/render_front.webp" },
  { card:"Zacian V Full Art",    price:86,   pack:"$50 pack",  img:"https://static.courtyard.io/graded-cards-renders/PSA%20131988769/render_front.webp" },
];

const FEATURES = [
  { icon:"◈", title:"Live EV Ratio",        desc:"Real-time expected value calculated from 5M+ tracked pulls with exponential decay weighting. Not naive midpoints, real calibrated data.", accent:"#00ff87" },
  { icon:"◉", title:"TradingView-Style Chart",desc:"Watch the EV ratio move like a stock ticker. Multiple timeframes from 1-minute to daily. See exactly when packs cross above or below break-even.", accent:"#4f8fff" },
  { icon:"◆", title:"Buyback EV ★ Exclusive",desc:"The actual cash in your hand after Courtyard's 10% cut + 6% processing fee. Nobody else shows you this number. This is what actually matters.", accent:"#ffd166" },
  { icon:"◇", title:"Pull Feed",             desc:"Live feed of recent pulls with card images, FMV values, and tier badges. See what's actually coming out of every pack right now.", accent:"#06d6a0" },
  { icon:"⚡", title:"+EV Alerts",           desc:"Get notified when any pack crosses above 1.0x EV ratio. Buy when the math is in your favor — not when you feel lucky.", accent:"#ff6b6b" },
  { icon:"◎", title:"Multi-Pack Rankings",   desc:"Compare all packs side by side. Instantly see which pack is the best value at any given moment across all 51 active packs.", accent:"#c77dff" },
];

function Counter({ end, duration=2000, suffix="" }: { end:number; duration?:number; suffix?:string }) {
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
        if (p < 1) requestAnimationFrame(tick); else setCount(end);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function LandingPage({ onEnterApp }: { onEnterApp: () => void }) {
  const { isSignedIn } = useUser();
  const [stats, setStats] = useState<any>(null);
  const [liveEV, setLiveEV] = useState<any>(null);

  useEffect(() => {
    fetch("/api/founding-stats").then(r => r.json()).then(setStats).catch(() => {});
    fetch("/api/pulls").then(r => r.json()).then(d => {
      if (d.packs?.length) setLiveEV(d);
    }).catch(() => {});
  }, []);

  const price     = stats?.currentPrice ?? 29;
  const remaining = stats?.foundingRemaining ?? 100;
  const filled    = 100 - remaining;
  const pct       = Math.round((filled / 100) * 100);
  const totalPaid = stats?.totalPaid ?? 0;

  const bestPack  = liveEV?.packs?.[0];
  const starterEV = liveEV?.packs?.find((p:any) => p.id?.includes('starter'))?.evRatio?.toFixed(3);
  const proEV     = liveEV?.packs?.find((p:any) => p.id?.includes('pro') && p.id?.includes('pkmn'))?.evRatio?.toFixed(3);

  return (
    <div style={{background:"#030810",color:"#c8dff0",fontFamily:"'Space Mono','Courier New',monospace",overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        .lp-nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:0 40px;height:60px;display:flex;align-items:center;justify-content:space-between;background:rgba(3,8,16,.9);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.05)}
        .nav-logo{display:flex;align-items:center;gap:9px;text-decoration:none}
        .nav-logo-mark{width:28px;height:28px;background:#00ff87;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#000}
        .nav-logo-text{font-size:15px;font-weight:700;color:#fff;font-family:'Syne',sans-serif;letter-spacing:-.3px}
        .nav-live{display:flex;align-items:center;gap:6px;font-size:11px;color:#00ff87}
        .nav-dot{width:6px;height:6px;border-radius:50%;background:#00ff87;animation:blink 2s infinite}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        .nav-links{display:flex;align-items:center;gap:24px}
        .nav-link{color:#3a5068;text-decoration:none;font-size:12px;transition:color .15s}
        .nav-link:hover{color:#c8dff0}
        .nav-cta{padding:7px 18px;background:#00ff87;color:#000;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s}
        .nav-cta:hover{background:#00e87a;transform:translateY(-1px)}

        .ticker-bar{background:#040c1a;border-bottom:1px solid rgba(0,255,135,.08);overflow:hidden;padding:9px 0;position:relative}
        .ticker-inner{display:flex;gap:64px;width:max-content;animation:scroll 50s linear infinite}
        @keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .ticker-item{display:flex;align-items:center;gap:8px;white-space:nowrap;font-size:11px}
        .ticker-bar::before,.ticker-bar::after{content:'';position:absolute;top:0;bottom:0;width:60px;z-index:2;pointer-events:none}
        .ticker-bar::before{left:0;background:linear-gradient(90deg,#040c1a,transparent)}
        .ticker-bar::after{right:0;background:linear-gradient(-90deg,#040c1a,transparent)}

        .live-stats{background:#040c1a;border-bottom:1px solid rgba(255,255,255,.05);padding:12px 40px;display:flex;align-items:center;gap:0;overflow-x:auto}
        .stat-cell{flex:1;min-width:120px;text-align:center;padding:0 20px;border-right:1px solid rgba(255,255,255,.06)}
        .stat-cell:last-child{border-right:none}
        .stat-label{font-size:9px;color:#3a5068;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px}
        .stat-val{font-size:18px;font-weight:700;font-family:'Syne',sans-serif;color:#00ff87}
        .stat-sub{font-size:9px;color:#3a5068;margin-top:2px}

        .hero{text-align:center;padding:90px 32px 60px;max-width:820px;margin:0 auto}
        .hero-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(0,255,135,.06);border:1px solid rgba(0,255,135,.18);border-radius:20px;padding:6px 14px;font-size:11px;color:#00ff87;margin-bottom:28px}
        .hero-h1{font-family:'Syne',sans-serif;font-size:clamp(52px,8vw,88px);font-weight:800;color:#fff;line-height:1;letter-spacing:-3px;margin-bottom:20px}
        .hero-h1 span{color:#00ff87}
        .hero-sub{font-size:clamp(14px,2vw,17px);color:#3a5068;line-height:1.7;max-width:520px;margin:0 auto 36px;font-family:'Space Mono',monospace}
        .hero-cta-row{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin-bottom:20px}
        .btn-primary{padding:14px 32px;background:#00ff87;color:#000;border:none;border-radius:8px;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;transition:all .15s}
        .btn-primary:hover{background:#00e87a;transform:translateY(-2px)}
        .btn-secondary{padding:14px 24px;background:transparent;color:#c8dff0;border:1px solid rgba(255,255,255,.12);border-radius:8px;font-size:13px;cursor:pointer;font-family:inherit;transition:all .15s}
        .btn-secondary:hover{border-color:rgba(255,255,255,.25);color:#fff}
        .hero-progress-row{display:flex;align-items:center;justify-content:center;gap:8px;font-size:10px;color:#3a5068}
        .progress-bar{width:120px;height:3px;background:#122038;border-radius:2px;overflow:hidden}
        .progress-fill{height:100%;background:#00ff87;border-radius:2px}

        .section{padding:88px 40px;max-width:1100px;margin:0 auto}
        .section-tag{font-size:10px;letter-spacing:3px;color:#00ff87;text-transform:uppercase;margin-bottom:10px;font-weight:700}
        .section-h2{font-family:'Syne',sans-serif;font-size:clamp(30px,4vw,46px);font-weight:800;color:#fff;line-height:1.05;letter-spacing:-1.5px;margin-bottom:16px}
        .section-sub{font-size:14px;color:#3a5068;line-height:1.7;max-width:520px;margin-bottom:48px}

        .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.05);border-radius:14px;overflow:hidden}
        @media(max-width:768px){.feat-grid{grid-template-columns:1fr}}
        .feat-card{background:#06101e;padding:28px 26px;transition:background .2s}
        .feat-card:hover{background:#0a1625}
        .feat-icon{font-size:20px;margin-bottom:14px}
        .feat-title{font-family:'Syne',sans-serif;font-weight:700;font-size:15px;color:#fff;margin-bottom:8px}
        .feat-desc{font-size:11px;color:#3a5068;line-height:1.75}

        .pulls-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}
        @media(max-width:900px){.pulls-grid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:600px){.pulls-grid{grid-template-columns:repeat(2,1fr)}}
        .pull-card{background:#07101f;border:1px solid #122038;border-radius:10px;overflow:hidden;transition:transform .2s,border-color .2s}
        .pull-card:hover{transform:translateY(-3px);border-color:#1e3a50}
        .pull-img{width:100%;aspect-ratio:3/4;object-fit:cover;background:#040c1a;display:block}
        .pull-info{padding:10px}
        .pull-name{font-size:11px;font-weight:700;color:#fff;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .pull-price{font-size:14px;font-weight:800;color:#00ff87;font-family:'Syne',sans-serif}
        .pull-pack{font-size:9px;color:#3a5068;margin-top:2px}

        .steps-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:40px}
        @media(max-width:768px){.steps-grid{grid-template-columns:1fr;gap:28px}}
        .step-num{font-family:'Syne',sans-serif;font-size:56px;font-weight:800;color:rgba(0,255,135,.06);line-height:1;margin-bottom:12px}
        .step-line{width:36px;height:2px;background:rgba(0,255,135,.35);margin-bottom:18px}
        .step-title{font-family:'Syne',sans-serif;font-weight:700;font-size:17px;color:#fff;margin-bottom:8px}
        .step-desc{font-size:12px;color:#3a5068;line-height:1.75}

        .pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;max-width:860px;margin:0 auto}
        @media(max-width:768px){.pricing-grid{grid-template-columns:1fr}}
        .price-card{background:#06101e;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:24px;position:relative;opacity:.55}
        .price-card.current{border-color:rgba(0,255,135,.3);background:rgba(0,255,135,.03);opacity:1}
        .price-badge{position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:#00ff87;color:#000;font-size:9px;font-weight:800;padding:3px 12px;border-radius:20px;white-space:nowrap;font-family:inherit}
        .price-tier{font-size:10px;color:#3a5068;letter-spacing:1px;margin-bottom:8px;text-transform:uppercase}
        .price-amount{display:flex;align-items:baseline;gap:3px;margin-bottom:4px}
        .price-num{font-family:'Syne',sans-serif;font-size:40px;font-weight:800;color:#00ff87;line-height:1}
        .price-mo{font-size:13px;color:#3a5068}
        .price-spots{font-size:10px;color:#3a5068;margin-bottom:12px}
        .price-desc{font-size:11px;color:#3a5068;line-height:1.6;margin-bottom:16px}
        .price-bar-row{display:flex;justify-content:space-between;font-size:9px;margin-bottom:5px}
        .price-bar{height:4px;background:#122038;border-radius:2px;overflow:hidden;margin-bottom:14px}
        .price-bar-fill{height:100%;background:#00ff87;border-radius:2px;transition:width .5s}
        .price-members{text-align:center;font-size:9px;color:#3a5068;margin-top:8px}
        .price-cta{width:100%;padding:12px;background:#00ff87;color:#000;border:none;border-radius:8px;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit;transition:all .15s;margin-bottom:6px}
        .price-cta:hover{background:#00e87a}
        .price-locked{width:100%;padding:10px;background:transparent;color:#3a5068;border:1px solid rgba(255,255,255,.06);border-radius:8px;font-size:11px;font-family:inherit;cursor:default}
        .price-trust{text-align:center;font-size:9px;color:#3a5068;display:flex;justify-content:center;gap:12px;flex-wrap:wrap}

        .cta-section{background:rgba(0,255,135,.03);border-top:1px solid rgba(0,255,135,.1);padding:80px 40px;text-align:center}
        .cta-h2{font-family:'Syne',sans-serif;font-size:clamp(28px,4vw,50px);font-weight:800;color:#fff;line-height:1.05;letter-spacing:-1.5px;margin-bottom:14px}
        .cta-sub{font-size:14px;color:#3a5068;margin-bottom:32px;line-height:1.7}

        .lp-footer{border-top:1px solid rgba(255,255,255,.05);padding:28px 40px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;font-size:10px;color:#3a5068}

        .divider{border:none;border-top:1px solid rgba(255,255,255,.05);margin:0}

        @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        .fu1{animation:fadeUp .7s ease forwards}
        .fu2{animation:fadeUp .7s .12s ease forwards;opacity:0}
        .fu3{animation:fadeUp .7s .24s ease forwards;opacity:0}
        .fu4{animation:fadeUp .7s .36s ease forwards;opacity:0}
      `}</style>

      {/* NAV */}
      <nav className="lp-nav">
        <a className="nav-logo" href="/">
          <div className="nav-logo-mark">P</div>
          <span className="nav-logo-text">PackPulse</span>
        </a>
        <div className="nav-live">
          <span className="nav-dot"/>
          Tracking live
        </div>
        <div className="nav-links">
          <a className="nav-link" href="#features">Features</a>
          <a className="nav-link" href="#how">How it works</a>
          <a className="nav-link" href="#pricing">Pricing</a>
          {isSignedIn
            ? <button className="nav-cta" onClick={onEnterApp}>Open App →</button>
            : <button className="nav-cta" onClick={onEnterApp}>Join Now →</button>
          }
        </div>
      </nav>

      {/* LIVE TICKER */}
      <div style={{paddingTop:60}}>
        <div className="ticker-bar">
          <div className="ticker-inner">
            {[...TICKER_ITEMS,...TICKER_ITEMS].map((t,i)=>(
              <div key={i} className="ticker-item">
                <span style={{color:"#3a5068"}}>{t.user}</span>
                <span style={{color:"#c8dff0",fontWeight:700}}>{t.card}</span>
                <span style={{color:t.win?"#00ff87":"#ff3860",fontWeight:700}}>${t.fmv.toLocaleString()}</span>
                {t.win
                  ? <span style={{color:"rgba(0,255,135,.4)",fontSize:9}}>(+${(t.fmv - parseInt(t.pack)).toFixed(0)})</span>
                  : <span style={{color:"rgba(255,56,96,.4)",fontSize:9}}>(-${Math.abs(parseInt(t.pack) - t.fmv)})</span>
                }
                <span style={{color:"rgba(255,255,255,.07)"}}>·</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LIVE STATS BAR */}
      <div className="live-stats">
        {[
          { label:"STARTER PACK EV", val: starterEV ?? "1.002", sub:"", green:true },
          { label:"PRO PACK EV",     val: proEV ?? "0.996",    sub:"", green: parseFloat(proEV??'0') >= 1 },
          { label:"BEST VALUE NOW",  val: bestPack?.name?.split(' ').slice(-2).join(' ')??'PLATINUM', sub:"", green:true },
          { label:"PULLS TRACKED",   val: "5,137,564",          sub:"and counting", green:false },
          { label:"UPDATED",         val: "30s ago",            sub:"live data",    green:false },
        ].map((s,i)=>(
          <div key={i} className="stat-cell">
            <div className="stat-label">{s.label}</div>
            <div className="stat-val" style={{color:s.green?"#00ff87":"#fff"}}>{s.val}</div>
            {s.sub&&<div className="stat-sub">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* HERO */}
      <div className="hero">
        <div className="hero-pill fu1">
          <span className="nav-dot" style={{width:5,height:5}}/>
          <Counter end={5137564} suffix=" pulls tracked and counting"/>
        </div>

        <h1 className="hero-h1 fu2">
          Stop buying packs <span>blind.</span>
        </h1>

        <p className="hero-sub fu3">
          Real-time expected value tracking for every Courtyard.io mystery pack.
          See the real math before you rip.
        </p>

        <div className="hero-cta-row fu4">
          <button className="btn-primary" onClick={onEnterApp}>
            Join Now — ${price}/mo →
          </button>
          <button className="btn-secondary" onClick={onEnterApp}>
            See Live Data
          </button>
        </div>

        <div className="hero-progress-row fu4">
          <span>{filled}/100 filled</span>
          <div className="progress-bar">
            <div className="progress-fill" style={{width:`${pct}%`}}/>
          </div>
          <span style={{color:remaining<=20?"#ff3860":"#ffd166"}}>{remaining} left</span>
        </div>
      </div>

      <hr className="divider"/>

      {/* REAL PULLS SECTION */}
      <div className="section">
        <div className="section-tag">Real Pulls</div>
        <h2 className="section-h2">See what members are pulling.</h2>
        <div className="pulls-grid">
          {REAL_PULLS.map((p,i)=>(
            <div key={i} className="pull-card">
              <img className="pull-img" src={p.img} alt={p.card}
                onError={(e)=>{(e.target as HTMLImageElement).src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='133' viewBox='0 0 100 133'%3E%3Crect width='100' height='133' fill='%23070f1c'/%3E%3C/svg%3E";}}
              />
              <div className="pull-info">
                <div className="pull-name">{p.card}</div>
                <div className="pull-price">${p.price.toLocaleString()}</div>
                <div className="pull-pack">from a {p.pack}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr className="divider"/>

      {/* FEATURES */}
      <div id="features" className="section">
        <div className="section-tag">Features</div>
        <h2 className="section-h2">Everything you need<br/>to buy smarter.</h2>
        <div className="feat-grid">
          {FEATURES.map((f,i)=>(
            <div key={i} className="feat-card">
              <div className="feat-icon" style={{color:f.accent}}>{f.icon}</div>
              <div className="feat-title">{f.title}</div>
              <div className="feat-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <hr className="divider"/>

      {/* HOW IT WORKS */}
      <div id="how" className="section">
        <div className="section-tag">How it works</div>
        <h2 className="section-h2">Card counting,<br/>but for mystery packs.</h2>
        <div className="steps-grid">
          {[
            { n:"01", title:"We track every pull", desc:"Our system fetches Courtyard data every 30 seconds — pull values, odds shifts, pool changes — around the clock across all 51 active packs." },
            { n:"02", title:"We calibrate the real EV", desc:"Using decay-weighted averages across 5M+ tracked pulls, we calculate what each pack is actually worth right now. No assumptions, just data." },
            { n:"03", title:"You buy with an edge", desc:"Check the EV ratio before you rip. Above 1.0x? The pack is worth more than you're paying. Below 1.0x? Maybe wait." },
          ].map((s,i)=>(
            <div key={i}>
              <div className="step-num">{s.n}</div>
              <div className="step-line"/>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <hr className="divider"/>

      {/* PRICING */}
      <div id="pricing" className="section">
        <div style={{textAlign:"center",marginBottom:48}}>
          <div className="section-tag" style={{justifyContent:"center",display:"flex"}}>Pricing</div>
          <h2 className="section-h2" style={{marginBottom:8}}>Lock in your rate<br/>before it goes up.</h2>
          <p style={{color:"#3a5068",fontSize:13}}>Price increases as more members join. Earlier is always cheaper.</p>
        </div>

        <div className="pricing-grid">
          {/* SOLD OUT tier — to be added after first 100 fill */}
          <div className="price-card">
            <div className="price-tier">Founding</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div className="price-amount">
                <span style={{fontSize:20,fontWeight:700,color:"#3a5068",fontFamily:"Syne,sans-serif",textDecoration:"line-through"}}>&nbsp;</span>
              </div>
            </div>
            <div className="price-spots" style={{color:"#3a5068"}}>Members 1–? </div>
            <div className="price-desc">First tier — only available once. Members who joined at the very beginning, locked in for life.</div>
            <div className="price-locked" style={{textAlign:"center"}}>Sold Out</div>
          </div>

          {/* CURRENT TIER */}
          <div className="price-card current">
            <div className="price-badge">CURRENT TIER</div>
            <div className="price-tier">Early Access</div>
            <div className="price-amount">
              <span className="price-num">${price}</span>
              <span className="price-mo">/mo</span>
            </div>
            <div className="price-spots">Members 1–100</div>
            <div style={{marginBottom:12}}>
              <div className="price-bar-row">
                <span style={{color:"#3a5068"}}>{filled}/100 filled</span>
                <span style={{color:remaining<=20?"#ff3860":"#ffd166",fontWeight:700}}>{remaining} left</span>
              </div>
              <div className="price-bar">
                <div className="price-bar-fill" style={{width:`${pct}%`}}/>
              </div>
            </div>
            <button className="price-cta" onClick={onEnterApp}>Join Now →</button>
            <div className="price-members">{totalPaid > 0 ? `${totalPaid} active members` : "Be the first member"}</div>
            <div className="price-trust" style={{marginTop:10}}>
              <span>✓ Cancel anytime</span>
              <span>✓ Instant access</span>
              <span>✓ 7-day refund</span>
            </div>
          </div>

          {/* LOCKED */}
          <div className="price-card">
            <div className="price-tier">Standard</div>
            <div className="price-amount">
              <span style={{fontSize:20,fontWeight:700,color:"#3a5068",fontFamily:"Syne,sans-serif"}}>$99</span>
              <span className="price-mo">/mo</span>
            </div>
            <div className="price-spots">Members 200+</div>
            <div className="price-desc">Full price tier. Available after Growth tier fills. Includes all Pro features.</div>
            <div className="price-locked" style={{textAlign:"center"}}>Locked</div>
          </div>
        </div>
      </div>

      <hr className="divider"/>

      {/* FINAL CTA */}
      <div className="cta-section">
        <div style={{maxWidth:560,margin:"0 auto"}}>
          <h2 className="cta-h2">Don't buy blind.<br/>Check the math.</h2>
          <p className="cta-sub">Real-time EV data for all 51 Courtyard packs. No guesswork.</p>
          <button className="btn-primary" onClick={onEnterApp} style={{padding:"15px 40px",fontSize:15,borderRadius:9}}>
            Join Now — ${price}/mo →
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <div style={{width:20,height:20,background:"#00ff87",borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#000",fontWeight:800}}>P</div>
          <span style={{color:"#c8dff0",fontWeight:700,fontFamily:"Syne,sans-serif",fontSize:12}}>PackPulse</span>
          <span style={{color:"#3a5068"}}>· © 2026</span>
        </div>
        <div>For educational purposes only · Not financial advice · Not affiliated with Courtyard.io</div>
      </footer>
    </div>
  );
}
