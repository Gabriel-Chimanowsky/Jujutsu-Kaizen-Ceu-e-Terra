import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { showCursedToast } from '../utils/toast'
import { Map, RefreshCw, Key, Copy, X, Sparkles } from 'lucide-react'

export default function JJKVTT({ lobbyData, isMaster, fetchLobbyData }) {
  const isSyncing = useRef(false)
  const [owlbearUrl, setOwlbearUrl] = useState('https://www.owlbear.rodeo/room/AN-07cqdtIU2/The%20Timid%20Snipe')
  const [showModal, setShowModal] = useState(false)
  const [manualToken, setManualToken] = useState('')

  // Bookmarklet code for sintonizing session from owlbear.rodeo
  const bookmarkletCode = `javascript:(function(){let k=Object.keys(localStorage).find(x=>x.startsWith('sb-')&&x.endsWith('-auth-token'));if(!k){alert('Erro: Token do Owlbear nao encontrado. Certifique-se de estar logado no owlbear.rodeo!');return;}let v=localStorage.getItem(k);fetch('${window.location.origin}/api/import_token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:k,value:v})}).then(r=>r.json()).then(d=>{alert('Arena Sintonizada com sucesso!');}).catch(e=>alert('Erro ao sintonizar: '+e));})();`;

  // Synchronize state from Lobby GET response
  useEffect(() => {
    if (lobbyData?.vtt_state && !isSyncing.current) {
      const state = lobbyData.vtt_state
      if (state.owlbearUrl && state.owlbearUrl !== owlbearUrl) {
        setTimeout(() => setOwlbearUrl(state.owlbearUrl), 0)
      }
    }
  }, [lobbyData, owlbearUrl])

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
      } catch {}

      await axios.post('/api/import_token', { key, value })
      showCursedToast("Arena Sintonizada", "Seu login do Owlbear foi importado com sucesso. Recarregando arena...", "success")
      setShowModal(false)
      setManualToken('')
      fetchLobbyData(true)
    } catch (err) {
      showCursedToast("Erro", "Erro ao importar token: " + err.message, "error")
    }
  }

  return (
    <div className="w-full h-full flex flex-col gap-3 items-stretch font-sans text-left relative z-20 overflow-hidden">
      
      {/* VTT Toolbox Bar */}
      <div className="w-full bg-neutral-950/80 border border-white/10 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xl shrink-0">
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-white font-jujutsu tracking-widest uppercase flex items-center gap-2">
            <Map className="w-4 h-4 text-purple-400 animate-pulse" /> Campo de Batalha (Owlbear Rodeo)
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Abrir Arena (Nova Aba) */}
          <a
            href={owlbearUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-purple-900/60 border border-purple-500/40 hover:border-purple-500/80 hover:bg-purple-900 text-white text-[10px] font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(139,92,246,0.2)] shrink-0"
          >
            <Map className="w-3.5 h-3.5 text-purple-300 animate-pulse" /> Abrir Arena (Nova Aba)
          </a>

          {/* Sintonizar Portal Button */}
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 bg-neutral-900 border border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-950/20 text-purple-300 hover:text-purple-200 text-[10px] font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(168,85,247,0.1)]"
          >
            <Key className="w-3.5 h-3.5" /> Sintonizar Portal
          </button>

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
            className="p-2.5 bg-neutral-900 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white rounded-xl cursor-pointer transition-all"
            title="Sincronizar Manualmente"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Embedded Owlbear Rodeo Room Viewport taking 100% width and remaining height */}
      <div className="w-full flex-1 min-h-0 bg-[#05040a] rounded-3xl border border-purple-500/20 shadow-2xl relative overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.15)]">
        <iframe
          src={owlbearUrl.replace(/https?:\/\/(www\.)?owlbear\.rodeo\//, '/')}
          title="Owlbear Rodeo VTT"
          className="w-full h-full border-0"
          allow="autoplay; camera; microphone; fullscreen; clipboard-read; clipboard-write; picture-in-picture"
        />
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

              <div className="bg-neutral-950/80 border border-amber-500/25 p-3 rounded-2xl flex flex-col gap-1 text-amber-300">
                <span className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Login com o Google no Owlbear
                </span>
                <p className="text-[10px] leading-relaxed text-gray-400">
                  Caso utilize <b>Google Login</b>, clique em <b>"Abrir Arena (Nova Aba)"</b> na barra superior, realize o login normalmente na aba do Owlbear e, depois, utilize o <b>Método 1</b> abaixo para sintonizar a arena de forma automática.
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
