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
                onClick={() => {
                  saveVTTState(
                    tokens, drawings, fog, mapUrl, gridSize, gridVisible, gridColor, offsetX, offsetY, 
                    pings, activeAudio, initiativeQueue, activeInitiativeIndex, weather, lighting, owlbearUrl
                  )
                  playCursedChime(523, 'sine')
                  showCursedToast("Arena Sintonizada", "O link do Owlbear Rodeo foi sincronizado com sucesso.", "success")
                }}
                className="px-2 py-1 bg-purple-750 hover:bg-purple-600 border-0 text-white font-extrabold text-[9px] rounded cursor-pointer transition-all"
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
