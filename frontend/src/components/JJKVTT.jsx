import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { showCursedToast } from '../utils/toast'
import { 
  Map, RefreshCw, Key, Copy, X, Sparkles,
  ChevronLeft, ChevronRight, RotateCw, Home,
  ExternalLink, Globe, Plus, Star
} from 'lucide-react'

// ── DEFAULT TABS ──
const DEFAULT_TABS = [
  { id: 1, title: 'Owlbear Rodeo', url: 'https://www.owlbear.rodeo', pinned: true }
]

let tabIdCounter = 2

export default function JJKVTT({ lobbyData, isMaster, fetchLobbyData, authStatus }) {
  const isSyncing = useRef(false)
  const [owlbearUrl, setOwlbearUrl] = useState('https://www.owlbear.rodeo')
  const [showModal, setShowModal] = useState(false)
  const [manualToken, setManualToken] = useState('')

  // ── TAB SYSTEM ──
  const [tabs, setTabs] = useState(DEFAULT_TABS)
  const [activeTabId, setActiveTabId] = useState(1)
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]

  // ── BROWSER STATES ──
  const iframeRef = useRef(null)
  const [addressBarInput, setAddressBarInput] = useState('https://www.owlbear.rodeo')
  const [isLoading, setIsLoading] = useState(false)
  const [historyStack, setHistoryStack] = useState(['https://www.owlbear.rodeo'])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Bookmarklet code
  const bookmarkletCode = `javascript:(function(){let k=Object.keys(localStorage).find(x=>x.startsWith('sb-')&&x.endsWith('-auth-token'));if(!k){alert('Token do Owlbear não encontrado. Certifique-se de estar logado!');return;}let v=localStorage.getItem(k);fetch('${window.location.origin}/api/import_token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:k,value:v,user_id:${authStatus?.user_id || 'null'}})}).then(r=>r.json()).then(d=>{alert('Arena Sintonizada com sucesso!');}).catch(e=>alert('Erro: '+e));})();`

  // Sync lobby data
  useEffect(() => {
    if (lobbyData?.vtt_state?.owlbearUrl && !isSyncing.current) {
      const u = lobbyData.vtt_state.owlbearUrl
      if (u !== owlbearUrl) {
        setOwlbearUrl(u)
      }
    }
  }, [lobbyData, owlbearUrl])

  // ── TAB ACTIONS ──
  const addTab = (url = 'https://www.owlbear.rodeo') => {
    const newTab = { id: tabIdCounter++, title: 'Nova Aba', url }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
    setAddressBarInput(url)
    setHistoryStack([url])
    setHistoryIndex(0)
  }

  const closeTab = (tabId, e) => {
    e.stopPropagation()
    if (tabs.length === 1) return // never close last tab
    const idx = tabs.findIndex(t => t.id === tabId)
    const newTabs = tabs.filter(t => t.id !== tabId)
    setTabs(newTabs)
    if (activeTabId === tabId) {
      const nextTab = newTabs[Math.max(0, idx - 1)]
      setActiveTabId(nextTab.id)
      setAddressBarInput(nextTab.url)
    }
  }

  const switchTab = (tabId) => {
    if (tabId === activeTabId) return
    setActiveTabId(tabId)
    const tab = tabs.find(t => t.id === tabId)
    if (tab) setAddressBarInput(tab.url)
  }

  const updateTabInfo = (tabId, info) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, ...info } : t))
  }

  // ── NAVIGATION ──
  const navigateTo = (url) => {
    if (!url?.trim()) return
    let target = url.trim()
    if (!target.startsWith('http://') && !target.startsWith('https://') && !target.startsWith('/')) {
      target = 'https://' + target
    }
    setIsLoading(true)
    if (iframeRef.current) iframeRef.current.src = target
    setAddressBarInput(target)
    updateTabInfo(activeTabId, { url: target, title: new URL(target).hostname })
    const nextStack = historyStack.slice(0, historyIndex + 1)
    nextStack.push(target)
    setHistoryStack(nextStack)
    setHistoryIndex(nextStack.length - 1)
  }

  const handleBack = () => {
    if (historyIndex <= 0) return
    const nextIndex = historyIndex - 1
    const url = historyStack[nextIndex]
    setHistoryIndex(nextIndex)
    setIsLoading(true)
    if (iframeRef.current) iframeRef.current.src = url
    setAddressBarInput(url)
  }

  const handleForward = () => {
    if (historyIndex >= historyStack.length - 1) return
    const nextIndex = historyIndex + 1
    const url = historyStack[nextIndex]
    setHistoryIndex(nextIndex)
    setIsLoading(true)
    if (iframeRef.current) iframeRef.current.src = url
    setAddressBarInput(url)
  }

  function handleReload() {
    setIsLoading(true)
    if (iframeRef.current) {
      try { iframeRef.current.contentWindow.location.reload() }
      catch { iframeRef.current.src = activeTab?.url || 'https://www.owlbear.rodeo' }
    }
  }

  const handleHome = () => navigateTo(owlbearUrl)

  const handleNavigateAddress = (e) => {
    if (e) e.preventDefault()
    navigateTo(addressBarInput)
  }

  const handleIframeLoad = () => {
    setIsLoading(false)
    try {
      if (iframeRef.current?.contentWindow) {
        const loc = iframeRef.current.contentWindow.location
        const fullUrl = loc.href
        if (fullUrl && fullUrl !== 'about:blank') {
          setAddressBarInput(fullUrl)
          updateTabInfo(activeTabId, { url: fullUrl })
          // Try to read title
          try {
            const t = iframeRef.current.contentWindow.document?.title
            if (t) updateTabInfo(activeTabId, { title: t.slice(0, 22) })
          } catch { /* cross-origin */ }
        }
      }
    } catch { /* cross-origin, normal */ }
  }

  const saveVTTState = async (url = owlbearUrl) => {
    if (!lobbyData?.lobby?.codigo) return
    isSyncing.current = true
    try { await axios.post('/lobby/vtt/update', { owlbearUrl: url }) }
    catch (err) { console.error('Error updating VTT:', err) }
    finally { isSyncing.current = false }
  }

  const handleSync = () => {
    saveVTTState(owlbearUrl)
    showCursedToast("Arena Sintonizada", "Link sincronizado com sucesso.", "success")
  }

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode)
    showCursedToast("Código Copiado", "Cole no Console (F12) do Owlbear Rodeo.", "success")
  }

  const handleManualImport = async () => {
    if (!manualToken.trim()) { showCursedToast("Erro", "Cole um token válido.", "error"); return }
    try {
      let key = "sb-emhrsjcofcbqxuaptqpp-auth-token", value = manualToken.trim()
      try {
        const parsed = JSON.parse(value)
        if (parsed.key && parsed.value) { key = parsed.key; value = typeof parsed.value === 'string' ? parsed.value : JSON.stringify(parsed.value) }
        else if (parsed.access_token) { value = JSON.stringify(parsed) }
      } catch { /* ignore */ }
      await axios.post('/api/import_token', { key, value, user_id: authStatus?.user_id })
      showCursedToast("Arena Sintonizada", "Login importado! Recarregando...", "success")
      setShowModal(false); setManualToken('')
      fetchLobbyData(true); handleReload()
    } catch (err) { showCursedToast("Erro", "Erro ao importar token: " + err.message, "error") }
  }

  return (
    <div className="w-full h-full flex flex-col gap-0 items-stretch font-sans text-left relative z-20 overflow-hidden">

      {/* ── BROWSER TAB BAR ── */}
      <div
        className="flex items-end gap-0 px-2 pt-2 shrink-0 overflow-x-auto"
        style={{ background: 'var(--header-bg)', borderBottom: '1px solid rgba(139,92,246,0.15)' }}
      >
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-[11px] font-semibold shrink-0 max-w-[160px] transition-all border-t border-l border-r cursor-pointer select-none ${
              activeTabId === tab.id
                ? 'bg-[var(--bg-color)] border-purple-500/30 text-white z-10'
                : 'bg-[var(--panel-bg)] border-transparent text-[var(--text-muted)] hover:text-white hover:bg-[var(--glass-bg)]'
            }`}
          >
            <Globe className="w-3 h-3 shrink-0 opacity-60" />
            <span className="truncate">{tab.title}</span>
            {!tab.pinned && (
              <span
                onClick={(e) => closeTab(tab.id, e)}
                className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white/10 rounded cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </span>
            )}
          </button>
        ))}
        <button
          onClick={() => addTab()}
          className="flex items-center justify-center w-7 h-7 mb-0.5 ml-1 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-all cursor-pointer shrink-0"
          title="Nova aba"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── BROWSER TOOLBAR ── */}
      <div
        className="w-full px-3 py-2 flex items-center gap-2 shrink-0"
        style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--header-border)' }}
      >
        {/* Nav buttons */}
        <div className="flex items-center gap-1">
          <button onClick={handleBack} disabled={historyIndex <= 0}
            className="p-1.5 rounded-lg hover:bg-white/8 disabled:opacity-30 text-[var(--text-muted)] hover:text-white cursor-pointer disabled:cursor-not-allowed transition-all"
            title="Voltar">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleForward} disabled={historyIndex >= historyStack.length - 1}
            className="p-1.5 rounded-lg hover:bg-white/8 disabled:opacity-30 text-[var(--text-muted)] hover:text-white cursor-pointer disabled:cursor-not-allowed transition-all"
            title="Avançar">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleReload}
            className="p-1.5 rounded-lg hover:bg-white/8 text-[var(--text-muted)] hover:text-white cursor-pointer transition-all"
            title="Atualizar">
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
          <button onClick={handleHome}
            className="p-1.5 rounded-lg hover:bg-white/8 text-[var(--text-muted)] hover:text-white cursor-pointer transition-all"
            title="Página inicial (Sala)">
            <Home className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Address bar */}
        <form onSubmit={handleNavigateAddress} className="flex-1 flex items-center gap-1.5 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-xl px-3 py-1 hover:border-purple-500/30 focus-within:border-purple-500/40 transition-all">
          {isLoading
            ? <RefreshCw className="w-3 h-3 shrink-0 animate-spin text-purple-400" />
            : <Globe className="w-3 h-3 shrink-0 text-[var(--text-muted)]" />
          }
          <input
            type="text"
            value={addressBarInput}
            onChange={e => setAddressBarInput(e.target.value)}
            onFocus={e => e.target.select()}
            className="flex-1 bg-transparent border-0 text-[11px] text-[var(--text-color)] placeholder-[var(--text-muted)] outline-none font-mono"
            placeholder="https://..."
            style={{ background: 'transparent !important', border: 'none !important' }}
          />
          <button type="submit" className="hidden" />
        </form>

        {/* Right side actions */}
        <div className="flex items-center gap-1.5">
          {/* Sintonizar portal */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-700/70 hover:bg-purple-600/80 border border-purple-500/30 text-white text-[10px] font-bold rounded-xl cursor-pointer transition-all"
            title="Sintonizar com Owlbear"
          >
            <Key className="w-3 h-3" />
            <span className="hidden sm:inline">Sintonizar</span>
          </button>

          {isMaster && (
            <div className="flex items-center gap-1 bg-[var(--panel-bg)] border border-[var(--panel-border)] px-2 py-1.5 rounded-xl">
              <span className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-wider shrink-0">URL Sala:</span>
              <input
                type="text"
                value={owlbearUrl}
                onChange={e => setOwlbearUrl(e.target.value)}
                className="px-1.5 py-0.5 rounded bg-transparent border-0 text-[var(--text-color)] text-[9px] w-44 focus:outline-none"
                style={{ background: 'transparent !important', border: 'none !important' }}
              />
              <button onClick={handleSync} className="px-2 py-0.5 bg-purple-700 hover:bg-purple-600 text-white font-bold text-[9px] rounded cursor-pointer">
                Sync
              </button>
            </div>
          )}

          <button onClick={() => fetchLobbyData(true)}
            className="p-1.5 rounded-xl hover:bg-white/8 text-[var(--text-muted)] hover:text-white cursor-pointer transition-all"
            title="Atualizar dados do lobby">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <a href={addressBarInput} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-xl hover:bg-white/8 text-[var(--text-muted)] hover:text-white cursor-pointer transition-all"
            title="Abrir em nova aba real do navegador">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ── IFRAME VIEWPORT ── */}
      <div className="w-full flex-1 min-h-0 relative overflow-hidden"
        style={{ background: '#05040a', borderTop: 'none' }}>
        <iframe
          ref={iframeRef}
          src={activeTab?.url || 'https://www.owlbear.rodeo'}
          onLoad={handleIframeLoad}
          title="VTT Browser"
          className="w-full h-full border-0"
          allow="autoplay; camera; microphone; fullscreen; clipboard-read; clipboard-write; picture-in-picture; storage-access"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-pointer-lock allow-top-navigation allow-modals"
        />

        {/* Loading bar */}
        {isLoading && (
          <div className="absolute top-0 left-0 right-0 h-0.5 z-10">
            <div className="h-full bg-purple-500 animate-pulse" style={{ width: '60%' }} />
          </div>
        )}
      </div>

      {/* ── SINTONIZAR MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl p-6 flex flex-col gap-5 relative overflow-hidden"
            style={{ background: 'var(--modal-bg)', border: '1px solid rgba(168,85,247,0.3)', boxShadow: '0 0 50px rgba(168,85,247,0.2)' }}>
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--card-border)' }}>
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                <Sparkles className="w-4 h-4 text-purple-400" /> Sintonizar Portal Espiritual
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-500 hover:text-white bg-transparent border-0 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="text-xs leading-relaxed flex flex-col gap-4" style={{ color: 'var(--text-muted)' }}>
              <div className="p-4 rounded-2xl flex flex-col gap-2.5" style={{ background: 'var(--panel-bg)', border: '1px solid rgba(168,85,247,0.15)' }}>
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Método 1: Bookmarklet (Recomendado)</span>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Abra o Owlbear Rodeo no seu navegador e certifique-se de estar logado. Abra o Console (F12), cole o código e pressione Enter.</p>
                <button onClick={handleCopyBookmarklet}
                  className="w-full py-2 bg-purple-800 hover:bg-purple-700 border-0 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-2">
                  <Copy className="w-3.5 h-3.5" /> Copiar Código de Sintonização
                </button>
              </div>

              <div className="p-4 rounded-2xl flex flex-col gap-2.5" style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}>
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Método 2: Token Manual</span>
                <textarea rows="3" placeholder='Cole o JSON da sessão ou token de autenticação...'
                  value={manualToken} onChange={e => setManualToken(e.target.value)}
                  className="w-full p-2.5 rounded-xl text-[10px] font-mono resize-none"
                  style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: 'var(--text-color)' }} />
                <button onClick={handleManualImport}
                  className="w-full py-2 font-bold text-xs rounded-xl cursor-pointer transition-all"
                  style={{ background: 'var(--panel-bg)', border: '1px solid var(--card-border)', color: 'var(--text-color)' }}>
                  Confirmar Importação Manual
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-3" style={{ borderTop: '1px solid var(--card-border)' }}>
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all"
                style={{ background: 'var(--panel-bg)', border: '1px solid var(--card-border)', color: 'var(--text-muted)' }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
