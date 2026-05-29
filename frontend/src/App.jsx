import { useState, useEffect } from 'react'
import axios from 'axios'
import LandingView from './views/LandingView'
import LoginView from './views/LoginView'
import RegisterView from './views/RegisterView'
import LobbyView from './views/LobbyView'
import CreateCharacterView from './views/CreateCharacterView'
import FichaView from './views/FichaView'
import ToastContainer from './components/ToastContainer'
import ConfirmModalContainer from './components/ConfirmModalContainer'
import DiceRoller from './components/DiceRoller'
import JJKAnimationOverlay from './components/JJKAnimationOverlay'
import CursedBackground from './components/CursedBackground'
import { updateCursedColor } from './utils/theme'
import { Sparkles, Smartphone, Download, Share2, X as CloseIcon } from 'lucide-react'
import { motion } from 'framer-motion'

// Expose updateCursedColor globally to let individual views call it directly
if (typeof window !== 'undefined') {
  window.updateCursedColor = updateCursedColor
}

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [authStatus, setAuthStatus] = useState({
    authenticated: false,
    user_id: null,
    username: '',
    role: '',
    character_id: null,
    character_nome: null,
    lobby_id: null,
    loading: true
  })

  const [isIOS] = useState(() => {
    if (typeof navigator === 'undefined') return false
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
  })

  const [showInstallPrompt, setShowInstallPrompt] = useState(() => {
    if (typeof window === 'undefined') return false
    const dismissed = localStorage.getItem('jjk_pwa_dismissed') === 'true'
    if (dismissed) return false
    const iosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    const standaloneMode = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches
    const isMobileSize = window.innerWidth <= 768
    return !!(iosDevice && !standaloneMode && isMobileSize)
  })

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      const dismissed = localStorage.getItem('jjk_pwa_dismissed')
      if (!dismissed) {
        setShowInstallPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        localStorage.setItem('jjk_pwa_dismissed', 'true')
      }
      setDeferredPrompt(null)
      setShowInstallPrompt(false)
    }
  }

  const handleDismissPrompt = () => {
    localStorage.setItem('jjk_pwa_dismissed', 'true')
    setShowInstallPrompt(false)
  }

  const reloadAuth = async () => {
    try {
      const response = await axios.get('/api/auth/status')
      setAuthStatus({
        authenticated: response.data.authenticated,
        user_id: response.data.user_id || null,
        username: response.data.username || '',
        role: response.data.role || '',
        character_id: response.data.character_id || null,
        character_nome: response.data.character_nome || null,
        lobby_id: response.data.lobby_id || null,
        loading: false
      })
    } catch (err) {
      console.error("Erro ao verificar autenticação:", err)
      setAuthStatus(prev => ({ ...prev, loading: false }))
    }
  }

  // Set default theme details on startup
  useEffect(() => {
    updateCursedColor('#8a2be2') // Purple as starting default JJK theme color
    setTimeout(() => {
      reloadAuth()
    }, 0)

    // Handle browser navigation (back/forward keys)
    const handlePopState = () => {
      setPath(window.location.pathname)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Custom navigate function that updates history state without reloading the browser
  const navigate = (newPath) => {
    window.history.pushState({}, '', newPath)
    setPath(newPath)
  }

  // Automatic routing locks (guards)
  useEffect(() => {
    if (authStatus.loading) return

    const publicPaths = ['/', '/login', '/register']
    const isPublic = publicPaths.includes(path)

    if (!authStatus.authenticated && !isPublic) {
      // Redirect unauthenticated players to login
      setTimeout(() => navigate('/login'), 0)
    } else if (authStatus.authenticated && (path === '/login' || path === '/register')) {
      // Redirect already logged in players back to the lobby
      setTimeout(() => navigate('/lobby'), 0)
    }
  }, [path, authStatus.authenticated, authStatus.loading])

  // Premium loading bar screen
  if (authStatus.loading) {
    return (
      <div className="min-h-screen bg-[#060606] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Deep shadows */}
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{
            background: 'radial-gradient(circle, rgba(138, 43, 226, 0.08) 0%, rgba(0,0,0,1) 80%)'
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-4 text-center">
          <div 
            className="w-16 h-16 rounded-2xl border flex items-center justify-center select-none bg-neutral-950/80 animate-pulse"
            style={{ 
              borderColor: 'var(--cursed-color, #8a2be2)',
              boxShadow: '0 0 25px var(--cursed-color, #8a2be2)'
            }}
          >
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-xl font-bold font-jujutsu bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent uppercase tracking-widest">
            Barreira Expansiva
          </h2>
          <p className="text-[10px] text-gray-500 font-sans tracking-widest uppercase animate-pulse">
            Canalizando energia do domínio inato...
          </p>
        </div>
      </div>
    )
  }

  // Routing coordinator
  const renderView = () => {
    // Exact match views
    if (path === '/') {
      return <LandingView authStatus={authStatus} navigate={navigate} />
    }
    if (path === '/login') {
      return <LoginView reloadAuth={reloadAuth} navigate={navigate} />
    }
    if (path === '/register') {
      return <RegisterView navigate={navigate} />
    }
    if (path === '/lobby') {
      return <LobbyView authStatus={authStatus} reloadAuth={reloadAuth} navigate={navigate} />
    }
    if (path === '/create_character') {
      return <CreateCharacterView navigate={navigate} />
    }

    // Dynamic character sheet router: `/ficha/:id`
    const fichaMatch = path.match(/^\/ficha\/(\d+)$/)
    if (fichaMatch) {
      const characterId = fichaMatch[1]
      return (
        <FichaView 
          characterId={characterId} 
          authStatus={authStatus} 
          reloadAuth={reloadAuth} 
          navigate={navigate} 
        />
      )
    }

    // Standard fallback fallback
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-4xl font-extrabold font-jujutsu text-white">404</h2>
        <p className="text-sm text-gray-400 mt-2 font-sans">Barreira Amaldiçoada corrompeu esta localização.</p>
        <button 
          onClick={() => navigate('/')} 
          className="mt-6 px-6 py-2.5 rounded-xl bg-purple-900 border border-purple-500 text-xs font-bold uppercase text-white cursor-pointer"
        >
          Retornar para o Início
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Dynamic Animated Nebula Background */}
      <CursedBackground />

      {/* Renders the actual matched view */}
      <main className="relative z-10 w-full min-h-screen">
        {renderView()}
      </main>

      {/* Global Interactive Elements */}
      <ToastContainer />
      <ConfirmModalContainer />
      <DiceRoller />
      <JJKAnimationOverlay />

      {/* Custom Jujutsu PWA Mobile Install Card Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[99999] font-sans">
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="glass-card rounded-2xl p-5 border border-purple-500/30 shadow-2xl relative overflow-hidden bg-neutral-950/95"
            style={{
              boxShadow: '0 15px 40px rgba(0,0,0,0.8), 0 0 25px rgba(138, 43, 226, 0.15)'
            }}
          >
            {/* Ambient Aura Background */}
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-purple-600/10 filter blur-xl animate-pulse pointer-events-none" />

            <div className="flex justify-between items-start gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-950/40 border border-purple-500/20 text-purple-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[9px] text-purple-300 font-extrabold uppercase tracking-widest">EXPANSÃO MÓVEL</span>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Instalar Jujutsu RPG</h4>
                </div>
              </div>
              <button 
                onClick={handleDismissPrompt} 
                className="text-gray-500 hover:text-white p-1 transition-all cursor-pointer rounded-lg hover:bg-white/5"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 text-left">
              <p className="text-[10px] text-gray-400 leading-relaxed font-sans">
                {isIOS 
                  ? "Sintonize sua energia Jujutsu adicionando o app a sua tela inicial. Toque no botao de Compartilhar no Safari e selecione 'Adicionar a Tela de Inico'." 
                  : "Deseja instalar este grimorio de combate como um aplicativo em sua tela inicial para acesso instantaneo?"
                }
              </p>
            </div>

            <div className="mt-4 flex items-center gap-2.5">
              {!isIOS ? (
                <>
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 py-2 rounded-xl text-white font-extrabold text-[10px] uppercase tracking-wider transition-all active:scale-[0.97] cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                    style={{ backgroundColor: 'var(--cursed-color, #8a2be2)' }}
                  >
                    <Download className="w-3.5 h-3.5" /> Instalar App
                  </button>
                  <button
                    onClick={handleDismissPrompt}
                    className="px-4 py-2 rounded-xl bg-neutral-900 border border-white/5 hover:bg-neutral-800 text-gray-400 hover:text-white font-extrabold text-[10px] uppercase tracking-wider transition-all active:scale-[0.97] cursor-pointer"
                  >
                    Depois
                  </button>
                </>
              ) : (
                <button
                  onClick={handleDismissPrompt}
                  className="w-full py-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-purple-300 hover:text-white font-extrabold text-[10px] uppercase tracking-widest transition-all active:scale-[0.97] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5 text-purple-400 animate-bounce" /> Entendido
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}

export default App
