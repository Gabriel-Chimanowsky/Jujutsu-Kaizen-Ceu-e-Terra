import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { showCursedToast } from '../utils/toast'
import CursedLogo from '../components/CursedLogo'
import { 
  Zap, 
  RotateCw, 
  Swords, 
  Shield, 
  Scroll, 
  BookOpen, 
  Sparkles, 
  FolderOpen, 
  Award, 
  TrendingUp, 
  X, 
  MessageSquare, 
  AlertTriangle,
  Eye,
  Skull,
  Ghost,
  User
} from 'lucide-react'

// Pure deterministic pseudo-random generator to satisfy React render purity rules
const getPseudoRandom = (index, salt = 0) => {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453123
  return x - Math.floor(x)
}

// ── RULEBOOK COMPONENT STANDARDIZATION SYSTEM ──
const RuleTabHeader = ({ title, subtitle, icon: Icon }) => (
  <div className="border-b border-white/5 pb-4 mb-5">
    <div className="flex items-center gap-3">
      {Icon && <Icon className="w-6 h-6 text-yellow-500 filter drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]" />}
      <h4 className="text-yellow-500 text-lg font-bold font-jujutsu tracking-wider uppercase">{title}</h4>
    </div>
    {subtitle && <p className="text-[10px] text-gray-500 mt-1 font-mono uppercase tracking-widest leading-none">{subtitle}</p>}
  </div>
)

const RuleInfoCard = ({ title, description, children, accentColor = 'purple' }) => {
  const colorMap = {
    purple: 'border-purple-500/20 bg-purple-950/5 text-purple-300 shadow-[rgba(139,92,246,0.02)_0px_0px_15px]',
    amber: 'border-amber-500/20 bg-amber-950/5 text-amber-300 shadow-[rgba(245,158,11,0.02)_0px_0px_15px]',
    yellow: 'border-yellow-500/20 bg-yellow-950/5 text-yellow-300 shadow-[rgba(234,179,8,0.02)_0px_0px_15px]',
    emerald: 'border-emerald-500/20 bg-emerald-950/5 text-emerald-300 shadow-[rgba(16,185,129,0.02)_0px_0px_15px]',
    red: 'border-red-500/20 bg-red-950/5 text-red-300 shadow-[rgba(239,68,68,0.02)_0px_0px_15px]',
    cyan: 'border-cyan-500/20 bg-cyan-950/5 text-cyan-300 shadow-[rgba(6,182,212,0.02)_0px_0px_15px]',
  }
  const borderClass = colorMap[accentColor] || colorMap.purple
  return (
    <div className={`p-5 rounded-2xl border ${borderClass} backdrop-blur-sm transition-all hover:border-white/10 hover:bg-white/[0.01]`}>
      {title && <span className="text-xs font-black uppercase tracking-widest block mb-2">{title}</span>}
      {description && <p className="text-xs text-gray-400 leading-relaxed mb-3">{description}</p>}
      {children}
    </div>
  )
}

const RuleListItem = ({ label, value, icon: Icon = Sparkles, iconColor = 'text-yellow-500' }) => (
  <div className="flex gap-4 bg-black/40 p-4 rounded-xl border border-white/5 items-start transition-all hover:border-white/10 hover:bg-white/[0.01]">
    <span className="p-2 rounded-lg bg-white/5 border border-white/5 shrink-0 flex items-center justify-center">
      <Icon className={`w-4 h-4 ${iconColor}`} />
    </span>
    <div className="space-y-1">
      <span className="font-extrabold text-white text-sm block font-sans">{label}</span>
      <span className="text-gray-400 text-xs leading-relaxed block font-sans">{value}</span>
    </div>
  </div>
)

const RuleAlertBanner = ({ children, icon: Icon = AlertTriangle, type = 'warning' }) => {
  const colorMap = {
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    danger: 'bg-red-500/10 border-red-500/20 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  }
  const colorClass = colorMap[type] || colorMap.warning
  return (
    <div className={`p-4 rounded-xl border ${colorClass} text-xs flex items-start gap-3 backdrop-blur-sm`}>
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="leading-relaxed font-sans">{children}</div>
    </div>
  )
}


export default function LandingView({ authStatus, navigate }) {
  // ── mini-game states ──
  const [kokusenZone] = useState({ left: 46, right: 54 })
  const [cursorPos, setCursorPos] = useState(0)
  const [isMoving, setIsMoving] = useState(true)
  const [speed, setSpeed] = useState(2.2)
  const [btnText, setBtnText] = useState("Disparar Kokusen!")
  const [blackFlashActive, setBlackFlashActive] = useState(false)
  const [shakeActive, setShakeActive] = useState(false)

  // ── domain simulation states ──
  const [selectedDomain, setSelectedDomain] = useState("infinite")
  const [activeDomainAnimation, setActiveDomainAnimation] = useState(null) // 'infinite' | 'shrine' | 'perfection' | 'shadows' | null
  const [domainStage, setDomainStage] = useState(0) // 0: conjuração/selo, 1: barreira fechando, 2: efeito absoluto, 3: dissipação

  // ── rulebook states ──
  const [isRulebookOpen, setIsRulebookOpen] = useState(false)
  const [rulebookTab, setRulebookTab] = useState("intro")

  // ── quotes state ──
  const [quote, setQuote] = useState({
    text: '"Não se preocupe, eu sou o mais forte." — Gojo Satoru',
    color: '#a855f7'
  })

  const directionRef = useRef(1)
  const cursorPosRef = useRef(0)

  // Quotes data
  const quotes = [
    { text: '"Não se preocupe, eu sou o mais forte." — Gojo Satoru', color: '#a855f7' },
    { text: '"Curve-se perante a verdadeira grandeza... Suas cabeças estão muito elevadas." — Ryomen Sukuna', color: '#ef4444' },
    { text: '"Você é forte. Fique orgulhoso." — Ryomen Sukuna', color: '#f87171' },
    { text: '"O trabalho é uma merda. Então, vamos acabar com isso logo." — Kento Nanami', color: '#fbbf24' },
    { text: '"Vou te fazer uma pergunta. Que tipo de mulher faz o seu estilo?" — Aoi Todo', color: '#f472b6' },
    { text: '"Se eu morrer aqui, serei apenas alguém que não conseguiu ir além." — Fushiguro Megumi', color: '#60a5fa' },
    { text: '"Eu não sei o que o amanhã me reserva, mas não quero me arrepender de como vivi hoje." — Itadori Yuji', color: '#fb7185' },
    { text: '"Nós somos Feiticeiros Jujutsu. Não somos heróis... Apenas garantimos que as pessoas tenham mortes dignas." — Masamichi Yaga', color: '#9ca3af' }
  ]

  // Cursor animation loop for Kokusen game
  useEffect(() => {
    if (!isMoving) return

    let animFrame
    const moveCursor = () => {
      cursorPosRef.current += directionRef.current * speed
      if (cursorPosRef.current >= 100) {
        cursorPosRef.current = 100
        directionRef.current = -1
      } else if (cursorPosRef.current <= 0) {
        cursorPosRef.current = 0
        directionRef.current = 1
      }
      setCursorPos(cursorPosRef.current)
      animFrame = requestAnimationFrame(moveCursor)
    }

    animFrame = requestAnimationFrame(moveCursor)
    return () => cancelAnimationFrame(animFrame)
  }, [isMoving, speed])

  const triggerKokusen = () => {
    if (!isMoving) {
      setIsMoving(true)
      setBtnText("Disparar Kokusen!")
      return
    }

    setIsMoving(false)
    const position = cursorPosRef.current

    if (position >= kokusenZone.left && position <= kokusenZone.right) {
      setBlackFlashActive(true)
      setShakeActive(true)
      
      showCursedToast(
        "KOKUSEN!", 
        "Você concentrou sua energia amaldiçoada em 0,000001 segundos! Suas habilidades Jujutsu foram elevadas ao expoente de 2.5!", 
        "success", 
        6000
      )

      setTimeout(() => {
        setBlackFlashActive(false)
        setShakeActive(false)
        setBtnText("Reiniciar Concentração")
      }, 3000)

      setSpeed(prev => Math.min(7.5, prev + 1.2))
    } else {
      showCursedToast(
        "Concentração Dispersada",
        "A energia amaldiçoada fluiu antes da hora e se dispersou como fumaça. Tente novamente!",
        "warning"
      )
      setBtnText("Tentar Novamente")
    }
  }

  const triggerDomain = () => {
    const domainThemes = {
      infinite: {
        name: "Vazio Infinito (Muryōkūsho)",
        description: "Você foi tragado para o Infinito absoluto. Informações ilimitadas inundam seu cérebro, paralisando suas ações totalmente!",
        color: '#a855f7'
      },
      shrine: {
        name: "Santuário Malevolente (Fukuma Mizushi)",
        description: "Um domínio sem barreiras físicas surge. O Santuário profanado desencadeia cortes invisíveis infinitos sobre seu corpo!",
        color: '#ef4444'
      },
      perfection: {
        name: "Auto-incorporação da Perfeição (Jhei Endoka)",
        description: "Milhares de mãos te envolvem no abismo. Sua alma está sujeita ao toque absoluto da Mutação Ociosa de Mahito!",
        color: '#22d3ee'
      },
      shadows: {
        name: "Jardim das Sombras Quiméricas (Kanō Teien)",
        description: "O chão dissolve em um oceano fluido de pântano escuro. Sombras e Shikigamis infinitos emergem para devorar seus alvos!",
        color: '#f59e0b'
      }
    }

    const theme = domainThemes[selectedDomain]
    
    // Inicia a sequência de animação imersiva em estágios
    setActiveDomainAnimation(selectedDomain)
    setDomainStage(0) // Conjuração
    setShakeActive(true)

    // Altera a cor de energia do tema temporariamente
    document.documentElement.style.setProperty('--cursed-color', theme.color)

    // Fase 1: Barreira se fecha
    setTimeout(() => {
      setDomainStage(1)
      setShakeActive(false)
    }, 1500)

    // Fase 2: Efeito Absoluto (Impacto do domínio)
    setTimeout(() => {
      setDomainStage(2)
      setShakeActive(true)
      showCursedToast("領域展開 Ryoiki Tenkai", `${theme.name} manifestado com sucesso!`, "energy", 5000)
    }, 3200)

    // Fase 3: Dissipação / Restauração do mundo físico
    setTimeout(() => {
      setDomainStage(3)
      setShakeActive(false)
    }, 7200)

    // Fim da simulação
    setTimeout(() => {
      setActiveDomainAnimation(null)
    }, 8500)
  }

  const changeQuote = () => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]
    setQuote(randomQuote)
  }

  // Elementos matemáticos para simulação do Vazio Infinito
  const mathSymbols = [
    "lim_{x \\to \\infty} f(x) = \\infty", "\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}", 
    "0.00000000000000000001s", "d/dx [e^x] = e^x", "\\nabla \\times \\mathbf{E} = -\\frac{\\partial \\mathbf{B}}{\\partial t}",
    "\\aleph_0", "i^2 = -1", "E = mc^2", "\\infty \\pm \\infty", "Ryoiki Tenkai", "Muryōkūsho",
    "UNIVERSO", "CONSCIÊNCIA", "INFINITO", "Lapidação", "Vácuo", "Paradoxo", "0.000001s"
  ]

  return (
    <div className={`relative min-h-screen flex flex-col items-center justify-start bg-[var(--bg-color)] text-[var(--text-color)] overflow-x-hidden ${shakeActive ? 'animate-shake' : ''}`}>
      
      {/* CSS Cinematográfico — Animações de alta imersão */}
      <style>{`
        @keyframes flowGrid {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(40px) translateX(20px); }
        }
        .cursed-grid {
          background-size: 40px 40px;
          background-image:
            linear-gradient(to right, rgba(138,43,226,0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(138,43,226,0.04) 1px, transparent 1px);
          animation: flowGrid 12s linear infinite;
        }
        .glowing-blob { filter: blur(100px); pointer-events: none; }

        /* ── KOKUSEN ── */
        @keyframes kokusen-crack {
          0% { opacity: 0; transform: scaleX(0) rotate(var(--r)); filter: brightness(4); }
          3% { opacity: 1; transform: scaleX(1.1) rotate(var(--r)); filter: brightness(3); }
          15% { opacity: 0.9; filter: brightness(1.5); }
          100% { opacity: 0; }
        }
        .kk-crack {
          position: absolute;
          height: 2px;
          width: 130vw;
          background: linear-gradient(90deg, transparent 0%, #ff4444 20%, #ffffff 50%, #ff4444 80%, transparent 100%);
          transform-origin: center;
          animation: kokusen-crack 1.8s ease-out forwards;
          box-shadow: 0 0 18px 4px rgba(255,50,50,0.6), 0 0 40px 12px rgba(200,0,0,0.3);
          pointer-events: none;
        }
        @keyframes kk-particle {
          0% { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
        }
        .kk-particle {
          position: absolute;
          border-radius: 50%;
          animation: kk-particle 1s ease-out forwards;
          pointer-events: none;
        }
        @keyframes kk-flash {
          0% { opacity: 0; } 5% { opacity: 0.95; } 15% { opacity: 0.6; } 40% { opacity: 0.15; } 100% { opacity: 0; }
        }
        .kk-vignette { animation: kk-flash 2s ease-out forwards; }
        @keyframes kk-text {
          0% { transform: scale(0.1) rotate(-8deg); opacity: 0; filter: blur(20px); }
          30% { transform: scale(1.25) rotate(2deg); opacity: 1; filter: blur(0); }
          60% { transform: scale(1.05) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .kk-title { animation: kk-text 0.8s cubic-bezier(0.2, 1.4, 0.4, 1) forwards; }

        /* ── VAZIO INFINITO ── */
        @keyframes floatEquation {
          0% { transform: translateY(110vh) scale(0.5) rotate(0deg); opacity: 0; }
          8% { opacity: 0.7; }
          92% { opacity: 0.7; }
          100% { transform: translateY(-20vh) scale(1.8) rotate(720deg); opacity: 0; }
        }
        .floating-math { animation: floatEquation 6s linear infinite; }
        @keyframes blackHoleRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .black-hole-ring { animation: blackHoleRotate 3s linear infinite; }
        @keyframes starSuck {
          0% { transform: translate(var(--sx), var(--sy)) scale(1); opacity: 0.8; }
          100% { transform: translate(0,0) scale(0); opacity: 0; }
        }
        .star-suck { animation: starSuck 2s ease-in forwards; }

        /* ── SANTUÁRIO MALEVOLENTE ── */
        @keyframes slashCut {
          0% { transform: scaleX(0) rotate(var(--rot)); opacity: 0; }
          4% { transform: scaleX(1.4) rotate(var(--rot)); opacity: 1; filter: brightness(3); }
          25% { transform: scaleX(1) rotate(var(--rot)); opacity: 0.9; }
          100% { transform: scaleX(1.05) rotate(var(--rot)); opacity: 0; }
        }
        .shrine-slash {
          height: 2px;
          background: linear-gradient(90deg, transparent, #ff2222, #ffffff 50%, #ff2222, transparent);
          transform-origin: center;
          animation: slashCut 0.7s cubic-bezier(0.1, 0.9, 0.4, 1) forwards;
          box-shadow: 0 0 20px 6px rgba(255,0,0,0.5), 0 0 6px 2px #fff;
        }
        @keyframes bloodSplatter {
          0% { transform: scale(0.2); opacity: 0; filter: blur(8px); }
          18% { transform: scale(1); opacity: 0.85; filter: blur(0); }
          80% { opacity: 0.85; }
          100% { opacity: 0; }
        }
        .blood-splat { animation: bloodSplatter 2.2s ease-out forwards; }

        /* ── PERFEIÇÃO ── */
        @keyframes waveHands {
          0%, 100% { transform: translate(var(--x), var(--y)) rotate(var(--r)); }
          50% { transform: translate(calc(var(--x) + 18px), calc(var(--y) - 18px)) rotate(calc(var(--r) + 10deg)); }
        }
        .perfection-hand { animation: waveHands 3.5s ease-in-out infinite alternate; filter: drop-shadow(0 0 10px rgba(34,211,238,0.5)); }
        @keyframes heartPulse {
          0%, 100% { transform: scale(1); filter: saturate(1) contrast(1); }
          50% { transform: scale(1.04); filter: saturate(1.6) contrast(1.15); }
        }
        .heartbeat-fx { animation: heartPulse 0.85s infinite ease-in-out; }

        /* ── JARDIM DAS SOMBRAS ── */
        @keyframes shadowRise {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
        .shadow-rise-pool { animation: shadowRise 1.8s cubic-bezier(0.05, 0.9, 0.2, 1) forwards; }
        @keyframes floatShadowBubble {
          0% { transform: translateY(100vh) scale(0.7); opacity: 0; }
          25% { opacity: 0.5; }
          85% { opacity: 0.5; }
          100% { transform: translateY(-10vh) scale(1.5); opacity: 0; }
        }
        .shadow-bubble { animation: floatShadowBubble 5.5s ease-in infinite; }

        /* ── RYOIKI DISSOLVE ── */
        @keyframes domainExpand {
          0% { clip-path: circle(0% at 50% 50%); opacity: 0; }
          100% { clip-path: circle(150% at 50% 50%); opacity: 1; }
        }
        .domain-expand { animation: domainExpand 1.2s cubic-bezier(0.2, 0.8, 0.3, 1) forwards; }
      `}</style>

      {/* Background decorativo premium */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 cursed-grid opacity-30" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/10 glowing-blob rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 glowing-blob rounded-full" />
      </div>

      {/* ── KOKUSEN — ANIMAÇÃO CINEMATOGRÁFICA ── */}
      <AnimatePresence>
        {blackFlashActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden"
            style={{ background: '#000' }}
          >
            {/* Red vignette flash */}
            <div className="kk-vignette absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, rgba(220,0,0,0.55) 0%, transparent 70%)' }} />

            {/* Lightning cracks from center */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="kk-crack"
                style={{
                  '--r': `${i * 22.5 + getPseudoRandom(i, 1) * 15}deg`,
                  top: '50%', left: '-15vw',
                  animationDelay: `${getPseudoRandom(i, 2) * 0.35}s`,
                  opacity: 0.7 + getPseudoRandom(i, 3) * 0.3,
                }}
              />
            ))}

            {/* Shrapnel particles */}
            {Array.from({ length: 30 }).map((_, i) => {
              const angle = getPseudoRandom(i, 4) * 360
              const dist = 120 + getPseudoRandom(i, 5) * 280
              return (
                <div
                  key={i}
                  className="kk-particle"
                  style={{
                    '--dx': `${Math.cos(angle * Math.PI / 180) * dist}px`,
                    '--dy': `${Math.sin(angle * Math.PI / 180) * dist}px`,
                    top: '50%', left: '50%',
                    width: `${4 + getPseudoRandom(i, 6) * 8}px`,
                    height: `${4 + getPseudoRandom(i, 6) * 8}px`,
                    background: getPseudoRandom(i, 7) > 0.5 ? '#ff3333' : '#ffffff',
                    boxShadow: '0 0 8px rgba(255,50,50,0.7)',
                    animationDelay: `${getPseudoRandom(i, 8) * 0.25}s`,
                    animationDuration: `${0.7 + getPseudoRandom(i, 9) * 0.6}s`,
                  }}
                />
              )
            })}

            {/* Title */}
            <div className="relative z-20 flex flex-col items-center gap-3 text-center">
              <div className="kk-title text-[10vw] md:text-9xl font-jujutsu font-extrabold tracking-widest uppercase"
                style={{
                  color: '#ffffff',
                  WebkitTextStroke: '2px #cc0000',
                  filter: 'drop-shadow(0 0 40px rgba(255,0,0,1)) drop-shadow(0 0 80px rgba(200,0,0,0.6))',
                  textShadow: '0 0 20px #ff0000, 0 0 60px rgba(255,0,0,0.5)',
                }}
              >
                黒閃
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-2xl md:text-4xl font-jujutsu font-black tracking-[0.3em] uppercase"
                style={{ color: '#ef4444', filter: 'drop-shadow(0 0 12px rgba(239,68,68,0.8))' }}
              >
                KOKUSEN!
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 0.7 }}
                className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-2"
              >
                Energia amaldiçoada concentrada em 0,000001 segundos
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── IMERSÃO COMPLETA: EXPANSÃO DE DOMÍNIO (RYOIKI TENKAI) ── */}
      <AnimatePresence>
        {activeDomainAnimation && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden pointer-events-none`}
            style={{ backgroundColor: domainStage >= 1 ? '#000000' : 'rgba(0,0,0,0.85)' }}
          >
            
            {/* ETAPA 0: Invocação e Selo de Mão Inicial */}
            {domainStage === 0 && (
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="flex flex-col items-center justify-center gap-4 text-center z-50"
              >
                <div className="filter drop-shadow-[0_0_30px_var(--cursed-color)] animate-bounce flex items-center justify-center">
                  {activeDomainAnimation === 'infinite' && <Eye className="w-24 h-24 md:w-32 md:h-32 stroke-1 text-purple-400" />}
                  {activeDomainAnimation === 'shrine' && <Skull className="w-24 h-24 md:w-32 md:h-32 stroke-1 text-red-500" />}
                  {activeDomainAnimation === 'perfection' && <Sparkles className="w-24 h-24 md:w-32 md:h-32 stroke-1 text-cyan-400" />}
                  {activeDomainAnimation === 'shadows' && <Ghost className="w-24 h-24 md:w-32 md:h-32 stroke-1 text-amber-500" />}
                </div>
                <div className="font-jujutsu text-5xl md:text-8xl tracking-widest text-white drop-shadow-[0_0_20px_var(--cursed-color)] uppercase">
                  領域展開
                </div>
                <div className="text-purple-300 text-lg md:text-2xl font-semibold tracking-wider font-mono">
                  RYOIKI TENKAI!
                </div>
              </motion.div>
            )}

            {/* ETAPAS 1 e 2: O Domínio está ativo */}
            {domainStage >= 1 && (
              <div className="absolute inset-0 w-full h-full flex items-center justify-center select-none">
                
                {/* 1. Vazio Infinito (Gojo Satoru) — Buraco Negro Absoluto */}
                {activeDomainAnimation === 'infinite' && (
                  <div className="domain-expand absolute inset-0 bg-[#020108] flex items-center justify-center overflow-hidden">
                    {/* Deep space background */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(88,28,135,0.35)_0%,rgba(20,5,50,0.8)_40%,#000_100%)]" />

                    {/* Stars being sucked toward center */}
                    {Array.from({ length: 60 }).map((_, idx) => {
                      const angle = getPseudoRandom(idx, 20) * 360
                      const dist = 150 + getPseudoRandom(idx, 21) * 600
                      return (
                        <div
                          key={idx}
                          className="star-suck absolute rounded-full"
                          style={{
                            '--sx': `${Math.cos(angle * Math.PI / 180) * dist}px`,
                            '--sy': `${Math.sin(angle * Math.PI / 180) * dist}px`,
                            top: '50%', left: '50%',
                            width: `${1 + getPseudoRandom(idx, 22) * 3}px`,
                            height: `${1 + getPseudoRandom(idx, 22) * 3}px`,
                            background: getPseudoRandom(idx, 23) > 0.6 ? '#c084fc' : '#ffffff',
                            boxShadow: `0 0 ${4 + getPseudoRandom(idx, 24) * 6}px rgba(192,132,252,0.8)`,
                            animationDelay: `${getPseudoRandom(idx, 25) * 2}s`,
                            animationDuration: `${1 + getPseudoRandom(idx, 26) * 1.5}s`,
                          }}
                        />
                      )
                    })}

                    {/* Floating math symbols */}
                    {Array.from({ length: 20 }).map((_, idx) => {
                      const symbol = mathSymbols[idx % mathSymbols.length]
                      return (
                        <div
                          key={idx}
                          className="floating-math absolute text-purple-400/40 text-sm md:text-base font-mono pointer-events-none"
                          style={{
                            left: `${getPseudoRandom(idx, 1) * 100}%`,
                            animationDelay: `${(idx * 0.2).toFixed(2)}s`,
                          }}
                        >
                          {symbol}
                        </div>
                      )
                    })}

                    {/* Black hole rings */}
                    <div className="absolute w-48 h-48 md:w-72 md:h-72 rounded-full border-2 border-purple-500/30 black-hole-ring" style={{ boxShadow: '0 0 60px rgba(139,92,246,0.4), inset 0 0 60px rgba(139,92,246,0.2)' }} />
                    <div className="absolute w-32 h-32 md:w-48 md:h-48 rounded-full border border-purple-400/20 black-hole-ring" style={{ animationDuration: '2s', animationDirection: 'reverse', boxShadow: '0 0 30px rgba(168,85,247,0.3)' }} />
                    <div className="absolute w-16 h-16 md:w-24 md:h-24 rounded-full bg-black" style={{ boxShadow: '0 0 40px 20px rgba(0,0,0,1), 0 0 0 2px rgba(139,92,246,0.5)' }} />

                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1.05, opacity: [0.8, 1, 0.8] }}
                      transition={{ scale: { duration: 1.2 }, opacity: { repeat: Infinity, duration: 2.5 } }}
                      className="text-center z-20 flex flex-col items-center gap-3 p-6"
                    >
                      <h2 className="text-white text-5xl md:text-8xl font-black font-jujutsu tracking-wider filter drop-shadow-[0_0_40px_#a855f7]">
                        VAZIO INFINITO
                      </h2>
                      <p className="text-purple-300 text-xs md:text-sm max-w-md bg-black/80 px-4 py-2 rounded-xl border border-purple-500/30 mt-4 leading-relaxed font-sans">
                        Informações ilimitadas do universo inundam sua mente. Paralisação absoluta garantida.
                      </p>
                    </motion.div>
                  </div>
                )}

                {/* 2. Santuário Malevolente (Sukuna) — UPGRADED */}
                {activeDomainAnimation === 'shrine' && (
                  <div className="domain-expand absolute inset-0 bg-[#080100] flex items-center justify-center overflow-hidden">
                    {/* Deep crimson background pulse */}
                    <div className="absolute inset-0" style={{
                      background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(180,0,0,0.35), rgba(80,0,0,0.2) 50%, transparent 80%)'
                    }} />
                    <div className="absolute inset-0 opacity-20" style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(180,0,0,0.08) 3px, rgba(180,0,0,0.08) 4px)'
                    }} />

                    {/* Katana slashes across full screen */}
                    {domainStage === 2 && Array.from({ length: 22 }).map((_, idx) => {
                      const angle = Math.floor(getPseudoRandom(idx, 3) * 180 - 90)
                      const delay = (getPseudoRandom(idx, 4) * 2.5).toFixed(2)
                      const topPos = Math.floor(getPseudoRandom(idx, 5) * 100)
                      return (
                        <div
                          key={idx}
                          className="shrine-slash absolute w-[200vw] pointer-events-none"
                          style={{
                            '--rot': `${angle}deg`,
                            top: `${topPos}%`,
                            left: '-50vw',
                            animationDelay: `${delay}s`,
                            height: `${1 + getPseudoRandom(idx, 17) * 2}px`,
                            opacity: 0.6 + getPseudoRandom(idx, 18) * 0.4
                          }}
                        />
                      )
                    })}

                    {/* Blood splatters */}
                    {domainStage === 2 && Array.from({ length: 14 }).map((_, idx) => {
                      const topPos = Math.floor(getPseudoRandom(idx, 7) * 85) + 5
                      const leftPos = Math.floor(getPseudoRandom(idx, 8) * 85) + 5
                      const size = Math.floor(getPseudoRandom(idx, 9) * 100) + 30
                      const delay = (0.3 + getPseudoRandom(idx, 10) * 2).toFixed(2)
                      return (
                        <div
                          key={idx}
                          className="blood-splat absolute rounded-full pointer-events-none"
                          style={{
                            top: `${topPos}%`, left: `${leftPos}%`,
                            width: `${size}px`, height: `${size * 0.6}px`,
                            background: `radial-gradient(ellipse, rgba(${160 + Math.floor(getPseudoRandom(idx,19)*60)},0,0,0.7), rgba(80,0,0,0.2))`,
                            animationDelay: `${delay}s`,
                            transform: `rotate(${getPseudoRandom(idx,20)*360}deg)`,
                            filter: 'blur(0.5px)'
                          }}
                        />
                      )
                    })}

                    <motion.div
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: [0.7, 1.08, 1], opacity: [0, 1, 0.95] }}
                      transition={{ duration: 1.0, ease: 'easeOut' }}
                      className="text-center z-20 flex flex-col items-center gap-3 p-6"
                    >
                      <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.4em] border border-red-500/30 px-3 py-1 rounded-full bg-red-950/40">八撮の射漏狂星• MALEVOLENT SHRINE</span>
                      <h2
                        className="text-5xl md:text-8xl font-black font-jujutsu tracking-wider"
                        style={{ color: '#ff2222', filter: 'drop-shadow(0 0 40px rgba(255,0,0,0.9)) drop-shadow(0 0 80px rgba(200,0,0,0.5))', textShadow: '0 0 20px #ff0000' }}
                      >
                        SANTUÁRIO MALEVOLENTE
                      </h2>
                      <p className="text-red-300 text-xs md:text-sm max-w-md bg-black/80 px-4 py-2 rounded-xl border border-red-500/30 mt-2 leading-relaxed font-sans">
                        Cortes catastróficos e invisíveis rasgam tudo a 200m. Não há defesa possível contra a técnica bala de Sukuna.
                      </p>
                    </motion.div>
                  </div>
                )}

                {/* 3. Auto-incorporação da Perfeição (Mahito) — UPGRADED */}
                {activeDomainAnimation === 'perfection' && (
                  <div className="domain-expand absolute inset-0 bg-[#010a0d] heartbeat-fx flex items-center justify-center overflow-hidden">
                    {/* Biomass radial gradient */}
                    <div className="absolute inset-0" style={{
                      background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(0,200,220,0.12), rgba(0,100,120,0.08) 50%, transparent 80%)'
                    }} />
                    {/* Grid scan lines */}
                    <div className="absolute inset-0 opacity-10" style={{
                      backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,210,238,0.2) 0px, transparent 1px, transparent 40px, rgba(0,210,238,0.2) 41px), repeating-linear-gradient(0deg, rgba(0,210,238,0.2) 0px, transparent 1px, transparent 40px, rgba(0,210,238,0.2) 41px)'
                    }} />

                    {/* Spectral hands around perimeter */}
                    {Array.from({ length: 16 }).map((_, idx) => {
                      const side = idx % 4
                      let style; let r;
                      if (side === 0) { style = { top: '-60px', left: `${(idx * 22) % 100}%` }; r = 175 + (getPseudoRandom(idx,11)*20-10); }
                      else if (side === 1) { style = { top: `${(idx*17)%100}%`, right: '-60px' }; r = 265 + (getPseudoRandom(idx,12)*20-10); }
                      else if (side === 2) { style = { bottom: '-60px', left: `${(idx*22)%100}%` }; r = getPseudoRandom(idx,13)*20-10; }
                      else { style = { top: `${(idx*17)%100}%`, left: '-60px' }; r = 85 + (getPseudoRandom(idx,14)*20-10); }
                      return (
                        <div key={idx} className="perfection-hand absolute pointer-events-none"
                          style={{ ...style, '--x':'0px','--y':'0px','--r':`${r}deg`, transform:`rotate(${r}deg)`, animationDelay:`${idx*0.18}s`, color:`rgba(0,${180+Math.floor(getPseudoRandom(idx,21)*60)},${200+Math.floor(getPseudoRandom(idx,22)*55)},0.35)` }}
                        >
                          <svg width="160" height="210" viewBox="0 0 100 150" fill="currentColor">
                            <path d="M50 150 C45 100 30 70 20 50 C15 40 5 30 10 20 C15 10 25 15 30 30 C35 25 35 10 42 5 C48 0 52 5 50 20 C55 15 65 5 72 10 C78 15 70 30 65 40 C75 35 85 30 90 40 C95 50 85 60 70 65 C60 70 55 90 50 150" />
                          </svg>
                        </div>
                      )
                    })}

                    <motion.div
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: [0.7, 1.1, 1.0], opacity: [0, 1, 0.95] }}
                      transition={{ duration: 1.1, ease: 'easeOut' }}
                      className="text-center z-20 flex flex-col items-center gap-3 p-6"
                    >
                      <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.4em] border border-cyan-500/30 px-3 py-1 rounded-full bg-cyan-950/40">自閉体自辛• SELF-EMBODIMENT</span>
                      <h2
                        className="text-4xl md:text-7xl font-black font-jujutsu tracking-wider"
                        style={{ color: '#22d3ee', filter: 'drop-shadow(0 0 40px rgba(34,211,238,0.9)) drop-shadow(0 0 80px rgba(0,150,200,0.4))', textShadow: '0 0 20px #06b6d4' }}
                      >
                        AUTO-INCORPORAÇÃO DA PERFEIÇÃO
                      </h2>
                      <p className="text-cyan-300 text-xs md:text-sm max-w-md bg-black/80 px-4 py-2 rounded-xl border border-cyan-500/30 mt-2 leading-relaxed font-sans">
                        A alma foi tocada. Mahito remodela sua existência a nível de corpo e espírito — irredutível, divino, absoluto.
                      </p>
                    </motion.div>
                  </div>
                )}

                {/* 4. Jardim das Sombras Quiméricas (Megumi) — UPGRADED */}
                {activeDomainAnimation === 'shadows' && (
                  <div className="domain-expand absolute inset-0 bg-[#010202] flex items-end justify-center overflow-hidden">
                    {/* Deep fog layers */}
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 100% 70% at 50% 100%, rgba(15,30,8,0.8), transparent 65%)' }} />
                    <div className="absolute bottom-0 left-0 w-full h-full" style={{ background: 'linear-gradient(to top, rgba(0,5,0,0.95) 0%, rgba(0,15,5,0.5) 30%, transparent 70%)' }} />

                    {/* Shadow water surface rising */}
                    <div
                      className="shadow-rise-pool absolute bottom-0 left-0 w-full pointer-events-none"
                      style={{
                        height: '65vh',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,10,3,0.75) 40%, transparent 100%)',
                        borderTop: '1px solid rgba(100,200,80,0.08)'
                      }}
                    />

                    {/* Shikigami shadow silhouettes rising from below */}
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="shadow-bubble absolute rounded-full pointer-events-none"
                        style={{
                          left: `${10 + getPseudoRandom(idx, 15) * 80}%`,
                          width: `${60 + getPseudoRandom(idx, 16) * 100}px`,
                          height: `${80 + getPseudoRandom(idx, 17) * 140}px`,
                          background: 'radial-gradient(ellipse, rgba(0,0,0,0.9) 40%, transparent 100%)',
                          animationDelay: `${idx * 0.6}s`,
                          filter: `blur(${4 + getPseudoRandom(idx, 23) * 6}px)`,
                          borderRadius: '40% 60% 60% 40% / 60% 30% 70% 40%'
                        }}
                      />
                    ))}

                    {/* Green foxfire orbs floating */}
                    {Array.from({ length: 12 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="shadow-bubble absolute rounded-full pointer-events-none"
                        style={{
                          left: `${getPseudoRandom(idx, 24) * 100}%`,
                          width: `${4 + getPseudoRandom(idx, 25) * 8}px`,
                          height: `${4 + getPseudoRandom(idx, 25) * 8}px`,
                          background: `rgba(${60 + Math.floor(getPseudoRandom(idx,26)*40)}, ${180 + Math.floor(getPseudoRandom(idx,27)*60)}, ${80 + Math.floor(getPseudoRandom(idx,28)*40)}, 0.7)`,
                          boxShadow: `0 0 ${8 + getPseudoRandom(idx,29)*12}px rgba(80,220,100,0.5)`,
                          animationDelay: `${idx * 0.35}s`,
                          animationDuration: `${4 + getPseudoRandom(idx,30)*3}s`,
                          filter: 'blur(1px)'
                        }}
                      />
                    ))}

                    <motion.div
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: [0.7, 1.08, 1.0], opacity: [0, 1, 0.95] }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="text-center z-20 flex flex-col items-center gap-3 p-6 mb-[12vh]"
                    >
                      <span className="text-[10px] font-black text-green-400 uppercase tracking-[0.4em] border border-green-500/30 px-3 py-1 rounded-full bg-green-950/40">弈塞陰魔庭• CHIMERA SHADOW GARDEN</span>
                      <h2
                        className="text-4xl md:text-7xl font-black font-jujutsu tracking-wider"
                        style={{ color: '#d97706', filter: 'drop-shadow(0 0 35px rgba(180,100,0,0.9)) drop-shadow(0 0 80px rgba(100,50,0,0.5))' }}
                      >
                        JARDIM DAS SOMBRAS QUIMÉRICAS
                      </h2>
                      <p className="text-amber-200 text-xs md:text-sm max-w-md bg-black/85 px-4 py-2 rounded-xl border border-amber-600/25 mt-2 leading-relaxed font-sans">
                        O chão devora tudo. Shikigamis nascem das sombras como predadores ancestrais. Megumi convoca o jardim primordial.
                      </p>
                    </motion.div>
                  </div>
                )}

              </div>
            )}

            {/* ETAPA 3: Dissipação e Restauração de Visão */}
            {domainStage === 3 && (
              <motion.div 
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
                className="absolute inset-0 bg-white z-50 flex items-center justify-center"
              >
                <div className="font-jujutsu text-xl text-black select-none tracking-widest font-black">
                  DISSIPANDO DOMÍNIO...
                </div>
              </motion.div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <header className="w-full max-w-7xl px-6 py-4 flex items-center justify-between relative z-30 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
          <span className="filter drop-shadow-[0_0_8px_var(--cursed-color)] group-hover:scale-110 transition-transform">
            <CursedLogo size={22} className="animate-pulse" />
          </span>
          <span className="font-jujutsu text-lg md:text-xl tracking-wider bg-gradient-to-r from-white via-gray-300 to-purple-400 bg-clip-text text-transparent brand-title-text">
            CÉU E TERRA
          </span>
        </div>
        <nav className="flex items-center gap-4">
          {authStatus.authenticated ? (
            <>
              <button 
                onClick={() => navigate('/lobby')} 
                className="glass-card px-4 py-2 rounded-xl text-sm font-semibold hover:text-white transition-all cursor-pointer text-purple-300 flex items-center gap-2"
              >
                <Swords className="w-4 h-4" /> Entrar no Lobby
              </button>
              <a 
                href="/logout" 
                className="text-xs text-gray-400 hover:text-red-400 transition-colors"
              >
                Sair
              </a>
            </>
          ) : (
            <>
              <button 
                onClick={() => navigate('/login')} 
                className="text-sm font-medium hover:text-purple-400 transition-colors cursor-pointer"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/register')} 
                className="glass-card px-4 py-2 rounded-xl text-sm font-semibold hover:text-white transition-all cursor-pointer text-purple-300"
              >
                Cadastrar-se
              </button>
            </>
          )}
        </nav>
      </header>

      {/* Hero section */}
      <section className="relative z-20 max-w-4xl px-6 pt-16 pb-8 text-center flex flex-col items-center gap-6">
        <div className="inline-flex items-center gap-2 bg-purple-950/40 border border-purple-500/30 px-4 py-2 rounded-full text-xs font-semibold text-purple-300 tracking-wider uppercase select-none shadow-[0_0_15px_rgba(139,92,246,0.15)]">
          <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" />
          LIVRO DE REGRAS 2.5.5 INTEGRADO E ATUALIZADO
        </div>

        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight leading-none mt-2">
          <span className="jjk-title-gradient">Jujutsu Kaisen</span><br />
          <span className="font-jujutsu text-5xl md:text-8xl bg-gradient-to-r from-purple-400 via-pink-500 to-amber-300 bg-clip-text text-transparent filter drop-shadow-[0_0_20px_rgba(138,43,226,0.3)]">
            Céu e Terra
          </span>
        </h1>

        <p className="text-base md:text-lg text-gray-400 max-w-2xl leading-relaxed mt-2 font-sans">
          O hub definitivo de **Feiticeiros & Maldições 2.5.5**. Alavanque seus personagens importando fichas completas do Excel, desvende os segredos ocultos da energia amaldiçoada e prepare-se para travar duelos lendários nos Lobbies.
        </p>

        {/* Painel do Personagem / Call to Actions */}
        <div className="w-full max-w-2xl mt-4 relative z-20">
          {authStatus.authenticated ? (
            <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
              <div className="text-left flex items-center gap-3">
                <Sparkles className="w-10 h-10 text-purple-400 filter drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                <div>
                  <h4 className="text-xs text-purple-400 font-bold uppercase tracking-wider">Feiticeiro Autenticado</h4>
                  <p className="text-lg font-bold text-white font-sans">{authStatus.character_nome || "Aguardando Criação..."}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0">
                {authStatus.character_id ? (
                  <button
                    onClick={() => navigate(`/ficha/${authStatus.character_id}`)}
                    className="px-6 py-2.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all text-sm cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.4)] flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" /> Acessar Ficha do Feiticeiro
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/lobby')}
                    className="px-6 py-2.5 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all text-sm cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.4)] flex items-center justify-center gap-2"
                  >
                    <Swords className="w-4 h-4" /> Ir para o Lobby
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="cursed-border px-8 py-4 rounded-xl font-bold bg-purple-600/80 hover:bg-purple-600 text-white flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(138,43,226,0.5)] cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" /> Acessar Ficha de Feiticeiro
              </button>
              <button
                onClick={() => navigate('/register')}
                className="glass-card px-8 py-4 rounded-xl font-bold hover:bg-white/5 active:scale-95 transition-all cursor-pointer text-white flex items-center justify-center gap-2 border border-white/10"
              >
                <Scroll className="w-5 h-5 text-purple-300" /> Registrar Novo Feiticeiro
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── SEÇÃO PREMIUM: BIBLIOTECA JUJUTSU & LIVRO DE REGRAS ── */}
      <section className="relative z-20 w-full max-w-6xl px-6 py-8">
        <div className="glass-card rounded-3xl p-8 border border-white/10 relative overflow-hidden bg-gradient-to-r from-purple-950/20 via-[#0a0a14] to-blue-950/15">
          <div className="absolute top-0 right-0 bg-yellow-500/10 border-l border-b border-yellow-500/20 px-4 py-2 rounded-bl-2xl text-[10px] font-bold text-yellow-400 uppercase tracking-widest font-mono">
            Compêndio de Almas
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <h2 className="text-2xl md:text-4xl font-bold text-white flex items-center gap-3 font-jujutsu">
                <Scroll className="w-8 h-8 text-yellow-500" /> Grimório Jujutsu: Feiticeiros & Maldições 2.5.5
              </h2>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed font-sans">
                O RPG de mesa **Feiticeiros & Maldições** traz os perigos, as maldições de graus elevados e a complexa manipulação de energia amaldiçoada do universo de Jujutsu Kaisen. Esta plataforma integra e automatiza todas as regras oficiais da versão 2.5.5:
              </p>

              {/* Destaques de regras em Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex gap-3 bg-black/40 p-4 rounded-2xl border border-white/5 items-start">
                  <Award className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white text-xs font-bold uppercase tracking-wider">Lapidação da Alma</h4>
                    <p className="text-gray-500 text-xs mt-1 font-sans">Atributos confirmados fundem-se na alma. O piso é travado e nunca poderá sofrer regressões ou diminuições.</p>
                  </div>
                </div>

                <div className="flex gap-3 bg-black/40 p-4 rounded-2xl border border-white/5 items-start">
                  <TrendingUp className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white text-xs font-bold uppercase tracking-wider">XP e Nível Cumulativo</h4>
                    <p className="text-gray-500 text-xs mt-1 font-sans">Sua progressão é somada pelo mestre. Cada nível desbloqueia 2 pontos de atributos e escala seu PV/PE máximo.</p>
                  </div>
                </div>

                <div className="flex gap-3 bg-black/40 p-4 rounded-2xl border border-white/5 items-start">
                  <Zap className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white text-xs font-bold uppercase tracking-wider">Técnicas de Barreira</h4>
                    <p className="text-gray-500 text-xs mt-1 font-sans">Invocação do Ryoiki Tenkai custa energia e garante acerto absoluto, alterando o ambiente físico.</p>
                  </div>
                </div>

                <div className="flex gap-3 bg-black/40 p-4 rounded-2xl border border-white/5 items-start">
                  <FolderOpen className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white text-xs font-bold uppercase tracking-wider">Sincronia Excel</h4>
                    <p className="text-gray-500 text-xs mt-1 font-sans">Permite sincronizar integralmente perícias, equipamentos, conjurações e shikigamis direto de planilhas.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsRulebookOpen(true)}
                  className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider active:scale-95 transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] cursor-pointer flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-black" /> Folhear Livro de Regras (2.5.5)
                </button>
              </div>
            </div>

            {/* Representação visual do Grimório */}
            <div className="lg:col-span-5 flex justify-center">
              <div 
                onClick={() => setIsRulebookOpen(true)}
                className="w-56 h-72 rounded-2xl bg-[#09070f] border-2 border-yellow-500/40 relative shadow-[0_0_35px_rgba(234,179,8,0.12)] flex flex-col items-center justify-between p-6 select-none cursor-pointer hover:scale-105 transition-all group hover:border-yellow-400"
              >
                <div className="w-full border-b border-yellow-500/20 pb-3 flex justify-between text-[8px] font-bold text-yellow-500/70 font-mono">
                  <span>REGULAMENTO J.K.</span>
                  <span>v2.5.5</span>
                </div>
                <div className="text-center space-y-2 flex flex-col items-center">
                  <BookOpen className="w-16 h-16 text-yellow-500 filter drop-shadow-[0_0_8px_#eab308]" />
                  <h3 className="font-jujutsu text-yellow-500 text-xl tracking-wider pt-2 group-hover:scale-110 transition-transform">CÉU E TERRA</h3>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">Guia Prático do Feiticeiro</p>
                </div>
                <div className="w-full text-center text-[8px] text-yellow-500/50 font-bold border-t border-yellow-500/20 pt-3">
                  FEITICEIROS & MALDIÇÕES
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mini-Games Grid */}
      <section className="relative z-20 w-full max-w-6xl px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch mb-24">
        
        {/* Kokusen trainer */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between gap-6 border border-white/10 relative overflow-hidden group bg-gradient-to-br from-black/80 to-red-950/5">
          <div className="absolute top-0 right-0 bg-red-600/10 px-3 py-1 rounded-bl-xl text-[10px] font-bold text-red-400 uppercase tracking-widest border-l border-b border-red-500/20 font-mono">
            Treino Concentrado
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2 font-jujutsu">
              <Zap className="w-6 h-6 text-red-500 animate-pulse" /> Faísca Negra (Kokusen)
            </h3>
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">
              Atingir o Kokusen requer aplicar energia amaldiçoada em um intervalo de <strong className="text-red-400">0,000001 segundos</strong> do golpe físico. Teste seus reflexos e tente manifestar a faísca negra!
            </p>
          </div>

          <div className="bg-black/50 border border-white/5 rounded-xl p-4 flex flex-col gap-4 relative">
            <div className="relative w-full h-8 bg-gray-950 rounded-lg overflow-hidden border border-white/10 flex items-center">
              {/* Sweet spot zone */}
              <div 
                className="absolute h-full bg-red-600 shadow-[0_0_15px_#ef4444] z-10"
                style={{ left: `${kokusenZone.left}%`, right: `${100 - kokusenZone.right}%` }}
              />
              {/* Sliding Cursor */}
              <div 
                className="absolute w-1.5 h-full bg-white shadow-[0_0_8px_#ffffff] z-20"
                style={{ left: `${cursorPos}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
              <span>Zona de Dispersão</span>
              <span className="text-red-500 font-bold">KOKUSEN ZONE</span>
              <span>Zona de Dispersão</span>
            </div>

            <button 
              onClick={triggerKokusen}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-red-700 to-red-900 text-white font-bold text-sm tracking-wider uppercase border border-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] active:scale-[0.98] transition-all cursor-pointer"
            >
              {btnText}
            </button>
          </div>

          <div className="text-xs text-gray-500 italic text-center font-sans">
            Dica: Aguarde o cursor cruzar exatamente a barra vermelha central para clicar.
          </div>
        </div>

        {/* Domain Expansion selector */}
        <div className="glass-card rounded-2xl p-6 flex flex-col justify-between gap-6 border border-white/10 relative overflow-hidden group bg-gradient-to-br from-black/80 to-purple-950/5">
          <div className="absolute top-0 right-0 bg-purple-600/10 px-3 py-1 rounded-bl-xl text-[10px] font-bold text-purple-400 uppercase tracking-widest border-l border-b border-purple-500/20 font-mono">
            Técnica Suprema
          </div>

          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2 font-jujutsu">
              <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" /> Expansão de Domínio (領域展開)
            </h3>
            <p className="text-sm text-gray-400 mt-2 leading-relaxed">
              Invoque a técnica definitiva. Escolha uma barreira inata e clique no botão abaixo para **sofrer na pele o impacto real** do domínio amaldiçoado!
            </p>
          </div>

          <div className="bg-black/50 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
            <label className="text-xs text-purple-300 font-semibold uppercase tracking-wider font-sans">Selecione o Domínio de Teste:</label>
            <select 
              value={selectedDomain} 
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="w-full p-2.5 rounded-lg text-sm bg-gray-900 border border-white/10 text-gray-300 focus:border-purple-500 cursor-pointer"
            >
              <option value="infinite">Vazio Infinito (Gojo Satoru)</option>
              <option value="shrine">Santuário Malevolente (Ryomen Sukuna)</option>
              <option value="perfection">Auto-incorporação da Perfeição (Mahito)</option>
              <option value="shadows">Jardim das Sombras Quiméricas (Megumi)</option>
            </select>

            <button 
              onClick={triggerDomain}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-700 to-indigo-950 text-white font-bold text-sm tracking-wider uppercase border border-purple-500/30 hover:shadow-[0_0_15px_rgba(138,43,226,0.4)] active:scale-[0.98] transition-all cursor-pointer font-sans flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-purple-300" /> Invocação Ryoiki Tenkai!
            </button>
          </div>

          <div className="text-xs text-gray-500 italic text-center font-sans">
            Aviso: Preparar-se para o impacto! A tela inteira sofrerá a distorção da barreira.
          </div>
        </div>

        {/* Quotes oracle */}
        <div className="glass-card md:col-span-2 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 relative overflow-hidden group">
          <div className="flex-1">
            <div className="inline-block bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded text-[9px] font-bold text-purple-400 uppercase tracking-widest mb-2 font-mono">
              Frase do Dia
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-jujutsu">
              <Scroll className="w-5 h-5 text-purple-400" /> Ressonância Mental dos Xamãs
            </h3>
            <div className="relative bg-black/60 border border-white/5 p-4 rounded-xl mt-3 min-h-[5rem] flex items-center">
              <p 
                className="text-sm md:text-base italic relative z-10 transition-opacity duration-300 font-sans"
                style={{ color: quote.color }}
              >
                {quote.text}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-[12rem] w-full md:w-auto">
            <button 
              onClick={changeQuote}
              className="w-full py-3 px-6 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-500/30 text-white text-xs font-bold tracking-wider uppercase active:scale-[0.98] transition-all text-center cursor-pointer font-sans flex items-center justify-center gap-2"
            >
              <RotateCw className="w-4 h-4 text-white animate-spin-slow" /> Sintonizar Mente
            </button>
            <span className="text-[10px] text-gray-500 text-center font-sans">Clique para evocar outro feiticeiro lendário.</span>
          </div>
        </div>
      </section>

      {/* ── MODAL INTERATIVO: LEITOR DO LIVRO DE REGRAS FEITICEIROS & MALDIÇÕES 2.5.5 ── */}
      <AnimatePresence>
        {isRulebookOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-4xl max-h-[85vh] rounded-3xl border border-yellow-500/30 overflow-hidden flex flex-col bg-[#07060b] shadow-[0_0_40px_rgba(234,179,8,0.25)] text-gray-200 rulebook-modal-container"
            >
              {/* Cabeçalho do Leitor */}
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/60 rulebook-modal-header">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-yellow-500" />
                  <div>
                    <h3 className="text-yellow-500 font-jujutsu text-lg tracking-wider">Feiticeiros & Maldições 2.5.5</h3>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest font-mono">Regulamento prático oficial do RPG</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsRulebookOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Abas de Navegação */}
              <div className="flex h-12 border-b border-white/5 bg-[#09080e] overflow-x-auto overflow-y-hidden rulebook-modal-tabs">
                {[
                  { id: 'intro', label: 'Introdução', icon: Sparkles },
                  { id: 'origins', label: 'Origens (2.5.5)', icon: User },
                  { id: 'attributes', label: 'Atributos', icon: Shield },
                  { id: 'xp', label: 'XP & Progressão', icon: TrendingUp },
                  { id: 'domain', label: 'Barreira Inata', icon: Zap }
                ].map(tab => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setRulebookTab(tab.id)}
                      className={`px-5 h-full text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all shrink-0 font-sans flex items-center justify-center gap-2 ${rulebookTab === tab.id ? 'border-yellow-500 text-yellow-500 bg-white/5' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Conteúdo do Livro de Regras */}
              <div className="p-6 md:p-8 overflow-y-auto flex-1 font-sans space-y-6 text-sm leading-relaxed text-gray-300 rulebook-modal-body">
                {rulebookTab === 'intro' && (
                  <div className="space-y-5">
                    <RuleTabHeader 
                      title="1. Universo Jujutsu de RPG" 
                      subtitle="Introdução ao compêndio de almas" 
                      icon={Sparkles} 
                    />
                    <div className="space-y-4 text-sm text-gray-300 font-sans leading-relaxed">
                      <p>
                        Em **Feiticeiros & Maldições 2.5.5**, você cria um feiticeiro capaz de manipular a misteriosa **Energia Amaldiçoada**, emanada a partir das emoções negativas dos seres humanos. O principal objetivo do RPG é enfrentar e exorcizar assombrações e maldições que assolam a humanidade, defendendo o equilíbrio cósmico.
                      </p>
                      <p>
                        O mestre assume o controle do ambiente e narra as tramas, enquanto os jogadores agem por meio de ações de exploração, conjurações de feitiços de barreira e rolagens críticas baseadas nos seus atributos corporais e espirituais.
                      </p>
                    </div>
                    <RuleAlertBanner icon={MessageSquare} type="warning">
                      <b>Nota do Livro de Regras:</b> A técnica suprema "Ryoiki Tenkai" (Expansão de Domínio) é tratada como um divisor de águas absoluto no campo de batalha, exigindo grande custo estratégico e preparação prévia.
                    </RuleAlertBanner>
                  </div>
                )}

                {rulebookTab === 'origins' && (
                  <div className="space-y-5">
                    <RuleTabHeader 
                      title="Origens do Feiticeiro" 
                      subtitle="v2.5.5 Escolha Fundamental do Xamã" 
                      icon={User} 
                    />
                    <p className="text-sm text-gray-300 leading-relaxed font-sans">
                      Na versão 2.5.5, a criação do seu xamã inicia-se pela escolha de uma de três **Origens** fundamentais que moldam sua essência e os traços herdados de energia e alma. As origens legadas foram unificadas nestas novas estruturas:
                    </p>

                    <div className="space-y-5">
                      <RuleInfoCard title="1. Origem: Inato" accentColor="purple" description="A origem mais comum no mundo Jujutsu, nascidos com afinidade natural e técnica própria que se manifesta na infância. Exemplos: Nobara Kugisaki e Kento Nanami.">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-300">
                          <div className="bg-black/30 p-3 rounded-xl border border-white/[0.03]">
                            <span className="font-extrabold text-white block mb-1">Bônus em Atributo</span>
                            <span className="text-gray-400">Aumenta em +2 um atributo e +1 em outro de sua escolha.</span>
                          </div>
                          <div className="bg-black/30 p-3 rounded-xl border border-white/[0.03]">
                            <span className="font-extrabold text-white block mb-1">Talento Natural</span>
                            <span className="text-gray-400">Ganha um Talento extra no Nível 1 e uma Aptidão gratuita a partir do Nível 4.</span>
                          </div>
                          <div className="bg-black/30 p-3 rounded-xl border border-white/[0.03]">
                            <span className="font-extrabold text-white block mb-1">Marca Registrada</span>
                            <span className="text-gray-400">Ganha um Feitiço adicional com seu custo reduzido em 1 PE.</span>
                          </div>
                        </div>
                      </RuleInfoCard>

                      <RuleInfoCard title="2. Origem: Derivado" accentColor="amber" description="A energia deriva de fontes alternativas ou antinaturais adquiridas tardiamente, como o consumo de objetos amaldiçoados ou alteração da alma. Exemplos: Yuuji Itadori e Junpei.">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-300">
                          <div className="bg-black/30 p-3 rounded-xl border border-white/[0.03]">
                            <span className="font-extrabold text-white block mb-1">Bônus em Atributo</span>
                            <span className="text-gray-400">Aumenta em +2 um atributo e +1 em outro de sua escolha.</span>
                          </div>
                          <div className="bg-black/30 p-3 rounded-xl border border-white/[0.03]">
                            <span className="font-extrabold text-white block mb-1">Energia Antinatural</span>
                            <span className="text-gray-400">Ação Bônus: Recupera energia amaldiçoada (PE) igual ao dobro do bônus de treino (1x ao dia).</span>
                          </div>
                          <div className="bg-black/30 p-3 rounded-xl border border-white/[0.03]">
                            <span className="font-extrabold text-white block mb-1">Caminhos do Despertar</span>
                            <span className="text-gray-400">Escolha entre Consumidor (assimila técnicas de objetos) ou Experimento (+2 feitiços e +30 no limite mental).</span>
                          </div>
                        </div>
                      </RuleInfoCard>

                      <RuleInfoCard title="3. Origem: Feiticeiro Reencarnado" accentColor="yellow" description="Xamãs ancestrais que reencarnaram na era moderna. Mantêm memórias, vasta maestria e conhecimentos ancestrais de combate. Exemplos: Hajime Kashimo e Ryu Ishigori.">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-300">
                          <div className="bg-black/30 p-3 rounded-xl border border-white/[0.03]">
                            <span className="font-extrabold text-white block mb-1">Bônus em Atributo</span>
                            <span className="text-gray-400">Aumenta em +2 um atributo e +1 em outro não escolhido.</span>
                          </div>
                          <div className="bg-black/30 p-3 rounded-xl border border-white/[0.03]">
                            <span className="font-extrabold text-white block mb-1">Conhecimentos Passados</span>
                            <span className="text-gray-400">Treinado em +2 perícias (ou Mestre em uma) e ganha uma Aptidão Amaldiçoada extra no Nível 1.</span>
                          </div>
                          <div className="bg-black/30 p-3 rounded-xl border border-white/[0.03]">
                            <span className="font-extrabold text-white block mb-1">Experiência de Batalha</span>
                            <span className="text-gray-400">Ação Bônus: Ganha uma Habilidade de Especialização temporária à sua escolha até o fim do dia (1x ao dia).</span>
                          </div>
                        </div>
                      </RuleInfoCard>
                    </div>

                    {/* COEXISTÊNCIA E RECEPTÁCULO */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/20 to-emerald-950/15 border border-red-500/10 space-y-3 shadow-sm">
                      <span className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 font-sans">
                        <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                        A Coexistência do Receptáculo (Derivado & Reencarnado)
                      </span>
                      <p className="text-xs text-gray-400 leading-relaxed font-sans">
                        Ao hospedar outra alma, o xamã coexiste violenta ou pacificamente com a entidade, ditando bônus e desafios:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans font-sans">
                        <div className="bg-black/50 border border-red-500/10 p-3.5 rounded-xl space-y-1">
                          <span className="font-bold text-red-400 uppercase tracking-wide block">Receptáculo Violento</span>
                          <p className="text-[11px] text-gray-400 leading-relaxed">
                            A entidade luta pelo controle. Consumir objetos exige <b>TR Fortitude e TR Vontade com CD = 20 + 1 por objeto</b>. Falhas resultam em perda de controle do corpo ou mente. Se resistir, ganha <b>+1 PE máximo</b> por objeto, limite de atributos estendido (+2 a cada 4 objetos) e RDs.
                          </p>
                        </div>
                        <div className="bg-black/50 border border-emerald-500/10 p-3.5 rounded-xl space-y-1">
                          <span className="font-bold text-emerald-400 uppercase tracking-wide block">Receptáculo Pacífico</span>
                          <p className="text-[11px] text-gray-400 leading-relaxed">
                            Relação harmoniosa e protetora. Concede <b>+1 PE máximo a cada 2 níveis</b>, <b>+2 no limite de um atributo a cada 6 níveis</b>, e ganha imunidade/resistência de dano da técnica da alma parceira.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {rulebookTab === 'attributes' && (
                  <div className="space-y-5">
                    <RuleTabHeader 
                      title="2. Os Atributos e a Lapidação da Alma" 
                      subtitle="As forças fundamentais do feiticeiro" 
                      icon={Shield} 
                    />
                    <p className="text-sm text-gray-300 leading-relaxed font-sans">
                      Cada feiticeiro é regido por seis atributos fundamentais que determinam sua aptidão física e controle amaldiçoado:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans">
                      <RuleListItem 
                        label="Força (FOR)" 
                        value="Mede seu poder físico, impacto de ataques corporais e capacidade de peso." 
                        icon={Swords} 
                        iconColor="text-red-500" 
                      />
                      <RuleListItem 
                        label="Destreza (DES)" 
                        value="Coordenação motora, agilidade e reflexos para esquivas rápidos." 
                        icon={Sparkles} 
                        iconColor="text-cyan-500" 
                      />
                      <RuleListItem 
                        label="Constituição (CON)" 
                        value="Resistência física, tolerância a dor e vitalidade básica (HP máximo)." 
                        icon={Shield} 
                        iconColor="text-emerald-500" 
                      />
                      <RuleListItem 
                        label="Inteligência (INT)" 
                        value="Raciocínio lógico, conhecimento de maldições e poderio de análise tática." 
                        icon={BookOpen} 
                        iconColor="text-purple-500" 
                      />
                      <RuleListItem 
                        label="Sabedoria (SAB)" 
                        value="Percepção sensorial e intuição de combate para notar ameaças e energias." 
                        icon={Eye} 
                        iconColor="text-amber-500" 
                      />
                      <RuleListItem 
                        label="Presença (PRE)" 
                        value="A magnitude da sua presença espiritual e controle de sua energia amaldiçoada (PE máximo)." 
                        icon={Zap} 
                        iconColor="text-yellow-500" 
                      />
                    </div>

                    <RuleAlertBanner icon={AlertTriangle} type="danger">
                      <b>REGRA DE OURO (LAPIDAÇÃO DE ATRIBUTOS):</b> Ao confirmar e salvar a alocação de atributos recebidos na ficha do RPG, estes são marcados permanentemente em sua alma. **É terminantemente proibido reduzir atributos abaixo do limite confirmado em banco de dados**. Uma vez alcançado um degrau de força, sua alma é moldada a ele!
                    </RuleAlertBanner>
                  </div>
                )}

                {rulebookTab === 'xp' && (
                  <div className="space-y-5">
                    <RuleTabHeader 
                      title="3. Progressão Acumulada de Experiência (XP)" 
                      subtitle="O caminho da evolução espiritual e level-up" 
                      icon={TrendingUp} 
                    />
                    <div className="space-y-4 text-sm text-gray-300 font-sans leading-relaxed">
                      <p>
                        A evolução no RPG Céu e Terra é regida por ganho acumulado de pontos de experiência (XP). Conforme realiza feitos lendários ou exorciza maldições, o mestre concede XP ao grupo através do painel de controle.
                      </p>
                      <p>
                        O nível do feiticeiro é atualizado automaticamente conforme as barreiras cumulativas abaixo:
                      </p>
                    </div>

                    <div className="bg-black/60 rounded-2xl overflow-hidden border border-white/5 font-mono text-xs shadow-md">
                      <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/10">
                          <tr>
                            <th className="p-3.5 text-yellow-500 font-bold uppercase tracking-wider">Nível</th>
                            <th className="p-3.5 text-yellow-500 font-bold uppercase tracking-wider">XP Acumulado Exigido</th>
                            <th className="p-3.5 text-yellow-500 font-bold uppercase tracking-wider">Bônus Adicional</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300">
                          <tr className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-3.5 font-bold">NV. 1</td>
                            <td className="p-3.5 text-gray-400">0 XP</td>
                            <td className="p-3.5 text-purple-400 font-bold">+0 Pontos de Atributos</td>
                          </tr>
                          <tr className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-3.5 font-bold">NV. 2</td>
                            <td className="p-3.5 text-gray-400">1.000 XP</td>
                            <td className="p-3.5 text-purple-400 font-bold">+2 Pontos de Atributos</td>
                          </tr>
                          <tr className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-3.5 font-bold">NV. 3</td>
                            <td className="p-3.5 text-gray-400">3.000 XP</td>
                            <td className="p-3.5 text-purple-400 font-bold">+4 Pontos de Atributos</td>
                          </tr>
                          <tr className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-3.5 font-bold">NV. 4</td>
                            <td className="p-3.5 text-gray-400">6.000 XP</td>
                            <td className="p-3.5 text-purple-400 font-bold">+6 Pontos de Atributos</td>
                          </tr>
                          <tr className="hover:bg-white/[0.01] transition-colors">
                            <td className="p-3.5 font-bold">NV. 5</td>
                            <td className="p-3.5 text-gray-400">10.000 XP <span className="text-[10px] text-red-400 px-1.5 py-0.5 rounded bg-red-950/40 border border-red-500/20 font-bold uppercase tracking-widest font-mono ml-2">Grau Especial</span></td>
                            <td className="p-3.5 text-purple-400 font-bold">+8 Pontos de Atributos</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[11px] text-gray-500 font-sans italic">
                      * Cada level-up recalcula e expande proporcionalmente sua vida útil e energia total.
                    </p>
                  </div>
                )}

                {rulebookTab === 'domain' && (
                  <div className="space-y-5">
                    <RuleTabHeader 
                      title="4. Ryoiki Tenkai — A Expansão de Domínio" 
                      subtitle="A barreira inata e acerto ineludível" 
                      icon={Zap} 
                    />
                    <div className="space-y-4 text-sm text-gray-300 font-sans leading-relaxed">
                      <p>
                        A manifestação da técnica inata de barreira aprisiona os alvos em um espaço particular. Nenhuma criatura pode escapar fisicamente por meios comuns, exceto superando a barreira por meio de outro Domínio (Disputa de Domínio).
                      </p>
                      <p>
                        <b>Efeitos Ativos no Domínio:</b>
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 font-sans">
                      <RuleListItem 
                        label="Acerto Absoluto (Ineludível)" 
                        value="Todas as magias, ataques e feitiços inatos desferidos pelo invocador acertam o alvo infalivelmente, ignorando rolagens de destreza ou esquivas normais." 
                        icon={Eye} 
                        iconColor="text-purple-400" 
                      />
                      <RuleListItem 
                        label="Ampliação de Técnica" 
                        value="A potência e a CD de todas as perícias amaldiçoadas do feiticeiro dentro do domínio ganham um bônus constante de +4." 
                        icon={TrendingUp} 
                        iconColor="text-emerald-400" 
                      />
                      <RuleListItem 
                        label="Consumo Extremo" 
                        value="Manifestar a expansão drena 20 PE (Pontos de Energia) instantaneamente do feiticeiro por uso." 
                        icon={Zap} 
                        iconColor="text-red-400" 
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Rodapé do Modal */}
              <div className="px-6 py-4 border-t border-white/5 bg-black/60 flex items-center justify-between text-xs text-gray-500 rulebook-modal-footer">
                <span>Versão 2.5.5 — Jujutsu RPG Companion</span>
                <button 
                  onClick={() => setIsRulebookOpen(false)}
                  className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold cursor-pointer uppercase transition-all"
                >
                  Entendido!
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="w-full py-6 mt-auto border-t border-white/5 bg-black/40 text-center text-xs text-gray-500 relative z-20 font-sans">
        <p>© 2026 Jujutsu RPG - Céu e Terra. Desenvolvido para proporcionar a melhor experiência de jogo sob o Regulamento 2.5.5.</p>
      </footer>
    </div>
  )
}
