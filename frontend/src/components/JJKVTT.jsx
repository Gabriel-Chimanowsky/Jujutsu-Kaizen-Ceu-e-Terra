import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { showCursedToast } from '../utils/toast'
import { 
  Eye, EyeOff, Trash2, Plus, RotateCw, Maximize2, Minimize2, 
  Grid, PenTool, Eraser, Move, Settings, Map, Ruler, Save, 
  RefreshCw, UserPlus, Skull, Check, X, Shield, Lock, Compass,
  Activity, Star, Flame, Heart, Sparkles, MessageSquare, Terminal,
  Volume2, VolumeX, Square, Circle as CircleIcon, Swords, Play, Square as StopIcon,
  ChevronRight, ArrowUp, ArrowDown
} from 'lucide-react'

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

const AUDIO_TRACKS = [
  { name: 'Ritual de Combate (Tensão)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { name: 'Expansão de Domínio (Vazio)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { name: 'Confronto Inevitável', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { name: 'Atmósfera de Mistério', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' }
]

const STATUS_BADGES = [
  { label: 'Atordoado', code: 'STUN', color: '#eab308' },
  { label: 'Sangrando', code: 'BLEED', color: '#ef4444' },
  { label: 'Queimado', code: 'BURN', color: '#f97316' },
  { label: 'Selado', code: 'SEAL', color: '#3b82f6' },
  { label: 'Domínio Ativo', code: 'DOM', color: '#a855f7' }
]

export default function JJKVTT({ lobbyData, isMaster, myCharacter, fetchLobbyData }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const isSyncing = useRef(false)

  // Synthesize futuristic retro-cursed WebAudio chimes
  const playCursedChime = (freq = 440, type = 'sine') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0.06, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.25)
    } catch (e) {
      // Ignored
    }
  }
  
  // Audio state
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackUrl, setCurrentTrackUrl] = useState('')

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
  const [pings, setPings] = useState([]) // format: [{id, x, y, color, name}]
  const [activeAudio, setActiveAudio] = useState(null) // format: {url, name, playing}
  const [initiativeQueue, setInitiativeQueue] = useState([]) // format: [{id, name, roll, active}]
  const [activeInitiativeIndex, setActiveInitiativeIndex] = useState(0)
  
  // Local Tool States
  const [activeTool, setActiveTool] = useState('move') // 'move' | 'ruler' | 'laser' | 'draw' | 'line' | 'rect' | 'circle' | 'erase' | 'fog_hide' | 'fog_reveal'
  const [drawColor, setDrawColor] = useState('#a855f7')
  const [drawWidth, setDrawWidth] = useState(4)
  
  const [selectedTokenId, setSelectedTokenId] = useState(null)
  const [activeRadialTokenId, setActiveRadialTokenId] = useState(null) // Radial popup menu state
  const [hpChangeVal, setHpChangeVal] = useState('')
  const [hpUpdating, setHpUpdating] = useState(false)
  
  // Ruler State
  const [rulerStart, setRulerStart] = useState(null)
  const [rulerEnd, setRulerEnd] = useState(null)

  // Advanced VTT Camera Navigation & Synced Atmosphere
  const weatherCanvasRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [spacePressed, setSpacePressed] = useState(false)
  const [weather, setWeather] = useState('none')
  const [lighting, setLighting] = useState('day')
  const [owlbearUrl, setOwlbearUrl] = useState('https://www.owlbear.rodeo/room/AN-07cqdtIU2/The%20Timid%20Snipe')

  // Interactive panels
  const [showConfig, setShowConfig] = useState(false)
  const [showSoundboard, setShowSoundboard] = useState(false)
  const [showInitiative, setShowInitiative] = useState(false)
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
    .flatMap(c => (c.recent_logs || []).map(log => {
      if (typeof log === 'string') {
        return { title: 'Ação', content: log, timestamp: '', charNome: c.nome, charColor: c.cor_energia }
      }
      return {
        title: log.title || 'Ação',
        content: log.content || '',
        timestamp: typeof log.timestamp === 'string' ? log.timestamp : '',
        charNome: c.nome,
        charColor: c.cor_energia
      }
    }))
    .sort((a, b) => {
      const timeA = a.timestamp || ''
      const timeB = b.timestamp || ''
      return timeB.localeCompare(timeA)
    })
    .slice(0, 4)

  // Calculate Ruler floating metrics (JJK VTT 3.0 calibrated)
  const rulerDetails = (() => {
    if (!rulerStart || !rulerEnd) return null
    const distPx = Math.hypot(rulerEnd.x - rulerStart.x, rulerEnd.y - rulerStart.y)
    const cells = Math.round((distPx / gridSize) * 10) / 10
    const meters = Math.round(cells * 1.5 * 10) / 10
    return { cells, meters }
  })()

  // Spacebar camera panning listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          e.preventDefault()
          setSpacePressed(true)
        }
      }
    }
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        setSpacePressed(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Weather animation particle simulation loop (60fps canvas)
  useEffect(() => {
    const canvas = weatherCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 1200
    canvas.height = 800

    let animationFrameId
    let particles = []
    const maxParticles = weather === 'rain' ? 140 : weather === 'snow' ? 90 : weather === 'embers' ? 70 : weather === 'fog' ? 25 : 0

    for (let i = 0; i < maxParticles; i++) {
      if (weather === 'rain') {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: -1 - Math.random() * 2,
          vy: 8 + Math.random() * 6,
          size: 1 + Math.random() * 1.5,
          alpha: 0.15 + Math.random() * 0.35
        })
      } else if (weather === 'snow') {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: -0.5 + Math.random() * 1,
          vy: 0.8 + Math.random() * 1.8,
          size: 2 + Math.random() * 3,
          alpha: 0.25 + Math.random() * 0.5,
          angle: Math.random() * Math.PI * 2,
          speed: 0.01 + Math.random() * 0.02
        })
      } else if (weather === 'embers') {
        particles.push({
          x: Math.random() * canvas.width,
          y: canvas.height + Math.random() * 40,
          vx: -0.8 + Math.random() * 1.6,
          vy: -1.2 - Math.random() * 2.2,
          size: 2 + Math.random() * 3.5,
          alpha: 0.35 + Math.random() * 0.55,
          color: Math.random() > 0.5 ? '#f97316' : '#eab308',
          angle: Math.random() * Math.PI * 2
        })
      } else if (weather === 'fog') {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: 0.08 + Math.random() * 0.2,
          vy: -0.04 + Math.random() * 0.08,
          size: 100 + Math.random() * 140,
          alpha: 0.04 + Math.random() * 0.08
        })
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (weather === 'none' || maxParticles === 0) return

      particles.forEach(p => {
        if (weather === 'rain') {
          ctx.beginPath()
          ctx.strokeStyle = `rgba(168, 85, 247, ${p.alpha})`
          ctx.lineWidth = p.size
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x + p.vx, p.y + p.vy)
          ctx.stroke()

          p.x += p.vx
          p.y += p.vy
          if (p.y > canvas.height || p.x < 0) {
            p.y = -10
            p.x = Math.random() * canvas.width
          }
        } else if (weather === 'snow') {
          ctx.beginPath()
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()

          p.angle += p.speed
          p.x += p.vx + Math.sin(p.angle) * 0.4
          p.y += p.vy
          if (p.y > canvas.height) {
            p.y = -10
            p.x = Math.random() * canvas.width
          }
        } else if (weather === 'embers') {
          ctx.beginPath()
          ctx.fillStyle = p.color
          ctx.shadowBlur = 8
          ctx.shadowColor = p.color
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0

          p.y += p.vy
          p.x += p.vx + Math.sin(p.y * 0.015) * 0.25
          if (p.y < -10) {
            p.y = canvas.height + 10
            p.x = Math.random() * canvas.width
            p.alpha = 0.35 + Math.random() * 0.55
          }
        } else if (weather === 'fog') {
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size)
          gradient.addColorStop(0, `rgba(147, 51, 234, ${p.alpha})`)
          gradient.addColorStop(0.5, `rgba(147, 51, 234, ${p.alpha * 0.4})`)
          gradient.addColorStop(1, 'rgba(147, 51, 234, 0)')

          ctx.beginPath()
          ctx.fillStyle = gradient
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()

          p.x += p.vx
          p.y += p.vy
          if (p.x - p.size > canvas.width) {
            p.x = -p.size
            p.y = Math.random() * canvas.height
          }
        }
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [weather])

  // Sync ambient audio locally based on global VTT state
  useEffect(() => {
    if (activeAudio?.playing && activeAudio?.url) {
      if (currentTrackUrl !== activeAudio.url) {
        if (audioRef.current) {
          audioRef.current.pause()
        }
        audioRef.current = new Audio(activeAudio.url)
        audioRef.current.loop = true
        audioRef.current.volume = 0.5
        audioRef.current.play().catch(err => console.log('Audio autoplay blocked by browser permissions.', err))
        setCurrentTrackUrl(activeAudio.url)
        setIsPlaying(true)
      } else if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(err => console.log(err))
        setIsPlaying(true)
      }
    } else {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause()
        setIsPlaying(false)
      }
    }

    return () => {
      // Clean up audio on dismount
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [activeAudio])

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
      if (state.activeAudio !== undefined) setActiveAudio(state.activeAudio)
      if (state.initiativeQueue !== undefined) setInitiativeQueue(state.initiativeQueue)
      if (state.activeInitiativeIndex !== undefined) setActiveInitiativeIndex(state.activeInitiativeIndex)
      if (state.weather !== undefined) setWeather(state.weather)
      if (state.lighting !== undefined) setLighting(state.lighting)
      if (state.owlbearUrl) setOwlbearUrl(state.owlbearUrl)
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
    updatedPings = pings,
    updatedAudio = activeAudio,
    updatedQueue = initiativeQueue,
    updatedQueueIndex = activeInitiativeIndex,
    currentWeather = weather,
    currentLighting = lighting,
    currentOwlbearUrl = owlbearUrl
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
        pings: updatedPings,
        activeAudio: updatedAudio,
        initiativeQueue: updatedQueue,
        activeInitiativeIndex: updatedQueueIndex,
        weather: currentWeather,
        lighting: currentLighting,
        owlbearUrl: currentOwlbearUrl
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
      auraColor: myCharacter.cor_energia || '#a855f7',
      statusBadges: [] // List of status effect codes
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
      auraColor: '#ef4444',
      statusBadges: []
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
    if (activeRadialTokenId === id) setActiveRadialTokenId(null)
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

  // HP Direct Modifier API Caller
  const applyHpDelta = async (charId, delta) => {
    if (hpUpdating) return
    const parsed = parseInt(delta)
    if (isNaN(parsed) || parsed === 0) {
      showCursedToast("Valor Inválido", "Por favor insira um delta numérico como +10 ou -5.", "warning")
      return
    }

    setHpUpdating(true)
    try {
      await axios.post(`/api/update_status/${charId}`, { pv_delta: parsed })
      showCursedToast("Vida Modificada", `Ajuste de ${parsed > 0 ? '+' : ''}${parsed} PV aplicado com sucesso.`, "success")
      setHpChangeVal('')
      setActiveRadialTokenId(null)
      fetchLobbyData(false)
    } catch (err) {
      console.error(err)
      showCursedToast("Erro de Invocação", "Não foi possível atualizar a integridade do feiticeiro.", "error")
    } finally {
      setHpUpdating(false)
    }
  }

  // --- LASER / APONTADOR HOLOGRÁFICO ---
  const triggerLaserPing = (coords) => {
    const pingColor = myCharacter?.cor_energia || '#a855f7'
    const userName = isMaster ? 'Mestre' : (myCharacter?.nome || lobbyData?.members?.find(m => m.user_id === lobbyData?.current_user_id)?.username || 'Jogador')
    const newPing = {
      id: `ping-${Date.now()}-${Math.random()}`,
      x: coords.x,
      y: coords.y,
      color: pingColor,
      name: userName
    }

    playCursedChime(880, 'sine')
    const nextPings = [...pings, newPing]
    setPings(nextPings)
    saveVTTState(tokens, drawings, fog, mapUrl, gridSize, gridVisible, gridColor, offsetX, offsetY, nextPings)

    setTimeout(() => {
      setPings(prev => {
        const filtered = prev.filter(p => p.id !== newPing.id)
        saveVTTState(tokens, drawings, fog, mapUrl, gridSize, gridVisible, gridColor, offsetX, offsetY, filtered)
        return filtered
      })
    }, 2500)
  }

  // --- AUDIO SYNCHRONIZED BOARD ---
  const playTrack = (track) => {
    if (!isMaster) return
    const updatedAudio = {
      url: track.url,
      name: track.name,
      playing: true
    }
    setActiveAudio(updatedAudio)
    saveVTTState(tokens, drawings, fog, mapUrl, gridSize, gridVisible, gridColor, offsetX, offsetY, pings, updatedAudio)
    playCursedChime(440, 'triangle')
    showCursedToast("Ressonância Espiritual", `Música ativada: ${track.name}`, "success")
  }

  const stopTrack = () => {
    if (!isMaster) return
    const updatedAudio = {
      url: '',
      name: 'Nenhuma',
      playing: false
    }
    setActiveAudio(updatedAudio)
    saveVTTState(tokens, drawings, fog, mapUrl, gridSize, gridVisible, gridColor, offsetX, offsetY, pings, updatedAudio)
    showCursedToast("Silêncio Sepulcral", "A atmosfera de combate foi pausada.", "info")
  }

  // --- INITIATIVE TRACKER HANDLERS ---
  const addCharacterToInitiative = (char) => {
    if (!isMaster) return
    if (initiativeQueue.some(i => i.id === `char-${char.id}`)) return
    
    const newQueue = [...initiativeQueue, {
      id: `char-${char.id}`,
      name: char.nome,
      roll: 10 + Math.floor(Math.random() * 10),
      color: char.cor_energia || '#a855f7'
    }].sort((a, b) => b.roll - a.roll)

    setInitiativeQueue(newQueue)
    saveVTTState(tokens, drawings, fog, mapUrl, gridSize, gridVisible, gridColor, offsetX, offsetY, pings, activeAudio, newQueue)
  }

  const addCustomNPCToInitiative = () => {
    if (!isMaster) return
    const name = npcName.trim() || 'Maldição Comum'
    const newQueue = [...initiativeQueue, {
      id: `npc-${Date.now()}`,
      name,
      roll: 10 + Math.floor(Math.random() * 10),
      color: '#ef4444'
    }].sort((a, b) => b.roll - a.roll)

    setInitiativeQueue(newQueue)
    saveVTTState(tokens, drawings, fog, mapUrl, gridSize, gridVisible, gridColor, offsetX, offsetY, pings, activeAudio, newQueue)
    setNpcName('')
  }

  const advanceInitiativeTurn = () => {
    if (!isMaster || initiativeQueue.length === 0) return
    const nextIndex = (activeInitiativeIndex + 1) % initiativeQueue.length
    setActiveInitiativeIndex(nextIndex)
    saveVTTState(tokens, drawings, fog, mapUrl, gridSize, gridVisible, gridColor, offsetX, offsetY, pings, activeAudio, initiativeQueue, nextIndex)
  }

  const clearInitiativeQueue = () => {
    if (!isMaster) return
    setInitiativeQueue([])
    setActiveInitiativeIndex(0)
    saveVTTState(tokens, drawings, fog, mapUrl, gridSize, gridVisible, gridColor, offsetX, offsetY, pings, activeAudio, [], 0)
    showCursedToast("Fila Dissipada", "Ordem de iniciativa limpa pelo Mestre.", "info")
  }

  // --- MOUSE & EVENT HANDLERS ---
  const getCoordinates = (e) => {
    if (!mapRef.current) return { x: 0, y: 0 }
    const rect = mapRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) / (zoom || 1),
      y: (clientY - rect.top) / (zoom || 1)
    }
  }

  const handleWheel = (e) => {
    if (activeTool === 'fog_hide' || activeTool === 'fog_reveal') return
    const zoomFactor = 1.08
    let newZoom = zoom
    if (e.deltaY < 0) {
      newZoom = Math.min(zoom * zoomFactor, 4)
    } else {
      newZoom = Math.max(zoom / zoomFactor, 0.25)
    }
    setZoom(newZoom)
  }

  const handleMouseDown = (e) => {
    const isPanAction = spacePressed || e.button === 1 || (activeTool === 'move' && !draggedTokenId)
    if (isPanAction) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      return
    }

    if (e.button !== 0) return 
    const coords = getCoordinates(e)

    if (activeTool === 'draw') {
      setIsDrawing(true)
      setCurrentLine({
        type: 'brush',
        points: [coords],
        color: drawColor,
        width: drawWidth
      })
    } else if (activeTool === 'line' || activeTool === 'rect' || activeTool === 'circle') {
      setIsDrawing(true)
      setCurrentLine({
        type: activeTool,
        start: coords,
        end: coords,
        color: drawColor,
        width: drawWidth
      })
    } else if (activeTool === 'laser') {
      triggerLaserPing(coords)
    } else if (activeTool === 'erase') {
      if (isMaster) {
        const nextDrawings = drawings.filter(d => {
          if (d.type === 'brush') {
            return !d.points.some(p => Math.hypot(p.x - coords.x, p.y - coords.y) < 20)
          } else {
            const startDist = Math.hypot(d.start.x - coords.x, d.start.y - coords.y)
            const endDist = Math.hypot(d.end.x - coords.x, d.end.y - coords.y)
            return startDist > 20 && endDist > 20
          }
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
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
      return
    }

    if (draggedTokenId) {
      handleTokenDrag(e)
      return
    }

    const coords = getCoordinates(e)

    if (isDrawing && currentLine) {
      if (currentLine.type === 'brush') {
        setCurrentLine(prev => ({
          ...prev,
          points: [...prev.points, coords]
        }))
      } else {
        setCurrentLine(prev => ({
          ...prev,
          end: coords
        }))
      }
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
    if (isPanning) {
      setIsPanning(false)
      return
    }

    if (draggedTokenId) {
      handleTokenDragEnd()
      return
    }

    if (isDrawing && currentLine) {
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

  // --- TOKEN DRAGGING ---
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
    
    // Snap to nearest grid center with Offset offset
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

  // Toggle status effect floting badge on a token
  const toggleTokenStatusBadge = (tokenId, code) => {
    const token = tokens.find(t => t.id === tokenId)
    if (!token) return
    const activeBadges = token.statusBadges || []
    const nextBadges = activeBadges.includes(code)
      ? activeBadges.filter(b => b !== code)
      : [...activeBadges, code]
      
    updateTokenAttribute(tokenId, 'statusBadges', nextBadges)
  }

  // --- MAP SETTINGS ---
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
    playCursedChime(329, 'sawtooth')
    showCursedToast("Território Sintonizado", `Arena alterada para: ${name}`, "success")
  }

  const clearVTTDrawingsAndFog = () => {
    if (!isMaster) return
    setDrawings([])
    setFog({})
    saveVTTState(tokens, [], {})
    showCursedToast("Limpeza Concluída", "Desenhos e névoa foram completamente dissipados.", "info")
  }

  return (
    <div className="w-full flex flex-col gap-5 items-stretch font-sans text-left relative z-20">
      
      {/* VTT Toolbox Bar */}
      <div className="w-full bg-neutral-950/80 border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Tool selectors */}
          {[
            { id: 'move', label: 'Mover', icon: Move },
            { id: 'ruler', label: 'Régua', icon: Ruler },
            { id: 'laser', label: 'Laser', icon: Flame },
            { id: 'draw', label: 'Pincel', icon: PenTool },
            { id: 'line', label: 'Linha', icon: StopIcon },
            { id: 'rect', label: 'Retângulo', icon: Square },
            { id: 'circle', label: 'Círculo', icon: CircleIcon },
            { id: 'erase', label: 'Borracha', icon: Eraser }
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTool(tool.id)
                setSelectedTokenId(null)
                setActiveRadialTokenId(null)
                playCursedChime(523, 'triangle')
              }}
              className={`px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border cursor-pointer transition-all duration-300 flex items-center gap-1.5 hover:scale-105 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] active:scale-95 ${
                activeTool === tool.id
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)]'
                  : 'bg-neutral-950 border-white/5 text-gray-400 hover:text-white hover:border-white/10'
              }`}
            >
              <tool.icon className="w-3.5 h-3.5" /> {tool.label}
            </button>
          ))}

          {/* Master Only Fog Controls */}
          {isMaster && (
            <div className="flex items-center gap-2 border-l border-white/10 pl-2">
              <button
                onClick={() => {
                  setActiveTool('fog_hide')
                  setActiveRadialTokenId(null)
                }}
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
                onClick={() => {
                  setActiveTool('fog_reveal')
                  setActiveRadialTokenId(null)
                }}
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

          {/* VTT Panels triggers */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setShowInitiative(!showInitiative)
                setShowSoundboard(false)
                setShowConfig(false)
              }}
              className={`px-3.5 py-2 border rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all ${
                showInitiative ? 'bg-purple-950 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'bg-neutral-900 border-white/10 text-gray-300 hover:text-white'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-purple-400 animate-pulse" /> Iniciativa
            </button>

            <button
              onClick={() => {
                setShowSoundboard(!showSoundboard)
                setShowInitiative(false)
                setShowConfig(false)
              }}
              className={`px-3.5 py-2 border rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all ${
                showSoundboard ? 'bg-purple-950 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.2)]' : 'bg-neutral-900 border-white/10 text-gray-300 hover:text-white'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5 text-purple-400" /> Atmosfera
            </button>
          </div>

          {/* Master Only Config & Cleaning Panel */}
          {isMaster && (
            <div className="flex items-center gap-1.5 border-l border-white/10 pl-1.5">
              <button
                onClick={() => {
                  setShowConfig(!showConfig)
                  setShowInitiative(false)
                  setShowSoundboard(false)
                }}
                className={`px-3.5 py-2 border rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all ${
                  showConfig ? 'bg-purple-950 border-purple-500 text-purple-300' : 'bg-neutral-900 border-white/10 text-gray-300 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-purple-400" /> Alinhamento
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
          
          {/* Synced Audio Status Badge */}
          {activeAudio?.playing && (
            <div className="absolute top-4 left-4 z-40 bg-purple-950/90 border border-purple-500/40 rounded-full px-3 py-1 text-[8px] font-extrabold uppercase text-white tracking-widest flex items-center gap-1.5 shadow-lg">
              <Volume2 className="w-3.5 h-3.5 text-purple-400 animate-bounce" /> {activeAudio.name}
            </div>
          )}

          <div className="w-full bg-[#05040a] rounded-3xl border border-purple-500/20 shadow-2xl relative overflow-hidden h-[650px] shadow-[0_0_20px_rgba(139,92,246,0.1)]">
            {/* Embedded Owlbear Rodeo Room (JJK calibrated proxy) */}
            <iframe
              src={owlbearUrl.replace(/https?:\/\/(www\.)?owlbear\.rodeo\//, '/')}
              title="Owlbear Rodeo VTT"
              className="w-full h-full border-0"
              allow="autoplay; camera; microphone; fullscreen; clipboard-read; clipboard-write; picture-in-picture"
            />
          </div>

          {/* Real-time Battle Logs Overlay inside VTT (Cinematic glassHUD) */}
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
          
          {/* Master Map & Grid Calibration panel */}
          {isMaster && showConfig && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-md bg-neutral-950/60 border border-purple-500/20 shadow-[0_4px_30px_rgba(139,92,246,0.05),_inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-5 flex flex-col gap-4 shadow-2xl animate-fade-in"
            >
              <h4 className="text-xs font-black text-white font-jujutsu border-b border-white/5 pb-2 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-purple-400" /> Alinhamento do Campo
              </h4>

              <div className="flex flex-col gap-3 font-sans">
                {/* Custom Owlbear Rodeo Room Link input */}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Sala Owlbear Rodeo Ativa</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Cole a URL da sala Owlbear..."
                      value={owlbearUrl}
                      onChange={(e) => setOwlbearUrl(e.target.value)}
                      className="px-3 py-1.5 rounded-lg text-xs bg-neutral-900 border border-white/10 text-white focus:outline-none flex-grow min-w-0"
                    />
                    <button
                      onClick={() => {
                        saveVTTState(
                          tokens, drawings, fog, mapUrl, gridSize, gridVisible, gridColor, offsetX, offsetY, 
                          pings, activeAudio, initiativeQueue, activeInitiativeIndex, weather, lighting, owlbearUrl
                        )
                        playCursedChime(523, 'sine')
                        showCursedToast("Arena Sintonizada", "O link do Owlbear Rodeo foi sincronizado com sucesso.", "success")
                      }}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg cursor-pointer border-0 animate-pulse"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Synced Audio Soundscape Panel VTT 3.0 */}
          {showSoundboard && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-md bg-neutral-950/60 border border-purple-500/20 shadow-[0_4px_30px_rgba(139,92,246,0.05),_inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-5 flex flex-col gap-4 shadow-2xl animate-fade-in"
            >
              <h4 className="text-xs font-black text-white font-jujutsu border-b border-white/5 pb-2 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-purple-400" /> Atmosfera de Combate
              </h4>

              <div className="flex flex-col gap-3 font-sans">
                {isMaster ? (
                  <>
                    <p className="text-[9px] text-gray-400 leading-relaxed">
                      Selecione um tema de fundo. A música tocará de forma sincronizada nos alto-falantes de todos os jogadores no lobby!
                    </p>

                    <div className="flex flex-col gap-2">
                      {AUDIO_TRACKS.map((track, idx) => {
                        const isPlayingThis = activeAudio?.url === track.url && activeAudio?.playing
                        return (
                          <button
                            key={idx}
                            onClick={() => isPlayingThis ? stopTrack() : playTrack(track)}
                            className={`px-3 py-2 rounded-xl text-[9px] font-black border uppercase tracking-wider transition-all flex items-center justify-between cursor-pointer ${
                              isPlayingThis
                                ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                                : 'bg-neutral-900 border-white/5 text-gray-400 hover:text-white'
                            }`}
                          >
                            <span>{track.name}</span>
                            {isPlayingThis ? <Volume2 className="w-3.5 h-3.5 text-white animate-bounce" /> : <Play className="w-3 h-3 text-gray-400" />}
                          </button>
                        )
                      })}
                    </div>

                    {activeAudio?.playing && (
                      <button
                        onClick={stopTrack}
                        className="w-full py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/25 text-red-400 rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer mt-1"
                      >
                        Silenciar Ambiente
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] text-gray-400 leading-relaxed">
                      O Mestre controla a atmosfera espiritual. Caso uma trilha sonora esteja ativa, o som ecoará sincronizado.
                    </p>
                    <div className="p-3 bg-neutral-900/60 rounded-xl border border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-purple-300 font-extrabold uppercase">Status</span>
                      <span className="text-[10px] text-white font-extrabold">
                        {isPlaying ? 'Ressonando Som' : 'Silenciado'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* VTT Initiative Queue Tracker VTT 3.0 (Sleek turn panel) */}
          {showInitiative && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-md bg-neutral-950/60 border border-purple-500/20 shadow-[0_4px_30px_rgba(139,92,246,0.05),_inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-5 flex flex-col gap-4 shadow-2xl animate-fade-in font-sans"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <h4 className="text-xs font-black text-white font-jujutsu flex items-center gap-1.5 leading-none">
                  <Swords className="w-4 h-4 text-purple-400 animate-pulse" /> Fila de Iniciativa
                </h4>
                {isMaster && initiativeQueue.length > 0 && (
                  <button 
                    onClick={clearInitiativeQueue}
                    className="text-[8px] font-black uppercase text-red-400 hover:text-white cursor-pointer bg-transparent border-0"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {initiativeQueue.length === 0 ? (
                <div className="flex flex-col gap-2 py-3 text-center">
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    Nenhum feiticeiro ou inimigo adicionado à rodada.
                  </p>
                  {isMaster && (
                    <div className="flex flex-col gap-1.5 mt-2">
                      <span className="text-[8px] text-gray-500 font-extrabold uppercase tracking-widest block text-left">Auto Inserir</span>
                      {activeCharacters.map(char => (
                        <button
                          key={char.id}
                          onClick={() => addCharacterToInitiative(char)}
                          className="px-2 py-1.5 bg-neutral-900 border border-white/5 hover:border-white/10 text-white rounded text-[8px] font-bold uppercase tracking-wider text-left cursor-pointer truncate"
                        >
                          + {char.nome}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-0.5 custom-scrollbar">
                    {initiativeQueue.map((item, idx) => {
                      const isActive = activeInitiativeIndex === idx
                      return (
                        <div 
                          key={item.id} 
                          className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                            isActive 
                              ? 'bg-purple-950/25 border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.2)]' 
                              : 'bg-neutral-900/40 border-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isActive && <ChevronRight className="w-3.5 h-3.5 text-purple-400 shrink-0 animate-pulse" />}
                            <span 
                              className="w-1.5 h-1.5 rounded-full shrink-0" 
                              style={{ backgroundColor: item.color }}
                            />
                            <span className={`text-[10px] font-extrabold truncate ${isActive ? 'text-white' : 'text-gray-400'}`}>
                              {item.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-black font-mono text-purple-400">
                            Inic: {item.roll}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {isMaster && (
                    <button
                      onClick={advanceInitiativeTurn}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl cursor-pointer active:scale-95 transition-all border-0 shadow-[0_0_10px_rgba(168,85,247,0.2)] mt-2"
                    >
                      Próximo Turno de Combate
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Active Token options (if selected) */}
          {selectedTokenId && !activeRadialTokenId && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="backdrop-blur-md bg-neutral-950/60 border border-purple-500/20 shadow-[0_4px_30px_rgba(139,92,246,0.05),_inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-2xl p-5 flex flex-col gap-4 shadow-2xl"
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
                          className="text-red-400 hover:text-red-300 cursor-pointer border-0 bg-transparent"
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
            <div className="glass-card rounded-2xl p-5 border border-white/5 flex flex-col gap-4 bg-black/20 font-sans">
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

          {/* Master Map & Grid Calibration panel */}
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

                {/* Weather & Lighting Controls (Master only synced VTT 3.0) */}
                <div className="flex flex-col gap-2.5 border-t border-white/5 pt-2.5">
                  <span className="text-[9px] text-purple-300 font-extrabold uppercase tracking-wider block">Atmosfera do Domínio</span>
                  
                  {/* Weather Selection */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[8px] text-gray-400 font-extrabold uppercase tracking-wider">Clima Climatológico</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { id: 'none', label: 'Límpido' },
                        { id: 'rain', label: 'Chuva Amaldiçoada' },
                        { id: 'snow', label: 'Gelo Polar' },
                        { id: 'embers', label: 'Brasas de Jogo' },
                        { id: 'fog', label: 'Névoa Vazia' }
                      ].map(w => (
                        <button
                          key={w.id}
                          onClick={() => {
                            setWeather(w.id)
                            saveVTTState(
                              tokens, drawings, fog, mapUrl, gridSize, gridVisible, gridColor, offsetX, offsetY, 
                              pings, activeAudio, initiativeQueue, activeInitiativeIndex, w.id, lighting
                            )
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[8px] font-black uppercase truncate border transition-all cursor-pointer border-0 ${
                            weather === w.id
                              ? 'bg-purple-950/30 border-purple-500/40 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                              : 'bg-neutral-900 border-white/5 text-gray-500 hover:text-white'
                          }`}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ambient Lighting Selection */}
                  <div className="flex flex-col gap-1 mt-1">
                    <label className="text-[8px] text-gray-400 font-extrabold uppercase tracking-wider">Iluminação Inata</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'day', label: 'Luz Plena' },
                        { id: 'night', label: 'Crepúsculo Roxo' },
                        { id: 'eclipse', label: 'Eclipse Sangue' }
                      ].map(l => (
                        <button
                          key={l.id}
                          onClick={() => {
                            setLighting(l.id)
                            saveVTTState(
                              tokens, drawings, fog, mapUrl, gridSize, gridVisible, gridColor, offsetX, offsetY, 
                              pings, activeAudio, initiativeQueue, activeInitiativeIndex, weather, l.id
                            )
                          }}
                          className={`px-2 py-1.5 rounded-lg text-[8px] font-black uppercase truncate border transition-all cursor-pointer border-0 ${
                            lighting === l.id
                              ? 'bg-purple-950/30 border-purple-500/40 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                              : 'bg-neutral-900 border-white/5 text-gray-500 hover:text-white'
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Grid Offset and size sliders */}
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
