import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { showCursedToast } from '../utils/toast'
import { 
  Map, 
  RefreshCw, 
  Key, 
  Copy, 
  X, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  Home, 
  ArrowRight, 
  ExternalLink, 
  Globe 
} from 'lucide-react'

// Helper: Translate a public external URL to local proxied path
const toProxyPath = (urlStr) => {
  if (!urlStr) return '';
  if (urlStr.startsWith('/') && !urlStr.startsWith('//')) {
    return urlStr;
  }
  let cleanUrl = urlStr.trim();
  if (cleanUrl.startsWith('https://')) {
    cleanUrl = cleanUrl.substring(8);
  } else if (cleanUrl.startsWith('http://')) {
    cleanUrl = cleanUrl.substring(7);
  } else if (cleanUrl.startsWith('//')) {
    cleanUrl = cleanUrl.substring(2);
  }
  
  if (cleanUrl.startsWith('www.owlbear.rodeo/')) {
    return '/' + cleanUrl.substring(17);
  }
  if (cleanUrl.startsWith('owlbear.rodeo/')) {
    return '/' + cleanUrl.substring(14);
  }
  return `/proxy/owlbear/${cleanUrl}`;
};

// Helper: Translate a local proxied path to clean public external URL
const toCleanPublicUrl = (pathStr) => {
  if (!pathStr) return '';
  if (pathStr.startsWith('http://') || pathStr.startsWith('https://')) {
    return pathStr;
  }
  if (pathStr.startsWith('/proxy/owlbear/')) {
    const remaining = pathStr.substring(15);
    return `https://${remaining}`;
  }
  if (pathStr.startsWith('/room/')) {
    return `https://www.owlbear.rodeo${pathStr}`;
  }
  if (pathStr.startsWith('/sign-up')) {
    return `https://www.owlbear.rodeo/sign-up`;
  }
  if (pathStr.startsWith('/manifest.json')) {
    return `https://www.owlbear.rodeo/manifest.json`;
  }
  return `https://www.owlbear.rodeo${pathStr.startsWith('/') ? '' : '/'}${pathStr}`;
};

export default function JJKVTT({ lobbyData, isMaster, fetchLobbyData, authStatus }) {
  const isSyncing = useRef(false)
  const [owlbearUrl, setOwlbearUrl] = useState('https://www.owlbear.rodeo')
  const [showModal, setShowModal] = useState(false)
  const [manualToken, setManualToken] = useState('')

  // Browser States (Lazily initialized to avoid synchronous state-updates in effects)
  const iframeRef = useRef(null)
  const [currentIframeSrc, setCurrentIframeSrc] = useState(() => toProxyPath('https://www.owlbear.rodeo'))
  const [addressBarInput, setAddressBarInput] = useState(() => toCleanPublicUrl(toProxyPath('https://www.owlbear.rodeo')))
  const [isLoading, setIsLoading] = useState(false)
  const [historyStack, setHistoryStack] = useState(() => [toProxyPath('https://www.owlbear.rodeo')])
  const [historyIndex, setHistoryIndex] = useState(0)
  const isInternalNavigation = useRef(false)

  // Bookmarklet code for sintonizing session from owlbear.rodeo
  const bookmarkletCode = `javascript:(function(){let k=Object.keys(localStorage).find(x=>x.startsWith('sb-')&&x.endsWith('-auth-token'));if(!k){alert('Erro: Token do Owlbear nao encontrado. Certifique-se de estar logado no owlbear.rodeo!');return;}let v=localStorage.getItem(k);fetch('${window.location.origin}/api/import_token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:k,value:v,user_id:${authStatus?.user_id || 'null'}})}).then(r=>r.json()).then(d=>{alert('Arena Sintonizada com sucesso!');}).catch(e=>alert('Erro ao sintonizar: '+e));})();`;

  // Synchronize state from Lobby GET response (asynchronous via timeout to avoid React effect cycle warnings)
  useEffect(() => {
    if (lobbyData?.vtt_state && !isSyncing.current) {
      const state = lobbyData.vtt_state
      if (state.owlbearUrl && state.owlbearUrl !== owlbearUrl) {
        setTimeout(() => {
          setOwlbearUrl(state.owlbearUrl)
          // If we haven't loaded any URL yet, initialize it
          if (!currentIframeSrc) {
            const pPath = toProxyPath(state.owlbearUrl)
            setCurrentIframeSrc(pPath)
            setAddressBarInput(toCleanPublicUrl(pPath))
            setHistoryStack([pPath])
            setHistoryIndex(0)
          }
        }, 0)
      }
    }
  }, [lobbyData, owlbearUrl, currentIframeSrc])

  // Auto-scan browser token on mount to immediately import their credentials seamlessly!
  useEffect(() => {
    const performAutoScan = async () => {
      try {
        const response = await axios.post('/api/scan_local_token')
        if (response.data?.found) {
          showCursedToast("Arena Sintonizada", "Portal espiritual sintonizado automaticamente com o login do seu navegador!", "success")
          handleReload()
        }
      } catch (err) {
        console.warn("Auto-scan local token failed:", err)
      }
    }
    
    // Give the iframe 1.5s to mount and begin loading before sintonizing
    const timer = setTimeout(performAutoScan, 1500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save VTT State to backend
  const saveVTTState = async (url = owlbearUrl) => {
    if (!lobbyData?.lobby?.codigo) return
    isSyncing.current = true
    try {
      const state = {
        owlbearUrl: url
      }
      await axios.post('/lobby/vtt/update', state)
    } catch (err) {
      console.error('Error updating VTT status:', err)
    } finally {
      isSyncing.current = false
    }
  }

  const handleSync = () => {
    saveVTTState(owlbearUrl)
    showCursedToast("Arena Sintonizada", "O link do Owlbear Rodeo foi sincronizado com sucesso.", "success")
  }

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode)
    showCursedToast("Codigo Copiado", "O codigo de sintonizacao foi copiado para a area de transferencia.", "success")
  }

  const handleManualImport = async () => {
    if (!manualToken.trim()) {
      showCursedToast("Erro", "Por favor, cole um token valido.", "error")
      return
    }
    try {
      let key = "sb-emhrsjcofcbqxuaptqpp-auth-token"
      let value = manualToken.trim()
      
      try {
        const parsed = JSON.parse(value)
        if (parsed.key && parsed.value) {
          key = parsed.key
          value = typeof parsed.value === 'string' ? parsed.value : JSON.stringify(parsed.value)
        } else if (parsed.access_token) {
          value = JSON.stringify(parsed)
        }
      } catch {
        // ignore
      }

      await axios.post('/api/import_token', { key, value, user_id: authStatus?.user_id })
      showCursedToast("Arena Sintonizada", "Seu login do Owlbear foi importado com sucesso. Recarregando arena...", "success")
      setShowModal(false)
      setManualToken('')
      fetchLobbyData(true)
      handleReload()
    } catch (err) {
      showCursedToast("Erro", "Erro ao importar token: " + err.message, "error")
    }
  }

  // Browser Navigation Actions
  const handleBack = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1
      setHistoryIndex(nextIndex)
      const prevSrc = historyStack[nextIndex]
      setIsLoading(true)
      if (iframeRef.current) {
        iframeRef.current.src = prevSrc
      }
      setCurrentIframeSrc(prevSrc)
      setAddressBarInput(toCleanPublicUrl(prevSrc))
    }
  }

  const handleForward = () => {
    if (historyIndex < historyStack.length - 1) {
      const nextIndex = historyIndex + 1
      setHistoryIndex(nextIndex)
      const nextSrc = historyStack[nextIndex]
      setIsLoading(true)
      if (iframeRef.current) {
        iframeRef.current.src = nextSrc
      }
      setCurrentIframeSrc(nextSrc)
      setAddressBarInput(toCleanPublicUrl(nextSrc))
    }
  }

  // Declared as hoisted function statement to allow safe access from useEffect auto-scan on mount
  function handleReload() {
    setIsLoading(true)
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow.location.reload()
      } catch {
        // Fallback in case of sandboxing or reload blocking
        iframeRef.current.src = currentIframeSrc
      }
    }
  }

  const handleHome = () => {
    setIsLoading(true)
    const homeProxyPath = toProxyPath(owlbearUrl)
    if (iframeRef.current) {
      iframeRef.current.src = homeProxyPath
    }
    setCurrentIframeSrc(homeProxyPath)
    setAddressBarInput(toCleanPublicUrl(homeProxyPath))

    // Add to history stack
    const nextStack = historyStack.slice(0, historyIndex + 1)
    nextStack.push(homeProxyPath)
    setHistoryStack(nextStack)
    setHistoryIndex(nextStack.length - 1)
  }

  const handleNavigateAddress = (e) => {
    if (e) e.preventDefault()
    if (!addressBarInput.trim()) return

    let target = addressBarInput.trim()
    if (!target.startsWith('http://') && !target.startsWith('https://') && !target.startsWith('/')) {
      target = 'https://' + target
    }

    const proxyPath = toProxyPath(target)
    setIsLoading(true)
    if (iframeRef.current) {
      iframeRef.current.src = proxyPath
    }
    setCurrentIframeSrc(proxyPath)
    setAddressBarInput(toCleanPublicUrl(proxyPath))

    // Add to history stack
    const nextStack = historyStack.slice(0, historyIndex + 1)
    nextStack.push(proxyPath)
    setHistoryStack(nextStack)
    setHistoryIndex(nextStack.length - 1)
  }

  const navigateIframe = (url) => {
    setIsLoading(true)
    const proxyPath = toProxyPath(url)
    if (iframeRef.current) {
      iframeRef.current.src = proxyPath
    }
    setCurrentIframeSrc(proxyPath)
    setAddressBarInput(toCleanPublicUrl(proxyPath))

    // Add to history stack
    const nextStack = historyStack.slice(0, historyIndex + 1)
    nextStack.push(proxyPath)
    setHistoryStack(nextStack)
    setHistoryIndex(nextStack.length - 1)
  }

  // Callback when iframe finishes loading a page (tracks internal redirects & same-origin clicks)
  const handleIframeLoad = () => {
    setIsLoading(false)
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const loc = iframeRef.current.contentWindow.location
        const relativePath = loc.pathname + loc.search + loc.hash
        
        if (relativePath && relativePath !== currentIframeSrc && relativePath !== 'about:blank') {
          isInternalNavigation.current = true
          setCurrentIframeSrc(relativePath)
          setAddressBarInput(toCleanPublicUrl(relativePath))

          // Append to custom history stack
          const nextStack = historyStack.slice(0, historyIndex + 1)
          nextStack.push(relativePath)
          setHistoryStack(nextStack)
          setHistoryIndex(nextStack.length - 1)
        }
      }
    } catch (err) {
      // Suppress cross-origin warnings if we browse to external domains briefly
      console.warn("Iframe same-origin check bypassed/failed:", err)
    }
  }

  return (
    <div className="w-full h-full flex flex-col gap-2 items-stretch font-sans text-left relative z-20 overflow-hidden">
      
      {/* Compact & Combined Single Row VTT Toolbox Bar */}
      <div className="w-full bg-neutral-950/80 border border-white/10 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xl shrink-0">
        
        {/* Left Side: Title & Navigation Group */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-black text-white font-jujutsu tracking-widest uppercase flex items-center gap-2">
            <Map className="w-4 h-4 text-purple-400 animate-pulse" /> Campo de Batalha (Owlbear Rodeo)
          </span>
          
          <div className="h-4 w-px bg-white/10" />
          
          {/* Navigation Controls Group */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleBack}
              disabled={historyIndex <= 0}
              className="p-1.5 bg-neutral-900 border border-white/5 hover:border-white/10 hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-neutral-900 disabled:hover:border-white/5 text-gray-400 hover:text-white rounded-lg cursor-pointer disabled:cursor-not-allowed transition-all"
              title="Voltar"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            
            <button
              onClick={handleForward}
              disabled={historyIndex >= historyStack.length - 1}
              className="p-1.5 bg-neutral-900 border border-white/5 hover:border-white/10 hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-neutral-900 disabled:hover:border-white/5 text-gray-400 hover:text-white rounded-lg cursor-pointer disabled:cursor-not-allowed transition-all"
              title="Avançar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            
            <button
              onClick={handleReload}
              className="p-1.5 bg-neutral-900 border border-white/5 hover:border-white/10 hover:bg-neutral-800 text-gray-400 hover:text-white rounded-lg cursor-pointer transition-all"
              title="Atualizar"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
            
            <button
              onClick={handleHome}
              className="p-1.5 bg-neutral-900 border border-white/5 hover:border-white/10 hover:bg-neutral-800 text-gray-400 hover:text-white rounded-lg cursor-pointer transition-all"
              title="Página Inicial (Sala Sincronizada)"
            >
              <Home className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Side: Master controls, Sync & External Link */}
        <div className="flex items-center gap-3">
          {isMaster && (
            <div className="flex items-center gap-1.5 bg-neutral-900/60 border border-white/5 px-2.5 py-1.5 rounded-xl">
              <span className="text-[8px] text-gray-400 font-extrabold uppercase tracking-wider shrink-0">URL da Sala:</span>
              <input
                type="text"
                placeholder="Cole o link da sala..."
                value={owlbearUrl}
                onChange={(e) => setOwlbearUrl(e.target.value)}
                className="px-2.5 py-1 rounded bg-neutral-950 border border-white/10 text-white text-[9px] w-64 focus:outline-none"
              />
              <button
                onClick={handleSync}
                className="px-2 py-1 bg-purple-700 hover:bg-purple-600 border-0 text-white font-extrabold text-[9px] rounded cursor-pointer transition-all"
              >
                Sintonizar
              </button>
            </div>
          )}

          <button
            onClick={() => fetchLobbyData(true)}
            className="p-2 bg-neutral-900 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white rounded-xl cursor-pointer transition-all"
            title="Sincronizar Manualmente"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          
          <a
            href={toCleanPublicUrl(currentIframeSrc)}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-neutral-900 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white rounded-xl cursor-pointer transition-all shrink-0"
            title="Abrir em Nova Aba"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Embedded Owlbear Rodeo Room Viewport taking 100% width and remaining height */}
      <div className="w-full flex-1 min-h-0 bg-[#05040a] rounded-3xl border border-purple-500/20 shadow-2xl relative overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.15)]">
        {currentIframeSrc ? (
          <iframe
            ref={iframeRef}
            src={currentIframeSrc}
            onLoad={handleIframeLoad}
            title="Owlbear Rodeo VTT"
            className="w-full h-full border-0"
            allow="autoplay; camera; microphone; fullscreen; clipboard-read; clipboard-write; picture-in-picture"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
            <span className="text-xs uppercase tracking-widest font-mono">Conectando ao Campo de Batalha...</span>
          </div>
        )}
      </div>

      {/* Sintonize Portal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-neutral-950 border border-purple-500/30 rounded-3xl p-6 shadow-[0_0_50px_rgba(168,85,247,0.2)] flex flex-col gap-5 text-left relative overflow-hidden">
            
            {/* Ambient Purple Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" /> Sintonizar Portal Espiritual (Owlbear)
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-500 hover:text-white bg-transparent border-0 cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-gray-300 leading-relaxed flex flex-col gap-3">
              <p>
                Para conectar perfeitamente sua presenca espiritual no mapa de batalha sem loops de login ou bloqueios, sintonize a sessao do seu navegador.
              </p>

              <div className="bg-neutral-950/80 border border-purple-500/25 p-3 rounded-2xl flex flex-col gap-1 text-purple-300">
                <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Login Nativo e Direto
                </span>
                <p className="text-[10px] leading-relaxed text-gray-400">
                  Agora você pode fazer <b>Login com o Google ou Apple</b> diretamente dentro do próprio sistema de Arena, sem precisar abrir abas externas! Caso já esteja logado ou prefira sintonizar de outra forma, use os métodos abaixo.
                </p>
              </div>
              
              <div className="bg-neutral-900/80 border border-purple-500/15 p-4 rounded-2xl flex flex-col gap-2.5">
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Metodo 1: Copiar Codigo de Sintonizacao (Recomendado)</span>
                <p className="text-[11px] text-gray-400">
                  Abra o Owlbear Rodeo no seu navegador e certifique-se de estar logado. Abra o Console do Navegador (F12 ou Ctrl+Shift+I), cole o codigo de sintonizacao abaixo e aperte Enter.
                </p>
                <button
                  onClick={handleCopyBookmarklet}
                  className="w-full py-2 bg-purple-800 hover:bg-purple-700 border-0 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar Codigo de Sintonizacao
                </button>
              </div>

              <div className="bg-neutral-900/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-2.5">
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Metodo 2: Colar Token Supabase Manualmente</span>
                <p className="text-[11px] text-gray-400">
                  Se preferir, cole o valor da chave "sb-*-auth-token" do seu Local Storage ou o JSON completo do token do Supabase abaixo:
                </p>
                <textarea
                  rows="3"
                  placeholder='Cole o JSON da sessao ou token de autenticacao...'
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-neutral-950 border border-white/10 text-white text-[10px] font-mono focus:outline-none focus:border-purple-500/40 resize-none"
                />
                <button
                  onClick={handleManualImport}
                  className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-white hover:text-purple-300 font-bold text-xs rounded-xl cursor-pointer transition-all"
                >
                  Confirmar Importacao Manual
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-white/5">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/5 text-gray-400 hover:text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
