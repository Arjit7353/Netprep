import { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════
//  NETPREP — EXTREME CINEMATIC SPLASH SCREEN v3
//  Full canvas-based with WebGL-style effects
// ═══════════════════════════════════════════════════════════════════

const SplashScreen = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [visible, setVisible] = useState(true);

  // Canvas refs
  const bgCanvasRef = useRef(null);       // Background: stars + nebula + grid
  const logoCanvasRef = useRef(null);     // Logo: animated N circle
  const fxCanvasRef = useRef(null);       // FX: particles + scanlines

  // Animation frame refs
  const bgRafRef = useRef(null);
  const logoRafRef = useRef(null);
  const fxRafRef = useRef(null);

  const fullText = 'ETprep';
  const phaseRef = useRef(0);

  /*
    PHASE TIMELINE (~7 seconds total, cinematic pace)
    ──────────────────────────────────────────────────
    0  pure black                          0.0s
    1  bg canvas fades in                  0.4s
    2  N circle canvas animation begins    1.2s
    3  N text + typewriter                 2.6s
    4  underline draws                     3.8s
    5  English tagline                     4.5s
    6  divider + Hindi + dots              5.3s
    7  exit begins                         6.8s
  */

  // ── Phase timeline ──
  useEffect(() => {
    const timers = [
      setTimeout(() => { setPhase(1); phaseRef.current = 1; }, 400),
      setTimeout(() => { setPhase(2); phaseRef.current = 2; }, 1200),
      setTimeout(() => { setPhase(3); phaseRef.current = 3; }, 2600),
      setTimeout(() => { setPhase(4); phaseRef.current = 4; }, 3800),
      setTimeout(() => { setPhase(5); phaseRef.current = 5; }, 4500),
      setTimeout(() => { setPhase(6); phaseRef.current = 6; }, 5300),
      setTimeout(() => { setPhase(7); phaseRef.current = 7; }, 6800),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // ── Typewriter: 110ms per char ──
  useEffect(() => {
    if (phase < 3) return;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTypedText(fullText.slice(0, i));
      if (i >= fullText.length) clearInterval(iv);
    }, 110);
    return () => clearInterval(iv);
  }, [phase]);

  // ── Exit ──
  useEffect(() => {
    if (phase !== 7) return;
    const t = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 1000);
    return () => clearTimeout(t);
  }, [phase, onComplete]);

  // ════════════════════════════════════════════════
  //  BG CANVAS: Stars (3 layers) + Nebula + Grid
  // ════════════════════════════════════════════════
  useEffect(() => {
    const canvas = bgCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, opacity = 0;

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Star layers
    const makeStars = (count, minR, maxR, minA, maxA, minSpeed, maxSpeed, color) =>
      Array.from({ length: count }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: minR + Math.random() * (maxR - minR),
        baseAlpha: minA + Math.random() * (maxA - minA),
        phase: Math.random() * Math.PI * 2,
        speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
        dx: (Math.random() - 0.5) * 0.00006,
        dy: (Math.random() - 0.5) * 0.00004,
        color,
        flare: Math.random() > 0.85,
        flareR: 2 + Math.random() * 5,
      }));

    const deepStars = makeStars(100, 0.2, 0.7, 0.02, 0.07, 0.001, 0.005, '180,190,254');
    const midStars  = makeStars(50,  0.4, 1.2, 0.04, 0.12, 0.002, 0.008, '196,181,253');
    const nearStars = makeStars(20,  0.8, 1.8, 0.08, 0.22, 0.003, 0.012, '224,231,255');

    // Grid lines data
    const gridSpacing = 55;

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      t += 0.016;

      // Fade in
      if (phaseRef.current >= 1 && opacity < 1) opacity = Math.min(1, opacity + 0.015);
      ctx.globalAlpha = opacity;

      // ── Nebula blobs ──
      const blobs = [
        { x: 0.35, y: 0.38, rx: 280, ry: 200, c: [79, 70, 229], a: 0.04 },
        { x: 0.65, y: 0.62, rx: 220, ry: 160, c: [139, 92, 246], a: 0.03 },
        { x: 0.5,  y: 0.5,  rx: 180, ry: 180, c: [99, 102, 241], a: 0.025 },
      ];
      blobs.forEach(b => {
        const bx = b.x * w + Math.sin(t * 0.08) * 15;
        const by = b.y * h + Math.cos(t * 0.06) * 12;
        const gr = ctx.createRadialGradient(bx, by, 0, bx, by, Math.max(b.rx, b.ry));
        gr.addColorStop(0, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},${b.a})`);
        gr.addColorStop(0.5, `rgba(${b.c[0]},${b.c[1]},${b.c[2]},${b.a * 0.4})`);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.save();
        ctx.scale(b.rx / b.ry, 1);
        ctx.beginPath();
        ctx.arc(bx * (b.ry / b.rx), by, b.ry * (1 + Math.sin(t * 0.05) * 0.05), 0, Math.PI * 2);
        ctx.fillStyle = gr;
        ctx.fill();
        ctx.restore();
      });

      // ── Subtle hex/grid ──
      ctx.strokeStyle = 'rgba(99,102,241,0.03)';
      ctx.lineWidth = 0.5;
      const gridOff = (t * 2) % gridSpacing;
      for (let gx = -gridSpacing + gridOff; gx < w + gridSpacing; gx += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke();
      }
      for (let gy = -gridSpacing + gridOff * 0.6; gy < h + gridSpacing; gy += gridSpacing) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke();
      }

      // ── Stars ──
      const drawStar = (s) => {
        s.x = ((s.x + s.dx) + 1) % 1;
        s.y = ((s.y + s.dy) + 1) % 1;
        const twinkle = Math.sin(t * s.speed * 60 + s.phase);
        const a = s.baseAlpha * (0.35 + twinkle * 0.65);
        const sx = s.x * w, sy = s.y * h;

        if (s.flare) {
          const fg = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.flareR * (1 + twinkle * 0.2));
          fg.addColorStop(0, `rgba(${s.color},${a * 0.5})`);
          fg.addColorStop(1, `rgba(${s.color},0)`);
          ctx.beginPath();
          ctx.arc(sx, sy, s.flareR * (1 + twinkle * 0.2), 0, Math.PI * 2);
          ctx.fillStyle = fg;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color},${a})`;
        ctx.fill();
      };

      deepStars.forEach(drawStar);
      midStars.forEach(drawStar);
      nearStars.forEach(drawStar);

      ctx.globalAlpha = 1;
      bgRafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (bgRafRef.current) cancelAnimationFrame(bgRafRef.current);
    };
  }, []);

  // ════════════════════════════════════════════════
  //  LOGO CANVAS: Animated N circle (frame-by-frame)
  // ════════════════════════════════════════════════
  useEffect(() => {
    if (phase < 2) return;
    const canvas = logoCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const SZ = 240;
    canvas.width = SZ;
    canvas.height = SZ;
    const CX = SZ / 2, CY = SZ / 2, R = 90;

    let startTime = null;
    let raf;
    const INTRO_MS = 1400;    // circle materialise
    const IDLE_START = 1400;  // starts idle loop

    const easeOutElastic = (t) => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      return Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1;
    };
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
    const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

    const drawFrame = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      ctx.clearRect(0, 0, SZ, SZ);

      const introProgress = Math.min(elapsed / INTRO_MS, 1);
      const idleTime = Math.max(0, elapsed - IDLE_START) / 1000;

      // Scale (elastic bounce in)
      const scaleP = easeOutElastic(Math.min(elapsed / (INTRO_MS * 0.75), 1));
      // Rotation (spins in from -90deg)
      const rotP = easeOutCubic(introProgress);
      const rotation = (1 - rotP) * (-Math.PI * 0.5);
      // Blur (clears as it materialises)
      const blurV = Math.max(0, (1 - introProgress * 1.8) * 12);
      // Idle glow pulse
      const glowPulse = 0.5 + Math.sin(idleTime * 1.8) * 0.5;
      // Idle slow rotate (after intro)
      const idleRot = idleTime * 0.15;

      ctx.save();
      ctx.translate(CX, CY);
      ctx.rotate(rotation + idleRot);
      ctx.scale(scaleP, scaleP);
      if (blurV > 0.3) ctx.filter = `blur(${blurV}px)`;
      ctx.translate(-CX, -CY);

      // ── Outer glow rings (3 layers) ──
      for (let ri = 3; ri >= 1; ri--) {
        const ringR = R + ri * 16 + Math.sin(idleTime * 0.8 + ri) * 3;
        const ringA = (introProgress * 0.06 + glowPulse * 0.03) / ri;
        const rg = ctx.createRadialGradient(CX, CY, ringR - 4, CX, CY, ringR + 4);
        rg.addColorStop(0, `rgba(99,102,241,${ringA})`);
        rg.addColorStop(0.5, `rgba(139,92,246,${ringA * 0.6})`);
        rg.addColorStop(1, 'rgba(99,102,241,0)');
        ctx.beginPath();
        ctx.arc(CX, CY, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(99,102,241,${ringA * 2})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // ── Conic gradient border (drawn as segments) ──
      const borderW = 3.5;
      const segs = 180;
      for (let si = 0; si < segs; si++) {
        if (si / segs > introProgress && elapsed < INTRO_MS) continue; // reveals gradually
        const a1 = (si / segs) * Math.PI * 2;
        const a2 = ((si + 1) / segs) * Math.PI * 2;
        const seg_t = (si / segs + idleTime * 0.05) % 1;
        // Hue cycles: 240 (indigo) → 270 (purple) → 300 (violet) → 240
        const hue = 240 + Math.sin(seg_t * Math.PI * 2) * 30;
        const sat = 65 + seg_t * 20;
        const lit = 52 + Math.sin(seg_t * Math.PI) * 15;
        ctx.beginPath();
        ctx.arc(CX, CY, R, a1, a2);
        ctx.strokeStyle = `hsl(${hue},${sat}%,${lit}%)`;
        ctx.lineWidth = borderW;
        ctx.stroke();
      }

      // ── Main circle background ──
      const bgGrad = ctx.createRadialGradient(CX - 25, CY - 25, 0, CX, CY, R);
      bgGrad.addColorStop(0, '#3730a3');
      bgGrad.addColorStop(0.3, '#4338ca');
      bgGrad.addColorStop(0.65, '#4f46e5');
      bgGrad.addColorStop(0.85, '#5b5bd6');
      bgGrad.addColorStop(1, '#3730a3');
      ctx.beginPath();
      ctx.arc(CX, CY, R - borderW / 2, 0, Math.PI * 2);
      ctx.fillStyle = bgGrad;
      ctx.fill();

      // ── Radial depth shadow ──
      const depthGrad = ctx.createRadialGradient(CX, CY - 10, R * 0.1, CX, CY + 15, R);
      depthGrad.addColorStop(0, 'rgba(0,0,0,0)');
      depthGrad.addColorStop(0.7, 'rgba(0,0,0,0.15)');
      depthGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.beginPath();
      ctx.arc(CX, CY, R - borderW / 2, 0, Math.PI * 2);
      ctx.fillStyle = depthGrad;
      ctx.fill();

      // ── Top-left highlight ──
      const hlGrad = ctx.createLinearGradient(CX - R, CY - R, CX - R * 0.1, CY - R * 0.1);
      hlGrad.addColorStop(0, `rgba(255,255,255,${0.12 * introProgress})`);
      hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.arc(CX, CY, R - borderW / 2, 0, Math.PI * 2);
      ctx.fillStyle = hlGrad;
      ctx.fill();

      // ── Animated shimmer sweep ──
      if (elapsed > 800) {
        const shimT = ((elapsed - 800) / 2500) % 1;
        const shimX1 = CX - R + shimT * R * 3;
        const shg = ctx.createLinearGradient(shimX1, CY - R, shimX1 + 80, CY + R);
        shg.addColorStop(0, 'rgba(255,255,255,0)');
        shg.addColorStop(0.5, `rgba(255,255,255,${0.08 * introProgress})`);
        shg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save();
        ctx.beginPath();
        ctx.arc(CX, CY, R - borderW / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = shg;
        ctx.fillRect(shimX1 - 40, CY - R - 5, 80, R * 2 + 10);
        ctx.restore();
      }

      // ── Idle inner glow pulse ──
      const igGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, R * 0.7);
      igGrad.addColorStop(0, `rgba(129,140,248,${0.08 * glowPulse * introProgress})`);
      igGrad.addColorStop(1, 'rgba(129,140,248,0)');
      ctx.beginPath();
      ctx.arc(CX, CY, R - borderW / 2, 0, Math.PI * 2);
      ctx.fillStyle = igGrad;
      ctx.fill();

      ctx.filter = 'none';
      ctx.restore();

      // ── N letter (no transform so no blur) ──
      if (introProgress > 0.3) {
        const lp = easeOutElastic(Math.min((introProgress - 0.3) / 0.5, 1));
        ctx.save();
        ctx.translate(CX, CY);
        ctx.scale(lp, lp);
        ctx.globalAlpha = Math.min((introProgress - 0.3) * 3, 1);
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 3;
        ctx.font = `900 60px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('N', 0, 1);
        // Subtle N shine
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillText('N', -1, -1);
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // ── Progress arc (draws during intro) ──
      if (introProgress < 0.98) {
        const arcP = easeOutCubic(introProgress);
        ctx.save();
        ctx.translate(CX, CY);
        ctx.rotate(-Math.PI / 2);
        ctx.beginPath();
        ctx.arc(0, 0, R + 22, 0, Math.PI * 2 * arcP);
        const arcG = ctx.createLinearGradient(
          -R - 22, 0, R + 22, 0
        );
        arcG.addColorStop(0, 'rgba(129,140,248,0.5)');
        arcG.addColorStop(1, 'rgba(196,181,253,0.2)');
        ctx.strokeStyle = arcG;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
      }

      raf = requestAnimationFrame(drawFrame);
      logoRafRef.current = raf;
    };

    raf = requestAnimationFrame(drawFrame);
    return () => {
      if (logoRafRef.current) cancelAnimationFrame(logoRafRef.current);
    };
  }, [phase]);

  // ════════════════════════════════════════════════
  //  FX CANVAS: Burst particles + scan line
  // ════════════════════════════════════════════════
  useEffect(() => {
    if (phase < 2) return;
    const canvas = fxCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h;
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Burst particles (emitted once at phase 2)
    const bursts = Array.from({ length: 20 }, (_, i) => {
      const angle = (i / 20) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 1.2 + Math.random() * 2.5;
      const colors = [
        [129, 140, 248], [167, 139, 250], [196, 181, 253],
        [99, 102, 241], [224, 231, 255],
      ];
      const c = colors[i % colors.length];
      return {
        x: 0, y: 0,   // will be set relative to center
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: 1 + Math.random() * 2,
        life: 1,
        decay: 0.015 + Math.random() * 0.015,
        color: c,
        trail: [],
      };
    });

    // Floating ambient particles
    const ambients = Array.from({ length: 35 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -(0.1 + Math.random() * 0.2),   // float upward
      r: 0.5 + Math.random() * 1,
      life: Math.random(),
      maxLife: 0.15 + Math.random() * 0.12,
      color: Math.random() > 0.5 ? [129, 140, 248] : [196, 181, 253],
    }));

    let t = 0;
    const CX_ratio = 0.5;
    const CY_ratio = 0.42;

    const drawFx = () => {
      ctx.clearRect(0, 0, w, h);
      t += 0.016;

      const cx = w * CX_ratio;
      const cy = h * CY_ratio;

      // ── Burst particles ──
      bursts.forEach(p => {
        if (p.life <= 0) return;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.life -= p.decay;

        p.trail.push({ x: cx + p.x, y: cy + p.y, life: p.life });
        if (p.trail.length > 8) p.trail.shift();

        // Trail
        p.trail.forEach((pt, ti) => {
          const ta = (ti / p.trail.length) * p.life * 0.4;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, p.r * (ti / p.trail.length) * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${ta})`;
          ctx.fill();
        });

        // Core
        const grd = ctx.createRadialGradient(cx + p.x, cy + p.y, 0, cx + p.x, cy + p.y, p.r * 2);
        grd.addColorStop(0, `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${p.life})`);
        grd.addColorStop(1, `rgba(${p.color[0]},${p.color[1]},${p.color[2]},0)`);
        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, p.r * 2, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + p.x, cy + p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.life * 0.8})`;
        ctx.fill();
      });

      // ── Ambient floating particles ──
      ambients.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 0.005;
        if (p.life > p.maxLife) {
          p.life = 0;
          p.x = Math.random() * w;
          p.y = Math.random() * h;
        }
        const a = Math.sin((p.life / p.maxLife) * Math.PI) * 0.15;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${a})`;
        ctx.fill();
      });

      // ── Scan line (subtle, slow) ──
      if (phaseRef.current >= 1) {
        const scanY = ((t * 25) % (h + 60)) - 30;
        const sg = ctx.createLinearGradient(0, scanY - 1, 0, scanY + 2);
        sg.addColorStop(0, 'rgba(129,140,248,0)');
        sg.addColorStop(0.5, 'rgba(129,140,248,0.025)');
        sg.addColorStop(1, 'rgba(129,140,248,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(0, scanY - 1, w, 3);
      }

      fxRafRef.current = requestAnimationFrame(drawFx);
    };
    drawFx();

    return () => {
      window.removeEventListener('resize', resize);
      if (fxRafRef.current) cancelAnimationFrame(fxRafRef.current);
    };
  }, [phase]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes sp_bgPulse {
          0%,100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes sp_nTextIn {
          0% { opacity:0; transform:translateY(14px); filter:blur(8px); }
          100% { opacity:1; transform:translateY(0); filter:blur(0); }
        }
        @keyframes sp_letterIn {
          0% {
            opacity:0;
            transform:translateX(-10px) translateY(6px) scale(0.75);
            filter:blur(7px);
          }
          100% {
            opacity:1;
            transform:translateX(0) translateY(0) scale(1);
            filter:blur(0);
          }
        }
        @keyframes sp_cursor {
          0%,100% { opacity:1; }
          50% { opacity:0; }
        }
        @keyframes sp_underline {
          0% { transform:scaleX(0); opacity:0; }
          25% { opacity:1; }
          100% { transform:scaleX(1); opacity:1; }
        }
        @keyframes sp_underGlow {
          0%,100% { opacity:0.22; }
          50% { opacity:0.6; }
        }
        @keyframes sp_tagline {
          0% {
            opacity:0;
            transform:translateY(20px);
            letter-spacing:0.55em;
            filter:blur(5px);
          }
          100% {
            opacity:1;
            transform:translateY(0);
            letter-spacing:0.28em;
            filter:blur(0);
          }
        }
        @keyframes sp_fadeUp {
          0% { opacity:0; transform:translateY(14px); }
          100% { opacity:1; transform:translateY(0); }
        }
        @keyframes sp_dot {
          0%,80%,100% { transform:scale(0.5); opacity:0.15; }
          40% { transform:scale(1.45); opacity:1; }
        }
        @keyframes sp_lineGrow {
          0% { width:0; opacity:0; }
          40% { opacity:0.3; }
          100% { width:76px; opacity:0.12; }
        }
        @keyframes sp_float {
          0%,100% { transform:translateY(0) scale(1); }
          50% { transform:translateY(-6px) scale(1.15); }
        }
        @keyframes sp_versionIn {
          0% { opacity:0; transform:translateY(6px); }
          100% { opacity:0.3; transform:translateY(0); }
        }
        @keyframes sp_shimmerText {
          0% { background-position:200% center; }
          100% { background-position:-200% center; }
        }
        @keyframes sp_orbitDot {
          0% { transform:rotate(0deg) translateX(var(--orbit-r)) rotate(0deg); }
          100% { transform:rotate(360deg) translateX(var(--orbit-r)) rotate(-360deg); }
        }
        @keyframes sp_bottomLine {
          0% { width:0; opacity:0; }
          100% { width:120px; opacity:0.08; }
        }
        @keyframes sp_accentPulse {
          0%,100% { opacity:0.3; transform:scale(1); }
          50% { opacity:0.6; transform:scale(1.2); }
        }
      `}</style>

      {/* ── Root ── */}
      <div
        className={`
          fixed inset-0 z-[9999] overflow-hidden select-none
          transition-all ease-[cubic-bezier(0.4,0,0,1)]
          ${phase >= 7
            ? 'opacity-0 scale-[1.07] duration-[1000ms] pointer-events-none'
            : 'opacity-100 scale-100 duration-700'}
        `}
        style={{
          background: 'linear-gradient(160deg, #020710 0%, #08101e 30%, #0b0c1a 60%, #060a14 100%)',
          backgroundSize: '400% 400%',
          animation: 'sp_bgPulse 30s ease infinite',
        }}
      >
        {/* ── BG Canvas ── */}
        <canvas ref={bgCanvasRef} className="absolute inset-0 z-0 pointer-events-none" />

        {/* ── FX Canvas (particles + scan) ── */}
        <canvas ref={fxCanvasRef} className="absolute inset-0 z-[3] pointer-events-none" />

        {/* ── Main content ── */}
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          style={{ paddingBottom: '40px' }}
        >

          {/* ══════════════════════════
              LOGO AREA
          ══════════════════════════ */}
          <div className="relative flex items-center justify-center mb-11">

            {/* Orbiting dots */}
            {phase >= 2 && [
              { r: '76px', sz: 2.5, dur: 8,  c: '129,140,248', d: '0s' },
              { r: '92px', sz: 2,   dur: 13, c: '167,139,250', d: '-3s' },
              { r: '104px',sz: 1.5, dur: 18, c: '196,181,253', d: '-7s' },
              { r: '70px', sz: 1.5, dur: 10, c: '99,102,241',  d: '-2s' },
              { r: '115px',sz: 1,   dur: 22, c: '224,231,255', d: '-5s' },
            ].map((o, i) => (
              <div
                key={`orb-${i}`}
                className="absolute pointer-events-none"
                style={{ '--orbit-r': o.r }}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: `${o.sz}px`,
                    height: `${o.sz}px`,
                    background: `rgba(${o.c},0.75)`,
                    boxShadow: `0 0 ${o.sz * 4}px rgba(${o.c},0.5)`,
                    animation: `sp_orbitDot ${o.dur}s linear ${o.d} infinite`,
                  }}
                />
              </div>
            ))}

            {/* Logo canvas */}
            <canvas
              ref={logoCanvasRef}
              className="relative z-10"
              style={{
                width: '110px',
                height: '110px',
                opacity: phase >= 2 ? 1 : 0,
                transition: 'opacity 0.5s ease',
              }}
            />
          </div>

          {/* ══════════════════════════
              NETprep TEXT
          ══════════════════════════ */}
          <div
            className="flex items-baseline"
            style={{ height: '64px', marginBottom: '6px' }}
          >
            {/* N */}
            <span
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
                fontSize: '52px',
                fontWeight: 900,
                lineHeight: 1,
                display: 'inline-block',
                color: 'rgba(255,255,255,0.96)',
                textShadow: '0 0 30px rgba(255,255,255,0.08)',
                opacity: phase >= 3 ? 1 : 0,
                animation: phase >= 3
                  ? 'sp_nTextIn 0.75s cubic-bezier(0.34,1.56,0.64,1) forwards'
                  : 'none',
              }}
            >
              N
            </span>

            {/* Typed characters */}
            {typedText.split('').map((char, i) => (
              <span
                key={`tc-${i}`}
                style={{
                  fontFamily: "'Inter', system-ui, sans-serif",
                  fontSize: '52px',
                  fontWeight: 900,
                  lineHeight: 1,
                  display: 'inline-block',
                  color: i < 2
                    ? 'rgba(224,231,255,0.93)'
                    : 'rgba(165,180,252,0.88)',
                  textShadow: i < 2
                    ? '0 0 22px rgba(224,231,255,0.1)'
                    : '0 0 22px rgba(129,140,248,0.12)',
                  animation: 'sp_letterIn 0.32s ease-out forwards',
                }}
              >
                {char}
              </span>
            ))}

            {/* Cursor */}
            {phase >= 3 && typedText.length < fullText.length && (
              <span
                style={{
                  display: 'inline-block',
                  width: '2.5px',
                  height: '42px',
                  marginLeft: '2px',
                  marginBottom: '2px',
                  borderRadius: '999px',
                  background: 'linear-gradient(180deg,#a5b4fc,#6366f1)',
                  boxShadow: '0 0 10px rgba(99,102,241,0.5)',
                  verticalAlign: 'middle',
                  animation: 'sp_cursor 0.75s step-end infinite',
                }}
              />
            )}
          </div>

          {/* ══════════════════════
              GRADIENT UNDERLINE
          ══════════════════════ */}
          {phase >= 4 && (
            <div className="relative" style={{ width: '175px', marginBottom: '36px' }}>
              <div style={{
                height: '1.5px',
                borderRadius: '999px',
                background: 'linear-gradient(90deg,transparent 0%,#4f46e5 18%,#a78bfa 50%,#4f46e5 82%,transparent 100%)',
                transformOrigin: 'center',
                animation: 'sp_underline 1s cubic-bezier(0.34,1,0.64,1) forwards',
              }} />
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: '1.5px',
                borderRadius: '999px',
                background: 'linear-gradient(90deg,transparent,#818cf8,#c4b5fd,#818cf8,transparent)',
                filter: 'blur(4px)',
                animation: 'sp_underline 1s cubic-bezier(0.34,1,0.64,1) forwards, sp_underGlow 4s ease-in-out 1s infinite',
              }} />
            </div>
          )}

          {/* ══════════════════════
              ENGLISH TAGLINE
          ══════════════════════ */}
          {phase >= 5 && (
            <div style={{ animation: 'sp_tagline 1.2s cubic-bezier(0.22,1,0.36,1) forwards', marginBottom: '2px' }}>
              <p style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                textAlign: 'center',
                background: 'linear-gradient(90deg,#475569,#94a3b8,#e2e8f0,#94a3b8,#475569)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                animation: 'sp_shimmerText 5s linear infinite',
              }}>
                Ace Your UGC NET Journey
              </p>
            </div>
          )}

          {/* ══════════════════════
              DIVIDER + HINDI
          ══════════════════════ */}
          {phase >= 6 && (
            <>
              <div
                className="flex items-center gap-3"
                style={{
                  marginTop: '20px',
                  marginBottom: '16px',
                  animation: 'sp_fadeUp 0.9s ease-out forwards',
                }}
              >
                <div style={{
                  height: '0.5px',
                  background: 'linear-gradient(90deg,transparent,rgba(100,116,139,0.4))',
                  animation: 'sp_lineGrow 1.3s ease-out forwards',
                }} />
                <div style={{
                  width: '5px', height: '5px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle,rgba(99,102,241,0.6),rgba(139,92,246,0.3))',
                  boxShadow: '0 0 8px rgba(99,102,241,0.3)',
                  animation: 'sp_float 3.5s ease-in-out infinite',
                }} />
                <div style={{
                  height: '0.5px',
                  background: 'linear-gradient(270deg,transparent,rgba(100,116,139,0.4))',
                  animation: 'sp_lineGrow 1.3s ease-out forwards',
                }} />
              </div>

              <div style={{ animation: 'sp_fadeUp 0.9s ease-out 0.25s both' }}>
                <p style={{
                  fontSize: '12.5px',
                  fontWeight: 500,
                  color: 'rgba(100,116,139,0.6)',
                  letterSpacing: '0.08em',
                  textAlign: 'center',
                }}>
                  ध्येय — सफलता की ओर एक कदम
                </p>
              </div>
            </>
          )}

          {/* ══════════════════════
              LOADING DOTS
          ══════════════════════ */}
          {phase >= 6 && (
            <div
              className="flex items-center"
              style={{
                gap: '8px',
                marginTop: '44px',
                animation: 'sp_fadeUp 0.7s ease-out 0.45s both',
              }}
            >
              {[0, 1, 2, 3, 4].map(i => {
                const c = i === 2;
                const n = i === 1 || i === 3;
                return (
                  <div
                    key={`dt-${i}`}
                    className="rounded-full"
                    style={{
                      width:  c ? '7px' : n ? '4.5px' : '3px',
                      height: c ? '7px' : n ? '4.5px' : '3px',
                      background: c
                        ? 'radial-gradient(circle,rgba(129,140,248,0.9),rgba(99,102,241,0.6))'
                        : n
                        ? 'rgba(129,140,248,0.45)'
                        : 'rgba(148,163,184,0.22)',
                      boxShadow: c ? '0 0 10px rgba(99,102,241,0.4)' : 'none',
                      animation: `sp_dot 1.9s ease-in-out infinite`,
                      animationDelay: `${i * 0.22}s`,
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* ══════════════════════
            CORNER ACCENTS
        ══════════════════════ */}
        {phase >= 5 && (
          <>
            {/* Top-left */}
            <div className="absolute top-6 left-6 z-10 pointer-events-none"
              style={{ opacity: 0, animation: 'sp_fadeUp 1s ease-out 0.5s forwards' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ width: '20px', height: '1px', background: 'rgba(99,102,241,0.25)', borderRadius: '1px' }} />
                <div style={{ width: '12px', height: '1px', background: 'rgba(99,102,241,0.15)', borderRadius: '1px' }} />
              </div>
            </div>
            {/* Top-right */}
            <div className="absolute top-6 right-6 z-10 pointer-events-none"
              style={{ opacity: 0, animation: 'sp_fadeUp 1s ease-out 0.6s forwards' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                <div style={{ width: '20px', height: '1px', background: 'rgba(99,102,241,0.25)', borderRadius: '1px' }} />
                <div style={{ width: '12px', height: '1px', background: 'rgba(99,102,241,0.15)', borderRadius: '1px' }} />
              </div>
            </div>
            {/* Bottom-left */}
            <div className="absolute bottom-6 left-6 z-10 pointer-events-none"
              style={{ opacity: 0, animation: 'sp_fadeUp 1s ease-out 0.7s forwards' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ width: '12px', height: '1px', background: 'rgba(99,102,241,0.15)', borderRadius: '1px' }} />
                <div style={{ width: '20px', height: '1px', background: 'rgba(99,102,241,0.25)', borderRadius: '1px' }} />
              </div>
            </div>
            {/* Bottom-right */}
            <div className="absolute bottom-6 right-6 z-10 pointer-events-none"
              style={{ opacity: 0, animation: 'sp_fadeUp 1s ease-out 0.8s forwards' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                <div style={{ width: '12px', height: '1px', background: 'rgba(99,102,241,0.15)', borderRadius: '1px' }} />
                <div style={{ width: '20px', height: '1px', background: 'rgba(99,102,241,0.25)', borderRadius: '1px' }} />
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════
            VERSION
        ══════════════════════ */}
        <div
          className="absolute bottom-7 left-1/2 z-10 pointer-events-none"
          style={{
            transform: 'translateX(-50%)',
            opacity: 0,
            animation: phase >= 6 ? 'sp_versionIn 0.9s ease-out 0.6s forwards' : 'none',
          }}
        >
          <p style={{
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#334155',
          }}>
            version&nbsp;1.0.0
          </p>
        </div>
      </div>
    </>
  );
};

export default SplashScreen;