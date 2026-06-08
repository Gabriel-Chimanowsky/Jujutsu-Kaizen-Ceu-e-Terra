import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// --- Web Audio SFX Synthesizers ---
const playKokusenSound = () => {
  if (typeof window === 'undefined') return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    const ctx = new AudioContext();
    
    // 1. Heavy bass drop
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 1.2);
    
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
    
    // 2. High-voltage lightning crack (white noise)
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.4);
    filter.Q.setValueAtTime(8, ctx.currentTime);
    
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 1.2);
    
    noise.start();
    noise.stop(ctx.currentTime + 0.4);
  } catch {
    console.error("Audio Context initialization blocked by browser autoplay policy.");
  }
};

const playRyoikiSound = () => {
  if (typeof window === 'undefined') return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    const ctx = new AudioContext();
    
    // 1. Deep cosmic rumble
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, ctx.currentTime + 2.5);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 2.5);
    
    gain.gain.setValueAtTime(0.9, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3.0);
    
    // 2. High-pitch energy surge (resonance sweep)
    const osc2 = ctx.createOscillator();
    const filter2 = ctx.createBiquadFilter();
    const gain2 = ctx.createGain();
    
    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(110, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 1.8);
    
    filter2.type = 'lowpass';
    filter2.frequency.setValueAtTime(100, ctx.currentTime);
    filter2.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 1.8);
    filter2.Q.setValueAtTime(12, ctx.currentTime);
    
    gain2.gain.setValueAtTime(0.01, ctx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 1.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);
    
    // 3. Glass shattering effect (noise and high oscillators)
    setTimeout(() => {
      try {
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        
        osc3.type = 'triangle';
        osc3.frequency.setValueAtTime(2500, ctx.currentTime);
        osc3.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.8);
        
        gain3.gain.setValueAtTime(0.4, ctx.currentTime);
        gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        
        osc3.start();
        osc3.stop(ctx.currentTime + 0.8);
      } catch {
        // ignore
      }
    }, 1000);
    
    osc.start();
    osc.stop(ctx.currentTime + 3.0);
    
    osc2.start();
    osc2.stop(ctx.currentTime + 2.2);
  } catch {
    // ignore
  }
};

// Fumble – crumbling dissonance chord
const playFumbleSound = () => {
  if (typeof window === 'undefined') return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    const ctx = new AudioContext();

    // Falling pitch oscillator
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.9);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
    osc.start();
    osc.stop(ctx.currentTime + 0.9);

    // Crunchy noise burst
    const bufSize = ctx.sampleRate * 0.25;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.6, ctx.currentTime);
    nGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    noise.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.25);
  } catch {
    // ignore
  }
};

// Fast Slash Sound
const playSlashSound = () => {
  if (typeof window === 'undefined') return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // ignore
  }
};

// Cursed Energy Charge – rising resonant sweep
const playChargeSound = () => {
  if (typeof window === 'undefined') return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  try {
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 1.5);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 1.5);
    filter.Q.setValueAtTime(6, ctx.currentTime);
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  } catch {
    // ignore
  }
};

export default function JJKAnimationOverlay() {
  const [activeAnim, setActiveAnim] = useState(null); // 'kokusen' | 'ryoiki' | 'fumble' | 'charge'
  const [animData, setAnimData] = useState({});
  const canvasRef = useRef(null);

  useEffect(() => {
    const handleKokusen = (e) => {
      setActiveAnim('kokusen');
      setAnimData({ title: e.detail?.title || 'Ataque' });
      playKokusenSound();
      setTimeout(() => setActiveAnim(null), 2500);
    };

    const handleRyoiki = (e) => {
      setActiveAnim('ryoiki');
      setAnimData({ 
        nome: e.detail?.nome || 'Expansao de Dominio',
        tipo: e.detail?.tipo || 'Letal',
        descricao: e.detail?.descricao || 'Tecnica Suprema de Dominio',
        cor_energia: e.detail?.cor_energia || '#8a2be2'
      });
      playRyoikiSound();
      setTimeout(() => setActiveAnim(null), 3500);
    };

    const handleFumble = (e) => {
      setActiveAnim('fumble');
      setAnimData({ title: e.detail?.title || 'Rolagem' });
      playFumbleSound();
      setTimeout(() => setActiveAnim(null), 2000);
    };

    const handleSlash = (e) => {
      setActiveAnim('slash');
      setAnimData({ title: e.detail?.title || 'Ataque', isSpell: e.detail?.isSpell });
      playSlashSound();
      setTimeout(() => setActiveAnim(null), 800);
    };

    const handleCharge = (e) => {
      setActiveAnim('charge');
      setAnimData({ amount: e.detail?.amount || 0 });
      playChargeSound();
      setTimeout(() => setActiveAnim(null), 1800);
    };

    window.addEventListener('trigger-kokusen', handleKokusen);
    window.addEventListener('trigger-ryoiki', handleRyoiki);
    window.addEventListener('trigger-fumble', handleFumble);
    window.addEventListener('trigger-slash', handleSlash);
    window.addEventListener('trigger-charge', handleCharge);

    return () => {
      window.removeEventListener('trigger-kokusen', handleKokusen);
      window.removeEventListener('trigger-ryoiki', handleRyoiki);
      window.removeEventListener('trigger-fumble', handleFumble);
      window.removeEventListener('trigger-slash', handleSlash);
      window.removeEventListener('trigger-charge', handleCharge);
    };
  }, []);

  // Canvas loop for visual effects
  useEffect(() => {
    if (!activeAnim || !canvasRef.current) return;
    if (activeAnim === 'fumble' || activeAnim === 'charge') return; // CSS-only for these
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);

    let tick = 0;
    const particles = [];
    
    const drawSparks = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, width, height);

      if (tick % 10 === 0) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.08)';
        ctx.fillRect(0, 0, width, height);
      }

      const cx = width / 2;
      const cy = height / 2;

      ctx.strokeStyle = Math.random() > 0.4 ? '#ef4444' : '#000000';
      ctx.lineWidth = Math.random() * 8 + 3;
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#ff0000';

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      let lx = cx;
      let ly = cy;
      const segments = 12;
      for (let i = 0; i < segments; i++) {
        const targetX = cx + (Math.random() - 0.5) * width * (i / segments);
        const targetY = cy + (Math.random() - 0.5) * height * (i / segments);
        lx = lx + (targetX - lx) * 0.4;
        ly = ly + (targetY - ly) * 0.4;
        ctx.lineTo(lx, ly);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (particles.length < 60) {
        particles.push({
          x: cx, y: cy,
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.5) * 16,
          size: Math.random() * 6 + 2,
          alpha: 1,
          color: Math.random() > 0.3 ? '#ef4444' : '#7f1d1d'
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy; p.alpha -= 0.02;
        if (p.alpha <= 0) { particles.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0000';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const drawRyoiki = () => {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;
      const maxRadius = Math.max(width, height) * 0.7;
      const radius = Math.min(maxRadius, (tick / 60) * maxRadius);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      ctx.fillStyle = '#05020c';
      ctx.fillRect(0, 0, width, height);

      if (particles.length === 0) {
        for (let i = 0; i < 80; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2 + 0.5,
            color: Math.random() > 0.5 ? '#8a2be2' : '#ffffff',
            speed: Math.random() * 0.5 + 0.1
          });
        }
      }

      particles.forEach(p => {
        p.y += p.speed;
        if (p.y > height) p.y = 0;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();

      ctx.strokeStyle = '#8a2be2';
      ctx.lineWidth = 14;
      ctx.shadowBlur = 40;
      ctx.shadowColor = '#a855f7';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 20;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(0, radius - 10), 0, Math.PI * 2);
      ctx.stroke();
    };

    const loop = () => {
      tick++;
      if (activeAnim === 'kokusen') drawSparks();
      else if (activeAnim === 'ryoiki') drawRyoiki();
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeAnim]);

  return (
    <AnimatePresence>
      {activeAnim && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-none select-none font-sans overflow-hidden"
          style={{
            backgroundColor:
              activeAnim === 'kokusen' ? 'rgba(0, 0, 0, 0.4)' :
              activeAnim === 'fumble' ? 'rgba(30, 0, 0, 0.55)' :
              activeAnim === 'charge' ? 'rgba(0, 0, 0, 0.25)' :
              activeAnim === 'slash' ? 'rgba(0, 0, 0, 0.15)' :
              'rgba(0,0,0,0.7)',
          }}
        >
          {/* Canvas for kokusen/ryoiki */}
          {(activeAnim === 'kokusen' || activeAnim === 'ryoiki') && (
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10" />
          )}

          {/* Fumble: screen-crack overlay */}
          {activeAnim === 'fumble' && (
            <div className="absolute inset-0 z-10 animate-fumble-overlay"
              style={{
                background: 'radial-gradient(ellipse at 50% 50%, rgba(200,0,0,0.35) 0%, transparent 70%)',
                filter: 'blur(2px)'
              }}
            />
          )}

          {/* Charge: burst ring */}
          {activeAnim === 'charge' && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="animate-charge-burst w-72 h-72 rounded-full" style={{
                boxShadow: '0 0 60px 30px var(--cursed-color), 0 0 120px 60px rgba(var(--cursed-color-rgb), 0.35)',
                border: '3px solid var(--cursed-color)',
                background: 'radial-gradient(circle, rgba(var(--cursed-color-rgb),0.25) 0%, transparent 70%)'
              }} />
            </div>
          )}

          {/* Slash: Fast diagonal line & burst */}
          {activeAnim === 'slash' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: -100, y: 100 }}
              animate={{ opacity: [0, 1, 0], scale: 1.5, x: 100, y: -100 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute inset-0 pointer-events-none flex items-center justify-center z-10"
            >
              <div 
                className="w-[150%] h-6 shadow-[0_0_30px_var(--cursed-color)]" 
                style={{ 
                  backgroundColor: 'var(--cursed-color)',
                  transform: 'rotate(-45deg)' 
                }}
              />
            </motion.div>
          )}

          {/* Typography overlays */}
          <div className="relative z-20 flex flex-col items-center justify-center text-center px-6">

            {/* ── KOKUSEN ── */}
            {activeAnim === 'kokusen' && (
              <motion.div
                initial={{ scale: 0.2, rotate: -15, opacity: 0 }}
                animate={{ scale: [0.2, 1.3, 1], rotate: [-15, 10, -5], opacity: 1 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
                className="flex flex-col items-center gap-2"
              >
                <span className="px-3 py-1 rounded bg-red-950 text-red-400 font-extrabold text-xs uppercase tracking-widest border border-red-500/30 animate-pulse">
                  CRÍTICO ABSOLUTO • D20 NATURAL
                </span>
                <h1 
                  className="text-6xl md:text-8xl font-black font-jujutsu italic uppercase tracking-tighter filter drop-shadow-[0_0_20px_#ef4444]"
                  style={{
                    color: '#ffffff',
                    WebkitTextStroke: '2px #000000',
                    backgroundImage: 'linear-gradient(to bottom, #ef4444, #7f1d1d)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  KOKUSEN
                </h1>
                <h2 className="text-xl md:text-2xl font-extrabold text-red-500 italic uppercase tracking-wider filter drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                  BLACK FLASH
                </h2>
                <p className="text-xs text-gray-400 font-medium uppercase mt-2">
                  {animData.title} atingiu a essência da energia amaldiçoada!
                </p>
              </motion.div>
            )}

            {/* ── RYOIKI ── */}
            {activeAnim === 'ryoiki' && (() => {
              const cor = animData.cor_energia || '#8a2be2'
              // derive a lighter tint for gradient
              return (
                <motion.div
                  initial={{ scale: 0.4, y: 60, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  transition={{ duration: 0.9, ease: [0.2, 1.2, 0.4, 1] }}
                  className="flex flex-col items-center gap-3"
                >
                  {/* Glow ring using character energy color */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: `radial-gradient(ellipse at center, ${cor}22 0%, transparent 65%)`,
                  }} />

                  <span
                    className="px-4 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-widest border animate-pulse"
                    style={{
                      backgroundColor: `${cor}22`,
                      borderColor: `${cor}55`,
                      color: cor,
                    }}
                  >
                    EXPANSAO DE DOMINIO • RYOIKI TENKAI
                  </span>

                  {/* Animated expanding ring */}
                  <div className="relative flex items-center justify-center mb-2">
                    <div
                      className="absolute rounded-full animate-ping"
                      style={{
                        width: '180px', height: '180px',
                        border: `2px solid ${cor}`,
                        opacity: 0.3,
                        animationDuration: '1.2s'
                      }}
                    />
                    <div
                      className="rounded-full"
                      style={{
                        width: '120px', height: '120px',
                        background: `radial-gradient(circle, ${cor}30, transparent 70%)`,
                        border: `1px solid ${cor}44`,
                        boxShadow: `0 0 40px ${cor}55, 0 0 80px ${cor}22`,
                      }}
                    />
                  </div>

                  <h1
                    className="text-4xl md:text-7xl font-black font-jujutsu text-center uppercase tracking-wider py-2"
                    style={{
                      backgroundImage: `linear-gradient(135deg, #ffffff, ${cor}, #ffffff)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: `drop-shadow(0 0 30px ${cor})`,
                    }}
                  >
                    {animData.nome}
                  </h1>

                  <span
                    className="px-3 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${cor}25`,
                      color: cor,
                      border: `1px solid ${cor}40`
                    }}
                  >
                    Tipo: {animData.tipo} • Acerto Absoluto
                  </span>

                  <p className="text-sm text-gray-300 max-w-lg mt-2 font-medium italic">
                    "{animData.descricao}"
                  </p>
                </motion.div>
              )
            })()}

            {/* ── FUMBLE ── */}
            {activeAnim === 'fumble' && (
              <motion.div
                initial={{ scale: 1.4, opacity: 0 }}
                animate={{ scale: [1.4, 0.95, 1], opacity: 1 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 300 }}
                className="flex flex-col items-center gap-2"
              >
                <span className="px-3 py-1 rounded bg-gray-900 text-gray-500 font-extrabold text-xs uppercase tracking-widest border border-gray-700/50">
                  FALHA CATASTRÓFICA • D20 NATURAL 1
                </span>
                <h1
                  className="text-5xl md:text-7xl font-black font-jujutsu italic uppercase tracking-tighter"
                  style={{
                    color: '#ffffff',
                    WebkitTextStroke: '2px #6b0000',
                    filter: 'drop-shadow(0 0 14px #7f1d1d)',
                    backgroundImage: 'linear-gradient(to bottom, #9ca3af, #4b5563)',
                    WebkitBackgroundClip: 'text',
                  }}
                >
                  FUMBLE
                </h1>
                <h2 className="text-base font-extrabold text-gray-500 italic uppercase tracking-wider">
                  Sua técnica falhou miseravelmente
                </h2>
                <p className="text-xs text-gray-600 font-medium uppercase mt-1">
                  {animData.title} — a energia amaldiçoada se dissipou no vazio.
                </p>
              </motion.div>
            )}

            {/* ── CHARGE ── */}
            {activeAnim === 'charge' && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.5, 1.1, 1], opacity: [0, 1, 0.85] }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="flex flex-col items-center gap-2"
              >
                <span
                  className="px-4 py-1.5 rounded-full font-extrabold text-xs uppercase tracking-widest border animate-pulse"
                  style={{
                    backgroundColor: 'rgba(var(--cursed-color-rgb), 0.15)',
                    borderColor: 'rgba(var(--cursed-color-rgb), 0.5)',
                    color: 'var(--cursed-color)',
                  }}
                >
                  ENERGIA CONCENTRADA
                </span>
                <h1
                  className="text-5xl md:text-7xl font-black font-jujutsu uppercase tracking-wide"
                  style={{
                    backgroundImage: `linear-gradient(to right, var(--cursed-color), #ffffff, var(--cursed-color))`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 22px var(--cursed-color))',
                  }}
                >
                  +{animData.amount} PE
                </h1>
                <p className="text-xs font-medium uppercase tracking-widest mt-1" style={{ color: 'var(--cursed-color)', opacity: 0.7 }}>
                  Energia amaldiçoada restaurada
                </p>
              </motion.div>
            )}

            {/* ── SLASH ── */}
            {activeAnim === 'slash' && (
              <motion.div
                initial={{ opacity: 0, scale: 1.5 }}
                animate={{ opacity: [0, 1, 0], scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="flex flex-col items-center gap-1 z-20"
              >
                <h1
                  className="text-5xl md:text-6xl font-black font-jujutsu uppercase tracking-wide"
                  style={{
                    color: 'white',
                    WebkitTextStroke: '1px var(--cursed-color)',
                    filter: 'drop-shadow(0 0 15px var(--cursed-color))',
                  }}
                >
                  {animData.title}
                </h1>
                <p className="text-xs font-bold uppercase tracking-widest text-white mt-1">
                  {animData.isSpell ? 'Fórmula Conjurada' : 'Ataque Desferido'}
                </p>
              </motion.div>
            )}

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
