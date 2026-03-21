import { useEffect, useRef, useState } from "react";
import { SignInButton, useUser } from "@clerk/clerk-react";

const TICKER_ITEMS = [
  { pack:"Pokémon Pro Pack",       ev:"2.686", signal:"BUY",        pos:true  },
  { pack:"Basketball Starter",     ev:"1.376", signal:"BUY",        pos:true  },
  { pack:"Pokémon Platinum Pack",  ev:"1.663", signal:"STRONG BUY", pos:true  },
  { pack:"Baseball Master Pack",   ev:"1.210", signal:"BUY",        pos:true  },
  { pack:"Pokémon Starter Pack",   ev:"0.986", signal:"WAIT",       pos:false },
  { pack:"Magic Booster",          ev:"1.094", signal:"BUY",        pos:true  },
  { pack:"One Piece Master Pack",  ev:"1.240", signal:"BUY",        pos:true  },
  { pack:"Football Pro Pack",      ev:"1.288", signal:"BUY",        pos:true  },
  { pack:"Lucky Legends Pack",     ev:"0.967", signal:"WAIT",       pos:false },
  { pack:"Wildcard Master Pack",   ev:"3.240", signal:"STRONG BUY", pos:true  },
  { pack:"Baseball Pro Pack",      ev:"1.180", signal:"BUY",        pos:true  },
  { pack:"Sports Starter Pack",    ev:"0.840", signal:"WAIT",       pos:false },
];

const FEATURES = [
  { icon:"📊", name:"Live EV Ratio",            tag:"REAL-TIME", desc:"Decay-weighted averages across 5M+ tracked pulls. Not naive midpoints — real calibrated data updated every 30 seconds across all 51 active packs." },
  { icon:"📈", name:"EV History Charts",         tag:"PRO",       desc:"Watch the EV ratio move like a stock ticker. See exactly when packs cross above or below break-even — and time your pull perfectly." },
  { icon:"🎯", name:"Buyback EV ★ Exclusive",    tag:"PRO",       desc:"Real cash in your hand after Courtyard's 10% cut + 6% processing fee. Nobody else shows you this number. The only EV that actually matters." },
  { icon:"📋", name:"Pull Feed",                 tag:"REAL-TIME", desc:"Live feed of every recent pull with card images, FMV values, and grades. See what's actually coming out of each pack right now." },
  { icon:"🔔", name:"+EV Alerts",                tag:"PRO",       desc:"Push notifications the moment any pack crosses 1.2x buyback EV. Buy when the math is in your favour — not when you feel lucky." },
  { icon:"🏆", name:"Multi-Pack Rankings",       tag:"REAL-TIME", desc:"Compare all 51 active Courtyard packs side by side. Instantly see which pack is the best value at any given moment." },
];

const STEPS = [
  { n:"01", title:"We track every pull",      desc:"Our system fetches Courtyard data every 30 seconds — pull values, odds shifts, pool changes — around the clock across all 51 active packs." },
  { n:"02", title:"We calibrate the real EV", desc:"Using decay-weighted averages across 5M+ tracked pulls, we calculate what each pack is actually worth right now. No assumptions, just data." },
  { n:"03", title:"You buy with an edge",     desc:"Check the EV ratio before you rip. Above 1.0x? The pack is worth more than you're paying. Below 1.0x? Maybe wait an hour." },
];

const PACK_GRID = [
  { name:"Pokémon Platinum Pack",  ev:"1.663", signal:"BUY",        cls:"buy"  },
  { name:"Wildcard Master Pack",   ev:"3.240", signal:"STRONG BUY", cls:"buy"  },
  { name:"Basketball Starter",     ev:"1.376", signal:"BUY",        cls:"buy"  },
  { name:"One Piece Master Pack",  ev:"1.240", signal:"BUY",        cls:"buy"  },
  { name:"Pokémon Starter Pack",   ev:"0.986", signal:"WAIT",       cls:"hold" },
  { name:"Lucky Legends Pack",     ev:"0.097", signal:"SKIP",       cls:"skip" },
];

function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const s = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - s) / 2000, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setVal(Math.floor(ease * end));
        if (p < 1) requestAnimationFrame(tick);
        else setVal(end);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

export default function LandingPage({ onEnterApp }: { onEnterApp: () => void }) {
  const { isSignedIn } = useUser();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch("/api/founding-stats").then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  const price     = stats?.currentPrice ?? 29;
  const remaining = stats?.foundingRemaining ?? 100;
  const filled    = 100 - remaining;
  const pct       = Math.round((filled / 100) * 100);

  return (
    <div style={{background:"#060608",minHeight:"100vh",color:"#f0f0f0"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700&display=swap');
        :root{--bg:#060608;--surface:#0d0d10;--card:#111115;--border:rgba(255,255,255,0.07);--green:#00ff88;--green-muted:rgba(0,255,136,0.08);--text:#f0f0f0;--muted:#666672;--mono:'Space Mono',monospace;--sans:'DM Sans',sans-serif;--display:'Syne',sans-serif}
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{background:var(--bg);color:var(--text);font-family:var(--sans);overflow-x:hidden;-webkit-font-smoothing:antialiased}

        .lp-nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:18px 48px;background:rgba(6,6,8,.88);backdrop-filter:blur(16px);border-bottom:1px solid var(--border)}
        .lp-logo{font-family:var(--display);font-size:20px;font-weight:800;color:var(--green);letter-spacing:-.5px;display:flex;align-items:center;gap:8px;text-decoration:none}
        .logo-dot{width:8px;height:8px;border-radius:50%;background:var(--green);animation:pdot 2s ease-in-out infinite}
        @keyframes pdot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.7)}}
        .nav-links{display:flex;align-items:center;gap:32px;list-style:none}
        .nav-links a{font-size:13px;color:var(--muted);text-decoration:none;font-weight:500;transition:color .2s}
        .nav-links a:hover{color:var(--text)}
        .nav-actions{display:flex;gap:10px;align-items:center}
        .btn-ghost{background:none;border:1px solid var(--border);color:var(--muted);padding:8px 18px;border-radius:6px;font-size:13px;cursor:pointer;font-family:var(--sans);transition:all .2s}
        .btn-ghost:hover{border-color:var(--green);color:var(--green)}
        .btn-green{background:var(--green);color:#000;padding:9px 20px;border-radius:6px;font-size:13px;font-weight:700;border:none;cursor:pointer;font-family:var(--sans);transition:all .2s}
        .btn-green:hover{background:#33ffaa;box-shadow:0 0 20px rgba(0,255,136,.3)}

        .lp-hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:120px 24px 80px;position:relative;overflow:hidden;text-align:center}
        .hero-bg{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 60% 50% at 50% 40%,rgba(0,255,136,.06) 0%,transparent 70%)}
        .hero-grid{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);background-size:40px 40px;mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black 0%,transparent 100%)}
        .hero-badge{font-family:var(--mono);font-size:10px;color:var(--green);letter-spacing:.15em;text-transform:uppercase;background:var(--green-muted);border:1px solid rgba(0,255,136,.2);padding:5px 14px;border-radius:20px;margin-bottom:28px;display:inline-flex;align-items:center;gap:8px}
        .live-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:pdot 1.5s ease-in-out infinite;flex-shrink:0}
        .lp-hero h1{font-family:var(--display);font-size:clamp(44px,7vw,88px);font-weight:800;line-height:1.05;letter-spacing:-.03em;margin-bottom:20px;max-width:800px}
        .lp-hero h1 span{color:var(--green)}
        .lp-hero > p{font-size:17px;color:var(--muted);line-height:1.6;max-width:520px;margin:0 auto 36px;font-weight:300}
        .hero-cta-row{display:flex;gap:14px;justify-content:center;align-items:center;flex-wrap:wrap;margin-bottom:28px}
        .btn-hero{background:var(--green);color:#000;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:700;border:none;cursor:pointer;font-family:var(--sans);transition:all .2s}
        .btn-hero:hover{background:#33ffaa;box-shadow:0 0 30px rgba(0,255,136,.3);transform:translateY(-1px)}
        .btn-hero-ghost{background:none;border:1px solid var(--border);color:var(--muted);padding:13px 28px;border-radius:8px;font-size:14px;cursor:pointer;font-family:var(--sans);transition:all .2s}
        .btn-hero-ghost:hover{border-color:var(--green);color:var(--green)}

        .dash-wrap{width:100%;max-width:760px;margin:24px auto 0;position:relative}
        .dash-wrap::before{content:'';position:absolute;inset:-1px;border-radius:13px;background:linear-gradient(135deg,rgba(0,255,136,.3),transparent 50%,rgba(0,255,136,.1));pointer-events:none;z-index:1}
        .dashboard{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;position:relative;z-index:0;box-shadow:0 40px 80px rgba(0,0,0,.6)}
        .dash-topbar{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--border);background:rgba(0,0,0,.3)}
        .dash-dots{display:flex;gap:6px}
        .dash-dot{width:10px;height:10px;border-radius:50%}
        .dash-badge{font-family:var(--mono);font-size:10px;background:var(--green-muted);color:var(--green);border:1px solid rgba(0,255,136,.2);padding:2px 8px;border-radius:4px}
        .dash-metrics{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--border)}
        .dash-metric{padding:14px 16px;border-right:1px solid var(--border)}
        .dash-metric:last-child{border-right:none}
        .dm-label{font-family:var(--mono);font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.12em;margin-bottom:5px}
        .dm-val{font-family:var(--mono);font-size:20px;font-weight:700}
        .dash-chart{padding:16px;height:100px;background:rgba(0,0,0,.2)}
        .dash-chart svg{width:100%;height:100%}

        .lp-ticker{background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border);overflow:hidden;padding:12px 0;position:relative}
        .lp-ticker::before,.lp-ticker::after{content:'';position:absolute;top:0;bottom:0;width:100px;z-index:2;pointer-events:none}
        .lp-ticker::before{left:0;background:linear-gradient(90deg,var(--bg),transparent)}
        .lp-ticker::after{right:0;background:linear-gradient(-90deg,var(--bg),transparent)}
        .ticker-track{display:flex;animation:tsroll 45s linear infinite;width:max-content}
        @keyframes tsroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .ticker-item{display:flex;align-items:center;gap:10px;padding:0 28px;border-right:1px solid var(--border);white-space:nowrap}
        .ti-pack{font-family:var(--mono);font-size:11px;color:var(--muted)}
        .ti-ev{font-family:var(--mono);font-size:12px;font-weight:700}
        .ti-ev.pos{color:var(--green)}.ti-ev.neg{color:#ff5757}
        .ti-badge{font-size:9px;font-family:var(--mono);padding:2px 6px;border-radius:3px;text-transform:uppercase;letter-spacing:.08em}
        .ti-badge.buy{background:rgba(0,255,136,.1);color:var(--green);border:1px solid rgba(0,255,136,.2)}
        .ti-badge.hot{background:rgba(255,100,50,.1);color:#ff6432;border:1px solid rgba(255,100,50,.2)}
        .ti-badge.wait{background:rgba(100,100,120,.15);color:var(--muted);border:1px solid var(--border)}

        .stats-grid{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surface)}
        .stat-cell{padding:28px 32px;border-right:1px solid var(--border);display:flex;flex-direction:column;gap:4px}
        .stat-cell:last-child{border-right:none}
        .sc-num{font-family:var(--display);font-size:36px;font-weight:800;letter-spacing:-.03em;color:var(--green)}
        .sc-label{font-family:var(--mono);font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.12em}

        .lp-section{padding:100px 48px;max-width:1200px;margin:0 auto}
        .sec-label{font-family:var(--mono);font-size:10px;color:var(--green);text-transform:uppercase;letter-spacing:.18em;margin-bottom:14px;display:block}
        .sec-title{font-family:var(--display);font-size:clamp(28px,4vw,44px);font-weight:800;letter-spacing:-.02em;line-height:1.1;margin-bottom:16px}
        .sec-sub{font-size:15px;color:var(--muted);max-width:480px;line-height:1.6;font-weight:300}

        .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-top:52px}
        .feat-card{background:var(--surface);padding:32px 28px;transition:background .2s}
        .feat-card:hover{background:var(--card)}
        .feat-icon-box{width:40px;height:40px;border-radius:8px;background:var(--green-muted);border:1px solid rgba(0,255,136,.15);display:flex;align-items:center;justify-content:center;margin-bottom:18px;font-size:18px}
        .feat-name{font-family:var(--display);font-size:15px;font-weight:700;margin-bottom:8px}
        .feat-desc{font-size:13px;color:var(--muted);line-height:1.6;font-weight:300}

        .how-steps{display:flex;gap:0;position:relative;margin-top:48px}
        .how-steps::before{content:'';position:absolute;top:24px;left:24px;right:24px;height:1px;background:linear-gradient(90deg,var(--green),#00cc6a,var(--green));opacity:.3}
        .how-step{flex:1;padding:0 24px;position:relative}
        .step-circle{width:48px;height:48px;border-radius:50%;background:var(--surface);border:1px solid rgba(0,255,136,.3);display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:13px;font-weight:700;color:var(--green);margin-bottom:20px;position:relative;z-index:1}
        .step-title{font-family:var(--display);font-size:17px;font-weight:700;margin-bottom:8px}
        .step-desc{font-size:13px;color:var(--muted);line-height:1.6;font-weight:300}

        .pack-hero-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden;box-shadow:0 40px 80px rgba(0,0,0,.5)}
        .phc-top{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,.3)}
        .phc-name{font-family:var(--display);font-size:16px;font-weight:700;display:flex;align-items:center;gap:10px}
        .phc-tag{font-family:var(--mono);font-size:9px;text-transform:uppercase;background:var(--green-muted);color:var(--green);border:1px solid rgba(0,255,136,.2);padding:3px 8px;border-radius:4px;letter-spacing:.1em}
        .phc-metrics{display:flex;gap:32px;padding:16px 20px;border-bottom:1px solid var(--border)}
        .phcm-val{font-family:var(--mono);font-size:22px;font-weight:700;color:var(--green)}
        .phcm-label{font-family:var(--mono);font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.12em}
        .pack-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);border-top:1px solid var(--border)}
        .pg-cell{background:var(--surface);padding:16px 18px;transition:background .2s;cursor:pointer}
        .pg-cell:hover{background:rgba(0,255,136,.04)}
        .pgc-name{font-size:12px;color:var(--muted);margin-bottom:6px}
        .pgc-ev{font-family:var(--mono);font-size:20px;font-weight:700;color:var(--text);margin-bottom:4px}
        .pgc-badge{display:inline-block;font-family:var(--mono);font-size:9px;text-transform:uppercase;padding:2px 7px;border-radius:3px;letter-spacing:.1em}
        .pgc-badge.buy{background:rgba(0,255,136,.12);color:var(--green);border:1px solid rgba(0,255,136,.2)}
        .pgc-badge.hold{background:rgba(255,204,68,.1);color:#ffcc44;border:1px solid rgba(255,204,68,.2)}
        .pgc-badge.skip{background:rgba(255,80,80,.08);color:#ff5050;border:1px solid rgba(255,80,80,.15)}

        .pulls-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:40px}
        .pull-card{background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden;transition:transform .2s,border-color .2s}
        .pull-card:hover{transform:translateY(-3px);border-color:rgba(0,255,136,.2)}
        .pull-img-box{height:120px;background:var(--card);display:flex;align-items:center;justify-content:center;font-size:40px;border-bottom:1px solid var(--border)}
        .pull-info{padding:10px 12px}
        .pull-name{font-size:11px;color:var(--muted);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .pull-price{font-family:var(--mono);font-size:14px;font-weight:700;color:var(--green)}
        .pull-pack{font-size:10px;color:var(--muted);margin-top:2px;font-family:var(--mono)}

        .pricing-card{background:var(--surface);border:1px solid rgba(0,255,136,.25);border-radius:16px;max-width:420px;margin:48px auto 0;overflow:hidden;box-shadow:0 0 60px rgba(0,255,136,.06)}
        .pc-top{padding:32px 32px 24px;border-bottom:1px solid var(--border)}
        .pc-name{font-family:var(--mono);font-size:11px;text-transform:uppercase;letter-spacing:.15em;color:var(--green);margin-bottom:16px}
        .pc-price-row{display:flex;align-items:flex-start;gap:4px;justify-content:center;margin-bottom:6px}
        .pc-dollar{font-family:var(--display);font-size:24px;font-weight:700;color:var(--muted);margin-top:8px}
        .pc-amount{font-family:var(--display);font-size:64px;font-weight:800;line-height:1;letter-spacing:-.04em;color:var(--text)}
        .pc-period{font-size:13px;color:var(--muted);align-self:flex-end;margin-bottom:8px}
        .pc-sub{font-size:12px;color:var(--muted);text-align:center}
        .pc-bar-row{display:flex;justify-content:space-between;font-family:var(--mono);font-size:10px;color:var(--muted);margin:14px 0 5px;padding:0 32px}
        .pc-bar-wrap{padding:0 32px;margin-bottom:4px}
        .pc-bar{height:4px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden}
        .pc-bar-fill{height:100%;background:var(--green);border-radius:2px}
        .pc-feats{padding:24px 32px;display:flex;flex-direction:column;gap:12px}
        .pcf-item{display:flex;align-items:center;gap:12px;font-size:13px;color:var(--muted)}
        .pcf-check{width:18px;height:18px;border-radius:50%;background:var(--green-muted);border:1px solid rgba(0,255,136,.25);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--green);flex-shrink:0}
        .pc-cta{padding:0 32px 32px}
        .btn-full{width:100%;padding:14px;background:var(--green);color:#000;border:none;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer;font-family:var(--sans);transition:all .2s}
        .btn-full:hover{background:#33ffaa;box-shadow:0 0 30px rgba(0,255,136,.3)}
        .pc-guarantee{font-family:var(--mono);font-size:10px;color:var(--muted);text-align:center;margin-top:10px;letter-spacing:.05em}

        .final-cta{margin:60px 48px;background:var(--surface);border:1px solid rgba(0,255,136,.15);border-radius:16px;padding:64px 48px;text-align:center;max-width:1104px;margin-left:auto;margin-right:auto;position:relative;overflow:hidden}
        .final-cta::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--green),transparent)}
        .final-cta h2{font-family:var(--display);font-size:clamp(32px,5vw,56px);font-weight:800;letter-spacing:-.03em;line-height:1.1;margin-bottom:16px}
        .final-cta h2 span{color:var(--green)}
        .final-cta > p{font-size:16px;color:var(--muted);margin-bottom:36px;font-weight:300}

        footer{border-top:1px solid var(--border);padding:32px 48px;display:flex;justify-content:space-between;align-items:center}
        .footer-logo{font-family:var(--display);font-size:18px;font-weight:800;color:var(--green)}
        .footer-links{display:flex;gap:24px;list-style:none}
        .footer-links a{font-size:13px;color:var(--muted);text-decoration:none;transition:color .2s}
        .footer-links a:hover{color:var(--text)}
        .footer-copy{font-family:var(--mono);font-size:11px;color:var(--muted)}
      `}</style>

      {/* NAV */}
      <nav className="lp-nav">
        <a className="lp-logo" href="/"><span className="logo-dot"/>PackPulse</a>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="#pricing">Pricing</a></li>
        </ul>
        <div className="nav-actions">
          {isSignedIn ? (
            <button className="btn-green" onClick={onEnterApp}>Open App →</button>
          ) : (
            <>
              <SignInButton mode="modal"><button className="btn-ghost">Sign in</button></SignInButton>
              <button className="btn-green" onClick={onEnterApp}>Join Now →</button>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <div className="lp-hero">
        <div className="hero-bg"/><div className="hero-grid"/>
        <div className="hero-badge"><span className="live-dot"/><span style={{fontFamily:"var(--mono)",fontSize:10}}>5,137,564 pulls tracked · 51 packs · Buyback EV exclusive</span></div>
        <h1>Stop buying packs<br/><span>blind.</span></h1>
        <p>Real-time expected value tracking for every Courtyard.io mystery pack. See the real math before you rip.</p>
        <div className="hero-cta-row">
          <button className="btn-hero" onClick={onEnterApp}>Join Now — ${price}/mo →</button>
          <button className="btn-hero-ghost" onClick={onEnterApp}>See Live Data</button>
        </div>
        <div style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted)",marginBottom:40,display:"flex",alignItems:"center",gap:12,justifyContent:"center"}}>
          <span>{filled}/100 filled</span>
          <div style={{width:160,height:3,background:"rgba(255,255,255,.08)",borderRadius:2,overflow:"hidden"}}>
            <div style={{height:"100%",width:`${Math.max(pct,2)}%`,background:"var(--green)",borderRadius:2}}/>
          </div>
          <span style={{color:"#ffcc44"}}>{remaining} left</span>
        </div>
        <div className="dash-wrap">
          <div className="dashboard">
            <div className="dash-topbar">
              <div className="dash-dots"><div className="dash-dot" style={{background:"#ff5f57"}}/><div className="dash-dot" style={{background:"#ffbd2e"}}/><div className="dash-dot" style={{background:"#28c840"}}/></div>
              <span style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted)"}}>packpulse.io/dashboard</span>
              <span className="dash-badge">● LIVE</span>
            </div>
            <div className="dash-metrics">
              {[{l:"EV RATIO",v:"1.247",c:"#00ff88"},{l:"CALIBRATED EV",v:"$31.18",c:"#00ff88"},{l:"PACK PRICE",v:"$25.00",c:"#f0f0f0"},{l:"SIGNAL",v:"GREAT VALUE",c:"#00ff88"}].map(m=>(
                <div key={m.l} className="dash-metric"><div className="dm-label">{m.l}</div><div className="dm-val" style={{color:m.c}}>{m.v}</div></div>
              ))}
            </div>
            <div className="dash-chart">
              <svg viewBox="0 0 700 80" preserveAspectRatio="none">
                <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00ff88" stopOpacity="0.15"/><stop offset="100%" stopColor="#00ff88" stopOpacity="0"/></linearGradient></defs>
                <path d="M0,65 L50,60 L100,55 L150,52 L200,48 L250,50 L300,44 L350,40 L400,38 L450,42 L500,35 L550,30 L600,28 L650,24 L700,20" fill="none" stroke="#00ff88" strokeWidth="2" opacity="0.8"/>
                <path d="M0,65 L50,60 L100,55 L150,52 L200,48 L250,50 L300,44 L350,40 L400,38 L450,42 L500,35 L550,30 L600,28 L650,24 L700,20 L700,80 L0,80 Z" fill="url(#cg)"/>
                <line x1="0" y1="52" x2="700" y2="52" stroke="#ff5757" strokeWidth="1" strokeDasharray="4,4" opacity="0.4"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* TICKER */}
      <div className="lp-ticker">
        <div className="ticker-track">
          {[...TICKER_ITEMS,...TICKER_ITEMS].map((t,i)=>(
            <div key={i} className="ticker-item">
              <span className="ti-pack">{t.pack}</span>
              <span className={`ti-ev ${t.pos?"pos":"neg"}`}>{t.ev}x</span>
              <span className={`ti-badge ${t.signal.includes("STRONG")?"hot":t.pos?"buy":"wait"}`}>{t.signal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div style={{padding:"64px 48px"}}>
        <div className="stats-grid">
          {[{num:<Counter end={5137564}/>,label:"Pulls Analyzed"},{num:"24/7",label:"Live Monitoring"},{num:"30s",label:"Update Interval"},{num:<Counter end={51}/>,label:"Active Packs"}].map((s,i)=>(
            <div key={i} className="stat-cell"><div className="sc-num">{s.num}</div><div className="sc-label">{s.label}</div></div>
          ))}
        </div>
      </div>

      {/* WHAT MAKES US DIFFERENT */}
      <section className="lp-section" style={{borderTop:"1px solid var(--border)",paddingBottom:0}}>
        <span className="sec-label">Why PackPulse</span>
        <h2 className="sec-title">We show you what others hide.</h2>
        <p className="sec-sub" style={{marginBottom:48}}>Three things that make PackPulse the only tracker that actually helps you profit.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:24}}>
          {/* Differentiator 1 */}
          <div style={{background:"rgba(0,255,136,.04)",border:"1px solid rgba(0,255,136,.2)",borderRadius:12,padding:"28px 24px",position:"relative" as const,overflow:"hidden"}}>
            <div style={{position:"absolute" as const,top:0,left:0,right:0,height:2,background:"var(--green)"}}/>
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--green)",letterSpacing:".18em",marginBottom:12,textTransform:"uppercase" as const}}>EXCLUSIVE</div>
            <div style={{fontFamily:"var(--display)",fontSize:18,fontWeight:800,marginBottom:10}}>Buyback EV</div>
            <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.7,marginBottom:16}}>
              Every other tracker shows FMV. We show you the actual cash in your hand after Courtyard's 10% buyback cut + 6% processing fee. The number that actually matters.
            </div>
            <div style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--green)"}}>
              FMV: $50.00 → Buyback: $42.30
            </div>
          </div>
          {/* Differentiator 2 */}
          <div style={{background:"rgba(255,204,68,.03)",border:"1px solid rgba(255,204,68,.2)",borderRadius:12,padding:"28px 24px",position:"relative" as const,overflow:"hidden"}}>
            <div style={{position:"absolute" as const,top:0,left:0,right:0,height:2,background:"#ffcc44"}}/>
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#ffcc44",letterSpacing:".18em",marginBottom:12,textTransform:"uppercase" as const}}>EXCLUSIVE</div>
            <div style={{fontFamily:"var(--display)",fontSize:18,fontWeight:800,marginBottom:10}}>Decision Engine</div>
            <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.7,marginBottom:16}}>
              Every pack gets a data-backed signal. Not just a number — an action. When buyback EV crosses 1.2x you see STRONG BUY. Below 1.0x you see WAIT. Never guess again.
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap" as const}}>
              {[{t:"🔥 STRONG BUY",c:"rgba(0,255,136,.15)",tc:"#00ff88"},{t:"✅ BUY",c:"rgba(0,255,136,.1)",tc:"#00ff88"},{t:"🕐 WAIT",c:"rgba(255,204,68,.1)",tc:"#ffcc44"},{t:"🚫 SKIP",c:"rgba(255,80,80,.1)",tc:"#ff5050"}].map(s=>(
                <span key={s.t} style={{fontFamily:"var(--mono)",fontSize:9,background:s.c,color:s.tc,padding:"3px 8px",borderRadius:4,fontWeight:700}}>{s.t}</span>
              ))}
            </div>
          </div>
          {/* Differentiator 3 — Pricing */}
          <div style={{background:"rgba(100,100,255,.03)",border:"1px solid rgba(100,100,255,.15)",borderRadius:12,padding:"28px 24px",position:"relative" as const,overflow:"hidden"}}>
            <div style={{position:"absolute" as const,top:0,left:0,right:0,height:2,background:"#6464ff"}}/>
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"#6464ff",letterSpacing:".18em",marginBottom:12,textTransform:"uppercase" as const}}>FAIR PRICING</div>
            <div style={{fontFamily:"var(--display)",fontSize:18,fontWeight:800,marginBottom:10}}>Early is always cheaper</div>
            <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.7,marginBottom:16}}>
              Price increases as more members join. First 100 members lock in $29/mo for life. After that it goes up. The sooner you join, the less you pay forever.
            </div>
            <div style={{display:"flex",flexDirection:"column" as const,gap:6}}>
              {[{t:"Members 1-100",p:"$29/mo",active:true},{t:"Members 101-200",p:"$49/mo",active:false},{t:"Members 200+",p:"$99/mo",active:false}].map(tier=>(
                <div key={tier.t} style={{display:"flex",justifyContent:"space-between",fontFamily:"var(--mono)",fontSize:10,padding:"5px 8px",background:tier.active?"rgba(0,255,136,.08)":"rgba(255,255,255,.02)",borderRadius:4,border:tier.active?"1px solid rgba(0,255,136,.2)":"1px solid transparent"}}>
                  <span style={{color:tier.active?"var(--green)":"var(--muted)"}}>{tier.t}</span>
                  <span style={{color:tier.active?"var(--green)":"var(--muted)",fontWeight:700}}>{tier.p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="lp-section" style={{paddingTop:20}}>
        <span className="sec-label">Features</span>
        <h2 className="sec-title">Everything you need<br/>to buy smarter.</h2>
        <p className="sec-sub">Six tools — three exclusive to PackPulse — that give you a real edge on every Courtyard pull.</p>
        <div className="feat-grid">
          {FEATURES.map((f,i)=>(
            <div key={i} className="feat-card">
              <div className="feat-icon-box">{f.icon}</div>
              <div className="feat-name">{f.name}</div>
              <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--green)",letterSpacing:".12em",marginBottom:10}}>{f.tag}</div>
              <div className="feat-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="lp-section" style={{borderTop:"1px solid var(--border)"}}>
        <span className="sec-label">How it works</span>
        <h2 className="sec-title">Card counting,<br/>but for mystery packs.</h2>
        <p className="sec-sub">The same edge casinos use — applied to Courtyard.io pull rates.</p>
        <div className="how-steps">
          {STEPS.map((s,i)=>(
            <div key={i} className="how-step">
              <div className="step-circle">{s.n}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PACK MONITOR */}
      <div style={{padding:"0 48px 80px",maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:32,gap:24}}>
          <div><span className="sec-label">Pack Monitor</span><h2 className="sec-title" style={{marginBottom:0}}>Find the best value<br/>pack instantly.</h2></div>
          <p className="sec-sub" style={{maxWidth:280,textAlign:"right" as const}}>Every pack ranked by real EV — right now.</p>
        </div>
        <div className="pack-hero-card">
          <div className="phc-top">
            <div className="phc-name">Wildcard Master Pack<span className="phc-tag">TOP PICK</span></div>
            <button className="btn-green" style={{fontSize:12,padding:"7px 16px"}} onClick={onEnterApp}>View Details ↗</button>
          </div>
          <div className="phc-metrics">
            {[{v:"3.240",l:"EV Ratio"},{v:"$162.00",l:"Avg Pack EV"},{v:"$50.00",l:"Pack Price"},{v:"+$112.00",l:"Avg Profit"}].map((m,i)=>(
              <div key={i}><div className="phcm-val" style={{color:i===3?"#ffcc44":"var(--green)"}}>{m.v}</div><div className="phcm-label">{m.l}</div></div>
            ))}
          </div>
          <div className="pack-grid">
            {PACK_GRID.map((p,i)=>(
              <div key={i} className="pg-cell">
                <div className="pgc-name">{p.name}</div>
                <div className="pgc-ev">{p.ev}</div>
                <span className={`pgc-badge ${p.cls}`}>{p.signal}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* REAL PULLS */}
      <div style={{padding:"0 48px 80px",maxWidth:1200,margin:"0 auto"}}>
        <span className="sec-label">Real Pulls</span>
        <h2 className="sec-title">See what members<br/>are pulling.</h2>
        <div className="pulls-grid">
          {[{e:"🃏",n:"Houndoom Aquapolis Holo",p:"$1,089",pk:"from a $99 pack"},{e:"⚡",n:"Dialga G Crosshatch Holo",p:"$160",pk:"from a $100 pack"},{e:"🌀",n:"Pheromosa & Buzzwole GX",p:"$113",pk:"from a $50 pack"},{e:"✨",n:"Mew Galarian Gallery",p:"$110",pk:"from a $50 pack"},{e:"🔥",n:"Zacian V Full Art",p:"$86",pk:"from a $50 pack"}].map((item,i)=>(
            <div key={i} className="pull-card">
              <div className="pull-img-box">{item.e}</div>
              <div className="pull-info">
                <div className="pull-name">{item.n}</div>
                <div className="pull-price">{item.p}</div>
                <div className="pull-pack">{item.pk}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PRICING */}
      <div id="pricing" style={{padding:"80px 48px",maxWidth:1200,margin:"0 auto",textAlign:"center" as const}}>
        <span className="sec-label">Pricing</span>
        <h2 className="sec-title">Lock in your rate<br/>before it goes up.</h2>
        <p className="sec-sub" style={{margin:"0 auto 48px"}}>Price increases as more members join. Earlier is always cheaper — and locked in for life.</p>

        {/* 3-tier pricing */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,maxWidth:900,margin:"0 auto 48px"}}>
          {/* Tier 1 — Sold out / past */}
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:24,opacity:.5}}>
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)",letterSpacing:".15em",textTransform:"uppercase" as const,marginBottom:8}}>Founding</div>
            <div style={{fontFamily:"var(--display)",fontSize:32,fontWeight:800,color:"var(--muted)",lineHeight:1}}>—</div>
            <div style={{fontSize:11,color:"var(--muted)",margin:"8px 0 16px",lineHeight:1.5}}>First tier. Only available once. Members who joined at the very beginning, locked in for life.</div>
            <div style={{padding:"8px 16px",border:"1px solid var(--border)",borderRadius:6,fontSize:12,color:"var(--muted)",fontFamily:"var(--mono)"}}>Sold Out</div>
          </div>
          {/* Tier 2 — Current */}
          <div style={{background:"rgba(0,255,136,.03)",border:"1px solid rgba(0,255,136,.3)",borderRadius:12,padding:24,position:"relative" as const}}>
            <div style={{position:"absolute" as const,top:-10,left:"50%",transform:"translateX(-50%)",background:"var(--green)",color:"#000",fontSize:8,fontWeight:700,padding:"2px 12px",borderRadius:10,fontFamily:"var(--mono)",whiteSpace:"nowrap" as const}}>CURRENT TIER</div>
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--green)",letterSpacing:".15em",textTransform:"uppercase" as const,marginBottom:8}}>Early Access</div>
            <div style={{display:"flex",alignItems:"flex-start",gap:2,justifyContent:"center",marginBottom:4}}>
              <span style={{fontFamily:"var(--display)",fontSize:18,fontWeight:700,color:"var(--muted)",marginTop:8}}>{"\$"}</span>
              <span style={{fontFamily:"var(--display)",fontSize:52,fontWeight:800,lineHeight:1,letterSpacing:"-.04em"}}>{price}</span>
              <span style={{fontSize:12,color:"var(--muted)",alignSelf:"flex-end",marginBottom:8}}>/mo</span>
            </div>
            <div style={{fontSize:11,color:"var(--muted)",marginBottom:12}}>Members 1–100</div>
            <div style={{display:"flex",justifyContent:"space-between",fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)",marginBottom:5}}>
              <span>{filled}/100 filled</span>
              <span style={{color:"#ffcc44",fontWeight:700}}>{remaining} left</span>
            </div>
            <div style={{height:4,background:"rgba(255,255,255,.06)",borderRadius:2,overflow:"hidden",marginBottom:16}}>
              <div style={{height:"100%",width:`${Math.max(pct,2)}%`,background:"var(--green)",borderRadius:2}}/>
            </div>
            {isSignedIn ? (
              <button className="btn-full" onClick={onEnterApp} style={{marginBottom:6}}>Join Now →</button>
            ) : (
              <SignInButton mode="modal" forceRedirectUrl="/?upgrade=1">
                <button className="btn-full" style={{marginBottom:6}}>Join Now — ${price}/mo →</button>
              </SignInButton>
            )}
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)"}}>✓ Cancel anytime &nbsp; ✓ Instant access &nbsp; ✓ 7-day refund</div>
          </div>
          {/* Tier 3 — Locked */}
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:24,opacity:.5}}>
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--muted)",letterSpacing:".15em",textTransform:"uppercase" as const,marginBottom:8}}>Standard</div>
            <div style={{fontFamily:"var(--display)",fontSize:32,fontWeight:800,color:"var(--muted)",lineHeight:1}}>$99</div>
            <div style={{fontSize:11,color:"var(--muted)",margin:"8px 0 16px",lineHeight:1.5,fontFamily:"var(--mono)"}}>/mo · Members 200+</div>
            <div style={{fontSize:11,color:"var(--muted)",lineHeight:1.5,marginBottom:16}}>Full price tier. Available after Early Access and Growth tiers fill. Includes all Pro features.</div>
            <div style={{padding:"8px 16px",border:"1px solid var(--border)",borderRadius:6,fontSize:12,color:"var(--muted)",fontFamily:"var(--mono)"}}>Locked</div>
          </div>
        </div>

        {/* Features included */}
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:28,maxWidth:680,margin:"0 auto"}}>
          <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--green)",letterSpacing:".18em",marginBottom:16,textAlign:"left" as const}}>EVERY PLAN INCLUDES</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,textAlign:"left" as const}}>
            {["Live EV tracking — 51 active Courtyard packs","Buyback EV — real cash after all fees ★","STRONG BUY / BUY / WAIT / SKIP signals","TradingView-style EV history charts","Push alerts at 1.2x+ buyback EV","Budget Advisor — best pack for your budget","Full pull feed — 50 live pulls + card images","Fee breakdown — every hidden cost exposed"].map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"var(--muted)"}}>
                <span style={{width:16,height:16,borderRadius:"50%",background:"var(--green-muted)",border:"1px solid rgba(0,255,136,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"var(--green)",flexShrink:0}}>✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="final-cta">
        <h2>Don't open blind.<br/><span>Check the math.</span></h2>
        <p>Every pack you've bought without data was a gamble. Make it a calculated decision.</p>
        <button className="btn-hero" onClick={onEnterApp}>Get Started →</button>
      </div>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">PackPulse</div>
        <ul className="footer-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#">Privacy</a></li>
          <li><a href="#">Terms</a></li>
        </ul>
        <div className="footer-copy">© 2026 PackPulse · Not affiliated with Courtyard.io</div>
      </footer>
    </div>
  );
}
