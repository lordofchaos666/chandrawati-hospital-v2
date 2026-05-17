import React, { useRef, useEffect } from "react";

/* ============================================================
   PediatricScene  ·  zero-dependency React component
   ------------------------------------------------------------
   • The original illustration is shown intact — no cutouts.
   • Cinematic overlay effects (heartbeat glow, expanding pulse
     rings, scanner sweep, rising heart particles, ken-burns
     zoom) create an examination feel without breaking the art.
   • Four floating glass buttons with 3D tilt + parallax.
   • Mouse-following highlight on the illustration card.

   FILE REQUIRED:
     • scene-image.webp  — the original illustration, untouched.
       Place it at /scene-image.webp (or pass a path via props).

   USAGE:
     import PediatricScene from "./PediatricScene";
     <div style={{ height: 720 }}><PediatricScene /></div>

   With a custom image path:
     <PediatricScene imageSrc="/assets/scene-image.webp" />
   ============================================================ */

const CONTACT = { left: 48, top: 60 }; // stethoscope contact point %

const SCENE_CSS = `
.ps-scene * { box-sizing: border-box; }
.ps-scene { position: relative; width: 100%; height: 100%; min-height: 480px; transform-style: preserve-3d; perspective: 1600px; }

.ps-halo {
  position: absolute; left: 50%; top: 50%;
  width: 80%; height: 80%;
  transform: translate(-50%, -50%);
  background: radial-gradient(closest-side, rgba(120,142,255,0.35) 0%, transparent 65%);
  filter: blur(28px); z-index: 1; pointer-events: none;
  animation: ps-halo 5.4s ease-in-out infinite;
}
@keyframes ps-halo {
  0%,100% { transform: translate(-50%,-50%) scale(1);    opacity:0.5; }
  50%     { transform: translate(-50%,-50%) scale(1.06); opacity:0.85; }
}
.ps-sun {
  position: absolute; left:50%; top:50%; width:72%; height:72%;
  transform: translate(-50%,-50%);
  background: radial-gradient(closest-side, rgba(255,246,220,0.95) 0%, rgba(247,235,210,0.4) 45%, transparent 70%);
  filter: blur(8px); z-index: 1; pointer-events: none; opacity:0;
  animation: ps-sun-in 1.8s cubic-bezier(0.16,1,0.3,1) forwards;
}
@keyframes ps-sun-in {
  from { opacity:0; transform:translate(-50%,-50%) scale(0.85); }
  to   { opacity:1; transform:translate(-50%,-50%) scale(1); }
}
.ps-ground {
  position: absolute; left:50%; top:50%; width:58%; height:60px;
  transform: translate(-50%, calc(50% + 220px));
  background: radial-gradient(ellipse at center, rgba(31,39,92,0.35), transparent 65%);
  filter: blur(18px); z-index: 2; pointer-events: none;
  animation: ps-ground 6.4s ease-in-out 1.3s infinite;
}
@keyframes ps-ground {
  0%,100% { transform: translate(-50%, calc(50% + 220px)) scaleX(1)   scaleY(1);   opacity:0.7; }
  50%     { transform: translate(-50%, calc(50% + 220px)) scaleX(0.92) scaleY(0.85); opacity:0.55; }
}

.ps-illus {
  position: absolute; left:50%; top:50%;
  width: min(620px, 78%);
  transform-style: preserve-3d; z-index: 20;
  transform:
    translate(-50%,-50%)
    translate3d(calc(var(--mx,0)*10px), calc(var(--my,0)*10px), 0)
    rotateY(calc(var(--mx,0)*4deg))
    rotateX(calc(var(--my,0)*-4deg));
  transition: transform 0.05s linear;
}
.ps-illus-enter { opacity:0; transform:scale(0.92) translateY(20px); animation: ps-illus-in 1.2s cubic-bezier(0.16,1,0.3,1) 0.2s forwards; transform-style:preserve-3d; }
@keyframes ps-illus-in { to { opacity:1; transform:scale(1) translateY(0); } }
.ps-illus-float { animation: ps-illus-float 7s ease-in-out 1.4s infinite; transform-style:preserve-3d; }
@keyframes ps-illus-float {
  0%,100% { transform: translateY(0)    rotateZ(0); }
  50%     { transform: translateY(-9px) rotateZ(0.3deg); }
}
.ps-card {
  position:relative; border-radius:30px; overflow:hidden;
  background: linear-gradient(180deg, #EDF1FF 0%, #DCE5FB 100%);
  border: 1px solid rgba(255,255,255,0.85);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.95) inset,
    0 -1px 0 rgba(31,39,92,0.06) inset,
    0 12px 24px -8px rgba(31,39,92,0.22),
    0 40px 80px -24px rgba(31,39,92,0.34),
    0 80px 160px -48px rgba(31,39,92,0.32);
  transform-style: preserve-3d;
}
.ps-img-wrap { animation: ps-kenburns 14s ease-in-out infinite alternate; transform-origin: 47% 62%; }
@keyframes ps-kenburns { 0% {transform:scale(1) rotate(0);} 100% {transform:scale(1.025) rotate(0.2deg);} }
.ps-img { display:block; width:100%; height:auto; user-select:none; -webkit-user-drag:none; }
.ps-light {
  position:absolute; inset:0; pointer-events:none;
  background: radial-gradient(
    400px circle at calc(50% + var(--mx,0)*30%) calc(50% + var(--my,0)*30%),
    rgba(255,255,255,0.28), rgba(255,255,255,0.05) 35%, transparent 60%);
  mix-blend-mode: overlay;
  transition: background 0.15s linear;
}
.ps-glaze {
  position:absolute; inset:0; pointer-events:none;
  background: linear-gradient(180deg, rgba(255,255,255,0.55) 0%, transparent 16%, transparent 82%, rgba(31,39,92,0.08) 100%);
}

.ps-pulse { position:absolute; width:0; height:0; pointer-events:none; }
.ps-pulse-dot {
  position:absolute; left:50%; top:50%; width:28px; height:28px;
  transform: translate(-50%,-50%); border-radius:999px;
  background: radial-gradient(closest-side, rgba(120,255,200,0.95), rgba(120,255,200,0) 70%);
  filter: blur(2px);
  animation: ps-dot 1.2s ease-in-out infinite;
}
@keyframes ps-dot {
  0%,100% { transform:translate(-50%,-50%) scale(0.85); opacity:0.7; }
  14%     { transform:translate(-50%,-50%) scale(1.25); opacity:1; }
  28%     { transform:translate(-50%,-50%) scale(0.95); opacity:0.85; }
  42%     { transform:translate(-50%,-50%) scale(1.15); opacity:1; }
  70%     { transform:translate(-50%,-50%) scale(0.85); opacity:0.7; }
}
.ps-ring {
  position:absolute; left:50%; top:50%;
  width:96px; height:96px; border-radius:999px;
  border: 2px solid rgba(91,220,168,0.9);
  box-shadow: 0 0 28px rgba(91,220,168,0.5);
  animation: ps-ring 2.4s cubic-bezier(0.16,1,0.3,1) infinite;
}
.ps-ring.b { animation-delay: 0.8s; border-color: rgba(91,220,168,0.7); box-shadow:none; }
.ps-ring.c { animation-delay: 1.6s; border-color: rgba(91,220,168,0.5); box-shadow:none; }
@keyframes ps-ring {
  0%   { transform:translate(-50%,-50%) scale(0.5); opacity:0.95; }
  80%  { opacity:0; }
  100% { transform:translate(-50%,-50%) scale(2.8); opacity:0; }
}
.ps-scanner {
  position:absolute; left:30%; top:38%; width:36%; height:38%;
  pointer-events:none; overflow:hidden; border-radius:40%;
  mix-blend-mode: screen; opacity:0;
  animation: ps-scanner-show 8s ease-in-out 2.5s infinite;
}
@keyframes ps-scanner-show { 0%,12%,100% {opacity:0;} 18%,42% {opacity:0.55;} }
.ps-scanner-line {
  position:absolute; left:0; right:0; height:60%;
  background: linear-gradient(180deg, transparent, rgba(120,255,200,0.55) 45%, rgba(120,255,200,0.85) 50%, rgba(120,255,200,0.55) 55%, transparent);
  filter: blur(1px);
  animation: ps-scanner 8s ease-in-out 2.5s infinite;
}
@keyframes ps-scanner {
  0%,12%,100% { transform: translateY(-110%); }
  30%         { transform: translateY(100%); }
  30.01%,99.99% { transform: translateY(100%); }
}
.ps-h { position:absolute; width:10px; height:10px; opacity:0; pointer-events:none; }
.ps-h svg { display:block; width:100%; height:100%; }
@keyframes ps-rise {
  0%   { transform: translate(-50%,0)              scale(0.5);  opacity:0; }
  20%  { opacity:0.85; }
  60%  { transform: translate(calc(-50% + 18px),-80px)  scale(1);    opacity:0.7; }
  100% { transform: translate(calc(-50% - 12px),-180px) scale(1.2);  opacity:0; }
}

.ps-btn-wrap {
  position:absolute; z-index:50; transform-style:preserve-3d;
  transform:
    translate3d(calc(var(--mx,0)*var(--ps,1.6)*22px), calc(var(--my,0)*var(--ps,1.6)*22px), 0)
    rotateY(calc(var(--mx,0)*var(--rd,1)*-10deg))
    rotateX(calc(var(--my,0)*var(--rd,1)*7deg));
  transition: transform 0.05s linear;
}
.ps-btn-enter { opacity:0; transform:scale(0.8) translateY(16px); animation: ps-btn-in 1.2s cubic-bezier(0.16,1,0.3,1) var(--enter,1s) forwards; transform-style:preserve-3d; }
@keyframes ps-btn-in { to { opacity:1; transform:scale(1) translateY(0); } }
.ps-btn-float { animation: ps-btn-float var(--fd,6.6s) ease-in-out var(--fdy,0s) infinite; transform-style:preserve-3d; }
@keyframes ps-btn-float {
  0%,100% { transform: translateY(0)    rotate(0); }
  25%     { transform: translateY(-11px) rotate(1.6deg); }
  50%     { transform: translateY(0)    rotate(0); }
  75%     { transform: translateY(8px)  rotate(-1.3deg); }
}
.ps-btn {
  position:relative;
  display:flex; align-items:center; gap:12px;
  padding:13px 22px 13px 14px; border-radius:18px;
  color:#0B1138; white-space:nowrap;
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size:14.5px; font-weight:600; letter-spacing:-0.005em; line-height:1.15;
  transform: translateZ(50px);
  background: linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55));
  -webkit-backdrop-filter: blur(22px) saturate(150%);
          backdrop-filter: blur(22px) saturate(150%);
  border: 1px solid rgba(255,255,255,0.85);
  box-shadow:
    0 1px 0 rgba(255,255,255,1) inset,
    0 -1px 0 rgba(31,39,92,0.05) inset,
    0 14px 30px -10px rgba(31,39,92,0.28),
    0 28px 70px -24px rgba(31,39,92,0.32);
}
.ps-btn::before {
  content:""; position:absolute; inset:1px; border-radius:17px;
  background: linear-gradient(180deg, rgba(255,255,255,0.6), transparent 35%);
  pointer-events:none;
}
.ps-btn-badge {
  position:relative; display:inline-flex; align-items:center; justify-content:center;
  flex-shrink:0; width:38px; height:38px; border-radius:13px; color:white;
  transform: translateZ(22px);
}
.ps-btn-badge::after {
  content:""; position:absolute; inset:2px; border-radius:11px;
  background: linear-gradient(180deg, rgba(255,255,255,0.35), transparent 50%);
  pointer-events:none;
}
.ps-btn-badge svg { position:relative; z-index:1; }

.ps-drift {
  position:absolute; z-index:25;
  transform: translate3d(calc(var(--mx,0)*var(--ps,1.9)*22px), calc(var(--my,0)*var(--ps,1.9)*22px), 0);
  transition: transform 0.05s linear;
}
.ps-drift-enter { opacity:0; transform:scale(0.6); animation: ps-drift-in 0.9s cubic-bezier(0.16,1,0.3,1) var(--enter,0.6s) forwards; }
@keyframes ps-drift-in { to { opacity:1; transform:scale(1); } }
.ps-drift-float { animation: ps-drift-float var(--fd,9s) ease-in-out var(--fdy,0s) infinite; }
@keyframes ps-drift-float {
  0%,100% { transform: translateY(0)    rotate(0); }
  25%     { transform: translateY(-12px) rotate(5deg); }
  50%     { transform: translateY(0)    rotate(0); }
  75%     { transform: translateY(9px)  rotate(-4deg); }
}
.ps-chip {
  display:flex; align-items:center; justify-content:center;
  width:38px; height:38px; border-radius:14px;
  background: linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.5));
  -webkit-backdrop-filter: blur(18px) saturate(140%);
          backdrop-filter: blur(18px) saturate(140%);
  border:1px solid rgba(255,255,255,0.85);
  box-shadow: 0 1px 0 rgba(255,255,255,1) inset, 0 10px 24px -8px rgba(31,39,92,0.22);
}

.ps-p { position:absolute; border-radius:999px; z-index:5; pointer-events:none; animation: ps-p var(--d,5s) ease-in-out var(--del,0s) infinite; }
@keyframes ps-p { 0%,100% { transform:translateY(0); opacity:0.3; } 50% { transform:translateY(-14px); opacity:0.7; } }

@media (prefers-reduced-motion: reduce) {
  .ps-scene *, .ps-scene *::before, .ps-scene *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
`;

/* ── icon set ── */
const HeartIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const BeakerIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 3h15M6 3v15a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V3M6 13h12"/></svg>;
const BulbIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.7.6 1 1.5 1 2.3v.5h6V17c0-.8.3-1.7 1-2.3A7 7 0 0 0 12 2z"/></svg>;
const ShieldIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const StethIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .2.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>;
const PlusIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M7 12h10"/></svg>;

/* ── floating glass button ── */
const FloatingBtn = ({ label, icon, gradient, tint, left, top, parallaxStrength, rotateDirection, enterDelay, floatDuration, floatDelay }) => (
  <div className="ps-btn-wrap" style={{ left:`${left}%`, top:`${top}%`, "--ps":parallaxStrength, "--rd":rotateDirection }}>
    <div className="ps-btn-enter" style={{ "--enter":`${enterDelay}s` }}>
      <div className="ps-btn-float" style={{ "--fd":`${floatDuration}s`, "--fdy":`${floatDelay}s` }}>
        <div className="ps-btn">
          <span className="ps-btn-badge" style={{ background:gradient, boxShadow:`0 10px 22px -8px ${tint}80` }}>
            {icon}
          </span>
          <span>{label}</span>
        </div>
      </div>
    </div>
  </div>
);

/* ── main component ── */
export default function PediatricScene({
  imageSrc = "/scene-image.webp",
  className = "",
  style = {},
}) {
  const sceneRef = useRef(null);

  useEffect(() => {
    const el = sceneRef.current;
    if (!el) return;

    let rafId = 0, targetX = 0, targetY = 0, currentX = 0, currentY = 0, active = false;

    const tick = () => {
      const dx = targetX - currentX, dy = targetY - currentY;
      currentX += dx * 0.08; currentY += dy * 0.08;
      el.style.setProperty("--mx", currentX.toFixed(4));
      el.style.setProperty("--my", currentY.toFixed(4));
      if (Math.abs(dx) < 0.0008 && Math.abs(dy) < 0.0008 && targetX === 0 && targetY === 0) {
        active = false; return;
      }
      rafId = requestAnimationFrame(tick);
    };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width/2, cy = r.top + r.height/2;
      targetX = Math.max(-1, Math.min(1, (e.clientX - cx) / (r.width/2)));
      targetY = Math.max(-1, Math.min(1, (e.clientY - cy) / (r.height/2)));
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
        <div className="ps-ground" aria-hidden />

        <div className="ps-illus">
          <div className="ps-illus-enter">
            <div className="ps-illus-float">
              <div className="ps-card">
                <div className="ps-img-wrap">
                  <img className="ps-img" src={imageSrc} alt="Pediatrician examining a child with their mother" draggable={false} />
                </div>

                <div className="ps-scanner" aria-hidden>
                  <div className="ps-scanner-line" />
                </div>

                <div className="ps-pulse" style={{ left:`${CONTACT.left}%`, top:`${CONTACT.top}%` }} aria-hidden>
                  <div className="ps-pulse-dot" />
                  <div className="ps-ring" />
                  <div className="ps-ring b" />
                  <div className="ps-ring c" />
                </div>

                <div className="ps-h" style={{ left:"46%", top:"60%", animation:"ps-rise 5s ease-in 1.2s infinite" }} aria-hidden>
                  <svg viewBox="0 0 24 24" fill="#FF6E8E"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/></svg>
                </div>
                <div className="ps-h" style={{ left:"50%", top:"60%", animation:"ps-rise 5s ease-in 2.4s infinite" }} aria-hidden>
                  <svg viewBox="0 0 24 24" fill="#FF8FA8"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/></svg>
                </div>
                <div className="ps-h" style={{ left:"49%", top:"60%", animation:"ps-rise 5s ease-in 3.8s infinite" }} aria-hidden>
                  <svg viewBox="0 0 24 24" fill="#FFB3C2"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/></svg>
                </div>

                <div className="ps-light" aria-hidden />
                <div className="ps-glaze" aria-hidden />
              </div>
            </div>
          </div>
        </div>

        {/* Four floating buttons */}
        <FloatingBtn
          label="Care with compassion" icon={<HeartIcon/>}
          gradient="linear-gradient(135deg,#FF6E8E,#E94168)" tint="#FF4A77"
          left={-3} top={16} parallaxStrength={1.7} rotateDirection={1}
          enterDelay={1.0} floatDuration={6.6} floatDelay={0}
        />
        <FloatingBtn
          label="Evidence based medicine" icon={<BeakerIcon/>}
          gradient="linear-gradient(135deg,#6E86FF,#3F52D6)" tint="#5366E8"
          left={62} top={6} parallaxStrength={1.5} rotateDirection={-1}
          enterDelay={1.2} floatDuration={7.4} floatDelay={0.4}
        />
        <FloatingBtn
          label="Innovation in healing" icon={<BulbIcon/>}
          gradient="linear-gradient(135deg,#FFB068,#FF8B3D)" tint="#FF9F50"
          left={-2} top={66} parallaxStrength={1.8} rotateDirection={-1}
          enterDelay={1.4} floatDuration={7.8} floatDelay={0.8}
        />
        <FloatingBtn
          label="Protecting the future" icon={<ShieldIcon/>}
          gradient="linear-gradient(135deg,#5BDCA8,#2DAA82)" tint="#3FB18A"
          left={62} top={74} parallaxStrength={1.6} rotateDirection={1}
          enterDelay={1.6} floatDuration={6.8} floatDelay={0.2}
        />

        {/* Drifting ambient chips */}
        <div className="ps-drift" style={{ left:"4%", top:"46%", "--ps":2.1 }}>
          <div className="ps-drift-enter" style={{ "--enter":"1.8s" }}>
            <div className="ps-drift-float" style={{ "--fd":"9s", "--fdy":"0s" }}>
              <div className="ps-chip" style={{ color:"#5366E8" }}><StethIcon/></div>
            </div>
          </div>
        </div>
        <div className="ps-drift" style={{ left:"92%", top:"42%", "--ps":2.0 }}>
          <div className="ps-drift-enter" style={{ "--enter":"1.9s" }}>
            <div className="ps-drift-float" style={{ "--fd":"10s", "--fdy":"0.6s" }}>
              <div className="ps-chip" style={{ color:"#FF7B6B" }}><PlusIcon/></div>
            </div>
          </div>
        </div>

        {/* Particles */}
        {[
          { l:18, t:10, s:5, c:"#5366E8", d:4,   del:0 },
          { l:82, t:34, s:6, c:"#FF7B6B", d:5,   del:0.4 },
          { l:26, t:90, s:4, c:"#5BDCA8", d:6,   del:0.8 },
          { l:70, t:94, s:5, c:"#7C8FFF", d:5.5, del:1.2 },
          { l:97, t:60, s:4, c:"#FFB37A", d:4.5, del:1.6 },
          { l:50, t:4,  s:4, c:"#9DA8FF", d:5.2, del:0.6 },
        ].map((p, i) => (
          <span key={i} aria-hidden className="ps-p"
            style={{ left:`${p.l}%`, top:`${p.t}%`, width:p.s, height:p.s, background:p.c, "--d":`${p.d}s`, "--del":`${p.del}s` }}
          />
        ))}
      </div>
    </>
  );
}
