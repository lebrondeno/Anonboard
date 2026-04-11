// Aurora borealis mesh — slow teal/indigo orbs, very subtle
// Only used on Home page hero section
export default function MeshBackground() {
  return (
    <>
      <style>{`
        .mesh-wrap { position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden; }

        .orb {
          position:absolute; border-radius:50%;
          filter:blur(90px);
          animation:orbIn 2s ease forwards;
        }
        [data-theme="light"] .orb { opacity:.38; }
        [data-theme="dark"]  .orb { opacity:.22; }

        /* Teal — top left */
        .orb-1 {
          width:700px; height:700px;
          background:radial-gradient(circle at 40% 40%, #0891B2 0%, #0E7490 40%, transparent 70%);
          top:-280px; left:-220px;
          animation:orbIn 1.8s ease forwards, drift1 28s ease-in-out infinite;
        }
        /* Indigo — top right */
        .orb-2 {
          width:580px; height:580px;
          background:radial-gradient(circle at 60% 40%, #4F46E5 0%, #6366F1 40%, transparent 70%);
          top:-160px; right:-180px;
          animation:orbIn 2.2s ease forwards, drift2 32s ease-in-out infinite;
        }
        /* Deep teal — bottom left */
        .orb-3 {
          width:500px; height:500px;
          background:radial-gradient(circle at 50% 50%, #0D9488 0%, #0F766E 40%, transparent 70%);
          bottom:5%; left:-100px;
          animation:orbIn 2.5s ease forwards, drift3 24s ease-in-out infinite;
        }
        /* Violet accent — bottom right, very subtle */
        .orb-4 {
          width:380px; height:380px;
          background:radial-gradient(circle at 50% 50%, #7C3AED 0%, transparent 65%);
          bottom:10%; right:-60px;
          animation:orbIn 2.8s ease forwards, drift4 30s ease-in-out infinite;
        }
        [data-theme="light"] .orb-4 { opacity:.18; }
        [data-theme="dark"]  .orb-4 { opacity:.12; }

        @keyframes orbIn { from{opacity:0;} to{opacity:var(--o, .22);} }

        @keyframes drift1 {
          0%,100% { transform:translate(0,0) scale(1); }
          25%     { transform:translate(50px,-40px) scale(1.06); }
          50%     { transform:translate(20px,60px) scale(.96); }
          75%     { transform:translate(-30px,20px) scale(1.03); }
        }
        @keyframes drift2 {
          0%,100% { transform:translate(0,0) scale(1); }
          30%     { transform:translate(-60px,40px) scale(1.05); }
          60%     { transform:translate(40px,-30px) scale(.97); }
          80%     { transform:translate(-20px,50px) scale(1.02); }
        }
        @keyframes drift3 {
          0%,100% { transform:translate(0,0) scale(1); }
          40%     { transform:translate(40px,50px) scale(1.08); }
          70%     { transform:translate(-50px,-20px) scale(.94); }
        }
        @keyframes drift4 {
          0%,100% { transform:translate(0,0) scale(1); }
          50%     { transform:translate(-40px,-50px) scale(1.07); }
        }

        /* Film grain */
        .mesh-grain {
          position:fixed; inset:0; pointer-events:none; z-index:1;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='250' height='250' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
        }
        [data-theme="light"] .mesh-grain { opacity:.022; }
        [data-theme="dark"]  .mesh-grain { opacity:.045; }

        /* Radial vignette — keeps edges clean */
        .mesh-vignette {
          position:fixed; inset:0; pointer-events:none; z-index:1;
          background:radial-gradient(ellipse 80% 60% at 50% 0%, transparent 30%, var(--bg) 100%);
        }
      `}</style>

      <div className="mesh-wrap" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
      </div>
      <div className="mesh-grain" aria-hidden="true" />
      <div className="mesh-vignette" aria-hidden="true" />
    </>
  )
}
