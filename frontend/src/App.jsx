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
import { Sparkles } from 'lucide-react'

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
    reloadAuth()

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
      navigate('/login')
    } else if (authStatus.authenticated && (path === '/login' || path === '/register')) {
      // Redirect already logged in players back to the lobby
      navigate('/lobby')
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
    </>
  )
}

export default App
