import { useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { showCursedToast } from '../utils/toast'
import { ArrowLeft, Flame } from 'lucide-react'

export default function LoginView({ reloadAuth, navigate }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      showCursedToast("Dados Incompletos", "Por favor, digite usuário e senha.", "warning")
      return
    }

    setLoading(true)
    try {
      const response = await axios.post('/login', { username, password }, {
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
      })
      
      showCursedToast("Acesso Autorizado", "Mente sintonizada com sucesso!", "success")
      
      // Reload current auth state
      await reloadAuth()
      
      // Navigate to lobby
      navigate('/lobby')
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Erro ao fazer login. Verifique suas credenciais."
      showCursedToast("Falha na Sintonia", errorMsg, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative z-20">
      
      {/* Back button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-sm text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para Início
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="w-full max-w-md bg-neutral-950/80 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 30px var(--cursed-color)15'
        }}
      >
        <div className="flex flex-col items-center gap-2 mb-8 text-center">
          <Flame className="w-10 h-10 text-purple-500 filter drop-shadow-[0_0_8px_var(--cursed-color)] animate-pulse" />
          <h2 className="text-2xl font-bold font-jujutsu bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-wide">
            Sintonia Feiticeira
          </h2>
          <p className="text-xs text-gray-500 font-sans">
            Insira suas credenciais para canalizar sua energia no RPG.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-purple-300 font-extrabold uppercase tracking-widest font-sans">
              Usuário (Nome do Feiticeiro)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite seu usuário..."
              className="w-full px-4 py-3 rounded-xl text-sm font-sans focus:outline-none"
              disabled={loading}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] text-purple-300 font-extrabold uppercase tracking-widest font-sans">
              Senha Inata
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha..."
              className="w-full px-4 py-3 rounded-xl text-sm font-sans focus:outline-none"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 rounded-xl text-white font-bold text-xs uppercase tracking-widest active:scale-95 transition-all cursor-pointer font-sans"
            style={{
              backgroundColor: 'var(--cursed-color)',
              boxShadow: '0 0 15px var(--cursed-color)'
            }}
          >
            {loading ? "Canalizando Sintonia..." : "Sintonizar Mente"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-gray-500 font-sans">
          Ainda não é registrado?{" "}
          <button 
            onClick={() => navigate('/register')}
            className="text-purple-400 font-bold hover:text-purple-300 transition-colors cursor-pointer"
          >
            Registrar-se agora
          </button>
        </div>
      </motion.div>
    </div>
  )
}
