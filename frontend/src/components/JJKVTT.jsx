import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { showCursedToast } from '../utils/toast'
import { 
  Eye, EyeOff, Trash2, Plus, RotateCw, Maximize2, Minimize2, 
  Grid, PenTool, Eraser, Move, Settings, Map, Ruler, Save, 
  RefreshCw, UserPlus, Skull, Check, X, Shield, Lock, Compass,
  Activity, Star, Flame, Heart, Sparkles, MessageSquare, Terminal
} from 'lucide-react'

// Default premium JJK VTT maps
const MAP_PRESETS = [
  { name: 'Arena de Expansão de Domínio', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Rua de Shibuya (Noite)', url: 'https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Colégio Técnico de Jujutsu', url: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=1200&auto=format&fit=crop' },
  { name: 'Sala de Selamento Amaldiçoada', url: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?q=80&w=1200&auto=format&fit=crop' }
]

const AURA_COLORS = [
  { name: 'Roxo Cursado', value: '#a855f7' },
  { name: 'Azul Feitiçaria', value: '#3b82f6' },
  { name: 'Vermelho Sangue', value: '#ef4444' },
  { name: 'Verde Reverso', value: '#10b981' },
  { name: 'Dourado Iluminado', value: '#eab308' },
  { name: 'Nenhuma', value: '' }
]

export default function JJKVTT({ lobbyData, isMaster, myCharacter, fetchLobbyData }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const isSyncing = useRef(false)

  // VTT States
  const [mapUrl, setMapUrl] = useState(MAP_PRESETS[0].url)
  const [gridSize, setGridSize] = useState(60)
  const [gridVisible, setGridVisible] = useState(true)
  const [gridColor, setGridColor] = useState('rgba(168, 85, 247, 0.25)')
  const [offsetX, setOffsetX] = useState(0)
  const [offsetY, setOffsetY] = useState(0)
  
  const [tokens, setTokens] = useState([])
  const [drawings, setDrawings] = useState([])
  const [fog, setFog] = useState({}) // format: {"col,row": true}
  const [pings, setPings] = useState([]) // format: [{id, x, y, color}]
  
  // Local Tool States
  const [activeTool, setActiveTool] = useState('move') // 'move' | 'ruler' | 'draw' | 'erase' | 'laser' | 'fog_hide' | 'fog_reveal'
  const [drawColor, setDrawColor] = useState('#a855f7')
  const [drawWidth, setDrawWidth] = useState(4)
  const [selectedTokenId, setSelectedTokenId] = useState(null)
  
  // Ruler State
  const [rulerStart, setRulerStart] = useState(null)
  const [rulerEnd, setRulerEnd] = useState(null)

  // Interactive panels
  const [showConfig, setShowConfig] = useState(false)
  const [customMapUrl, setCustomMapUrl] = useState('')
  const [npcName, setNpcName] = useState('')
  const [npcImage, setNpcImage] = useState(MAP_PRESETS[3].url)
  const [npcSize, setNpcSize] = useState(1)

  // Dragging & drawing states
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentLine, setCurrentLine] = useState(null)
  const [draggedTokenId, setDraggedTokenId] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Compile active combat logs from all sintonized characters
  const activeCharacters = lobbyData?.characters || []
  const mergedLogs = activeCharacters
    .flatMap(c => (c.recent_logs || []).map(log => ({ ...log, charNome: c.nome, charColor: c.cor_energia })))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 4)

  // Synchronize state from Lobby GET response
  useEffect(() => {
    if (lobbyData?.vtt_state && !isSyncing.current) {
      const state = lobbyData.vtt_state
      if (state.mapUrl) setMapUrl(state.mapUrl)
      if (state.gridSize) setGridSize(state.gridSize)
      if (state.gridVisible !== undefined) setGridVisible(state.gridVisible)
      if (state.gridColor) setGridColor(state.gridColor)
      if (state.offsetX !== undefined) setOffsetX(state.offsetX)
      if (state.offsetY !== undefined) setOffsetY(state.offsetY)
      if (state.tokens) setTokens(state.tokens)
      if (state.drawings) setDrawings(state.drawings)
      if (state.fog) setFog(state.fog)
      if (state.pings) setPings(state.pings)
    }
  }, [lobbyData])

  // Save VTT State to backend
  const saveVTTState = async (
    updatedTokens = tokens, 
    updatedDrawings = drawings, 
    updatedFog = fog, 
    currentMapUrl = mapUrl, 
    currentGridSize = gridSize, 
    currentGridVisible = gridVisible, 
    currentGridColor = gridColor,
    currentOffsetX = offsetX,
    currentOffsetY = offsetY,
    updatedPings = pings
  ) => {
    if (!lobbyData?.lobby?.codigo) return
    isSyncing.current = true
    try {
      const state = {
        mapUrl: currentMapUrl,
        gridSize: currentGridSize,
        gridVisible: currentGridVisible,
        gridColor: currentGridColor,
        offsetX: currentOffsetX,
        offsetY: currentOffsetY,
        tokens: updatedTokens,
        drawings: updatedDrawings,
        fog: updatedFog,
        pings: updatedPings
      }
      await axios.post('/lobby/vtt/update', state)
    } catch (err) {
      console.error('Error updating VTT status:', err)
    } finally {
      isSyncing.current = false
    }
  }

  // --- TOKEN HANDLERS ---
  const spawnCharacterToken = () => {
    if (!myCharacter) {
      showCursedToast("Sem Personagem", "Você precisa de um feiticeiro criado para invocar seu token.", "warning")
      return
    }
    // Check if token already exists
    if (tokens.some(t => t.charId === myCharacter.id)) {
      showCursedToast("Token Existente", "Seu token de feiticeiro já está no mapa.", "warning")
      return
    }

    const newToken = {
      id: `char-${myCharacter.id}-${Date.now()}`,
      name: myCharacter.nome,
      imageUrl: myCharacter.imagem_url || '',
      x: 120,
      y: 120,
      size: 1,
      rotation: 0,
      label: '',
      isCharacter: true,
      charId: myCharacter.id,
      color: myCharacter.cor_energia || '#a855f7',
      auraColor: myCharacter.cor_energia || '#a855f7'
    }

    const nextTokens = [...tokens, newToken]
    setTokens(nextTokens)
    saveVTTState(nextTokens)
    showCursedToast("Feiticeiro Conjurado", `${myCharacter.nome} entrou na arena tática.`, "success")
  }

  const spawnNPCToken = () => {
    if (!isMaster) return
    const name = npcName.trim() || 'Maldição Comum'
    const newToken = {
      id: `npc-${Date.now()}`,
      name,
      imageUrl: npcImage,
      x: 180,
      y: 180,
      size: npcSize,
      rotation: 0,
      label: '',
      isCharacter: false,
      color: '#ef4444',
      auraColor: '#ef4444'
    }

    const nextTokens = [...tokens, newToken]
    setTokens(nextTokens)
    saveVTTState(nextTokens)
    setNpcName('')
    showCursedToast("Invocação de Ameaça", `Token "${name}" adicionado pelo Mestre.`, "success")
  }

  const deleteToken = (id) => {
    const tokenToDelete = tokens.find(t => t.id === id)
    if (!isMaster && (!tokenToDelete || tokenToDelete.charId !== myCharacter?.id)) {
      showCursedToast("Ação Bloqueada", "Você só pode remover seu próprio token de feiticeiro.", "warning")
      return
    }
    const nextTokens = tokens.filter(t => t.id !== id)
    setTokens(nextTokens)
    if (selectedTokenId === id) setSelectedTokenId(null)
    saveVTTState(nextTokens)
  }

  const updateTokenAttribute = (id, key, value) => {
    const token = tokens.find(t => t.id === id)
    if (!isMaster && (!token || token.charId !== myCharacter?.id)) return

    const nextTokens = tokens.map(t => {
      if (t.id === id) {
        return { ...t, [key]: value }
      }
      return t
    })
    setTokens(nextTokens)
    saveVTTState(nextTokens)
  }

  // --- LASER / PING SYSTEM ---
  const triggerLaserPing = (coords) => {
    const pingColor = myCharacter?.cor_energia || '#a855f7'
    const newPing = {
      id: `ping-${Date.now()}-${Math.random()}`,
      x: coords.x,
      y: coords.y,
      color: pingColor
    }

    const nextPings = [...pings, newPing]
    setPings(nextPings)
    saveVTTState(tokens, drawings, fog, mapUrl, gridSize, gridVisible, gridColor, offsetX, offsetY, nextPings)

    // Remove ping after 2 seconds automatically to avoid clutter
    setTimeout(() => {
      setPings(prev => {
        const filtered = prev.filter(p => p.id !== newPing.id)
        saveVTTState(tokens, drawings, fog, mapUrl, gridSize, gridVisible, gridColor, offsetX, offsetY, filtered)
        return filtered
      })
    }, 2000)
  }

  // --- MOUSE & TOUCH EVENT HANDLERS ---
  const getCoordinates = (e) => {
    if (!mapRef.current) return { x: 0, y: 0 }
    const rect = mapRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const handleMouseDown = (e) => {
    if (e.button !== 0) return // Only primary click
    const coords = getCoordinates(e)

    if (activeTool === 'draw') {
      setIsDrawing(true)
      setCurrentLine({
        points: [coords],
        color: drawColor,
        width: drawWidth
      })
    } else if (activeTool === 'laser') {
      triggerLaserPing(coords)
    } else if (activeTool === 'erase') {
      if (isMaster) {
        const nextDrawings = drawings.filter(d => {
          return !d.points.some(p => {
            const dist = Math.hypot(p.x - coords.x, p.y - coords.y)
            return dist < 20
          })
        })
        setDrawings(nextDrawings)
        saveVTTState(tokens, nextDrawings)
      }
    } else if (activeTool === 'fog_hide' || activeTool === 'fog_reveal') {
      if (isMaster) {
        const col = Math.floor((coords.x - offsetX) / gridSize)
        const row = Math.floor((coords.y - offsetY) / gridSize)
        const key = `${col},${row}`
        const nextFog = { ...fog }
        if (activeTool === 'fog_hide') {
          nextFog[key] = true
        } else {
          delete nextFog[key]
        }
        setFog(nextFog)
        saveVTTState(tokens, drawings, nextFog)
      }
    } else if (activeTool === 'ruler') {
      setRulerStart(coords)
      setRulerEnd(coords)
    }
  }

  const handleMouseMove = (e) => {
    const coords = getCoordinates(e)

    if (activeTool === 'draw' && isDrawing && currentLine) {
      setCurrentLine(prev => ({
        ...prev,
        points: [...prev.points, coords]
      }))
    } else if (activeTool === 'fog_hide' || activeTool === 'fog_reveal') {
      if (isMaster && (e.buttons === 1 || e.touches)) {
        const col = Math.floor((coords.x - offsetX) / gridSize)
        const row = Math.floor((coords.y - offsetY) / gridSize)
        const key = `${col},${row}`
        const nextFog = { ...fog }
        let changed = false
        if (activeTool === 'fog_hide' && !fog[key]) {
          nextFog[key] = true
          changed = true
        } else if (activeTool === 'fog_reveal' && fog[key]) {
          delete nextFog[key]
          changed = true
        }
        if (changed) {
          setFog(nextFog)
          saveVTTState(tokens, drawings, nextFog)
        }
      }
    } else if (activeTool === 'ruler' && rulerStart) {
      setRulerEnd(coords)
    }
  }

  const handleMouseUp = () => {
    if (activeTool === 'draw' && isDrawing && currentLine) {
      const nextDrawings = [...drawings, currentLine]
      setDrawings(nextDrawings)
      setIsDrawing(false)
      setCurrentLine(null)
      saveVTTState(tokens, nextDrawings)
    } else if (activeTool === 'ruler') {
      setRulerStart(null)
      setRulerEnd(null)
    }
  }

  // --- TOKEN DRAGGING HANDLERS ---
  const handleTokenDragStart = (e, id) => {
    e.stopPropagation()
    const token = tokens.find(t => t.id === id)
    if (!isMaster && (!token || token.charId !== myCharacter?.id)) return

    setDraggedTokenId(id)
    setSelectedTokenId(id)

    const coords = getCoordinates(e)
    setDragOffset({
      x: coords.x - token.x,
      y: coords.y - token.y
    })
  }

  const handleTokenDrag = (e) => {
    if (!draggedTokenId) return
    const coords = getCoordinates(e)
    
    let nextX = coords.x - dragOffset.x
    let nextY = coords.y - dragOffset.y

    nextX = Math.max(0, nextX)
    nextY = Math.max(0, nextY)

    const nextTokens = tokens.map(t => {
      if (t.id === draggedTokenId) {
        return { ...t, x: nextX, y: nextY }
      }
      return t
    })
    setTokens(nextTokens)
  }

  const handleTokenDragEnd = () => {
    if (!draggedTokenId) return
    
    // Snap to nearest grid center on release
    const nextTokens = tokens.map(t => {
      if (t.id === draggedTokenId) {
        const col = Math.round((t.x - offsetX) / gridSize)
        const row = Math.round((t.y - offsetY) / gridSize)
        return {
          ...t,
          x: col * gridSize + offsetX,
          y: row * gridSize + offsetY
        }
      }
      return t
    })
    setTokens(nextTokens)
    setDraggedTokenId(null)
    saveVTTState(nextTokens)
  }

  // --- MAP CONFIGURATION HANDLERS ---
  const applyCustomMapUrl = () => {
    if (!isMaster) return
    const url = customMapUrl.trim()
    if (url) {
      setMapUrl(url)
      saveVTTState(tokens, drawings, fog, url)
      setCustomMapUrl('')
      setShowConfig(false)
      showCursedToast("Barreira Alterada", "O mapa tático foi atualizado pelo Mestre.", "info")
    }
  }

  const changePresetMap = (url, name) => {
    if (!isMaster) return
    setMapUrl(url)
    saveVTTState(tokens, drawings, fog, url)
    showCursedToast("Território Sintonizado", `Arena alterada para: ${name}`, "success")
  }

  const clearVTTDrawingsAndFog = () => {
    if (!isMaster) return
    setDrawings([])
    setFog({})
    saveVTTState(tokens, [], {})
    showCursedToast("Limpeza Concluída", "Desenhos e névoa foram completamente dissipados.", "info")
  }

  // Calculate measured distance
  const getMeasuredDetails = () => {
    if (!rulerStart || !rulerEnd) return null
    const dx = rulerEnd.x - rulerStart.x
    const dy = rulerEnd.y - rulerStart.y
    const pixelDist = Math.hypot(dx, dy)
    
    const cells = pixelDist / gridSize
    const meters = cells * 1.5 // JJK system rules: 1.5m per square

    return {
      cells: cells.toFixed(1),
      meters: meters.toFixed(1)
    }
  }

  const rulerDetails = getMeasuredDetails()

  return (
    <div className="w-full flex flex-col gap-5 items-stretch font-sans text-left relative z-20">
      
      {/* VTT Toolbox Bar */}
      <div className="w-full bg-neutral-950/80 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Tool selectors */}
          {[
            { id: 'move', label: 'Mover', icon: Move },
            { id: 'ruler', label: 'Régua', icon: Ruler },
            { id: 'laser', label: 'Laser', icon: Flame },
            { id: 'draw', label: 'Pincel', icon: PenTool },
            { id: 'erase', label: 'Borracha', icon: Eraser }
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(tool.id)
                setSelectedTokenId(null)
              }}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all flex items-center gap-1.5 ${
                activeTool === tool.id
                  ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                  : 'bg-neutral-900 border-white/5 text-gray-400 hover:text-white'
              }`}
            >
              <tool.icon className="w-3.5 h-3.5" /> {tool.label}
            </button>
          ))}

          {/* Master Only Fog Controls */}
          {isMaster && (
            <div className="flex items-center gap-2 border-l border-white/10 pl-2">
              <button
                onClick={() => setActiveTool('fog_hide')}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTool === 'fog_hide'
                    ? 'bg-red-950 border-red-500 text-red-300'
                    : 'bg-neutral-900 border-white/5 text-gray-500 hover:text-white'
                }`}
                title="Erguer Névoa Amaldiçoada"
              >
                <EyeOff className="w-3.5 h-3.5 text-red-400 animate-pulse" /> + Névoa
              </button>
              <button
                onClick={() => setActiveTool('fog_reveal')}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all flex items-center gap-1.5 ${
                  activeTool === 'fog_reveal'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                    : 'bg-neutral-900 border-white/5 text-gray-500 hover:text-white'
                }`}
                title="Dissipar Névoa"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" /> - Névoa
              </button>
            </div>
          )}
        </div>

        {/* Action button panel */}
        <div className="flex items-center gap-2.5">
          {/* Quick spawn character token */}
          {!isMaster && myCharacter && (
            <button
              onClick={spawnCharacterToken}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-800/80 to-indigo-800/80 hover:from-purple-700 hover:to-indigo-700 border border-purple-500/20 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(139,92,246,0.25)]"
            >
              <UserPlus className="w-3.5 h-3.5" /> Invocar Meu Token
            </button>
          )}

          {/* Master Only Config & Cleaning Panel */}
          {isMaster && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="px-3.5 py-2 bg-neutral-900 border border-white/10 hover:border-white/20 text-gray-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5 text-purple-400" /> Configuração
              </button>
              <button
                onClick={clearVTTDrawingsAndFog}
                className="px-3 py-2 bg-red-950/20 hover:bg-red-950/50 border border-red-500/20 text-red-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                title="Dissipar tudo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <button
            onClick={() => fetchLobbyData(true)}
            className="p-2 bg-neutral-900 border border-white/5 hover:border-white/10 text-gray-400 hover:text-white rounded-xl cursor-pointer"
            title="Sincronizar Manualmente"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start w-full">
        
        {/* VTT Main Arena viewport */}
        <div className="lg:col-span-3 flex flex-col gap-2 relative">
          
          <div 
            ref={containerRef}
            className="w-full overflow-auto bg-black rounded-3xl border border-white/10 shadow-2xl custom-scrollbar select-none cursor-crosshair max-h-[650px] relative"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            
            {/* Scrollable Map Container */}
            <div 
              ref={mapRef}
              onMouseDown={handleMouseDown}
              className="relative shadow-2xl origin-top-left"
              style={{
                width: '1200px',
                height: '800px',
                backgroundImage: `url(${mapUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transition: 'background-image 0.5s ease-in-out'
              }}
            >
              
              {/* CSS Grid Pattern Overlay Layer (Calibrated with OffsetX & OffsetY) */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundSize: `${gridSize}px ${gridSize}px`,
                  backgroundPosition: `${offsetX}px ${offsetY}px`,
                  backgroundImage: gridVisible 
                    ? `linear-gradient(to right, ${gridColor} 1.5px, transparent 1.5px), linear-gradient(to bottom, ${gridColor} 1.5px, transparent 1.5px)`
                    : 'none'
                }}
              />

              {/* Fog of War Layer */}
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: Math.ceil(1200 / gridSize) + 1 }).map((_, col) => 
                  Array.from({ length: Math.ceil(800 / gridSize) + 1 }).map((_, row) => {
                    const key = `${col},${row}`
                    const hasFog = fog[key]
                    if (!hasFog) return null

                    return (
                      <div
                        key={key}
                        className="absolute flex items-center justify-center pointer-events-auto"
                        style={{
                          left: `${col * gridSize + offsetX}px`,
                          top: `${row * gridSize + offsetY}px`,
                          width: `${gridSize}px`,
                          height: `${gridSize}px`,
                          backgroundColor: isMaster ? 'rgba(0, 0, 0, 0.65)' : '#000000',
                          border: isMaster ? '1px dashed rgba(239, 68, 68, 0.3)' : 'none',
                          zIndex: 10
                        }}
                      >
                        {isMaster && <Lock className="w-3 h-3 text-red-500 opacity-60" />}
                      </div>
                    )
                  })
                )}
              </div>

              {/* drawings SVG Canvas Overlay Layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                {drawings.map((line, idx) => (
                  <path
                    key={idx}
                    d={`M ${line.points.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                    fill="none"
                    stroke={line.color}
                    strokeWidth={line.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}

                {/* Drawing active line */}
                {isDrawing && currentLine && (
                  <path
                    d={`M ${currentLine.points.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                    fill="none"
                    stroke={currentLine.color}
                    strokeWidth={currentLine.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Ruler Measurement line */}
                {rulerStart && rulerEnd && (
                  <>
                    <line
                      x1={rulerStart.x}
                      y1={rulerStart.y}
                      x2={rulerEnd.x}
                      y2={rulerEnd.y}
                      stroke="#c084fc"
                      strokeWidth="3.5"
                      strokeDasharray="4 4"
                    />
                    <circle cx={rulerStart.x} cy={rulerStart.y} r="5" fill="#a855f7" />
                    <circle cx={rulerEnd.x} cy={rulerEnd.y} r="5" fill="#a855f7" />
                  </>
                )}
              </svg>

              {/* Ruler floating metrics card */}
              {rulerStart && rulerEnd && rulerDetails && (
                <div 
                  className="absolute bg-neutral-950/95 border border-purple-500/50 text-[10px] text-white px-2.5 py-1.5 rounded-lg shadow-lg pointer-events-none z-30 font-sans tracking-wide"
                  style={{
                    left: `${(rulerStart.x + rulerEnd.x) / 2 + 10}px`,
                    top: `${(rulerStart.y + rulerEnd.y) / 2 - 25}px`,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.5), 0 0 10px rgba(168,85,247,0.2)'
                  }}
                >
                  <span className="font-black text-purple-400">{rulerDetails.meters} metros</span>
                  <span className="text-gray-400 text-[8px] block">{rulerDetails.cells} quadrados</span>
                </div>
              )}

              {/* Real-time Laser Pings pulsing rings (Framer Motion) */}
              {pings.map(ping => (
                <div
                  key={ping.id}
                  className="absolute pointer-events-none z-30"
                  style={{
                    left: `${ping.x}px`,
                    top: `${ping.y}px`
                  }}
                >
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: [0, 2.5], opacity: [1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute rounded-full -translate-x-1/2 -translate-y-1/2"
                    style={{
                      width: '50px',
                      height: '50px',
                      border: `3px solid ${ping.color}`,
                      boxShadow: `0 0 12px ${ping.color}`
                    }}
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2] }}
                    className="w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2"
                    style={{ backgroundColor: ping.color, boxShadow: `0 0 8px ${ping.color}` }}
                  />
                </div>
              ))}

              {/* Tokens Layer */}
              <div className="absolute inset-0 pointer-events-none z-20">
                {tokens.map((token) => {
                  const sizePx = token.size * gridSize
                  const isSelected = selectedTokenId === token.id
                  const canControl = isMaster || token.charId === myCharacter?.id

                  // Cross-reference HP for character tokens
                  const charStatus = token.isCharacter ? activeCharacters.find(c => c.id === token.charId) : null
                  const pvPercent = charStatus && charStatus.pv_max > 0 ? (charStatus.pv_atual / charStatus.pv_max) * 100 : 0
                  const hpColorClass = pvPercent > 50 ? 'bg-emerald-500' : pvPercent > 25 ? 'bg-amber-500' : 'bg-red-500'

                  return (
                    <div
                      key={token.id}
                      onMouseDown={(e) => canControl && activeTool === 'move' && handleTokenDragStart(e, token.id)}
                      className={`absolute rounded-full border-2 flex items-center justify-center bg-neutral-900 pointer-events-auto transition-transform ${
                        canControl && activeTool === 'move' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                      } ${isSelected ? 'scale-105 z-50' : 'border-white/20'}`}
                      style={{
                        left: `${token.x}px`,
                        top: `${token.y}px`,
                        width: `${sizePx}px`,
                        height: `${sizePx}px`,
                        transform: `rotate(${token.rotation || 0}deg)`,
                        borderColor: token.color || '#a855f7',
                        boxShadow: isSelected 
                          ? `0 0 18px ${token.auraColor || token.color || '#a855f7'}` 
                          : token.auraColor 
                          ? `0 0 12px ${token.auraColor}` 
                          : `0 4px 10px rgba(0,0,0,0.5)`
                      }}
                      title={token.name}
                    >
                      {token.imageUrl ? (
                        <img 
                          src={token.imageUrl} 
                          alt={token.name} 
                          className="w-full h-full object-cover select-none pointer-events-none" 
                        />
                      ) : (
                        <div className="text-[10px] font-black text-white font-mono shrink-0 select-none">
                          {token.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}

                      {/* Health Bar Overlay inside Token (Sleek JJK theme) */}
                      {charStatus && (
                        <div className="absolute top-1 left-2 right-2 h-1 bg-black/75 rounded-full overflow-hidden border border-white/5 pointer-events-none">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${hpColorClass}`}
                            style={{ width: `${pvPercent}%` }}
                          />
                        </div>
                      )}

                      {/* Label status banner */}
                      {token.label && (
                        <div className="absolute bottom-1.5 left-1 right-1 bg-neutral-950/90 py-0.5 rounded text-[7px] font-black uppercase text-center text-white tracking-wider truncate max-h-[14px] pointer-events-none leading-none select-none">
                          {token.label}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

            </div>
          </div>

          {/* Real-time Battle Logs Overlay inside VTT 2.0 (Cinematic glassHUD) */}
          <div className="absolute bottom-6 left-6 w-72 max-w-[280px] bg-neutral-950/85 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 shadow-2xl z-40 pointer-events-auto flex flex-col gap-2 font-sans select-none">
            <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5">
              <Terminal className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white leading-none">Logs do Domínio</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping ml-auto" />
            </div>

            <div className="flex flex-col gap-2.5 max-h-[180px] overflow-y-auto pr-0.5 custom-scrollbar text-[10px]">
              {mergedLogs.length === 0 ? (
                <span className="text-gray-500 italic py-2">Sem atividade de dados recente...</span>
              ) : (
                mergedLogs.map((log, idx) => (
                  <div key={idx} className="flex flex-col gap-0.5 text-left border-l-2 pl-2" style={{ borderColor: log.charColor || '#a855f7' }}>
                    <div className="flex justify-between items-center gap-1">
                      <span className="font-extrabold text-white truncate max-w-[120px]">{log.charNome}</span>
                      <span className="text-[8px] text-gray-500 shrink-0 font-mono">{log.timestamp}</span>
                    </div>
                    <span className="text-[9px] text-purple-300 font-extrabold tracking-wide truncate">{log.title}</span>
                    <span className="text-gray-400 leading-tight leading-normal" dangerouslySetInnerHTML={{ __html: log.content }} />
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Sidebar tática control panels */}
        <div className="lg:col-span-1 flex flex-col gap-5">
          
          {/* Active Token options (if selected) */}
          {selectedTokenId && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl p-5 border border-purple-500/25 bg-purple-950/10 flex flex-col gap-4"
            >
              {(() => {
                const token = tokens.find(t => t.id === selectedTokenId)
                if (!token) return null
                const canControl = isMaster || token.charId === myCharacter?.id

                return (
                  <>
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h4 className="text-xs font-black text-white font-jujutsu truncate">
                        {token.name}
                      </h4>
                      {canControl && (
                        <button
                          onClick={() => deleteToken(token.id)}
                          className="text-red-400 hover:text-red-300 cursor-pointer"
                          title="Remover Token"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {canControl ? (
                      <div className="flex flex-col gap-3 font-sans">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Status / Etiqueta</label>
                          <input
                            type="text"
                            placeholder="Ex: Ferido, Envenenado..."
                            value={token.label || ''}
                            onChange={(e) => updateTokenAttribute(token.id, 'label', e.target.value)}
                            className="px-3 py-1.5 rounded-lg text-xs bg-neutral-900 border border-white/10 text-white focus:outline-none"
                          />
                        </div>

                        {/* Aura Energy Color Selector */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Aura Cursada</label>
                          <div className="grid grid-cols-3 gap-1">
                            {AURA_COLORS.map((aura, idx) => (
                              <button
                                key={idx}
                                onClick={() => updateTokenAttribute(token.id, 'auraColor', aura.value)}
                                className={`px-1 py-1 rounded text-[8px] font-black uppercase truncate border transition-all cursor-pointer ${
                                  (token.auraColor || '') === aura.value
                                    ? 'bg-purple-950/20 border-purple-500/40 text-purple-300'
                                    : 'bg-neutral-900 border-white/5 text-gray-500 hover:text-white'
                                }`}
                              >
                                {aura.name.split(' ')[0]}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Tamanho (Quadrados)</label>
                            <select
                              value={token.size}
                              onChange={(e) => updateTokenAttribute(token.id, 'size', Number(e.target.value))}
                              className="px-2 py-1.5 rounded-lg text-xs bg-neutral-900 border border-white/10 text-white cursor-pointer focus:outline-none"
                            >
                              <option value={1}>1x1 (Humano)</option>
                              <option value={2}>2x2 (Grande)</option>
                              <option value={3}>3x3 (Enorme)</option>
                              <option value={4}>4x4 (Colossal)</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Rotação (Graus)</label>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => updateTokenAttribute(token.id, 'rotation', ((token.rotation || 0) + 45) % 360)}
                                className="px-2 py-1.5 bg-neutral-900 border border-white/15 hover:border-white/20 text-white rounded-lg text-xs flex items-center justify-center gap-1 cursor-pointer w-full"
                              >
                                <RotateCw className="w-3.5 h-3.5" /> +45°
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        Este token pertence a outro jogador. Você não possui permissões de mestre para controlá-lo.
                      </p>
                    )}
                  </>
                )
              })()}
            </motion.div>
          )}

          {/* Master Summon NPC / Curses panel */}
          {isMaster && (
            <div className="glass-card rounded-2xl p-5 border border-white/5 flex flex-col gap-4 bg-black/20">
              <h4 className="text-xs font-black text-white font-jujutsu border-b border-white/5 pb-2 flex items-center gap-1.5">
                <Skull className="w-4 h-4 text-red-500" /> Invocar Maldições / Ameaças
              </h4>

              <div className="flex flex-col gap-3 font-sans">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Nome da Ameaça</label>
                  <input
                    type="text"
                    placeholder="Ex: Sukuna, Dedos, Maldição..."
                    value={npcName}
                    onChange={(e) => setNpcName(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs bg-neutral-900 border border-white/10 text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Tamanho (Quadrados)</label>
                    <select
                      value={npcSize}
                      onChange={(e) => setNpcSize(Number(e.target.value))}
                      className="px-2 py-1.5 rounded-lg text-xs bg-neutral-900 border border-white/10 text-white cursor-pointer focus:outline-none"
                    >
                      <option value={1}>1x1 (Padrão)</option>
                      <option value={2}>2x2 (Grande)</option>
                      <option value={3}>3x3 (Enorme)</option>
                      <option value={4}>4x4 (Colossal)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Aparência (Token)</label>
                    <select
                      value={npcImage}
                      onChange={(e) => setNpcImage(e.target.value)}
                      className="px-2 py-1.5 rounded-lg text-xs bg-neutral-900 border border-white/10 text-white cursor-pointer focus:outline-none"
                    >
                      <option value={MAP_PRESETS[3].url}>Barreira Preta</option>
                      <option value="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=200&auto=format&fit=crop">Ritual Roxo</option>
                      <option value="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop">Energia Vermelha</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={spawnNPCToken}
                  className="mt-1 w-full py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer active:scale-95 transition-all border-0 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                >
                  Conjurar Ameaça
                </button>
              </div>
            </div>
          )}

          {/* Master Map & Grid Calibration panel (VTT 2.0 Precision sliders) */}
          {isMaster && showConfig && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-5 border border-white/5 flex flex-col gap-4 bg-black/20 animate-fade-in"
            >
              <h4 className="text-xs font-black text-white font-jujutsu border-b border-white/5 pb-2 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-purple-400" /> Alinhamento do Campo
              </h4>

              <div className="flex flex-col gap-3 font-sans">
                {/* Preset Maps selection */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Territórios Pré-definidos</label>
                  <div className="flex flex-col gap-1.5 max-h-[100px] overflow-y-auto custom-scrollbar">
                    {MAP_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => changePresetMap(preset.url, preset.name)}
                        className={`text-left px-2 py-1.5 rounded-lg text-[9px] font-bold border transition-all truncate cursor-pointer ${
                          mapUrl === preset.url
                            ? 'bg-purple-950/30 border-purple-500/40 text-purple-300'
                            : 'bg-neutral-900/60 border-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Map Background Link input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Link de Mapa Customizado</label>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Cole a URL da imagem..."
                      value={customMapUrl}
                      onChange={(e) => setCustomMapUrl(e.target.value)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-neutral-900 border border-white/10 text-white focus:outline-none flex-grow min-w-0"
                    />
                    <button
                      onClick={applyCustomMapUrl}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg cursor-pointer border-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sliders de Alinhamento e Deslocamento da Grade */}
                <div className="flex flex-col gap-2.5 border-t border-white/5 pt-2.5">
                  <span className="text-[9px] text-purple-300 font-extrabold uppercase tracking-wider block">Calibração do Grid</span>
                  
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[8px] text-gray-400 font-bold">
                      <span>Tamanho Grade ({gridSize}px)</span>
                    </div>
                    <input
                      type="range"
                      min={40}
                      max={120}
                      value={gridSize}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setGridSize(val)
                        saveVTTState(tokens, drawings, fog, mapUrl, val, gridVisible, gridColor, offsetX, offsetY)
                      }}
                      className="w-full accent-purple-500 cursor-ew-resize h-1 bg-neutral-900 rounded-lg appearance-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[8px] text-gray-400 font-bold">
                      <span>Deslocamento X ({offsetX}px)</span>
                    </div>
                    <input
                      type="range"
                      min={-gridSize}
                      max={gridSize}
                      value={offsetX}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setOffsetX(val)
                        saveVTTState(tokens, drawings, fog, mapUrl, gridSize, gridVisible, gridColor, val, offsetY)
                      }}
                      className="w-full accent-purple-500 cursor-ew-resize h-1 bg-neutral-900 rounded-lg appearance-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[8px] text-gray-400 font-bold">
                      <span>Deslocamento Y ({offsetY}px)</span>
                    </div>
                    <input
                      type="range"
                      min={-gridSize}
                      max={gridSize}
                      value={offsetY}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setOffsetY(val)
                        saveVTTState(tokens, drawings, fog, mapUrl, gridSize, gridVisible, gridColor, offsetX, val)
                      }}
                      className="w-full accent-purple-500 cursor-ew-resize h-1 bg-neutral-900 rounded-lg appearance-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] text-gray-400 font-extrabold uppercase tracking-wider">Visualização Grade</label>
                    <button
                      onClick={() => {
                        const nextGrid = !gridVisible
                        setGridVisible(nextGrid)
                        saveVTTState(tokens, drawings, fog, mapUrl, gridSize, nextGrid, gridColor, offsetX, offsetY)
                      }}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer border-0 ${
                        gridVisible
                          ? 'bg-purple-950/20 border-purple-500/40 text-purple-300'
                          : 'bg-neutral-900 border-white/10 text-gray-500'
                      }`}
                    >
                      {gridVisible ? 'Grade Visível' : 'Grade Oculta'}
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* Sintonized Tokens List */}
          <div className="glass-card rounded-2xl p-5 border border-white/5 flex flex-col gap-3 bg-black/20 font-sans">
            <h4 className="text-xs font-black text-white font-jujutsu border-b border-white/5 pb-1.5 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-purple-400" /> Tokens em Campo ({tokens.length})
            </h4>

            {tokens.length === 0 ? (
              <p className="text-[10px] text-gray-500 leading-relaxed">
                Nenhum token foi conjurado na arena de combate ainda.
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-0.5 custom-scrollbar">
                {tokens.map((t) => (
                  <div 
                    key={t.id}
                    onClick={() => setSelectedTokenId(t.id)}
                    className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                      selectedTokenId === t.id
                        ? 'bg-purple-950/20 border-purple-500/40 text-white'
                        : 'bg-neutral-900/40 border-white/5 hover:border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div 
                        className="w-5 h-5 rounded-full border shrink-0 bg-neutral-800 overflow-hidden flex items-center justify-center text-[7px] font-black text-white"
                        style={{ borderColor: t.color || '#a855f7' }}
                      >
                        {t.imageUrl ? <img src={t.imageUrl} className="w-full h-full object-cover" /> : t.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="text-[10px] font-bold truncate leading-none">
                        {t.name}
                      </span>
                    </div>

                    {(isMaster || t.charId === myCharacter?.id) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteToken(t.id)
                        }}
                        className="text-red-400/80 hover:text-red-400 p-1 rounded hover:bg-white/5 border-0 bg-transparent"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
