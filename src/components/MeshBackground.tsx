// Animated gradient mesh — used on hero/home page only
// Pure CSS animation, no JS, no canvas, no performance cost
export default function MeshBackground() {
  return (
    <>
      <style>{`
        .mesh-wrap {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .mesh-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0;
          animation: meshFadeIn 1.2s ease forwards;
        }
        [data-theme="light"] .mesh-orb { opacity: 0.55; }
        [data-theme="dark"]  .mesh-orb { opacity: 0.18; }

        .mesh-orb-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, #4F46E5 0%, transparent 70%);
          top: -200px; left: -150px;
          animation: meshFadeIn 1.2s ease forwards, meshFloat1 18s ease-in-out infinite;
        }
        .mesh-orb-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, #7C3AED 0%, transparent 70%);
          top: -100px; right: -100px;
          animation: meshFadeIn 1.4s ease forwards, meshFloat2 22s ease-in-out infinite;
        }
        .mesh-orb-3 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #0284C7 0%, transparent 70%);
          bottom: 20%; left: 10%;
          animation: meshFadeIn 1.6s ease forwards, meshFloat3 20s ease-in-out infinite;
        }
        .mesh-orb-4 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, #DB2777 0%, transparent 70%);
          bottom: 10%; right: 5%;
          animation: meshFadeIn 1.8s ease forwards, meshFloat4 24s ease-in-out infinite;
          opacity: 0;
        }
        [data-theme="light"] .mesh-orb-4 { opacity: 0.25; }
        [data-theme="dark"]  .mesh-orb-4 { opacity: 0.10; }

        /* Grain overlay for texture */
        .mesh-grain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
        }
        [data-theme="light"] .mesh-grain { opacity: 0.025; }
        [data-theme="dark"]  .mesh-grain { opacity: 0.04; }

        @keyframes meshFadeIn {
          from { opacity: 0; }
          to   { opacity: var(--target-opacity, 0.55); }
        }
        @keyframes meshFloat1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%     { transform: translate(40px,-30px) scale(1.08); }
          66%     { transform: translate(-20px,40px) scale(0.95); }
        }
        @keyframes meshFloat2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%     { transform: translate(-50px,30px) scale(1.05); }
          70%     { transform: translate(30px,-20px) scale(0.97); }
        }
        @keyframes meshFloat3 {
          0%,100% { transform: translate(0,0) scale(1); }
          30%     { transform: translate(30px,40px) scale(1.1); }
          60%     { transform: translate(-40px,-20px) scale(0.92); }
        }
        @keyframes meshFloat4 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%     { transform: translate(-30px,-40px) scale(1.06); }
        }

        /* Vignette to keep edges dark/clean */
        .mesh-vignette {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 1;
          background: radial-gradient(ellipse at center, transparent 40%, var(--bg) 100%);
        }
      `}</style>

      <div className="mesh-wrap" aria-hidden="true">
        <div className="mesh-orb mesh-orb-1" />
        <div className="mesh-orb mesh-orb-2" />
        <div className="mesh-orb mesh-orb-3" />
        <div className="mesh-orb mesh-orb-4" />
      </div>
      <div className="mesh-grain" aria-hidden="true" />
      <div className="mesh-vignette" aria-hidden="true" />
    </>
  )
}
