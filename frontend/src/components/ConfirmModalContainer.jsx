import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmModalContainer() {
  const [modal, setModal] = useState(null) // { question, subtext, resolve }

  useEffect(() => {
    const handleShow = (e) => {
      const { question, subtext, resolve } = e.detail
      setModal({ question, subtext, resolve })
    }

    window.addEventListener('show-confirm', handleShow)
    return () => window.removeEventListener('show-confirm', handleShow)
  }, [])

  const handleResolve = (value) => {
    if (modal) {
      modal.resolve(value)
      setModal(null)
    }
  }

  return (
    <AnimatePresence>
      {modal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => handleResolve(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="w-full max-w-md bg-neutral-950 border-2 border-cursed/50 rounded-3xl p-6 shadow-2xl flex flex-col gap-6"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: '0 25px 50px rgba(0,0,0,0.8), 0 0 30px var(--cursed-color, #8a2be2)33'
            }}
          >
            <div className="flex flex-col items-center text-center gap-3">
              <AlertTriangle className="w-12 h-12 text-amber-500 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-bounce" />
              <h3 className="text-white font-extrabold text-lg leading-tight">
                {modal.question}
              </h3>
              {modal.subtext && (
                <p className="text-gray-400 text-sm leading-relaxed">
                  {modal.subtext}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleResolve(false)}
                className="py-3.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-bold text-xs uppercase tracking-widest hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleResolve(true)}
                className="py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--cursed-color, #8a2be2)',
                  boxShadow: '0 0 12px var(--cursed-color, #8a2be2)'
                }}
              >
                Confirmar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
