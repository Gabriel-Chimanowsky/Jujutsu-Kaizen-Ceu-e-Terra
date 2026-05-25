import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { showCursedToast } from '../utils/toast'
import { Map, RefreshCw } from 'lucide-react'

export default function JJKVTT({ lobbyData, isMaster, myCharacter, fetchLobbyData }) {
  const isSyncing = useRef(false)
  const [owlbearUrl, setOwlbearUrl] = useState('https://www.owlbear.rodeo/room/AN-07cqdtIU2/The%20Timid%20Snipe')

  // Synchronize state from Lobby GET response
  useEffect(() => {
    if (lobbyData?.vtt_state && !isSyncing.current) {
      const state = lobbyData.vtt_state
      if (state.owlbearUrl) {
        setOwlbearUrl(state.owlbearUrl)
      }
    }
  }, [lobbyData])

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

  return (
    <div className="w-full flex flex-col gap-5 items-stretch font-sans text-left relative z-20">
      
      {/* VTT Toolbox Bar */}
      <div className="w-full bg-neutral-950/80 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-white font-jujutsu tracking-widest uppercase flex items-center gap-2">
            <Map className="w-4 h-4 text-purple-400 animate-pulse" /> Campo de Batalha (Owlbear Rodeo)
          </span>
        </div>

        {/* Master Only Config: Elegant Compact Input next to Sync */}
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
            className="p-2.5 bg-neutral-900 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white rounded-xl cursor-pointer transition-all"
            title="Sincronizar Manualmente"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Embedded Owlbear Rodeo Room Viewport taking 100% width */}
      <div className="w-full bg-[#05040a] rounded-3xl border border-purple-500/20 shadow-2xl relative overflow-hidden h-[750px] shadow-[0_0_20px_rgba(139,92,246,0.15)]">
        <iframe
          src={owlbearUrl.replace(/https?:\/\/(www\.)?owlbear\.rodeo\//, '/')}
          title="Owlbear Rodeo VTT"
          className="w-full h-full border-0"
          allow="autoplay; camera; microphone; fullscreen; clipboard-read; clipboard-write; picture-in-picture"
        />
      </div>

    </div>
  )
}
