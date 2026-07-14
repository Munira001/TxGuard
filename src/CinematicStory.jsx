import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowUp } from 'lucide-react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import './CinematicStory.css';

gsap.registerPlugin(ScrollToPlugin);

const ZOOM_FACTOR = 1.35;
const TOTAL_FRAMES = 180;

export default function CinematicStory({ onBack }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [frames, setFrames] = useState([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  // Ref to hold frames to avoid dependency re-triggering in handlers
  const framesRef = useRef([]);

  // Preload and Generate Frames Sequence
  useEffect(() => {
    const collageImg = new Image();
    // Path to the copied collage image
    collageImg.src = '/collage.jpg';

    collageImg.onload = () => {
      generateSequence(collageImg);
    };

    collageImg.onerror = () => {
      console.warn("Collage image not found at /collage.jpg. Falling back to procedural canvas generator.");
      generateFallbackSequence();
    };
  }, []);

  // Frame Sequence Generation Logic
  const generateSequence = (img) => {
    const W = img.width;
    const H = img.height;
    const h = H / 5; // 5 stacked scenes in the collage sprite

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // Internal cinematic resolution
    tempCanvas.width = 1280;
    tempCanvas.height = 720;

    const preloaded = [];
    let loadedCount = 0;

    for (let idx = 0; idx < TOTAL_FRAMES; idx++) {
      // Clear temp canvas
      tempCtx.fillStyle = '#000000';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      const sceneIndex = Math.floor(idx / 36); // 5 scenes total (0 to 4)
      const progress = (idx % 36) / 35; // progress inside each scene (0 to 1)

      let sx = 0;
      let sy = sceneIndex * h;
      let sw = W;
      let sh = h;

      // Interpolation & pan/zoom logic for each of the 5 scenes
      if (sceneIndex === 0) {
        // Scene 1: Gold Trophy - Slow Zoom In
        const scale = 1.0 + progress * 0.25;
        sw = W / scale;
        sh = h / scale;
        sx = (W - sw) / 2;
        sy = sceneIndex * h + (h - sh) / 2;
      } else if (sceneIndex === 1) {
        // Scene 2: Colorful abstract logo - Panning left to right
        const panRange = W * 0.15;
        sx = progress * panRange;
        sw = W - panRange;
      } else if (sceneIndex === 2) {
        // Scene 3: Stars logo - Zooming Out
        const scale = 1.25 - progress * 0.25;
        sw = W / scale;
        sh = h / scale;
        sx = (W - sw) / 2;
        sy = sceneIndex * h + (h - sh) / 2;
      } else if (sceneIndex === 3) {
        // Scene 4: Match Schedule - Rotation and slow zoom in
        const scale = 1.05 + progress * 0.15;
        sw = W / scale;
        sh = h / scale;
        sx = (W - sw) / 2;
        sy = sceneIndex * h + (h - sh) / 2;
      } else if (sceneIndex === 4) {
        // Scene 5: Shouting Fans - Panning and subtle camera vibration
        const scale = 1.15;
        const shakeX = Math.sin(idx * 1.5) * 6;
        const shakeY = Math.cos(idx * 1.5) * 6;
        sw = W / scale;
        sh = h / scale;
        sx = (W - sw) / 2 + shakeX;
        sy = sceneIndex * h + (h - sh) / 2 + shakeY;
      }

      // Object fit cover inside the 1280x720 canvas
      const targetAspect = 1280 / 720;
      const sourceAspect = sw / sh;

      if (sourceAspect > targetAspect) {
        const sliceW = sh * targetAspect;
        sx = sx + (sw - sliceW) / 2;
        sw = sliceW;
      } else {
        const sliceH = sw / targetAspect;
        sy = sy + (sh - sliceH) / 2;
        sh = sliceH;
      }

      tempCtx.drawImage(img, sx, sy, sw, sh, 0, 0, 1280, 720);

      // Convert to Image source URL
      const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.85);

      const frameImg = new Image();
      frameImg.src = dataUrl;
      preloaded.push(frameImg);

      frameImg.onload = () => {
        loadedCount++;
        const percent = Math.round((loadedCount / TOTAL_FRAMES) * 100);
        setLoadProgress(percent);

        if (loadedCount === TOTAL_FRAMES) {
          setFrames(preloaded);
          framesRef.current = preloaded;
          // Initial draw
          setTimeout(() => {
            setLoading(false);
            drawFrame(0, preloaded);
          }, 600);
        }
      };
    }
  };

  // Fallback procedural frame generator in case collage image is missing
  const generateFallbackSequence = () => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = 1280;
    tempCanvas.height = 720;

    const preloaded = [];
    let loadedCount = 0;

    for (let idx = 0; idx < TOTAL_FRAMES; idx++) {
      tempCtx.fillStyle = '#000000';
      tempCtx.fillRect(0, 0, 1280, 720);

      // Draw a beautiful abstract gradient ring rotating
      const cx = 1280 / 2;
      const cy = 720 / 2;
      const progress = idx / (TOTAL_FRAMES - 1);

      const gradient = tempCtx.createRadialGradient(cx, cy, 20 + progress * 50, cx, cy, 200 + progress * 150);
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
      gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      tempCtx.fillStyle = gradient;
      tempCtx.beginPath();
      tempCtx.arc(cx, cy, 400, 0, Math.PI * 2);
      tempCtx.fill();

      // Decorative HUD text
      tempCtx.font = 'bold 36px Outfit';
      tempCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      tempCtx.textAlign = 'center';

      let text = "FIFA WORLD CUP 2026";
      if (idx > 36) text = "USA • CANADA • MEXICO";
      if (idx > 72) text = "ON-CHAIN DATA FEED";
      if (idx > 108) text = "104 MATCH SCHEDULE";
      if (idx > 144) text = "FEEL THE PASSION";

      tempCtx.fillText(text, cx, cy - 10);

      // Small subtitle
      tempCtx.font = '16px JetBrains Mono';
      tempCtx.fillStyle = '#8b5cf6';
      tempCtx.fillText(`FRAME SEQUENCE STAGE [${idx + 1}/${TOTAL_FRAMES}]`, cx, cy + 30);

      const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.85);
      const frameImg = new Image();
      frameImg.src = dataUrl;
      preloaded.push(frameImg);

      frameImg.onload = () => {
        loadedCount++;
        const percent = Math.round((loadedCount / TOTAL_FRAMES) * 100);
        setLoadProgress(percent);

        if (loadedCount === TOTAL_FRAMES) {
          setFrames(preloaded);
          framesRef.current = preloaded;
          setTimeout(() => {
            setLoading(false);
            drawFrame(0, preloaded);
          }, 600);
        }
      };
    }
  };

  // Main Canvas Aspect Cover Drawing Logic
  const drawFrame = (index, loadedFrames = frames) => {
    const canvas = canvasRef.current;
    const img = loadedFrames[index];
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    const canvasW = canvas.width;
    const canvasH = canvas.height;

    const imgW = img.width;
    const imgH = img.height;

    const canvasAspect = canvasW / canvasH;
    const imgAspect = imgW / imgH;

    let drawW = canvasW;
    let drawH = canvasH;
    let offsetX = 0;
    let offsetY = 0;

    // Cover math (object-fit: cover)
    if (canvasAspect > imgAspect) {
      drawH = canvasW / imgAspect;
      offsetY = (canvasH - drawH) / 2;
    } else {
      drawW = canvasH * imgAspect;
      offsetX = (canvasH * imgAspect - canvasW) / 2; // Offset center
      offsetX = (canvasW - drawW) / 2;
    }

    // Zoom factor adjustments (to hide letterbox/blackbars)
    const zoomW = drawW * ZOOM_FACTOR;
    const zoomH = drawH * ZOOM_FACTOR;

    const zoomOffsetX = offsetX - (zoomW - drawW) / 2;
    const zoomOffsetY = offsetY - (zoomH - drawH) / 2;

    ctx.clearRect(0, 0, canvasW, canvasH);
    ctx.drawImage(img, zoomOffsetX, zoomOffsetY, zoomW, zoomH);
  };

  // Window Resize Listener
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Redraw current frame
      if (framesRef.current.length > 0) {
        drawFrame(currentFrameIndex, framesRef.current);
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // Trigger initially

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [currentFrameIndex]);

  // Scroll to Frame Mapping Listener
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      if (maxScroll <= 0) return;

      const fraction = Math.max(0, Math.min(1, scrollY / maxScroll));
      const index = Math.min(TOTAL_FRAMES - 1, Math.floor(fraction * TOTAL_FRAMES));

      setCurrentFrameIndex(index);
      setShowScrollIndicator(scrollY < 100);

      if (framesRef.current.length > 0) {
        requestAnimationFrame(() => {
          drawFrame(index, framesRef.current);
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mousemove Interactive Parallax Shift
  useEffect(() => {
    const handleMouseMove = (e) => {
      const canvas = canvasRef.current;
      if (!canvas || loading) return;

      const xPct = e.clientX / window.innerWidth - 0.5;
      const yPct = e.clientY / window.innerHeight - 0.5;

      // Shift opposite direction for depth illusion
      const maxShift = 45; // max pixels to shift
      const shiftX = -xPct * maxShift;
      const shiftY = -yPct * maxShift;

      gsap.to(canvas, {
        x: shiftX,
        y: shiftY,
        duration: 0.8,
        ease: 'power2.out'
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [loading]);

  // Scroll to Top action
  const handleScrollToTop = () => {
    gsap.to(window, {
      scrollTo: 0,
      duration: 1.8,
      ease: 'power3.inOut'
    });
  };

  return (
    <div ref={containerRef} className="cinematic-body">
      {/* Loading overlay screen */}
      {loading && (
        <div className="loading-overlay">
          <div className="loader-glow-ring">
            <div className="loader-inner">
              <span className="loader-text">{loadProgress}%</span>
            </div>
          </div>
          <p className="mt-6 text-sm tracking-widest text-zinc-500 font-mono">
            PRELOADING 180 RESOLUTION FRAMES...
          </p>
        </div>
      )}

      {/* FIXED CANVAS VIEWPORT CONTAINER */}
      <div className="cinematic-canvas-container">
        <canvas ref={canvasRef} className="cinematic-canvas" />
      </div>

      {/* HEADER OVERLAY */}
      <header className="cinematic-header">
        <button className="back-btn" onClick={onBack}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
        <div className="text-right text-xs tracking-wider text-zinc-500 font-mono hidden md:block">
          FRAME INDEX: {currentFrameIndex + 1} / {TOTAL_FRAMES}
        </div>
      </header>

      {/* NARRATIVE CONTENT CARDS OVERLAY */}
      <div className="narrative-container">
        {/* Section 1: Intro */}
        <section className="narrative-section">
          <div className={`narrative-card ${currentFrameIndex >= 0 && currentFrameIndex < 36 ? 'visible' : ''}`}>
            <h2 className="narrative-title" style={{ color: '#a78bfa' }}>🛡️ TxGuard Sentinel</h2>
            <p className="narrative-desc">
              An autonomous real-time odds anomalies scanner and agent suite built on TxLINE and Solana. Scroll down to see the architecture.
            </p>
          </div>
        </section>

        {/* Section 2: Slide 2 - The Problem */}
        <section className="narrative-section">
          <div className={`narrative-card ${currentFrameIndex >= 36 && currentFrameIndex < 72 ? 'visible' : ''}`}>
            <h2 className="narrative-title" style={{ color: '#f43f5e' }}>⚠️ Slide 2: The In-Play Data Gap</h2>
            <p className="narrative-desc" style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
              • Sports consensus odds shift rapidly, but retail fans and professional builders lack tools to detect sharp signals instantly.<br />
              • Typical betting simulators use linear asset pricing math, which fails to match actual sports contract payoff models.<br />
              • Lack of cryptographic, automated, on-chain settlement systems for sports telemetry.
            </p>
          </div>
        </section>

        {/* Section 3: Slide 3 - The Solution */}
        <section className="narrative-section">
          <div className={`narrative-card ${currentFrameIndex >= 72 && currentFrameIndex < 108 ? 'visible' : ''}`}>
            <h2 className="narrative-title" style={{ color: '#10b981' }}>🚀 Slide 3: A Unified Analytical Terminal</h2>
            <p className="narrative-desc" style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
              • <strong>Consensus Ingestion</strong>: Ingests real-time consensus odds and live match events directly from the TxLINE data layer.<br />
              • <strong>Three Autonomous Agents</strong>: Concurrently runs Detector, Competitive Arena, and Market Maker loops.<br />
              • <strong>On-Chain Settlement</strong>: Executes SOL micro-transfers directly on Solana Devnet to resolve agent trades.
            </p>
          </div>
        </section>

        {/* Section 4: Slide 4 - The Tech */}
        <section className="narrative-section">
          <div className={`narrative-card ${currentFrameIndex >= 108 && currentFrameIndex < 144 ? 'visible' : ''}`}>
            <h2 className="narrative-title" style={{ color: '#c084fc' }}>⚙️ Slide 4: Algorithmic & Mathematical Depth</h2>
            <p className="narrative-desc" style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>
              • <strong>Regime-Aware Predictor</strong>: Adapts to mean reversion in simulated markets and trend momentum in live markets.<br />
              • <strong>Inverse-Odds Payoffs</strong>: Settle positions using correct implied probability betting formulas ($K_{entry}/K_{exit}$) rather than linear price models.<br />
              • <strong>Dynamic Market Maker</strong>: Widens spreads based on rolling standard deviation volatility and skews quotes to hedge inventory risk.
            </p>
          </div>
        </section>

        {/* Section 5: Slide 5 - Readiness */}
        <section className="narrative-section">
          <div className={`narrative-card ${currentFrameIndex >= 144 && currentFrameIndex <= 180 ? 'visible' : ''}`}>
            <h2 className="narrative-title" style={{ color: '#38bdf8' }}>🏆 Production-Ready & Deployable</h2>
            <p className="narrative-desc">
              A fully working submission. Vercel simulation mode ensures live-ticking reviews post-tournament. Real-time logging enables continuous strategy auditing. Connect Phantom wallet to mint commemorative NFT badges on Solana.
            </p>
          </div>
        </section>
      </div>

      {/* SCROLL WHEEL INDICATOR */}
      <div className={`scroll-indicator ${!showScrollIndicator ? 'hidden' : ''}`}>
        <div className="mouse-icon">
          <div className="mouse-wheel" />
        </div>
        <span className="font-mono text-[10px] tracking-widest mt-1">SCROLL DOWN</span>
      </div>

      {/* SCROLL TO TOP FLOATING BUTTON */}
      <button
        className={`scroll-to-top-btn ${currentFrameIndex > 150 ? 'visible' : ''}`}
        onClick={handleScrollToTop}
      >
        <ArrowUp size={20} />
      </button>
    </div>
  );
}
