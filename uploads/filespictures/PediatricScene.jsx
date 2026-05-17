import React, { useRef, useEffect } from "react";

/* ============================================================
   PediatricScene  ·  zero-dependency animated illustration
   ------------------------------------------------------------
   Drop-in React component. No framer-motion, no Tailwind —
   just React + CSS keyframes + a small rAF parallax lerp.

   FILES REQUIRED (both ship alongside this .jsx):
     • scene-base.webp   — the illustration with hand region patched out
     • scene-hand.webp   — only the gloved hand + stethoscope (transparent PNG/WebP)

   By default the component looks for both files at the site root:
     /scene-base.webp  and  /scene-hand.webp

   To use a different path (e.g. in /public/assets/), pass props:
     <PediatricScene
       baseImg="/assets/scene-base.webp"
       handImg="/assets/scene-hand.webp"
     />

   USAGE:
     import PediatricScene from "./PediatricScene";
     <div style={{ height: 640 }}><PediatricScene /></div>
   ============================================================ */

// Exact percentage position of the hand layer over the base image —
// computed from the original illustration pixel coordinates.
const HAND = { left: 40.060, top: 48.884, width: 21.966 };
// Stethoscope contact point on the child's chest.
const CONTACT = { left: 48, top: 60 };

/* ─── Inline SVG icons ─────────────────────────────────────── */
const HeartIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);
const BeakerIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 3h15M6 3v15a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V3M6 13h12"/>
  </svg>
);
const StethoscopeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .2.3"/>
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
    <circle cx="20" cy="10" r="2"/>
  </svg>
);
const CrossIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>
  </svg>
);
const PillIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.5 20.5a4.95 4.95 0 0 1-7-7l10-10a4.95 4.95 0 0 1 7 7l-10 10Z"/>
    <path d="m8.5 8.5 7 7"/>
  </svg>
);
const SparkleIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
  </svg>
);

/* ─── All animations + scoped CSS ──────────────────────────── */
const SCENE_CSS = `
.ps-scene { position: relative; width: 100%; height: 100%; min-height: 480px; transform-style: preserve-3d; perspective: 1400px; }
.ps-scene * { box-sizing: border-box; }

.ps-glass {
  background: linear-gradient(135deg, rgba(255,255,255,0.78), rgba(255,255,255,0.46));
  -webkit-backdrop-filter: blur(18px) saturate(140%);
          backdrop-filter: blur(18px) saturate(140%);
  border: 1px solid rgba(255,255,255,0.7);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.95) inset,
    0 14px 36px -10px rgba(31, 39, 92, 0.18),
    0 28px 72px -24px rgba(31, 39, 92, 0.22);
}

/* Background atmosphere */
.ps-halo {
  position: absolute; left: 50%; top: 50%;
  width: 78%; height: 78%;
  transform: translate(-50%, -50%);
  background: radial-gradient(closest-side, rgba(120,142,255,0.30) 0%, transparent 65%);
  filter: blur(24px);
  z-index: 1; pointer-events: none;
  animation: ps-halo-pulse 5.2s ease-in-out infinite;
}
@keyframes ps-halo-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1);    opacity: 0.55; }
  50%      { transform: translate(-50%, -50%) scale(1.06); opacity: 0.85; }
}
.ps-sun {
  position: absolute; left: 50%; top: 50%;
  width: 70%; height: 70%;
  transform: translate(-50%, -50%);
  background: radial-gradient(closest-side, rgba(255,246,220,0.92) 0%, rgba(247,235,210,0.35) 45%, transparent 70%);
  filter: blur(6px);
  z-index: 1; pointer-events: none; opacity: 0;
  animation: ps-sun-in 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes ps-sun-in {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
  to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

/* Illustration card */
.ps-illus-parallax {
  position: absolute;
  left: 50%; top: 50%;
  width: min(620px, 86%);
  transform-style: preserve-3d;
  z-index: 20;
  transform:
    translate(-50%, -50%)
    translate3d(calc(var(--mx, 0) * 8px), calc(var(--my, 0) * 8px), 0)
    rotateY(calc(var(--mx, 0) * 2.5deg))
    rotateX(calc(var(--my, 0) * -2.5deg));
}
.ps-illus-enter {
  opacity: 0;
  transform: scale(0.92) translateY(20px);
  animation: ps-illus-in 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
  transform-style: preserve-3d;
}
@keyframes ps-illus-in { to { opacity: 1; transform: scale(1) translateY(0); } }
.ps-illus-float {
  animation: ps-illus-float 6.4s ease-in-out 1.3s infinite;
}
@keyframes ps-illus-float {
  0%, 100% { transform: translateY(0) scale(1); }
  50%      { transform: translateY(-8px) scale(1.005); }
}
.ps-card {
  position: relative;
  border-radius: 28px;
  overflow: hidden;
  background: linear-gradient(180deg, #EDF1FF 0%, #DFE6FB 100%);
  border: 1px solid rgba(255,255,255,0.7);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.9) inset,
    0 -1px 0 rgba(31,39,92,0.05) inset,
    0 30px 60px -20px rgba(31,39,92,0.28),
    0 60px 120px -40px rgba(31,39,92,0.30);
}
.ps-card-img {
  display: block; width: 100%; height: auto;
  user-select: none; -webkit-user-drag: none;
}
.ps-card-glaze {
  position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 18%, transparent 82%, rgba(31,39,92,0.06) 100%);
}

/* Doctor's hand layer */
.ps-hand {
  position: absolute;
  user-select: none; -webkit-user-drag: none;
  transform-origin: 30% 75%;
  filter: drop-shadow(0 4px 6px rgba(31, 39, 92, 0.18));
  opacity: 0;
  animation:
    ps-hand-enter   1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.9s forwards,
    ps-hand-breathe 3.8s ease-in-out                   2.0s infinite;
}
@keyframes ps-hand-enter {
  from { opacity: 0; transform: translateY(-14px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ps-hand-breathe {
  0%, 50%, 100% { transform: translateY(0); }
  25%, 75%      { transform: translateY(-2.5px); }
}

/* Pulse rings at stethoscope contact */
.ps-pulse { position: absolute; width: 0; height: 0; pointer-events: none; }
.ps-pulse-dot {
  position: absolute; left: 50%; top: 50%;
  width: 22px; height: 22px;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background: radial-gradient(closest-side, rgba(120,255,200,0.95), rgba(120,255,200,0) 70%);
  filter: blur(2px);
}
.ps-pulse-ring {
  position: absolute; left: 50%; top: 50%;
  width: 90px; height: 90px;
  border-radius: 999px;
  border: 2px solid rgba(91, 220, 168, 0.85);
  box-shadow: 0 0 24px rgba(91, 220, 168, 0.45);
  animation: ps-pulse-ring 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite;
}
.ps-pulse-ring.delay { border-color: rgba(91, 220, 168, 0.55); box-shadow: none; animation-delay: 1.2s; }
@keyframes ps-pulse-ring {
  0%   { transform: translate(-50%, -50%) scale(0.55); opacity: 0.9; }
  80%  { opacity: 0; }
  100% { transform: translate(-50%, -50%) scale(2.6); opacity: 0; }
}

/* 3D moving tabs */
.ps-tab-parallax {
  position: absolute; z-index: 40;
  transform-style: preserve-3d;
  transform:
    translate3d(
      calc(var(--mx, 0) * var(--ps, 1.5) * 20px),
      calc(var(--my, 0) * var(--ps, 1.5) * 20px),
      0)
    rotateY(calc(var(--mx, 0) * var(--rd, 1) * -8deg))
    rotateX(calc(var(--my, 0) * var(--rd, 1) * 6deg));
}
.ps-tab-enter {
  opacity: 0;
  transform: scale(0.85) translateY(14px);
  animation: ps-tab-in 1.1s cubic-bezier(0.16, 1, 0.3, 1) var(--enter-delay, 1s) forwards;
  transform-style: preserve-3d;
}
@keyframes ps-tab-in { to { opacity: 1; transform: scale(1) translateY(0); } }
.ps-tab-float {
  animation: ps-tab-float var(--float-dur, 6.4s) ease-in-out var(--float-delay, 0s) infinite;
  transform-style: preserve-3d;
}
@keyframes ps-tab-float {
  0%,100% { transform: translateY(0)     rotate(0); }
  25%     { transform: translateY(-10px)  rotate(1.5deg); }
  50%     { transform: translateY(0)     rotate(0); }
  75%     { transform: translateY(7px)   rotate(-1.2deg); }
}
.ps-tab-card {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 18px 11px 14px;
  border-radius: 16px;
  color: #0B1138;
  white-space: nowrap;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 14.5px; font-weight: 550;
  letter-spacing: -0.005em; line-height: 1.15;
  transform: translateZ(40px);
}
.ps-tab-badge {
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  width: 34px; height: 34px;
  border-radius: 12px;
  color: white;
  transform: translateZ(18px);
}

/* Drifting medical icon chips */
.ps-drift-parallax {
  position: absolute; z-index: 25;
  transform: translate3d(
    calc(var(--mx, 0) * var(--ps, 1.7) * 20px),
    calc(var(--my, 0) * var(--ps, 1.7) * 20px),
    0);
}
.ps-drift-enter {
  opacity: 0; transform: scale(0.6);
  animation: ps-drift-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) var(--enter-delay, 0.6s) forwards;
}
@keyframes ps-drift-in { to { opacity: 1; transform: scale(1); } }
.ps-drift-float {
  animation: ps-drift-float var(--float-dur, 9s) ease-in-out var(--float-delay, 0s) infinite;
}
@keyframes ps-drift-float {
  0%,100% { transform: translateY(0)     rotate(0); }
  25%     { transform: translateY(-12px)  rotate(5deg); }
  50%     { transform: translateY(0)     rotate(0); }
  75%     { transform: translateY(9px)   rotate(-4deg); }
}
.ps-drift-chip {
  display: flex; align-items: center; justify-content: center;
  width: var(--chip-size, 38px); height: var(--chip-size, 38px);
  border-radius: 16px;
}

/* Particles */
.ps-particle {
  position: absolute; border-radius: 999px;
  opacity: 0.55; z-index: 5; pointer-events: none;
  animation: ps-particle var(--p-dur, 5s) ease-in-out var(--p-delay, 0s) infinite;
}
@keyframes ps-particle {
  0%, 100% { transform: translateY(0);     opacity: 0.3; }
  50%      { transform: translateY(-14px); opacity: 0.7; }
}

@media (prefers-reduced-motion: reduce) {
  .ps-scene *, .ps-scene *::before, .ps-scene *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
`;

/* ─── Small subcomponents ──────────────────────────────────── */
const Tab3D = ({ label, icon, gradient, tint, left, top, parallaxStrength, rotateDirection, enterDelay, floatDuration, floatDelay }) => (
  <div className="ps-tab-parallax" style={{ left: `${left}%`, top: `${top}%`, "--ps": parallaxStrength, "--rd": rotateDirection }}>
    <div className="ps-tab-enter" style={{ "--enter-delay": `${enterDelay}s` }}>
      <div className="ps-tab-float" style={{ "--float-dur": `${floatDuration}s`, "--float-delay": `${floatDelay}s` }}>
        <div className="ps-glass ps-tab-card">
          <span className="ps-tab-badge" style={{ background: gradient, boxShadow: `0 8px 18px -6px ${tint}66` }}>
            {icon}
          </span>
          <span>{label}</span>
        </div>
      </div>
    </div>
  </div>
);

const DriftIcon = ({ children, x, y, parallaxStrength, enterDelay, floatDuration, floatDelay, tint, size }) => (
  <div className="ps-drift-parallax" style={{ left: `${x}%`, top: `${y}%`, "--ps": parallaxStrength }}>
    <div className="ps-drift-enter" style={{ "--enter-delay": `${enterDelay}s` }}>
      <div className="ps-drift-float" style={{ "--float-dur": `${floatDuration}s`, "--float-delay": `${floatDelay}s` }}>
        <div className="ps-glass ps-drift-chip" style={{ color: tint, "--chip-size": `${size}px` }}>
          {children}
        </div>
      </div>
    </div>
  </div>
);

/* ─── Main component ───────────────────────────────────────── */
export default function PediatricScene({
  baseImg = "/scene-base.webp",
  handImg = "/scene-hand.webp",
  className = "",
  style = {},
}) {
  const sceneRef = useRef(null);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;

    let rafId = 0;
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let active = false;

    const tick = () => {
      const dx = targetX - currentX;
      const dy = targetY - currentY;
      currentX += dx * 0.09;
      currentY += dy * 0.09;
      el.style.setProperty("--mx", currentX.toFixed(4));
      el.style.setProperty("--my", currentY.toFixed(4));
      if (Math.abs(dx) < 0.0008 && Math.abs(dy) < 0.0008 && targetX === 0 && targetY === 0) {
        active = false;
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      targetX = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2)));
      targetY = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2)));
      if (!active) { active = true; rafId = requestAnimationFrame(tick); }
    };
    const onLeave = () => {
      targetX = 0; targetY = 0;
      if (!active) { active = true; rafId = requestAnimationFrame(tick); }
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <>
      <style>{SCENE_CSS}</style>
      <div ref={sceneRef} className={`ps-scene ${className}`} style={style}>
        <div className="ps-halo" aria-hidden />
        <div className="ps-sun" aria-hidden />

        <div className="ps-illus-parallax">
          <div className="ps-illus-enter">
            <div className="ps-illus-float">
              <div className="ps-card">
                <img
                  src={baseImg}
                  alt="Pediatrician examining a child with their mother"
                  className="ps-card-img"
                  draggable={false}
                />
                <img
                  src={handImg}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="ps-hand"
                  style={{
                    left: `${HAND.left}%`,
                    top: `${HAND.top}%`,
                    width: `${HAND.width}%`,
                  }}
                />
                <div className="ps-pulse" style={{ left: `${CONTACT.left}%`, top: `${CONTACT.top}%` }} aria-hidden>
                  <div className="ps-pulse-dot" />
                  <div className="ps-pulse-ring" />
                  <div className="ps-pulse-ring delay" />
                </div>
                <div className="ps-card-glaze" aria-hidden />
              </div>
            </div>
          </div>
        </div>

        <Tab3D
          label="Care with compassion"
          icon={<HeartIcon size={18} />}
          gradient="linear-gradient(135deg, #FF6E8E, #E94168)"
          tint="#FF4A77"
          left={-1}  top={28}
          parallaxStrength={1.7}  rotateDirection={1}
          enterDelay={1.0}  floatDuration={6.4}  floatDelay={0}
        />
        <Tab3D
          label="Evidence based treatment"
          icon={<BeakerIcon size={18} />}
          gradient="linear-gradient(135deg, #6E86FF, #3F52D6)"
          tint="#5366E8"
          left={62}  top={9}
          parallaxStrength={1.5}  rotateDirection={-1}
          enterDelay={1.2}  floatDuration={7.2}  floatDelay={0.4}
        />

        <DriftIcon x={6}  y={7}  parallaxStrength={1.9} enterDelay={0.9} floatDuration={9}    floatDelay={0}   tint="#5366E8" size={38}>
          <StethoscopeIcon size={20} />
        </DriftIcon>
        <DriftIcon x={90} y={66} parallaxStrength={2.0} enterDelay={1.3} floatDuration={11}   floatDelay={0.4} tint="#FF7B6B" size={38}>
          <PillIcon size={18} />
        </DriftIcon>
        <DriftIcon x={3}  y={75} parallaxStrength={1.7} enterDelay={1.7} floatDuration={9.5}  floatDelay={0.8} tint="#5BDCA8" size={38}>
          <CrossIcon size={16} />
        </DriftIcon>
        <DriftIcon x={92} y={28} parallaxStrength={1.6} enterDelay={1.1} floatDuration={10.5} floatDelay={0.2} tint="#FFB37A" size={36}>
          <SparkleIcon size={16} />
        </DriftIcon>

        {[
          { l: 18, t: 14, s: 4, c: "#5366E8", d: 4,   delay: 0 },
          { l: 82, t: 38, s: 5, c: "#FF7B6B", d: 5,   delay: 0.4 },
          { l: 26, t: 88, s: 3, c: "#5BDCA8", d: 6,   delay: 0.8 },
          { l: 70, t: 92, s: 4, c: "#7C8FFF", d: 5.5, delay: 1.2 },
          { l: 95, t: 52, s: 3, c: "#FFB37A", d: 4.5, delay: 1.6 },
        ].map((p, i) => (
          <span key={i} aria-hidden className="ps-particle"
            style={{
              left: `${p.l}%`, top: `${p.t}%`,
              width: p.s, height: p.s,
              background: p.c,
              "--p-dur": `${p.d}s`,
              "--p-delay": `${p.delay}s`,
            }}
          />
        ))}
      </div>
    </>
  );
}
