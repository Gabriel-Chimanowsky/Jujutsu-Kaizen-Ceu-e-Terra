import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, Zap, Skull } from 'lucide-react'

export default function DiceRoller() {
  const [rollData, setRollData] = useState(null) // { formula, title, mod, isRolling, results: [], total: 0 }
  const [currentNum, setCurrentNum] = useState(20)

  useEffect(() => {
    const handleRoll = (e) => {
      const { formula, title, mod } = e.detail
      
      // Parse formula
      const cleanFormula = String(formula || '1d20').replace(/\s+/g, '').toLowerCase()
      const match = cleanFormula.match(/^(\d*)d(\d+)(?:([+-]\d+))?$/)
      
      let diceCount = 1
      let diceType = 20
      let modifier = 0

      if (match) {
        diceCount = match[1] ? parseInt(match[1]) : 1
        diceType = parseInt(match[2])
        if (match[3]) {
          modifier = parseInt(match[3])
        } else {
          modifier = parseInt(mod || 0)
        }
      } else {
        const num = parseInt(cleanFormula)
        if (!isNaN(num)) {
          modifier = num
        } else {
          modifier = parseInt(mod || 0)
        }
      }

      setRollData({
        formula,
        title,
        diceCount,
        diceType,
        modifier,
        isRolling: true,
        results: [],
        total: 0
      })
    }

    window.addEventListener('roll-dice', handleRoll)
    return () => window.removeEventListener('roll-dice', handleRoll)
  }, [])

  // Animate the rolling number
  useEffect(() => {
    if (!rollData || !rollData.isRolling) return

    let interval = setInterval(() => {
      setCurrentNum(Math.floor(Math.random() * rollData.diceType) + 1)
    }, 50)

    const timer = setTimeout(() => {
      clearInterval(interval)
      
      // Finalize roll
      const rolls = []
      let sum = 0
      for (let i = 0; i < rollData.diceCount; i++) {
        const r = Math.floor(Math.random() * rollData.diceType) + 1
        rolls.push(r)
        sum += r
      }
      
      const total = sum + rollData.modifier
      
      setRollData((prev) => ({
        ...prev,
        isRolling: false,
        results: rolls,
        total
      }))
      
      setCurrentNum(rolls[0])

      // If natural 20 or critical success on d20, trigger custom effects
      if (rollData.diceType === 20 && rolls.includes(20)) {
        // Dispatch Black Flash event!
        const kokusenEvent = new CustomEvent('trigger-kokusen', { detail: { title: rollData.title } })
        window.dispatchEvent(kokusenEvent)
        
        // Trigger shake
        document.body.classList.add('animate-shake')
        setTimeout(() => {
          document.body.classList.remove('animate-shake')
        }, 800)
      }
    }, 1200)

    return () => {
      clearInterval(interval)
      clearTimeout(timer)
    }
  }, [rollData?.isRolling])

  const getDieShape = () => {
    // Standard D20 SVG path
    return (
      <svg className="w-32 h-32 text-cursed drop-shadow-[0_0_15px_var(--cursed-color)]" viewBox="0 0 100 100" fill="currentColor">
        <polygon points="50,5 95,28 95,72 50,95 5,72 5,28" fill="none" stroke="currentColor" strokeWidth="3" />
        <polygon points="50,5 50,95" fill="none" stroke="currentColor" strokeWidth="2" />
        <polygon points="5,28 95,28" fill="none" stroke="currentColor" strokeWidth="2" />
        <polygon points="5,72 95,72" fill="none" stroke="currentColor" strokeWidth="2" />
        <polygon points="50,38 95,28 50,5 5,28" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <polygon points="50,62 95,72 50,95 5,72" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <polygon points="50,38 50,62" fill="none" stroke="currentColor" strokeWidth="2" />
        <polygon points="50,38 95,72" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <polygon points="50,38 5,72" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <polygon points="50,62 95,28" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <polygon points="50,62 5,28" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }

  const handleClose = () => {
    setRollData(null)
  }

  return (
    <AnimatePresence>
      {rollData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md cursor-pointer"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 30 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            className="w-full max-w-lg bg-neutral-950 border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6 text-center cursor-default"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 40px var(--cursed-color)1e'
            }}
          >
            {/* Header */}
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                {rollData.title}
              </span>
              <h3 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mt-1">
                Conjuração de Dados ({rollData.formula})
              </h3>
            </div>

            {/* Virtual Die */}
            <div className="relative flex items-center justify-center py-4 w-full">
              <motion.div
                animate={
                  rollData.isRolling
                    ? {
                        rotate: [0, 360, 720, 1080],
                        scale: [1, 1.15, 0.95, 1],
                        y: [0, -15, 10, 0]
                      }
                    : {
                        rotate: 0,
                        scale: rollData.results.includes(20) ? [1, 1.25, 1.2] : 1
                      }
                }
                transition={{
                  duration: rollData.isRolling ? 1.2 : 0.4,
                  ease: "easeInOut"
                }}
                className="relative"
              >
                {getDieShape()}
                <div className="absolute inset-0 flex items-center justify-center font-jujutsu text-4xl font-extrabold text-white select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  {currentNum}
                </div>
              </motion.div>

              {/* Dynamic Aura Effects during roll or on natural 20 */}
              {rollData.isRolling && (
                <div className="absolute inset-0 w-48 h-48 m-auto pointer-events-none rounded-full filter blur-xl animate-pulse"
                     style={{ background: 'radial-gradient(circle, var(--cursed-color) 0%, transparent 70%)', opacity: 0.35 }} />
              )}
            </div>

            {/* Results display */}
            <AnimatePresence mode="wait">
              {rollData.isRolling ? (
                <motion.div
                  key="rolling"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="h-20 flex flex-col justify-center"
                >
                  <p className="text-gray-400 text-sm tracking-wider uppercase font-semibold animate-pulse flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" /> Canalizando Energia Amaldiçoada...
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-2 h-20"
                >
                  {/* Natural 20 / 1 highlights */}
                  {rollData.diceType === 20 && rollData.results.includes(20) && (
                    <span className="px-3 py-1 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 font-extrabold text-[10px] uppercase tracking-widest shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-red-400" /> SUCESSO CRÍTICO (KOKUSEN!)
                    </span>
                  )}
                  {rollData.diceType === 20 && rollData.results.includes(1) && (
                    <span className="px-3 py-1 rounded-full bg-neutral-900 border border-red-900/40 text-red-700 font-extrabold text-[10px] uppercase tracking-widest flex items-center gap-1">
                      <Skull className="w-3.5 h-3.5 text-red-700" /> FALHA CRÍTICA
                    </span>
                  )}

                  <div className="text-5xl font-black text-white tracking-tight drop-shadow-[0_0_15px_var(--cursed-color)55]">
                    {rollData.total}
                  </div>

                  <div className="text-xs text-gray-500 font-medium">
                    Breakdown: (
                    <span className="text-gray-300 font-bold">
                      {rollData.results.join(' + ')}
                    </span>
                    ) 
                    {rollData.modifier >= 0 ? ' + ' : ' - '}
                    <span className="text-gray-300 font-bold">
                      {Math.abs(rollData.modifier)}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <button
              onClick={handleClose}
              className="mt-2 w-full py-3.5 rounded-xl border border-white/10 text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
            >
              Fechar Rolagem
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
