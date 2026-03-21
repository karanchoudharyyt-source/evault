import { useEffect, useRef, useState } from "react";
import { SignInButton, useUser } from "@clerk/clerk-react";

// ─── Live ticker data ──────────────────────────────────────────────────────────
const TICKER = [
  { pack:"Pokémon Pro Pack",      ev:"2.686x", signal:"STRONG BUY", pos:true  },
  { pack:"Wildcard Master Pack",  ev:"3.240x", signal:"STRONG BUY", pos:true  },
  { pack:"Basketball Starter",    ev:"1.376x", signal:"BUY",        pos:true  },
  { pack:"Pokémon Platinum Pack", ev:"1.663x", signal:"STRONG BUY", pos:true  },
  { pack:"Baseball Master Pack",  ev:"1.210x", signal:"BUY",        pos:true  },
  { pack:"Magic Booster",         ev:"1.094x", signal:"BUY",        pos:true  },
  { pack:"One Piece Master",      ev:"1.240x", signal:"BUY",        pos:true  },
  { pack:"Pokémon Starter Pack",  ev:"0.986x", signal:"WAIT",       pos:false },
  { pack:"Lucky Legends Pack",    ev:"0.097x", signal:"SKIP",       pos:false },
  { pack:"Football Pro Pack",     ev:"1.288x", signal:"BUY",        pos:true  },
];

// ─── Counter ──────────────────────────────────────────────────────────────────
function Counter({ end, suffix="" }:{ end:number; suffix?:string }) {
  const [v,setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(()=>{
    const obs = new IntersectionObserver(([e])=>{
      if(!e.isIntersecting) return;
      obs.disconnect();
      const s = performance.now();
      const tick = (now:number)=>{
        const p = Math.min((now-s)/2000,1);
        setV(Math.floor((1-Math.pow(1-p,3))*end));
        if(p<1) requestAnimationFrame(tick); else setV(end);
      };
      requestAnimationFrame(tick);
    },{threshold:0.5});
    if(ref.current) obs.observe(ref.current);
    return ()=>obs.disconnect();
  },[end]);
  return <span ref={ref}>{v.toLocaleString()}{suffix}</span>;
}

// ─── Pack name formatter ───────────────────────────────────────────────────────
function packName(slug:string):string {
  const MAP:Record<string,string> = {
    'pkmn-pro-pack':'Pokémon Pro Pack','pkmn-starter-pack':'Pokémon Starter Pack',
    'pkmn-platinum-pack':'Pokémon Platinum Pack','pkmn-master-pack':'Pokémon Master Pack',
    'basketball-starter-pack':'Basketball Starter Pack','basketball-pro-pack':'Basketball Pro Pack',
    'baseball-master-pack':'Baseball Master Pack','baseball-pro-pack':'Baseball Pro Pack',
    'football-pro-pack':'Football Pro Pack','football-starter-pack':'Football Starter Pack',
    'mtg-sealed-booster':'Magic The Gathering Booster','lucky-legends':'Lucky Legends Pack',
    'onepiece-master-pack':'One Piece Master Pack','wildcard-master-pack':'Wildcard Master Pack',
    'sports-starter-pack':'Sports Starter Pack',
  };
  return MAP[slug] ?? slug.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LandingPage({ onEnterApp }:{ onEnterApp:()=>void }) {
  const { isSignedIn } = useUser();
  const [stats,  setStats]  = useState<any>(null);
  const [pulls,  setPulls]  = useState<any[]>([]);

  useEffect(()=>{
    fetch("/api/founding-stats").then(r=>r.json()).then(setStats).catch(()=>{});
    fetch("/api/landing-pulls").then(r=>r.json()).then(d=>setPulls(d.pulls??[])).catch(()=>{});
  },[]);

  const price     = stats?.currentPrice ?? 29;
  const remaining = stats?.foundingRemaining ?? 100;
  const filled    = 100 - remaining;
  const pct       = Math.round((filled/100)*100);

  return (
    <div style={{background:"#060608",color:"#f0f0f0",fontFamily:"'DM Sans',sans-serif",overflowX:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,700&display=swap');
        :root{
          --bg:#060608;--surf:#0d0d10;--card:#111115;
          --border:rgba(255,255,255,.07);
          --green:#00ff88;--green-m:rgba(0,255,136,.08);
          --text:#f0f0f0;--muted:#666672;
          --mono:'Space Mono',monospace;--sans:'DM Sans',sans-serif;--disp:'Syne',sans-serif;
        }
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{background:var(--bg);color:var(--text);font-family:var(--sans);-webkit-font-smoothing:antialiased;overflow-x:hidden}

        /* NAV */
        .nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:16px 48px;background:rgba(6,6,8,.9);backdrop-filter:blur(16px);border-bottom:1px solid var(--border)}
        .logo{font-family:var(--disp);font-size:20px;font-weight:800;color:var(--green);display:flex;align-items:center;gap:8px;text-decoration:none;letter-spacing:-.5px}
        .ldot{width:8px;height:8px;border-radius:50%;background:var(--green);animation:blink 2s ease-in-out infinite}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:.4}}
        .nav-links{display:flex;gap:28px;list-style:none}
        .nav-links a{font-size:13px;color:var(--muted);text-decoration:none;transition:color .2s}
        .nav-links a:hover{color:var(--text)}
        .nav-btns{display:flex;gap:10px;align-items:center}
        .btn-ghost{background:none;border:1px solid var(--border);color:var(--muted);padding:8px 18px;border-radius:6px;font-size:13px;cursor:pointer;font-family:var(--sans);transition:all .2s}
        .btn-ghost:hover{border-color:var(--green);color:var(--green)}
        .btn-green{background:var(--green);color:#000;padding:9px 20px;border-radius:6px;font-size:13px;font-weight:700;border:none;cursor:pointer;font-family:var(--sans);transition:all .2s}
        .btn-green:hover{background:#33ffaa}

        /* HERO */
        .hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:120px 24px 60px;position:relative;overflow:hidden;text-align:center}
        .hero-bg{position:absolute;inset:0;background:radial-gradient(ellipse 60% 50% at 50% 40%,rgba(0,255,136,.06),transparent 70%);pointer-events:none}
        .hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);background-size:40px 40px;mask-image:radial-gradient(ellipse 80% 80% at 50% 50%,black,transparent);pointer-events:none}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:var(--green-m);border:1px solid rgba(0,255,136,.2);padding:5px 14px;border-radius:20px;font-family:var(--mono);font-size:10px;color:var(--green);letter-spacing:.1em;text-transform:uppercase;margin-bottom:28px}
        .live-dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:blink 1.5s ease-in-out infinite;flex-shrink:0}
        .hero h1{font-family:var(--disp);font-size:clamp(48px,7vw,88px);font-weight:800;line-height:1.02;letter-spacing:-.04em;margin-bottom:20px;max-width:820px}
        .hero h1 em{color:var(--green);font-style:normal}
        .hero > p{font-size:17px;color:var(--muted);line-height:1.65;max-width:540px;margin:0 auto 36px;font-weight:300}
        .hero-ctas{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:24px}
        .btn-hero{background:var(--green);color:#000;padding:13px 28px;border-radius:8px;font-size:14px;font-weight:700;border:none;cursor:pointer;font-family:var(--sans);transition:all .2s}
        .btn-hero:hover{background:#33ffaa;transform:translateY(-1px);box-shadow:0 8px 30px rgba(0,255,136,.25)}
        .btn-outline{background:none;border:1px solid var(--border);color:var(--muted);padding:13px 28px;border-radius:8px;font-size:14px;cursor:pointer;font-family:var(--sans);transition:all .2s}
        .btn-outline:hover{border-color:var(--green);color:var(--green)}
        .spots-line{font-family:var(--mono);font-size:11px;color:var(--muted);display:flex;align-items:center;gap:12px;justify-content:center;margin-bottom:48px}
        .spots-bar{width:140px;height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;display:inline-block}
        .spots-fill{height:100%;background:var(--green);border-radius:2px}

        /* DASHBOARD MOCKUP */
        .mock-wrap{width:100%;max-width:800px;margin:0 auto;position:relative}
        .mock-wrap::before{content:'';position:absolute;inset:-1px;border-radius:14px;background:linear-gradient(135deg,rgba(0,255,136,.3),transparent 50%,rgba(0,255,136,.1));z-index:1;pointer-events:none}
        .mock{background:var(--surf);border:1px solid var(--border);border-radius:12px;overflow:hidden;position:relative;z-index:0;box-shadow:0 40px 80px rgba(0,0,0,.6)}
        .mock-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid var(--border);background:rgba(0,0,0,.3)}
        .mock-dots{display:flex;gap:6px}
        .mock-dot{width:10px;height:10px;border-radius:50%}
        .mock-badge{font-family:var(--mono);font-size:10px;background:var(--green-m);color:var(--green);border:1px solid rgba(0,255,136,.2);padding:2px 8px;border-radius:4px}
        .mock-stats{display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid var(--border)}
        .mock-stat{padding:14px 16px;border-right:1px solid var(--border)}
        .mock-stat:last-child{border-right:none}
        .ms-label{font-family:var(--mono);font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.12em;margin-bottom:5px}
        .ms-val{font-family:var(--mono);font-size:19px;font-weight:700}
        .mock-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border)}
        .mock-card{background:var(--surf);padding:12px 14px}
        .mc-name{font-size:11px;color:var(--muted);margin-bottom:6px}
        .mc-ev{font-family:var(--mono);font-size:18px;font-weight:700;color:var(--green);margin-bottom:2px}
        .mc-bb{font-family:var(--mono);font-size:12px;color:#ffcc44;margin-bottom:6px}
        .mc-sig{display:inline-block;font-family:var(--mono);font-size:8px;font-weight:700;padding:2px 6px;border-radius:3px;text-transform:uppercase}

        /* TICKER */
        .ticker{background:var(--surf);border-top:1px solid var(--border);border-bottom:1px solid var(--border);overflow:hidden;padding:11px 0;position:relative}
        .ticker::before,.ticker::after{content:'';position:absolute;top:0;bottom:0;width:80px;z-index:2;pointer-events:none}
        .ticker::before{left:0;background:linear-gradient(90deg,var(--bg),transparent)}
        .ticker::after{right:0;background:linear-gradient(-90deg,var(--bg),transparent)}
        .ticker-track{display:flex;animation:scroll 50s linear infinite;width:max-content}
        @keyframes scroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .ti{display:flex;align-items:center;gap:10px;padding:0 24px;border-right:1px solid var(--border);white-space:nowrap}
        .ti-pack{font-family:var(--mono);font-size:11px;color:var(--muted)}
        .ti-ev{font-family:var(--mono);font-size:12px;font-weight:700}
        .ti-ev.pos{color:var(--green)}.ti-ev.neg{color:#ff5757}
        .ti-sig{font-family:var(--mono);font-size:9px;padding:2px 6px;border-radius:3px;text-transform:uppercase;letter-spacing:.06em}
        .ti-sig.buy{background:rgba(0,255,136,.1);color:var(--green);border:1px solid rgba(0,255,136,.2)}
        .ti-sig.strong{background:rgba(255,100,50,.12);color:#ff6432;border:1px solid rgba(255,100,50,.2)}
        .ti-sig.wait{background:rgba(100,100,120,.15);color:var(--muted);border:1px solid var(--border)}

        /* STATS */
        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--border);border-radius:12px;overflow:hidden;background:var(--surf);max-width:1100px;margin:0 auto}
        .stat-cell{padding:28px 32px;border-right:1px solid var(--border);display:flex;flex-direction:column;gap:4px}
        .stat-cell:last-child{border-right:none}
        .sc-num{font-family:var(--disp);font-size:34px;font-weight:800;letter-spacing:-.03em;color:var(--green)}
        .sc-label{font-family:var(--mono);font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.12em}

        /* SECTIONS */
        .sec{padding:96px 48px;max-width:1100px;margin:0 auto}
        .sec-label{font-family:var(--mono);font-size:10px;color:var(--green);text-transform:uppercase;letter-spacing:.18em;margin-bottom:14px;display:block}
        .sec-title{font-family:var(--disp);font-size:clamp(28px,4vw,44px);font-weight:800;letter-spacing:-.02em;line-height:1.08;margin-bottom:16px}
        .sec-sub{font-size:15px;color:var(--muted);max-width:500px;line-height:1.65;font-weight:300}

        /* EXCLUSIVE FEATURES */
        .excl-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:48px}
        .excl-card{border-radius:12px;padding:28px 24px;position:relative;overflow:hidden}
        .excl-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
        .excl-card.green{background:rgba(0,255,136,.04);border:1px solid rgba(0,255,136,.2)}
        .excl-card.green::before{background:var(--green)}
        .excl-card.yellow{background:rgba(255,204,68,.03);border:1px solid rgba(255,204,68,.2)}
        .excl-card.yellow::before{background:#ffcc44}
        .excl-card.blue{background:rgba(100,130,255,.03);border:1px solid rgba(100,130,255,.15)}
        .excl-card.blue::before{background:#6482ff}
        .excl-tag{font-family:var(--mono);font-size:9px;letter-spacing:.18em;text-transform:uppercase;margin-bottom:12px;display:block}
        .excl-name{font-family:var(--disp);font-size:20px;font-weight:800;margin-bottom:12px;letter-spacing:-.01em}
        .excl-desc{font-size:13px;color:var(--muted);line-height:1.7;margin-bottom:16px;font-weight:300}

        /* FEATURES GRID */
        .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);border:1px solid var(--border);border-radius:12px;overflow:hidden;margin-top:52px}
        .feat{background:var(--surf);padding:28px;transition:background .2s}
        .feat:hover{background:var(--card)}
        .feat-icon{width:38px;height:38px;border-radius:8px;background:var(--green-m);border:1px solid rgba(0,255,136,.15);display:flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:17px}
        .feat-name{font-family:var(--disp);font-size:14px;font-weight:700;margin-bottom:6px}
        .feat-tag{font-family:var(--mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:10px}
        .feat-desc{font-size:12px;color:var(--muted);line-height:1.65;font-weight:300}

        /* HOW IT WORKS */
        .steps{display:flex;position:relative;margin-top:52px}
        .steps::before{content:'';position:absolute;top:24px;left:24px;right:24px;height:1px;background:linear-gradient(90deg,var(--green),#00cc6a,var(--green));opacity:.3}
        .step{flex:1;padding:0 24px;position:relative}
        .step-num{width:48px;height:48px;border-radius:50%;background:var(--surf);border:1px solid rgba(0,255,136,.3);display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:13px;font-weight:700;color:var(--green);margin-bottom:20px;position:relative;z-index:1}
        .step-title{font-family:var(--disp);font-size:17px;font-weight:700;margin-bottom:8px}
        .step-desc{font-size:13px;color:var(--muted);line-height:1.65;font-weight:300}

        /* PACK MONITOR */
        .pack-card{background:var(--surf);border:1px solid var(--border);border-radius:12px;overflow:hidden;box-shadow:0 32px 64px rgba(0,0,0,.5)}
        .pack-card-top{padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:rgba(0,0,0,.3)}
        .pack-card-name{font-family:var(--disp);font-size:16px;font-weight:700;display:flex;align-items:center;gap:10px}
        .pack-card-tag{font-family:var(--mono);font-size:9px;text-transform:uppercase;background:var(--green-m);color:var(--green);border:1px solid rgba(0,255,136,.2);padding:3px 8px;border-radius:4px;letter-spacing:.1em}
        .pack-metrics{display:flex;gap:32px;padding:16px 20px;border-bottom:1px solid var(--border)}
        .pm-val{font-family:var(--mono);font-size:22px;font-weight:700;color:var(--green)}
        .pm-label{font-family:var(--mono);font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.12em;margin-top:2px}
        .pack-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border)}
        .pg-cell{background:var(--surf);padding:14px 16px;transition:background .2s;cursor:pointer}
        .pg-cell:hover{background:rgba(0,255,136,.04)}
        .pgc-name{font-size:12px;color:var(--muted);margin-bottom:5px}
        .pgc-ev{font-family:var(--mono);font-size:18px;font-weight:700;color:var(--text);margin-bottom:4px}
        .pgc-badge{display:inline-block;font-family:var(--mono);font-size:9px;text-transform:uppercase;padding:2px 7px;border-radius:3px;letter-spacing:.1em}
        .pgc-badge.buy{background:rgba(0,255,136,.12);color:var(--green);border:1px solid rgba(0,255,136,.2)}
        .pgc-badge.hold{background:rgba(255,204,68,.1);color:#ffcc44;border:1px solid rgba(255,204,68,.2)}
        .pgc-badge.skip{background:rgba(255,80,80,.08);color:#ff5050;border:1px solid rgba(255,80,80,.15)}

        /* REAL PULLS */
        .pulls-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:40px}
        .pull-card{background:var(--surf);border:1px solid var(--border);border-radius:10px;overflow:hidden;transition:transform .2s,border-color .2s;cursor:pointer}
        .pull-card:hover{transform:translateY(-4px);border-color:rgba(0,255,136,.25)}
        .pull-img{height:140px;background:var(--card);display:flex;align-items:center;justify-content:center;overflow:hidden;border-bottom:1px solid var(--border);position:relative}
        .pull-img img{width:100%;height:100%;object-fit:contain;padding:8px}
        .pull-img-placeholder{font-size:40px;opacity:.3}
        .pull-info{padding:10px 12px}
        .pull-name{font-size:11px;color:var(--muted);margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .pull-price{font-family:var(--mono);font-size:14px;font-weight:700;color:var(--green)}
        .pull-pack{font-size:10px;color:var(--muted);margin-top:3px;font-family:var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

        /* PRICING */
        .pricing-wrap{max-width:880px;margin:48px auto 0}
        .pricing-tiers{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px}
        .tier-card{background:var(--surf);border:1px solid var(--border);border-radius:12px;padding:24px;position:relative;opacity:.55;transition:all .2s}
        .tier-card.active{border-color:rgba(0,255,136,.35);background:rgba(0,255,136,.03);opacity:1}
        .tier-current{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--green);color:#000;font-size:8px;font-weight:700;padding:2px 12px;border-radius:10px;font-family:var(--mono);white-space:nowrap;letter-spacing:.05em}
        .tier-label{font-family:var(--mono);font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.15em;margin-bottom:10px}
        .tier-label.active-label{color:var(--green)}
        .tier-price{display:flex;align-items:flex-start;gap:3px;margin-bottom:4px}
        .tier-dollar{font-family:var(--disp);font-size:18px;font-weight:700;color:var(--muted);margin-top:6px}
        .tier-amount{font-family:var(--disp);font-size:46px;font-weight:800;line-height:1;letter-spacing:-.04em}
        .tier-mo{font-size:12px;color:var(--muted);align-self:flex-end;margin-bottom:5px}
        .tier-members{font-size:11px;color:var(--muted);margin-bottom:12px;font-family:var(--mono)}
        .tier-desc{font-size:11px;color:var(--muted);line-height:1.6;margin-bottom:14px;font-weight:300}
        .tier-bar-row{display:flex;justify-content:space-between;font-family:var(--mono);font-size:9px;margin-bottom:5px}
        .tier-bar{height:4px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;margin-bottom:14px}
        .tier-bar-fill{height:100%;background:var(--green);border-radius:2px}
        .tier-btn{width:100%;padding:11px;background:var(--green);color:#000;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:var(--sans);transition:all .2s;margin-bottom:8px}
        .tier-btn:hover{background:#33ffaa}
        .tier-trust{font-family:var(--mono);font-size:9px;color:var(--muted);text-align:center;line-height:1.8}
        .tier-locked{width:100%;padding:10px;background:transparent;border:1px solid var(--border);border-radius:8px;font-size:12px;color:var(--muted);cursor:default;font-family:var(--mono)}
        .pricing-includes{background:var(--surf);border:1px solid var(--border);border-radius:12px;padding:28px 32px}
        .pi-title{font-family:var(--mono);font-size:9px;color:var(--green);letter-spacing:.18em;text-transform:uppercase;margin-bottom:18px}
        .pi-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .pi-item{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--muted);font-weight:300}
        .pi-check{width:16px;height:16px;border-radius:50%;background:var(--green-m);border:1px solid rgba(0,255,136,.25);display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--green);flex-shrink:0}

        /* FINAL CTA */
        .final-cta{margin:48px;background:var(--surf);border:1px solid rgba(0,255,136,.15);border-radius:16px;padding:72px 48px;text-align:center;max-width:1004px;margin-left:auto;margin-right:auto;position:relative;overflow:hidden}
        .final-cta::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--green),transparent)}
        .final-cta h2{font-family:var(--disp);font-size:clamp(32px,5vw,52px);font-weight:800;letter-spacing:-.03em;line-height:1.08;margin-bottom:16px}
        .final-cta h2 em{color:var(--green);font-style:normal}
        .final-cta > p{font-size:16px;color:var(--muted);margin-bottom:36px;font-weight:300}

        /* FOOTER */
        footer{border-top:1px solid var(--border);padding:28px 48px;display:flex;justify-content:space-between;align-items:center}
        .foot-logo{font-family:var(--disp);font-size:18px;font-weight:800;color:var(--green)}
        .foot-links{display:flex;gap:24px;list-style:none}
        .foot-links a{font-size:13px;color:var(--muted);text-decoration:none;transition:color .2s}
        .foot-links a:hover{color:var(--text)}
        .foot-copy{font-family:var(--mono);font-size:11px;color:var(--muted)}

        /* ── MOBILE RESPONSIVE ── */
        @media(max-width:768px){
          .nav{padding:14px 20px}
          .nav-links{display:none}
          .nav-btns .btn-ghost{display:none}

          .hero{padding:100px 20px 48px}
          .hero h1{font-size:42px;letter-spacing:-.03em}
          .hero > p{font-size:15px}
          .hero-ctas{gap:10px}
          .btn-hero,.btn-outline{padding:12px 20px;font-size:13px}
          .spots-line{font-size:10px;flex-wrap:wrap;gap:8px}
          .mock-stats{grid-template-columns:repeat(2,1fr)}
          .mock-cards{grid-template-columns:1fr}
          .mock-cards .mock-card:last-child{display:none}

          .stats-grid{grid-template-columns:repeat(2,1fr)}
          .stat-cell:nth-child(2){border-right:none}
          .stat-cell:nth-child(3){border-top:1px solid var(--border)}
          .stat-cell:nth-child(4){border-top:1px solid var(--border)}

          .sec{padding:56px 20px}
          .sec-title{font-size:28px}

          .excl-grid{grid-template-columns:1fr;gap:14px}
          .feat-grid{grid-template-columns:1fr}
          .steps{flex-direction:column;gap:32px}
          .steps::before{display:none}
          .step{padding:0}

          .pack-metrics{gap:16px;flex-wrap:wrap}
          .pack-grid{grid-template-columns:1fr 1fr}
          .pack-grid .pg-cell:last-child{display:none}

          .pulls-grid{grid-template-columns:repeat(2,1fr);gap:10px}
          .pulls-grid .pull-card:nth-child(n+5){display:none}

          .pricing-wrap{max-width:100%}
          .pricing-tiers{grid-template-columns:1fr;gap:14px}
          .pi-grid{grid-template-columns:1fr}

          .final-cta{margin:20px;padding:48px 24px}
          .final-cta h2{font-size:28px}

          footer{flex-direction:column;gap:16px;text-align:center;padding:24px 20px}
          .foot-links{justify-content:center}
        }

        @media(max-width:480px){
          .hero h1{font-size:34px}
          .stats-grid{grid-template-columns:1fr 1fr;border-radius:10px}
          .pulls-grid{grid-template-columns:1fr 1fr}
          .pack-grid{grid-template-columns:1fr}
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="nav">
        <a className="logo" href="/"><span className="ldot"/>PackPulse</a>
        <ul className="nav-links">
          <li><a href="#exclusive">Why Different</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="#pricing">Pricing</a></li>
        </ul>
        <div className="nav-btns">
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

      {/* ── HERO ── */}
      <div className="hero">
        <div className="hero-bg"/><div className="hero-grid"/>

        <div className="hero-badge">
          <span className="live-dot"/>
          5,137,564 pulls tracked and counting
        </div>

        <h1>Stop buying packs<br/><em>blind.</em></h1>
        <p>Real-time expected value for every Courtyard.io mystery pack. See the real math — including the cash you'd actually get after fees — before you rip.</p>

        <div className="hero-ctas">
          <button className="btn-hero" onClick={onEnterApp}>Join Now — ${price}/mo →</button>
          <button className="btn-outline" onClick={onEnterApp}>See Live Data Free</button>
        </div>

        <div className="spots-line">
          <span>{filled}/100 filled</span>
          <div className="spots-bar"><div className="spots-fill" style={{width:`${Math.max(pct,2)}%`}}/></div>
          <span style={{color:"#ffcc44"}}>{remaining} early access spots left</span>
        </div>

        {/* Dashboard mockup */}
        <div className="mock-wrap">
          <div className="mock">
            <div className="mock-bar">
              <div className="mock-dots">
                <div className="mock-dot" style={{background:"#ff5f57"}}/>
                <div className="mock-dot" style={{background:"#ffbd2e"}}/>
                <div className="mock-dot" style={{background:"#28c840"}}/>
              </div>
              <span style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--muted)"}}>packpulse.io/dashboard</span>
              <span className="mock-badge">● LIVE · 30s</span>
            </div>
            <div className="mock-stats">
              {[{l:"+EV PACKS",v:"5/13",c:"#00ff88"},{l:"BEST EV NOW",v:"2.686x",c:"#00ff88"},{l:"AVG MARKET EV",v:"0.999x",c:"#ff5757"},{l:"PULLS TRACKED",v:"50",c:"#f0f0f0"}].map(s=>(
                <div key={s.l} className="mock-stat">
                  <div className="ms-label">{s.l}</div>
                  <div className="ms-val" style={{color:s.c}}>{s.v}</div>
                </div>
              ))}
            </div>
            <div className="mock-cards">
              {[
                {name:"Pokémon Platinum Pack",ev:"1.663x",bb:"1.407x",sig:"STRONG BUY",sc:"rgba(0,255,136,.1)",stc:"#00ff88"},
                {name:"Wildcard Master Pack", ev:"3.240x",bb:"2.741x",sig:"STRONG BUY",sc:"rgba(0,255,136,.1)",stc:"#00ff88"},
                {name:"Pokémon Starter Pack", ev:"0.986x",bb:"🔒 PRO",  sig:"WAIT",      sc:"rgba(255,204,68,.08)",stc:"#ffcc44"},
              ].map(c=>(
                <div key={c.name} className="mock-card">
                  <div className="mc-name">{c.name}</div>
                  <div className="mc-ev">{c.ev}</div>
                  <div className="mc-bb">BUYBACK: {c.bb}</div>
                  <span className="mc-sig" style={{background:c.sc,color:c.stc,border:`1px solid ${c.stc}33`}}>{c.sig}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── TICKER ── */}
      <div className="ticker">
        <div className="ticker-track">
          {[...TICKER,...TICKER].map((t,i)=>(
            <div key={i} className="ti">
              <span className="ti-pack">{t.pack}</span>
              <span className={`ti-ev ${t.pos?"pos":"neg"}`}>{t.ev}</span>
              <span className={`ti-sig ${t.signal.includes("STRONG")?"strong":t.pos?"buy":"wait"}`}>{t.signal}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <div style={{padding:"64px 48px"}}>
        <div className="stats-grid">
          {[
            {n:<Counter end={5137564}/>, l:"Pulls Analyzed"},
            {n:"24/7",                  l:"Live Monitoring"},
            {n:"30s",                   l:"Update Interval"},
            {n:<Counter end={51}/>,     l:"Active Packs Tracked"},
          ].map((s,i)=>(
            <div key={i} className="stat-cell">
              <div className="sc-num">{s.n}</div>
              <div className="sc-label">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── WHAT MAKES US DIFFERENT ── */}
      <section id="exclusive" className="sec" style={{borderTop:"1px solid var(--border)",paddingBottom:0}}>
        <span className="sec-label">Why PackPulse</span>
        <h2 className="sec-title">We show what others hide.</h2>
        <p className="sec-sub">Three things no other Courtyard tracker gives you. This is why PackPulse exists.</p>
        <div className="excl-grid">

          <div className="excl-card green">
            <span className="excl-tag" style={{color:"var(--green)"}}>★ Exclusive — nobody else has this</span>
            <div className="excl-name">Buyback EV</div>
            <div className="excl-desc">Every other tracker shows FMV. We calculate the actual dollar in your hand after Courtyard's 10% buyback cut + 6% processing fee. That's the number that actually matters.</div>
            <div style={{background:"rgba(0,0,0,.3)",borderRadius:8,padding:"10px 14px",fontFamily:"var(--mono)",fontSize:11}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{color:"var(--muted)"}}>FMV estimate</span>
                <span style={{color:"#f0f0f0"}}>$50.00</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{color:"var(--muted)"}}>Buyback offer (−10%)</span>
                <span style={{color:"#ff5757"}}>−$5.00</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{color:"var(--muted)"}}>Processing fee (−6%)</span>
                <span style={{color:"#ff5757"}}>−$2.70</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",borderTop:"1px solid rgba(255,255,255,.08)",paddingTop:8}}>
                <span style={{color:"var(--green)",fontWeight:700}}>Cash in your hand</span>
                <span style={{color:"var(--green)",fontWeight:700}}>$42.30</span>
              </div>
            </div>
          </div>

          <div className="excl-card yellow">
            <span className="excl-tag" style={{color:"#ffcc44"}}>★ Exclusive — data-backed signals</span>
            <div className="excl-name">Decision Engine</div>
            <div className="excl-desc">Every pack gets a clear action signal based on real math. STRONG BUY means your buyback EV exceeds 1.2x — you statistically profit after every fee. Stop guessing.</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[
                {sig:"🔥 STRONG BUY", desc:"Buyback EV > 1.2x — profit after all fees",     c:"rgba(0,255,136,.12)", tc:"#00ff88", bc:"rgba(0,255,136,.2)"},
                {sig:"✅ BUY",        desc:"Buyback EV > 1.0x — in your favour",              c:"rgba(0,255,136,.08)", tc:"#00ff88", bc:"rgba(0,255,136,.15)"},
                {sig:"🕐 WAIT",       desc:"FMV positive, buyback negative — hold off",       c:"rgba(255,204,68,.08)",tc:"#ffcc44", bc:"rgba(255,204,68,.2)"},
                {sig:"🚫 SKIP",       desc:"Below break-even — not worth it right now",       c:"rgba(255,80,80,.07)", tc:"#ff5050", bc:"rgba(255,80,80,.15)"},
              ].map(s=>(
                <div key={s.sig} style={{display:"flex",alignItems:"center",gap:10,background:s.c,border:`1px solid ${s.bc}`,borderRadius:6,padding:"7px 10px"}}>
                  <span style={{fontFamily:"var(--mono)",fontSize:10,fontWeight:700,color:s.tc,minWidth:100,flexShrink:0}}>{s.sig}</span>
                  <span style={{fontSize:11,color:"var(--muted)"}}>{s.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="excl-card blue">
            <span className="excl-tag" style={{color:"#6482ff"}}>We track more — 51 vs ~22</span>
            <div className="excl-name">All 51 Active Packs</div>
            <div className="excl-desc">Most trackers cover a handful of packs. We dynamically discover every single active Courtyard vending machine — Pokémon, Baseball, Basketball, Football, Soccer, One Piece, Wildcard, Comics, Magic The Gathering, and more.</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:4}}>
              {["Pokémon","Baseball","Basketball","Football","Soccer","One Piece","Wildcard","Comics","Magic","Sports","Watches","Limited Drop"].map(c=>(
                <span key={c} style={{fontFamily:"var(--mono)",fontSize:9,background:"rgba(100,130,255,.1)",color:"#6482ff",border:"1px solid rgba(100,130,255,.2)",padding:"2px 8px",borderRadius:20}}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="sec">
        <span className="sec-label">Features</span>
        <h2 className="sec-title">Everything you need<br/>to buy smarter.</h2>
        <p className="sec-sub">Six tools — three exclusive to PackPulse — that give you a real edge on every pull.</p>
        <div className="feat-grid">
          {[
            {icon:"📊",name:"Live EV Ratio",          tag:"Real-time · Free",   desc:"Decay-weighted averages across 5M+ pulls. Updated every 30s. Not naive midpoints — real calibrated expected value.",            tc:"var(--green)"},
            {icon:"📈",name:"EV History Charts",       tag:"Pro",                desc:"Watch EV move like a stock ticker. See exactly when packs cross above or below break-even and time your pull perfectly.",         tc:"#4f8fff"},
            {icon:"🎯",name:"Buyback EV",              tag:"Pro · Exclusive ★",  desc:"Real cash after Courtyard's 10% cut + 6% processing. The number that determines if you actually profit. Nobody else has this.",  tc:"#ffcc44"},
            {icon:"📋",name:"Live Pull Feed",          tag:"Real-time · Free",   desc:"Live feed of every recent pull with real card images, FMV values, grades, and pack source. See what's hitting right now.",        tc:"var(--green)"},
            {icon:"🔔",name:"+EV Push Alerts",         tag:"Pro",                desc:"Instant push notifications when any pack crosses 1.2x buyback EV. Works when your browser is closed. Never miss a window.",      tc:"#ff6b6b"},
            {icon:"💰",name:"Budget Advisor",          tag:"Pro · Exclusive ★",  desc:"Tell us your budget. We instantly rank every pack by real buyback EV. The best pick for what you can spend, right now.",          tc:"#c77dff"},
          ].map((f,i)=>(
            <div key={i} className="feat">
              <div className="feat-icon">{f.icon}</div>
              <div className="feat-name">{f.name}</div>
              <div className="feat-tag" style={{color:f.tc}}>{f.tag}</div>
              <div className="feat-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="sec" style={{borderTop:"1px solid var(--border)"}}>
        <span className="sec-label">How it works</span>
        <h2 className="sec-title">Card counting,<br/>but for mystery packs.</h2>
        <p className="sec-sub">The same mathematical edge casinos use — applied to Courtyard.io pull rates.</p>
        <div className="steps">
          {[
            {n:"01",t:"We track every pull",     d:"Our system fetches Courtyard data every 30 seconds — pull values, odds shifts, pool changes — around the clock across all 51 active packs."},
            {n:"02",t:"We calibrate real EV",    d:"Using decay-weighted averages across 5M+ tracked pulls, we calculate what each pack is worth right now. No assumptions, just data."},
            {n:"03",t:"You buy with an edge",    d:"Check the Buyback EV before you rip. Above 1.2x? STRONG BUY — you profit after all fees. Below 1.0x? Maybe wait an hour."},
          ].map((s,i)=>(
            <div key={i} className="step">
              <div className="step-num">{s.n}</div>
              <div className="step-title">{s.t}</div>
              <div className="step-desc">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PACK MONITOR ── */}
      <div style={{padding:"0 48px 80px",maxWidth:1100,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:32,gap:24}}>
          <div>
            <span className="sec-label">Pack Monitor</span>
            <h2 className="sec-title" style={{marginBottom:0}}>Find the best value<br/>pack instantly.</h2>
          </div>
          <p className="sec-sub" style={{maxWidth:280,textAlign:"right" as const}}>All 51 packs ranked by real Buyback EV — updated every 30 seconds.</p>
        </div>
        <div className="pack-card">
          <div className="pack-card-top">
            <div className="pack-card-name">Wildcard Master Pack <span className="pack-card-tag">🔥 STRONG BUY</span></div>
            <button className="btn-green" style={{fontSize:12,padding:"7px 16px"}} onClick={onEnterApp}>View Details ↗</button>
          </div>
          <div className="pack-metrics">
            {[{v:"3.240x",l:"EV Ratio"},{v:"2.741x",l:"Buyback EV ★"},{v:"$50.00",l:"Pack Price"},{v:"+$87.00",l:"Expected Cash Profit"}].map((m,i)=>(
              <div key={i}><div className="pm-val" style={{color:i===3?"#ffcc44":"var(--green)"}}>{m.v}</div><div className="pm-label">{m.l}</div></div>
            ))}
          </div>
          <div className="pack-grid">
            {[
              {name:"Pokémon Platinum Pack",  ev:"1.663x",  cls:"buy",  sig:"BUY"},
              {name:"Wildcard Master Pack",   ev:"3.240x",  cls:"buy",  sig:"STRONG BUY"},
              {name:"Basketball Starter",     ev:"1.376x",  cls:"buy",  sig:"BUY"},
              {name:"One Piece Master Pack",  ev:"1.240x",  cls:"buy",  sig:"BUY"},
              {name:"Pokémon Starter Pack",   ev:"0.986x",  cls:"hold", sig:"WAIT"},
              {name:"Lucky Legends Pack",     ev:"0.097x",  cls:"skip", sig:"SKIP"},
            ].map((p,i)=>(
              <div key={i} className="pg-cell">
                <div className="pgc-name">{p.name}</div>
                <div className="pgc-ev">{p.ev}</div>
                <span className={`pgc-badge ${p.cls}`}>{p.sig}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── REAL PULLS ── */}
      <div style={{padding:"0 48px 80px",maxWidth:1100,margin:"0 auto"}}>
        <span className="sec-label">Real Pulls</span>
        <h2 className="sec-title">See what members<br/>are pulling.</h2>
        <div className="pulls-grid">
          {pulls.length > 0 ? pulls.slice(0,5).map((p:any,i:number)=>(
            <div key={i} className="pull-card">
              <div className="pull-img">
                <img src={p.image} alt={p.title}
                  onError={(e)=>{ (e.target as HTMLImageElement).style.display="none"; }}
                  style={{width:"100%",height:"100%",objectFit:"contain",padding:8}}
                />
              </div>
              <div className="pull-info">
                <div className="pull-name">{p.title.replace(/^[\d]+ /,'').slice(0,40)}</div>
                <div className="pull-price">${p.fmv?.toLocaleString()}</div>
                <div className="pull-pack">from {packName(p.packSlug)}</div>
              </div>
            </div>
          )) : (
            // Fallback with real Courtyard card image structure
            [
              {title:"2014 Pokémon XY Phantom Forces Gengar EX Holo PSA 9",       fmv:1089, pack:"Pokémon Master Pack"},
              {title:"2020 Pokémon Champion's Path Dialga G Crosshatch Holo",      fmv:160,  pack:"Pokémon Pro Pack"},
              {title:"2019 Pokémon Unified Minds Pheromosa & Buzzwole GX Alt Art", fmv:113,  pack:"Pokémon Starter Pack"},
              {title:"2022 Pokémon SWSH Astral Radiance Mew Galarian Gallery",     fmv:110,  pack:"Pokémon Starter Pack"},
              {title:"2020 Pokémon Sword & Shield Zacian V Full Art Ultra Rare",   fmv:86,   pack:"Pokémon Starter Pack"},
            ].map((p,i)=>(
              <div key={i} className="pull-card">
                <div className="pull-img">
                  <div className="pull-img-placeholder">🃏</div>
                </div>
                <div className="pull-info">
                  <div className="pull-name">{p.title.slice(0,40)}</div>
                  <div className="pull-price">${p.fmv.toLocaleString()}</div>
                  <div className="pull-pack">from {p.pack}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── PRICING ── */}
      <div id="pricing" style={{padding:"80px 48px",maxWidth:1100,margin:"0 auto",textAlign:"center" as const}}>
        <span className="sec-label">Pricing</span>
        <h2 className="sec-title">Lock in your rate<br/>before it goes up.</h2>
        <p className="sec-sub" style={{margin:"0 auto 0"}}>Price rises as more members join. First 100 members lock in $29/mo for life.</p>

        <div className="pricing-wrap">
          <div className="pricing-tiers">
            {/* Tier 1 — Early Access CURRENT */}
            <div className="tier-card active">
              <div className="tier-current">CURRENT TIER</div>
              <div className="tier-label active-label">Early Access</div>
              <div className="tier-price">
                <span className="tier-dollar">$</span>
                <span className="tier-amount">{price}</span>
                <span className="tier-mo">/mo</span>
              </div>
              <div className="tier-members">Members 1–100</div>
              <div className="tier-bar-row">
                <span style={{color:"var(--muted)"}}>{filled}/100 filled</span>
                <span style={{color:"#ffcc44",fontWeight:700}}>{remaining} left</span>
              </div>
              <div className="tier-bar">
                <div className="tier-bar-fill" style={{width:`${Math.max(pct,2)}%`}}/>
              </div>
              {isSignedIn ? (
                <button className="tier-btn" onClick={onEnterApp}>Join Now →</button>
              ) : (
                <SignInButton mode="modal" forceRedirectUrl="/?upgrade=1">
                  <button className="tier-btn">Join Now — ${price}/mo →</button>
                </SignInButton>
              )}
              <div className="tier-trust">✓ Cancel anytime &nbsp; ✓ Instant access<br/>✓ 7-day money back guarantee</div>
            </div>

            {/* Tier 2 — Growth Locked */}
            <div className="tier-card">
              <div className="tier-label">Growth</div>
              <div className="tier-price">
                <span className="tier-dollar">$</span>
                <span className="tier-amount" style={{color:"var(--muted)"}}>49</span>
                <span className="tier-mo">/mo</span>
              </div>
              <div className="tier-members">Members 101–200</div>
              <div className="tier-desc">Available after Early Access fills. Still below standard price — lock in before it rises again.</div>
              <button className="tier-locked">Locked</button>
            </div>

            {/* Tier 3 — Standard Locked */}
            <div className="tier-card">
              <div className="tier-label">Standard</div>
              <div className="tier-price">
                <span className="tier-dollar">$</span>
                <span className="tier-amount" style={{color:"var(--muted)"}}>99</span>
                <span className="tier-mo">/mo</span>
              </div>
              <div className="tier-members">Members 200+</div>
              <div className="tier-desc">Full price tier. Open after Growth fills. Includes every Pro feature — same product, higher price.</div>
              <button className="tier-locked">Locked</button>
            </div>
          </div>

          {/* What's included */}
          <div className="pricing-includes">
            <div className="pi-title">Every plan includes</div>
            <div className="pi-grid">
              {[
                "Live EV tracking — all 51 Courtyard packs",
                "Buyback EV — real cash after all fees ★ exclusive",
                "STRONG BUY / BUY / WAIT / SKIP signals",
                "TradingView-style EV history charts",
                "Push alerts when packs cross 1.2x Buyback EV",
                "Budget Advisor — best pack for your budget ★",
                "Full live pull feed — 50 pulls with card images",
                "Fee breakdown — every hidden cost exposed",
              ].map((f,i)=>(
                <div key={i} className="pi-item">
                  <div className="pi-check">✓</div>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div className="final-cta">
        <h2>Don't open blind.<br/><em>Check the math.</em></h2>
        <p>Every pack you've bought without data was a gamble. Make it a calculated decision.</p>
        <button className="btn-hero" onClick={onEnterApp} style={{fontSize:15,padding:"14px 32px"}}>
          Get Started — ${price}/mo →
        </button>
        <div style={{marginTop:12,fontFamily:"var(--mono)",fontSize:10,color:"var(--muted)"}}>
          {remaining} early access spots · Price rises after 100 members
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer>
        <div className="foot-logo">PackPulse</div>
        <ul className="foot-links">
          <li><a href="#exclusive">Why Different</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
        </ul>
        <div className="foot-copy">© 2026 PackPulse · Not affiliated with Courtyard.io · Educational purposes only</div>
      </footer>
    </div>
  );
}
