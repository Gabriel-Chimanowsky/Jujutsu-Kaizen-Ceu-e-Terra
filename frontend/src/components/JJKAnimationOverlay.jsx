import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// --- Web Audio SFX Synthesizers ---
export const playKokusenSound = () => {
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
  } catch (e) {
    console.error("Audio Context initialization blocked by browser autoplay policy.", e);
  }
};

export const playRyoikiSound = () => {
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
      } catch(e){}
    }, 1000);
    
    osc.start();
    osc.stop(ctx.currentTime + 3.0);
    
    osc2.start();
    osc2.stop(ctx.currentTime + 2.2);
  } catch (e) {}
};

export default function JJKAnimationOverlay() {
  const [activeAnim, setActiveAnim] = useState(null); // 'kokusen' or 'ryoiki'
  const [animData, setAnimData] = useState({});
  const canvasRef = useRef(null);

  useEffect(() => {
    const handleKokusen = (e) => {
      setActiveAnim('kokusen');
      setAnimData({ title: e.detail?.title || 'Ataque' });
      playKokusenSound();
      
      // Auto dismiss
      setTimeout(() => {
        setActiveAnim(null);
      }, 2500);
    };

    const handleRyoiki = (e) => {
      setActiveAnim('ryoiki');
      setAnimData({ 
        nome: e.detail?.nome || 'Vazio Infinito',
        tipo: e.detail?.tipo || 'Letal',
        descricao: e.detail?.descricao || 'Técnica Suprema de Domínio'
      });
      playRyoikiSound();

      // Auto dismiss
      setTimeout(() => {
        setActiveAnim(null);
      }, 3500);
    };

    window.addEventListener('trigger-kokusen', handleKokusen);
    window.addEventListener('trigger-ryoiki', handleRyoiki);

    return () => {
      window.removeEventListener('trigger-kokusen', handleKokusen);
      window.removeEventListener('trigger-ryoiki', handleRyoiki);
    };
  }, []);

  // Canvas loop for stunning visual effects
  useEffect(() => {
    if (!activeAnim || !canvasRef.current) return;
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

    // Particles/Shockwave configurations
    let tick = 0;
    const particles = [];
    
    // Setup Kokusen red/black arcing sparks
    const drawSparks = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, width, height);

      // Flash effect periodically
      if (tick % 10 === 0) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.08)';
        ctx.fillRect(0, 0, width, height);
      }

      // Draw random arcing lightning bolts from center
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
      ctx.shadowBlur = 0; // Reset shadow

      // Draw red particles floating around
      if (particles.length < 60) {
        particles.push({
          x: cx,
          y: cy,
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.5) * 16,
          size: Math.random() * 6 + 2,
          alpha: 1,
          color: Math.random() > 0.3 ? '#ef4444' : '#7f1d1d'
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }
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

    // Setup Ryoiki black barrier circular expansion
    const drawRyoiki = () => {
      ctx.clearRect(0, 0, width, height);

      // Expand a circular black domain barrier
      const cx = width / 2;
      const cy = height / 2;
      const maxRadius = Math.max(width, height) * 0.7;
      const radius = Math.min(maxRadius, (tick / 60) * maxRadius);

      // 1. Draw cosmos space inside the circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.clip();

      // Draw starry galaxy bg
      ctx.fillStyle = '#05020c';
      ctx.fillRect(0, 0, width, height);

      // Draw 80 cosmic stars
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

      // 2. Draw the barrier edge (thick dark glowing border)
      ctx.strokeStyle = '#8a2be2';
      ctx.lineWidth = 14;
      ctx.shadowBlur = 40;
      ctx.shadowColor = '#a855f7';
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw outer dark shadow ring
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 20;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(0, radius - 10), 0, Math.PI * 2);
      ctx.stroke();
    };

    const loop = () => {
      tick++;
      if (activeAnim === 'kokusen') {
        drawSparks();
      } else if (activeAnim === 'ryoiki') {
        drawRyoiki();
      }
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
            backgroundColor: activeAnim === 'kokusen' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0,0,0,0.7)',
          }}
        >
          {/* Main Visual Effects Canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-10" />

          {/* Typography overlays */}
          <div className="relative z-20 flex flex-col items-center justify-center text-center px-6">
            {activeAnim === 'kokusen' ? (
              <motion.div
                initial={{ scale: 0.2, rotate: -15, opacity: 0 }}
                animate={{ scale: [0.2, 1.3, 1], rotate: [ -15, 10, -5 ], opacity: 1 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 200 }}
                className="flex flex-col items-center gap-2"
              >
                {/* Red electric spark glow badge */}
                <span className="px-3 py-1 rounded bg-red-950 text-red-400 font-extrabold text-xs uppercase tracking-widest border border-red-500/30 animate-pulse">
                  CRÍTICO ABSOLUTO • D20 NATURAL
                </span>
                
                {/* BLACK FLASH Header */}
                <h1 
                  className="text-6xl md:text-8xl font-black font-jujutsu italic uppercase tracking-tighter filter drop-shadow-[0_0_20px_#ef4444]"
                  style={{
                    color: '#ffffff',
                    WebkitTextStroke: '2px #000000',
                    backgroundImage: 'linear-gradient(to bottom, #ef4444, #7f1d1d)',
                    WebkitBackgroundClip: 'text',
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
            ) : (
              <motion.div
                initial={{ scale: 0.5, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="flex flex-col items-center gap-3"
              >
                {/* Purple barrier glow badge */}
                <span className="px-4 py-1.5 rounded-full bg-purple-950/80 text-purple-400 font-extrabold text-xs uppercase tracking-widest border border-purple-500/40 animate-pulse">
                  EXPANSÃO DE DOMÍNIO • RYOIKI TENKAI
                </span>
                
                {/* Stylized Domain Name */}
                <h1 
                  className="text-4xl md:text-7xl font-black font-jujutsu text-center uppercase tracking-wider py-2 filter drop-shadow-[0_0_30px_#a855f7]"
                  style={{
                    color: '#ffffff',
                    backgroundImage: 'linear-gradient(to right, #c084fc, #8a2be2, #c084fc)',
                    WebkitBackgroundClip: 'text',
                  }}
                >
                  {animData.nome}
                </h1>
                
                {/* Domain Category / Info */}
                <span className="px-3 py-0.5 rounded text-[10px] bg-purple-900/60 text-purple-200 border border-purple-500/20 font-bold uppercase tracking-wider">
                  Tipo: {animData.tipo} • Acerto Absoluto
                </span>
                
                <p className="text-sm text-gray-300 max-w-lg mt-2 font-medium italic">
                  "{animData.descricao}"
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
