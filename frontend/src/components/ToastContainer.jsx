import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Swords, Skull, AlertTriangle, Scroll, Sparkles } from 'lucide-react'

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handleToast = (e) => {
      const { id, title, message, type, duration } = e.detail
      setToasts((prev) => [...prev, { id, title, message, type }])

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }

    window.addEventListener('cursed-toast', handleToast)
    return () => window.removeEventListener('cursed-toast', handleToast)
  }, [])

  const getIcon = (type) => {
    if (type === 'success') return <Swords className="w-4 h-4 text-emerald-400" />
    if (type === 'error') return <Skull className="w-4 h-4 text-red-500" />
    if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500" />
    if (type === 'info') return <Scroll className="w-4 h-4 text-blue-400" />
    return <Sparkles className="w-4 h-4 text-purple-400" />
  }

  const getAccentColor = (type) => {
    if (type === 'success') return '#10b981'
    if (type === 'error') return '#ef4444'
    if (type === 'warning') return '#f59e0b'
    if (type === 'info') return '#3b82f6'
    return 'var(--cursed-color, #8a2be2)'
  }

  return (
    <div className="fixed bottom-8 right-8 z-[9999] flex flex-col gap-3 w-96 max-w-[calc(100vw-4rem)] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.2 } }}
            layout
            className="pointer-events-auto relative overflow-hidden bg-black/90 backdrop-blur-xl border border-white/5 rounded-2xl p-4 flex flex-col gap-1 shadow-2xl pl-6"
            style={{
              borderLeft: `5px solid ${getAccentColor(toast.type)}`,
              boxShadow: `0 15px 35px rgba(0, 0, 0, 0.6), 0 0 15px ${getAccentColor(toast.type)}1a`
            }}
          >
            <div className="flex items-center gap-2 font-jujutsu text-sm font-bold text-white uppercase tracking-wider">
              <span>{getIcon(toast.type)}</span>
              <span>{toast.title}</span>
            </div>
            <div 
              className="text-xs text-gray-300 leading-relaxed font-sans whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: toast.message }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
