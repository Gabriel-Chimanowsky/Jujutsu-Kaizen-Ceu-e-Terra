import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { showCursedToast } from '../utils/toast'
import AttributesRadarChart from '../components/AttributesRadarChart'
import CursedLogo from '../components/CursedLogo'
import { showConfirmModal } from '../utils/confirm'
import { rollDice } from '../utils/dice'
import { 
  Zap, 
  Swords, 
  Shield, 
  Scroll, 
  Sparkles, 
  RotateCw,
  FolderOpen, 
  Eye, 
  Skull, 
  FileText, 
  User, 
  ArrowLeft, 
  Compass, 
  Trash2, 
  Save, 
  Settings, 
  Camera, 
  Heart, 
  Plus, 
  Briefcase, 
  Brain, 
  Activity, 
  PawPrint, 
  Scale, 
  Search, 
  Dice5
} from 'lucide-react'

export default function FichaView({ characterId, navigate }) {
  const [loading, setLoading] = useState(true)
  const [char, setChar] = useState(null)
  const [activeTab, setActiveTab] = useState('atributos')
  const [lobbyMembros, setLobbyMembros] = useState([])
  const [selectedTargetId, setSelectedTargetId] = useState('')
  
  // Custom step adjustments states for vitals panel
  const [pvAdjust, setPvAdjust] = useState(5)
  const [peAdjust, setPeAdjust] = useState(5)
  const [almaAdjust, setAlmaAdjust] = useState(5)
  
  // Modals visibility states
  const [showAddAttack, setShowAddAttack] = useState(false)
  const [showAddSpell, setShowAddSpell] = useState(false)
  const [showAddTalent, setShowAddTalent] = useState(false)
  const [showAddSummon, setShowAddSummon] = useState(false)
  const [showAddItem, setShowAddItem] = useState(false)

  // Editing states
  const [editingAttack, setEditingAttack] = useState(null)
  const [editingSpell, setEditingSpell] = useState(null)
  const [editingTalent, setEditingTalent] = useState(null)
  const [editingSummon, setEditingSummon] = useState(null)

  // Attribute Evolution Local Allocation
  const [allocatedAttrs, setAllocatedAttrs] = useState({
    forca: 0, destreza: 0, constituicao: 0, inteligencia: 0, sabedoria: 0, presenca: 0
  })

  // Basic physical updates state
  const [isEditingBasics, setIsEditingBasics] = useState(false)
  const [basicForm, setBasicForm] = useState({
    nome: '', especializacao: '', grau: '', peso: '', altura: '', afiliacao: '', votos_ativos: '', cor_energia: ''
  })

  // Excel sync state & ref
  const [syncingExcel, setSyncingExcel] = useState(false)
  const excelInputRef = useRef(null)

  // Avatar upload & native cropping states
  const [cropperOpen, setCropperOpen] = useState(false)
  const [rawImage, setRawImage] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [rotation, setRotation] = useState(0)
  const [isSavingAvatar, setIsSavingAvatar] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const avatarInputRef = useRef(null)

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPanX(e.clientX - dragStart.x)
    setPanY(e.clientY - dragStart.y)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      setDragStart({ x: e.touches[0].clientX - panX, y: e.touches[0].clientY - panY })
    }
  }

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return
    setPanX(e.touches[0].clientX - dragStart.x)
    setPanY(e.touches[0].clientY - dragStart.y)
  }

  const getCoverDimensions = () => {
    if (!imageSize.width || !imageSize.height) return { width: 256, height: 256, scaleToFitFactor: 1 }
    const scaleToFitFactor = Math.max(256 / imageSize.width, 256 / imageSize.height)
    return {
      width: imageSize.width * scaleToFitFactor,
      height: imageSize.height * scaleToFitFactor,
      scaleToFitFactor
    }
  }

  const { scaleToFitFactor } = getCoverDimensions()

  const handleAvatarChange = (e) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        setImageSize({ width: img.width, height: img.height })
        setRawImage(event.target.result)
        setZoom(1)
        setPanX(0)
        setPanY(0)
        setRotation(0)
        setCropperOpen(true)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleCropAndSave = async () => {
    if (!rawImage) return
    
    const img = new Image()
    img.src = rawImage
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 256
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        showCursedToast("Erro", "Não foi possível criar o contexto 2D.", "error")
        return
      }
      
      ctx.clearRect(0, 0, 256, 256)
      ctx.save()
      
      // Translate to canvas center
      ctx.translate(128 + panX, 128 + panY)
      
      // Rotate
      ctx.rotate((rotation * Math.PI) / 180)
      
      // Scale
      const totalScale = zoom * scaleToFitFactor
      ctx.scale(totalScale, totalScale)
      
      // Draw centered
      ctx.drawImage(img, -imageSize.width / 2, -imageSize.height / 2, imageSize.width, imageSize.height)
      
      ctx.restore()
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
          showCursedToast("Erro", "Falha ao gerar o recorte.", "error")
          return
        }
        
        const formData = new FormData()
        formData.append('file', blob, 'avatar.png')
        
        try {
          setIsSavingAvatar(true)
          const res = await axios.post(`/api/upload_avatar/${char.id}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
          setChar(res.data.character)
          setCropperOpen(false)
          setRawImage(null)
          showCursedToast("Selo da Alma", "Seu novo retrato foi selado na ficha!", "success")
        } catch (err) {
          console.error(err)
          showCursedToast("Falha de Selamento", err.response?.data?.error || "Erro de conexão.", "error")
        } finally {
          setIsSavingAvatar(false)
        }
      }, 'image/png')
    }
  }

  const handleExcelSyncUpload = async (e) => {
    if (!e.target.files || !e.target.files[0]) return
    const file = e.target.files[0]
    if (!file.name.endsWith('.xlsx')) {
      showCursedToast("Arquivo Inválido", "Por favor, envie apenas arquivos de planilha do Excel (.xlsx)!", "error")
      return
    }

    setSyncingExcel(true)
    showCursedToast("Sincronizando Planilha", "Enviando arquivo e recalculando ficha no servidor...", "info")

    try {
      const formData = new FormData()
      formData.append('file', file)
      
      await axios.post(`/api/import_excel/${char.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      showCursedToast("Sincronização Concluída", "Sua ficha foi atualizada e os limites recalculados!", "success")
      await loadCharacterData(true)
    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.error || "Erro desconhecido ao processar a sincronização."
      showCursedToast("Erro de Sincronia", errorMsg, "error")
    } finally {
      setSyncingExcel(false)
      if (excelInputRef.current) excelInputRef.current.value = ""
    }
  }

  const [googleSheetsUrl, setGoogleSheetsUrl] = useState("")
  const [syncingGoogleSheets, setSyncingGoogleSheets] = useState(false)

  const handleGoogleSheetsSync = async () => {
    if (!googleSheetsUrl) {
      showCursedToast("URL Vazia", "Por favor, insira o link do Google Sheets!", "error")
      return
    }
    setSyncingGoogleSheets(true)
    showCursedToast("Sincronizando Google Sheets", "Baixando planilha e reescrevendo ficha...", "info")
    try {
      const res = await axios.post(`/api/import_excel_url/${char.id}`, { url: googleSheetsUrl })
      setChar(res.data.character)
      showCursedToast("Sincronização Concluída", "Sua ficha foi totalmente reescrita com os dados da planilha!", "success")
      setGoogleSheetsUrl("")
    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.error || "Erro de sincronização. Verifique se a planilha é pública."
      showCursedToast("Erro de Sincronia", errorMsg, "error")
    } finally {
      setSyncingGoogleSheets(false)
    }
  }

  const handleUpdateAttackJogada = async (category, field, value) => {
    try {
      const currentConfig = { ...(char.configuracoes || {}) }
      const currentCat = { ...(currentConfig[category] || {}) }
      currentCat[field] = value
      currentConfig[category] = currentCat
      
      const res = await axios.post(`/api/update_attack_jogadas/${char.id}`, currentConfig)
      setChar(res.data.character)
      showCursedToast("Ataque Calibrado", "Jogadas de ataque atualizadas com sucesso!", "success")
    } catch (err) {
      console.error(err)
      showCursedToast("Erro de Calibragem", "Não foi possível calibrar a jogada.", "error")
    }
  }

  // Modal forms states
  const [attackForm, setAttackForm] = useState({
    nome: '', pericia: 'Luta', dano_dados: '1d6', dano_attr: 'forca', bonus_acerto: 0, bonus_dano: 0, critico: '20 / x2', alcance: 'Corpo a Corpo', tipo: 'Impacto'
  })
  const [spellForm, setSpellForm] = useState({
    nome: '', nivel: 1, custo: 2, acao: 'Padrão', alcance: 'Médio', duracao: 'Instantânea', dano: '3d8', descricao: '', tipo: 'Ativo'
  })

  // Automatic predetermined PE cost/reduction calculation helper based JJK 2.5
  const updateSpellLevelOrType = (field, value) => {
    setSpellForm(prev => {
      const updated = { ...prev, [field]: value };
      const lvl = updated.nivel;
      const t = updated.tipo;
      if (t === 'Passivo') {
        const map = { 0: 0, 1: 2, 2: 4, 3: 6, 4: 8, 5: 10 };
        updated.custo = map[lvl] !== undefined ? map[lvl] : lvl * 2;
      } else {
        const map = { 0: 0, 1: 2, 2: 5, 3: 8, 4: 12, 5: 20 };
        updated.custo = map[lvl] !== undefined ? map[lvl] : lvl * 4;
      }
      return updated;
    });
  }
  const [talentForm, setTalentForm] = useState({
    nome: '', tipo: 'Classe', custo: 0, execucao: 'Ação Padrão', alcance: 'Pessoal', duracao: 'Instantânea', descricao: '', dado_rolagem: ''
  })
  const [summonForm, setSummonForm] = useState({
    nome: '', hp_max: 10, pe_max: 5, ataque: '1d6+2', defesa: 12, desc: ''
  })
  const [itemForm, setItemForm] = useState({
    nome: '', qtd: 1, peso: 0.5
  })

  // Notes/Diary state
  const [notes, setNotes] = useState('')
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  // Pericia/Resistance editing states
  const [editingPericia, setEditingPericia] = useState(null) // { nome, treinada, bonus }
  const [editingResistance, setEditingResistance] = useState(null) // { nome, treinada, mestre, bonus }

  // Load character data from server
  const loadCharacterData = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const res = await axios.get(`/ficha/${characterId}`, {
        params: { format: 'json' },
        headers: { 'Accept': 'application/json' }
      })
      setChar(res.data)
      setNotes(res.data.anotacoes || '')
      setBasicForm({
        nome: res.data.nome || '',
        especializacao: res.data.especializacao || '',
        grau: res.data.grau || '',
        peso: res.data.peso || '72kg',
        altura: res.data.altura || '1.82m',
        afiliacao: res.data.afiliacao || 'Colégio Técnico de Jujutsu',
        votos_ativos: res.data.votos_ativos || 'Revelação da Técnica (+2 CD Feitiços)',
        cor_energia: res.data.cor_energia || '#8a2be2'
      })
      // Set the dynamic cursed color theme based on loaded character
      if (res.data.cor_energia && typeof window.updateCursedColor === 'function') {
        window.updateCursedColor(res.data.cor_energia)
      } else if (res.data.cor_energia) {
        // Fallback injector
        document.documentElement.style.setProperty('--cursed-color', res.data.cor_energia)
        const cleanHex = res.data.cor_energia.replace('#', '')
        if (cleanHex.length === 6) {
          const r = parseInt(cleanHex.substring(0, 2), 16)
          const g = parseInt(cleanHex.substring(2, 4), 16)
          const b = parseInt(cleanHex.substring(4, 6), 16)
          document.documentElement.style.setProperty('--cursed-color-rgb', `${r}, ${g}, ${b}`)
        }
      }
    } catch (err) {
      console.error("Error loading character:", err)
      showCursedToast("Conexão Fracassada", "Não foi possível resgatar esta ficha.", "error")
      navigate('/lobby')
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  // Load current lobby to fill out targets
  const loadLobbyTargets = async () => {
    try {
      const response = await axios.get('/lobby', {
        params: { format: 'json' },
        headers: { 'Accept': 'application/json' }
      })
      if (response.data && response.data.in_lobby) {
        // Filter out this active character from target selections
        const membersList = response.data.characters.filter(c => c.id !== parseInt(characterId))
        setLobbyMembros(membersList)
      }
    } catch (err) {
      console.error("Error loading target list:", err)
    }
  }

  useEffect(() => {
    setTimeout(() => {
      loadCharacterData(true)
      loadLobbyTargets()
    }, 0)

    // Sintoniza em polling para receber atualizações do mestre (ex: XP ou alteração de atributos)
    const interval = setInterval(() => {
      loadCharacterData(false)
    }, 5000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId])

  if (loading || !char) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative z-20">
        <Sparkles className="w-12 h-12 text-purple-400 animate-spin filter drop-shadow-[0_0_8px_var(--cursed-color)]" />
        <p className="text-xs text-gray-500 font-sans tracking-widest uppercase mt-3">Carregando Barreira da Ficha...</p>
      </div>
    )
  }

  // RPG Stat calculations
  const calculateModifier = (val) => Math.floor((val - 10) / 2)
  const mods = {
    forca: calculateModifier(char.attributes?.forca || 10),
    destreza: calculateModifier(char.attributes?.destreza || 10),
    constituicao: calculateModifier(char.attributes?.constituicao || 10),
    inteligencia: calculateModifier(char.attributes?.inteligencia || 10),
    sabedoria: calculateModifier(char.attributes?.sabedoria || 10),
    presenca: calculateModifier(char.attributes?.presenca || 10)
  }

  const isRestringido = char?.origem?.toLowerCase() === 'restringido' || char?.especializacao?.toLowerCase() === 'restringido';

  // Vitals stats proportions
  const pvPercent = Math.max(0, Math.min(100, char.status?.pv_max > 0 ? ((char.status?.pv_atual || 0) / char.status?.pv_max) * 100 : 0))
  const pePercent = Math.max(0, Math.min(100, char.status?.pe_max > 0 ? ((char.status?.pe_atual || 0) / char.status?.pe_max) * 100 : 0))
  const intPercent = Math.max(0, Math.min(100, char.status?.integridade_max > 0 ? ((char.status?.integridade_atual || 0) / char.status?.integridade_max) * 100 : 0))

  // Sincronizações de status
  const handleUpdateStatus = async (fieldDelta, amount) => {
    try {
      const payload = {}
      payload[fieldDelta] = amount
      const res = await axios.post(`/api/update_status/${char.id}`, payload)
      setChar(res.data.character)
      showCursedToast("Vitalidade Sincronizada", "Vitals atualizadas com sucesso.", "success")
    } catch {
      showCursedToast("Erro de Limiar", "Falha ao alterar status.", "error")
    }
  }

  // Evolução de atributos local
  const changeAllocatedAttr = (attr, delta) => {
    const totalAllocated = Object.values(allocatedAttrs).reduce((a, b) => a + b, 0)
    const currentAllocated = allocatedAttrs[attr]

    if (delta > 0 && totalAllocated >= char.pontos_atributos) {
      showCursedToast("Limite de Evolução", "Nenhum ponto de atributo disponível.", "warning")
      return
    }
    if (delta < 0 && currentAllocated <= 0) return

    setAllocatedAttrs(prev => ({
      ...prev,
      [attr]: prev[attr] + delta
    }))
  }

  const handleConfirmEvolution = async () => {
    const totalAllocated = Object.values(allocatedAttrs).reduce((a, b) => a + b, 0)
    if (totalAllocated === 0) return

    const confirm = await showConfirmModal(
      "Confirmar Técnica do Despertar",
      `Deseja fundir definitivamente estes +${totalAllocated} pontos na sua alma?`
    )
    if (!confirm) return

    try {
      const payload = {
        forca: (char.attributes?.forca || 10) + allocatedAttrs.forca,
        destreza: (char.attributes?.destreza || 10) + allocatedAttrs.destreza,
        constituicao: (char.attributes?.constituicao || 10) + allocatedAttrs.constituicao,
        inteligencia: (char.attributes?.inteligencia || 10) + allocatedAttrs.inteligencia,
        sabedoria: (char.attributes?.sabedoria || 10) + allocatedAttrs.sabedoria,
        presenca: (char.attributes?.presenca || 10) + allocatedAttrs.presenca
      }
      const res = await axios.post(`/api/confirm_attributes/${char.id}`, payload)
      setChar(res.data.character)
      setAllocatedAttrs({ forca: 0, destreza: 0, constituicao: 0, inteligencia: 0, sabedoria: 0, presenca: 0 })
      showCursedToast("Alma Lapidada", "Atributos evoluídos e gravados na barreira do destino!", "success")
    } catch (err) {
      showCursedToast("Erros de Conjunção", err.response?.data?.error || "Erro ao sintonizar evolução.", "error")
    }
  }

  // Update physical details basics
  const handleSaveBasics = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`/api/update_character_basics/${char.id}`, basicForm)
      setChar(res.data.character)
      setIsEditingBasics(false)
      showCursedToast("Ficha Polida", "Registros básicos atualizados.", "success")
    } catch {
      showCursedToast("Erro", "Falha ao salvar registros físicos.", "error")
    }
  }

  // Skill updates
  const handleOpenEditPericia = (name, pData) => {
    setEditingPericia({ nome: name, treinada: pData.treinada, bonus: pData.bonus || 0 })
  }

  const handleSavePericia = async () => {
    if (!editingPericia) return
    try {
      const res = await axios.post(`/api/update_pericias/${char.id}`, {
        nome: editingPericia.nome,
        treinada: editingPericia.treinada,
        bonus: parseInt(editingPericia.bonus)
      })
      setChar(res.data.character)
      setEditingPericia(null)
      showCursedToast("Perícia Moldada", `Conhecimento em "${editingPericia.nome}" ajustado.`, "success")
    } catch {
      showCursedToast("Erro", "Não foi possível calibrar perícia.", "error")
    }
  }

  // Resistance updates
  const handleOpenEditResistance = (name, rData) => {
    setEditingResistance({ nome: name, treinada: rData.treinada, mestre: rData.mestre || false, bonus: rData.bonus || 0 })
  }

  const handleSaveResistance = async () => {
    if (!editingResistance) return
    try {
      const res = await axios.post(`/api/update_resistencias/${char.id}`, {
        resistencias: {
          ...char.resistencias,
          [editingResistance.nome]: {
            ...char.resistencias[editingResistance.nome],
            treinada: editingResistance.treinada,
            mestre: editingResistance.mestre,
            bonus: parseInt(editingResistance.bonus)
          }
        }
      })
      setChar(res.data.character)
      setEditingResistance(null)
      showCursedToast("Alma Fortalecida", `Resistência "${editingResistance.nome}" gravada.`, "success")
    } catch {
      showCursedToast("Erro", "Não foi possível calibrar resistência.", "error")
    }
  }

  // Click rolls triggers
  const triggerAttrRoll = (attrName, score) => {
    const mod = calculateModifier(score)
    const sign = mod >= 0 ? '+' : ''
    const formula = `1d20${sign}${mod}`
    rollDice(formula, `Atributo: ${attrName.toUpperCase()}`, mod)
  }

  const triggerPericiaRoll = (name, pData) => {
    const attrName = pData.attr
    const attrMod = mods[attrName] || 0
    const trainedBonus = pData.treinada ? char.training_bonus : 0
    const mestreBonus = pData.mestre ? char.training_bonus : 0 // JJK standard allows mestre multipliers
    const finalBonus = attrMod + char.half_level + trainedBonus + mestreBonus + (pData.bonus || 0)
    const sign = finalBonus >= 0 ? '+' : ''
    const formula = `1d20${sign}${finalBonus}`
    rollDice(formula, `Perícia: ${name}`, finalBonus)
  }

  const triggerResistanceRoll = (name, rData) => {
    const attrName = rData.attr
    const attrMod = mods[attrName] || 0
    const trainedBonus = rData.treinada ? char.training_bonus : 0
    const mestreBonus = rData.mestre ? (char.training_bonus * 2) : 0
    const finalBonus = attrMod + char.half_level + trainedBonus + mestreBonus + (rData.bonus || 0)
    const sign = finalBonus >= 0 ? '+' : ''
    const formula = `1d20${sign}${finalBonus}`
    rollDice(formula, `Resistência: ${name}`, finalBonus)
  }

  const triggerAtaqueJogadaRoll = (name, bonus) => {
    const sign = bonus >= 0 ? '+' : ''
    const formula = `1d20${sign}${bonus}`
    rollDice(formula, `Jogada de Ataque: ${name}`, bonus)
  }

  // Attacks handling
  const handleAddAttack = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`/api/add_attack/${char.id}`, attackForm)
      setChar(prev => ({ ...prev, ataques: res.data }))
      setShowAddAttack(false)
      setAttackForm({ nome: '', pericia: 'Luta', dano_dados: '1d6', dano_attr: 'forca', bonus_acerto: 0, bonus_dano: 0, critico: '20 / x2', alcance: 'Corpo a Corpo', tipo: 'Impacto' })
      showCursedToast("Lâmina Forjada", "Ataque adicionado com sucesso!", "success")
    } catch {
      showCursedToast("Erro", "Falha ao imbuir ataque.", "error")
    }
  }

  const handleDeleteAttack = async (attackId) => {
    const confirm = await showConfirmModal("Excluir Técnica de Combate", "Deseja quebrar esta conjuração física do seu arsenal?")
    if (!confirm) return
    try {
      const res = await axios.delete(`/api/delete_attack/${char.id}/${attackId}`)
      setChar(prev => ({ ...prev, ataques: res.data }))
      showCursedToast("Descartado", "Ataque purificado do grimório.", "info")
    } catch {
      showCursedToast("Erro", "Falha ao apagar ataque.", "error")
    }
  }

  const handleUseAttack = async (attackId, attackName) => {
    try {
      const res = await axios.post(`/api/use_attack/${char.id}/${attackId}`, {
        target_id: selectedTargetId || null
      })
      const data = res.data

      // Dynamic Dice modal callback triggers beautiful screen shakes
      if (typeof window.rollDice === 'function') {
        window.rollDice("1d20", `Ataque: ${attackName}`, data.total_acerto - data.d20_roll)
      }

      // Display results inside a premium JJK toast
      setTimeout(() => {
        showCursedToast(
          data.hit ? "Acerto Crítico!" : "Ataque Desviado",
          data.hit 
            ? `Rolado ${data.total_acerto} vs Defesa. Dano causado: ${data.final_damage} PV!`
            : "Inimigo evitou o ataque com perícia de barreira.",
          data.hit ? "success" : "warning",
          5000
        )
        loadCharacterData(false)
      }, 1000)

    } catch (err) {
      showCursedToast("Técnica Interrompida", err.response?.data?.error || "Erro ao atacar.", "error")
    }
  }

  // Spells handling
  const handleAddSpell = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`/api/add_spell/${char.id}`, spellForm)
      setChar(prev => ({ ...prev, feiticos: res.data }))
      setShowAddSpell(false)
      setSpellForm({ nome: '', nivel: 1, custo: 2, acao: 'Padrão', alcance: 'Médio', duracao: 'Instantânea', dano: '3d8', descricao: '', tipo: 'Ativo' })
      showCursedToast("Técnica Inata Aprendida", "Feitiço adicionado ao grimório!", "success")
    } catch {
      showCursedToast("Erro", "Falha ao gravar feitiço.", "error")
    }
  }

  const handleDeleteSpell = async (spellId) => {
    const confirm = await showConfirmModal("Excluir Ritual Feitiço", "Tem certeza que deseja apagar permanentemente este sigilo da sua inata?")
    if (!confirm) return
    try {
      const res = await axios.delete(`/api/delete_spell/${char.id}/${spellId}`)
      setChar(prev => ({ ...prev, feiticos: res.data }))
      showCursedToast("Ritual Apagado", "Feitiço deletado.", "info")
    } catch {
      showCursedToast("Erro", "Falha ao apagar feitiço.", "error")
    }
  }

  const handleUseSpell = async (spellId, spellName, spellCost) => {
    if (char.status?.pe_atual < spellCost) {
      const resourceName = isRestringido ? "Estamina" : "PE";
      const toastTitle = isRestringido ? "Estamina Esgotada" : "Energia Esgotada";
      showCursedToast(toastTitle, `Você necessita de ${spellCost} ${resourceName} para canalizar ${spellName}.`, "error")
      return
    }
    const spell = (char.feiticos || []).find(s => s.id === spellId)
    const spellDano = spell?.dano

    try {
      const res = await axios.post(`/api/use_spell/${char.id}/${spellId}`, {
        target_id: selectedTargetId || null
      })
      const data = res.data

      if (spellDano && typeof window.rollDice === 'function') {
        window.rollDice(spellDano, `Conjurar: ${spellName}`, 0)
      }

      setTimeout(() => {
        showCursedToast(
          "Fórmula Conjurada",
          `Fórmula de técnica realizada. Consumiu ${spellCost} PE. Efeito: ${data.damage_roll_desc || 'Ativado'} (${data.final_effect} PV afetados)`,
          data.is_healing ? "success" : "info",
          6000
        )
        loadCharacterData(false)
      }, spellDano ? 1000 : 0)
    } catch (err) {
      showCursedToast("Falha de Fórmula", err.response?.data?.error || "Erro ao conjurar feitiço.", "error")
    }
  }

  // Talents handling
  const handleAddTalent = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`/api/add_talent/${char.id}`, talentForm)
      setChar(prev => ({ ...prev, habilidades_talentos: res.data }))
      setShowAddTalent(false)
      setTalentForm({ nome: '', tipo: 'Classe', custo: 0, execucao: 'Ação Padrão', alcance: 'Pessoal', duracao: 'Instantânea', descricao: '', dado_rolagem: '' })
      showCursedToast("Habilidade Sintonizada", "Novo talento sintonizado!", "success")
    } catch {
      showCursedToast("Erro", "Falha ao sintonizar talento.", "error")
    }
  }

  const handleDeleteTalent = async (talentId) => {
    const confirm = await showConfirmModal("Excluir Talento da Ficha", "Desprender este talento da sua inata?")
    if (!confirm) return
    try {
      const res = await axios.delete(`/api/delete_talent/${char.id}/${talentId}`)
      setChar(prev => ({ ...prev, habilidades_talentos: res.data }))
      showCursedToast("Desprendido", "Talento deletado.", "info")
    } catch {
      showCursedToast("Erro", "Falha ao apagar talento.", "error")
    }
  }

  const handleUseTalent = async (talentId, talentName, talentCost) => {
    if (char.status?.pe_atual < talentCost) {
      const resourceName = isRestringido ? "Estamina" : "PE";
      const toastTitle = isRestringido ? "Estamina Esgotada" : "Energia Esgotada";
      showCursedToast(toastTitle, `Necessita de ${talentCost} ${resourceName} para ativar ${talentName}.`, "error")
      return
    }
    try {
      const res = await axios.post(`/api/use_lobby_talent/${char.id}/${talentId}`, {
        target_id: selectedTargetId || null
      })
      const data = res.data

      showCursedToast(
        "Talento Ativado",
        `Ativou ${talentName}. Custo: ${talentCost} PE. ${data.roll_desc ? `Rolagem: ${data.roll_desc}` : ''}`,
        "success",
        5000
      )
      loadCharacterData(false)
    } catch (err) {
      showCursedToast("Interrompido", err.response?.data?.error || "Erro ao ativar talento.", "error")
    }
  }

  // Shikigami Summons Handling
  const handleAddSummon = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`/api/add_summon/${char.id}`, summonForm)
      setChar(prev => ({ ...prev, invocacoes: res.data }))
      setShowAddSummon(false)
      setSummonForm({ nome: '', hp_max: 10, pe_max: 5, ataque: '1d6+2', defesa: 12, desc: '' })
      showCursedToast("Contrato Firmado", "Shikigami adicionado às sombras!", "success")
    } catch {
      showCursedToast("Erro", "Falha ao criar Shikigami.", "error")
    }
  }

  const handleUpdateSummonStats = async (summonId, fields) => {
    try {
      const res = await axios.post(`/api/update_summon/${char.id}/${summonId}`, fields)
      setChar(prev => ({ ...prev, invocacoes: res.data }))
      showCursedToast("Sombra Alterada", "Estatísticas do Shikigami recalibradas.", "success")
    } catch {
      showCursedToast("Erro", "Não foi possível calibrar Shikigami.", "error")
    }
  }

  const handleDeleteSummon = async (summonId) => {
    const confirm = await showConfirmModal("Excluir Pacto Shikigami", "Romper pacto com esta invocação das sombras?")
    if (!confirm) return
    try {
      const res = await axios.delete(`/api/delete_summon/${char.id}/${summonId}`)
      setChar(prev => ({ ...prev, invocacoes: res.data }))
      showCursedToast("Pacto Dissolvido", "Shikigami purificado das sombras.", "info")
    } catch {
      showCursedToast("Erro", "Falha ao apagar Shikigami.", "error")
    }
  }

  // Edit saving handlers
  const handleSaveEditAttack = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`/api/update_attack/${char.id}/${editingAttack.id}`, editingAttack)
      setChar(prev => ({ ...prev, ataques: res.data }))
      setEditingAttack(null)
      showCursedToast("Ataque Calibrado", "Alterações no ataque salvas com sucesso!", "success")
    } catch {
      showCursedToast("Erro", "Falha ao atualizar ataque.", "error")
    }
  }

  const handleSaveEditSpell = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`/api/update_spell/${char.id}/${editingSpell.id}`, editingSpell)
      setChar(prev => ({ ...prev, feiticos: res.data }))
      setEditingSpell(null)
      showCursedToast("Ritual Calibrado", "Fórmula do feitiço atualizada!", "success")
    } catch {
      showCursedToast("Erro", "Falha ao atualizar feitiço.", "error")
    }
  }

  const handleSaveEditTalent = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`/api/update_talent/${char.id}/${editingTalent.id}`, editingTalent)
      setChar(prev => ({ ...prev, habilidades_talentos: res.data }))
      setEditingTalent(null)
      showCursedToast("Talento Recalibrado", "Alterações no talento foram gravadas!", "success")
    } catch {
      showCursedToast("Erro", "Falha ao atualizar talento.", "error")
    }
  }

  const handleSaveEditSummon = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`/api/update_summon/${char.id}/${editingSummon.id}`, editingSummon)
      setChar(prev => ({ ...prev, invocacoes: res.data }))
      setEditingSummon(null)
      showCursedToast("Shikigami Calibrado", "Estatísticas do Shikigami atualizadas!", "success")
    } catch {
      showCursedToast("Erro", "Falha ao atualizar Shikigami.", "error")
    }
  }

  // Inventory handling
  const handleAddItem = async (e) => {
    e.preventDefault()
    try {
      const res = await axios.post(`/api/add_item/${char.id}`, {
        nome: itemForm.nome,
        qtd: parseInt(itemForm.qtd),
        peso: parseFloat(itemForm.peso)
      })
      setChar(prev => ({ ...prev, inventario: res.data }))
      setShowAddItem(false)
      setItemForm({ nome: '', qtd: 1, peso: 0.5 })
      showCursedToast("Arsenal Atualizado", "Item colocado no inventário!", "success")
    } catch {
      showCursedToast("Erro", "Não foi possível guardar item.", "error")
    }
  }

  const handleUpdateItemQty = async (itemId, currentQty, delta) => {
    const newQty = Math.max(0, currentQty + delta)
    try {
      const res = await axios.post(`/api/update_item/${char.id}/${itemId}`, {
        qtd: newQty
      })
      setChar(prev => ({ ...prev, inventario: res.data }))
      showCursedToast("Arsenal Reorganizado", "Quantidade de item atualizada.", "success")
    } catch {
      showCursedToast("Erro", "Erro ao mudar quantidade.", "error")
    }
  }

  const handleDeleteItem = async (itemId) => {
    const confirm = await showConfirmModal("Descartar Item", "Deseja remover este item de seu inventário?")
    if (!confirm) return
    try {
      const res = await axios.delete(`/api/delete_item/${char.id}/${itemId}`)
      setChar(prev => ({ ...prev, inventario: res.data }))
      showCursedToast("Descartado", "Item removido do inventário.", "info")
    } catch {
      showCursedToast("Erro", "Erro ao remover item.", "error")
    }
  }

  // Carried Weight capacity
  const carriedWeight = (char.inventario || []).reduce((acc, item) => acc + ((item.qtd || 1) * (item.peso || 0)), 0)
  const weightLimit = (char.attributes?.forca || 10) * 5
  const weightPercent = Math.max(0, Math.min(100, (carriedWeight / weightLimit) * 100))

  // Notes handling
  const handleSaveNotes = async () => {
    setIsSavingNotes(true)
    try {
      await axios.post(`/api/update_anotacoes/${char.id}`, { anotacoes: notes })
      showCursedToast("Diário Gravado", "Suas memórias foram gravadas no diário da alma.", "success")
    } catch {
      showCursedToast("Erro de Gravação", "Não foi possível gravar anotações.", "error")
    } finally {
      setIsSavingNotes(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 relative z-20 w-full max-w-7xl mx-auto">
      
      {/* Hidden input for Avatar upload */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarChange}
        className="hidden"
        accept="image/*"
      />

      {/* Back to lobby navigation and Brand Header */}
      <div className="w-full flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate('/lobby')}
          className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 font-sans"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para o Lobby
        </button>
        <div className="flex items-center gap-1.5 cursor-pointer opacity-70 hover:opacity-100 transition-opacity" onClick={() => navigate('/')}>
          <CursedLogo size={20} className="text-purple-400 filter drop-shadow-[0_0_6px_rgba(168,85,247,0.3)]" />
          <span className="font-jujutsu text-xs md:text-sm tracking-widest bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent brand-title-text">
            CÉU E TERRA
          </span>
        </div>
      </div>

      {/* Header glass panel */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-neutral-950/80 border rounded-3xl p-6 md:p-8 mb-8 flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden"
        style={{ 
          borderColor: 'rgba(var(--cursed-color-rgb), 0.25)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 35px rgba(var(--cursed-color-rgb), 0.1)' 
        }}
      >
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full filter blur-[100px] opacity-10 pointer-events-none" style={{ backgroundColor: 'var(--cursed-color)' }} />
        
        {/* Left Side: Avatar, Name, Basics */}
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left w-full lg:w-auto">
          {/* Avatar frame */}
          <div 
            onClick={() => avatarInputRef.current?.click()}
            className="group relative w-24 h-24 md:w-28 md:h-28 rounded-2xl border-2 flex items-center justify-center bg-neutral-900 overflow-hidden shrink-0 cursor-pointer shadow-lg hover:shadow-[0_0_15px_rgba(var(--cursed-color-rgb),0.3)] transition-all duration-300"
            style={{ borderColor: 'var(--cursed-color)' }}
            title="Alterar Retrato da Ficha"
          >
            {char.imagem_url ? (
              <img src={char.imagem_url} alt={char.nome} className="w-full h-full object-cover group-hover:opacity-40 transition-opacity duration-300" />
            ) : (
              <User className="w-12 h-12 text-gray-500 group-hover:opacity-40 transition-opacity duration-300" />
            )}
            
            {/* Elegant overlay on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-white transition-opacity duration-300">
              <Camera className="w-5 h-5 text-white" />
              <span className="text-[9px] uppercase tracking-wider font-sans font-bold">Ajustar</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2 min-w-0">
            {isEditingBasics ? (
              <form onSubmit={handleSaveBasics} className="flex flex-wrap gap-2.5 max-w-xl font-sans">
                <input
                  type="text"
                  value={basicForm.nome}
                  onChange={(e) => setBasicForm(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome do Feiticeiro..."
                  className="px-3 py-1.5 rounded-lg text-xs font-bold w-full bg-neutral-900 border border-white/10"
                  required
                />
                <input
                  type="text"
                  value={basicForm.especializacao}
                  onChange={(e) => setBasicForm(prev => ({ ...prev, especializacao: e.target.value }))}
                  placeholder="Especialização..."
                  className="px-3 py-1.5 rounded-lg text-xs w-2/5 bg-neutral-900 border border-white/10"
                />
                <input
                  type="text"
                  value={basicForm.grau}
                  onChange={(e) => setBasicForm(prev => ({ ...prev, grau: e.target.value }))}
                  placeholder="Grau..."
                  className="px-3 py-1.5 rounded-lg text-xs w-2/5 bg-neutral-900 border border-white/10"
                />
                <input
                  type="text"
                  value={basicForm.peso}
                  onChange={(e) => setBasicForm(prev => ({ ...prev, peso: e.target.value }))}
                  placeholder="Peso..."
                  className="px-3 py-1.5 rounded-lg text-xs w-1/4 bg-neutral-900 border border-white/10"
                />
                <input
                  type="text"
                  value={basicForm.altura}
                  onChange={(e) => setBasicForm(prev => ({ ...prev, altura: e.target.value }))}
                  placeholder="Altura..."
                  className="px-3 py-1.5 rounded-lg text-xs w-1/4 bg-neutral-900 border border-white/10"
                />
                <input
                  type="text"
                  value={basicForm.afiliacao}
                  onChange={(e) => setBasicForm(prev => ({ ...prev, afiliacao: e.target.value }))}
                  placeholder="Afiliação..."
                  className="px-3 py-1.5 rounded-lg text-xs w-2/5 bg-neutral-900 border border-white/10"
                />
                <input
                  type="text"
                  value={basicForm.votos_ativos}
                  onChange={(e) => setBasicForm(prev => ({ ...prev, votos_ativos: e.target.value }))}
                  placeholder="Voto de Restrição..."
                  className="px-3 py-1.5 rounded-lg text-xs w-full bg-neutral-900 border border-white/10"
                />
                <div className="flex items-center gap-2 w-full mt-1.5">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">COR ENERGIA:</span>
                  <input
                    type="color"
                    value={basicForm.cor_energia}
                    onChange={(e) => setBasicForm(prev => ({ ...prev, cor_energia: e.target.value }))}
                    className="w-8 h-8 rounded border border-white/10 p-0 cursor-pointer"
                  />
                  <button type="submit" className="ml-auto px-4 py-1.5 bg-green-700/80 hover:bg-green-600 rounded-lg text-xs font-bold text-white cursor-pointer">Salvar</button>
                  <button type="button" onClick={() => setIsEditingBasics(false)} className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-bold text-gray-300 cursor-pointer">Cancelar</button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <h2 className="text-2xl font-bold font-jujutsu text-white">
                    {char.nome}
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest font-sans" style={{ backgroundColor: 'rgba(var(--cursed-color-rgb), 0.25)', color: 'var(--cursed-color)' }}>
                    {char.grau}
                  </span>
                  <button 
                    onClick={() => setIsEditingBasics(true)}
                    className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Editar Informações Físicas"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-400 font-sans tracking-wide">
                  {char.especializacao} • {char.origem} • {char.afiliacao}
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-1.5 font-sans">
                  <span className="text-[10px] text-white font-extrabold bg-neutral-800/80 px-2.5 py-1 rounded-md">
                    NÍVEL {char.nivel}
                  </span>
                  <span className="text-[10px] text-gray-500 font-semibold">
                    XP ACUMULADO: <strong className="text-white">{char.xp}</strong>
                  </span>
                  <span className="text-[10px] text-gray-500 font-semibold">
                    ALTURA: <strong className="text-white">{char.altura || '1.82m'}</strong>
                  </span>
                  <span className="text-[10px] text-gray-500 font-semibold">
                    PESO: <strong className="text-white">{char.peso || '72kg'}</strong>
                  </span>
                  
                  {/* Excel Sync Button */}
                  <button
                    onClick={() => excelInputRef.current?.click()}
                    disabled={syncingExcel}
                    className="text-[9px] font-black tracking-widest text-emerald-400 hover:text-white bg-emerald-950/30 hover:bg-emerald-900/60 border border-emerald-500/20 hover:border-emerald-500/50 rounded-xl px-3 py-1.5 transition-all duration-300 flex items-center gap-1.5 cursor-pointer outline-none active:scale-95"
                  >
                    <FolderOpen className="w-3.5 h-3.5" /> {syncingExcel ? "SINCRONIZANDO..." : "SINCRONIZAR EXCEL"}
                  </button>
                  <input
                    type="file"
                    ref={excelInputRef}
                    accept=".xlsx"
                    onChange={handleExcelSyncUpload}
                    className="hidden"
                  />

                  {/* Google Sheets URL Import */}
                  <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 rounded-xl px-3 py-1 max-w-sm">
                    <input
                      type="text"
                      placeholder="Link do Google Sheets..."
                      value={googleSheetsUrl}
                      onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                      className="bg-transparent text-[9px] text-gray-300 placeholder-gray-600 focus:outline-none w-44 font-semibold font-sans"
                    />
                    <button
                      onClick={handleGoogleSheetsSync}
                      disabled={syncingGoogleSheets}
                      className="text-[9px] font-black tracking-widest text-purple-400 hover:text-white bg-purple-950/30 hover:bg-purple-900/60 border border-purple-500/20 hover:border-purple-500/50 rounded-lg px-2.5 py-1 transition-all duration-300 flex items-center gap-1 cursor-pointer outline-none active:scale-95 shrink-0"
                    >
                      <Sparkles className="w-3 h-3" /> {syncingGoogleSheets ? "SINCRONIZANDO..." : "SINTONIZAR LINK"}
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-purple-300 bg-purple-950/20 border border-purple-800/20 rounded-lg p-2 mt-1.5 font-sans max-w-xl flex items-center gap-1.5">
                  <Scroll className="w-4 h-4 text-purple-400" /> <strong>Votos de Restrição / Pactos:</strong> {char.votos_ativos || 'Nenhum pacto ativo.'}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Global targets selector inside combat/spell view */}
        <div className="bg-neutral-900/60 border border-white/5 rounded-2xl p-4 flex flex-col gap-2 w-full lg:w-64 font-sans shrink-0">
          <span className="text-[10px] text-red-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5"><Compass className="w-3.5 h-3.5" /> Mirar Domínio (Alvo)</span>
          <select 
            value={selectedTargetId}
            onChange={(e) => setSelectedTargetId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-xs bg-black border border-white/10 text-white font-bold outline-none cursor-pointer"
          >
            <option value="">Sem Alvo Físico (Rolar Livre)</option>
            {lobbyMembros.map(m => (
              <option key={m.id} value={m.id}>{m.nome} (Lvl {m.nivel})</option>
            ))}
          </select>
          <span className="text-[8px] text-gray-500">
            Ataques e feitiços com alvos aplicarão bônus de acerto e deduções de RD em tempo real no servidor.
          </span>
        </div>

      </motion.div>

      {/* Dynamic Vitals HUD Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8 font-sans"
      >
        {/* Health (PV) Card */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex justify-between items-center">
            <span className="text-xs text-red-400 font-extrabold flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-red-500" /> Pontos de Vida (PV)</span>
            <div className="flex items-center gap-1 bg-red-950/20 px-1 py-0.5 rounded-lg border border-red-500/10">
              <button onClick={() => handleUpdateStatus('pv_delta', pvAdjust)} className="w-5 h-5 rounded bg-red-900/40 hover:bg-red-800/60 border border-red-500/20 text-red-300 text-xs font-black flex items-center justify-center cursor-pointer select-none" title="Adicionar valor">+</button>
              <input 
                type="number" 
                value={pvAdjust}
                onChange={(e) => setPvAdjust(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-8 h-5 text-center bg-transparent text-red-300 font-extrabold text-[10px] focus:outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0" 
                title="Clique para alterar o valor de ajuste"
              />
              <button onClick={() => handleUpdateStatus('pv_delta', -pvAdjust)} className="w-5 h-5 rounded bg-red-900/40 hover:bg-red-800/60 border border-red-500/20 text-red-300 text-xs font-black flex items-center justify-center cursor-pointer select-none" title="Subtrair valor">-</button>
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-1 justify-center">
            <span className="text-3xl font-extrabold text-white">{char.status?.pv_atual}</span>
            <span className="text-gray-500 font-medium">/ {char.status?.pv_max}</span>
          </div>
          <div className="w-full h-2.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-300" style={{ width: `${pvPercent}%` }} />
          </div>
        </div>

        {/* Cursed Energy (PE) / Stamina Card */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex justify-between items-center">
            <span className="text-xs font-extrabold flex items-center gap-1.5" style={{ color: isRestringido ? '#10b981' : 'var(--cursed-color)' }}>
              {isRestringido ? (
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              {isRestringido ? "Pontos de Estamina" : "Energia Amaldiçoada (PE)"}
            </span>
            <div className="flex items-center gap-1 bg-neutral-950/40 px-1 py-0.5 rounded-lg border border-white/5">
              <button onClick={() => handleUpdateStatus('pe_delta', peAdjust)} className="w-5 h-5 rounded bg-neutral-900/60 hover:bg-neutral-800/80 border border-white/10 text-gray-300 text-xs font-black flex items-center justify-center cursor-pointer select-none" title="Adicionar valor">+</button>
              <input 
                type="number" 
                value={peAdjust}
                onChange={(e) => setPeAdjust(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-8 h-5 text-center bg-transparent text-gray-300 font-extrabold text-[10px] focus:outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0" 
                title="Clique para alterar o valor de ajuste"
              />
              <button onClick={() => handleUpdateStatus('pe_delta', -peAdjust)} className="w-5 h-5 rounded bg-neutral-900/60 hover:bg-neutral-800/80 border border-white/10 text-gray-300 text-xs font-black flex items-center justify-center cursor-pointer select-none" title="Subtrair valor">-</button>
            </div>
          </div>
          <div className="my-3 flex items-baseline gap-1 justify-center">
            <span className="text-3xl font-extrabold text-white">{char.status?.pe_atual}</span>
            <span className="text-gray-500 font-medium">/ {char.status?.pe_max}</span>
          </div>
          <div className="w-full h-2.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pePercent}%`, backgroundColor: isRestringido ? '#10b981' : 'var(--cursed-color)' }} />
          </div>
        </div>

        {/* Cursed Vitals / Integrity Card */}
        <div className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden flex flex-col justify-between h-36">
          <div className="flex justify-between items-center">
            <span className="text-xs text-amber-400 font-extrabold flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-amber-400" /> Integridade & Alma</span>
            <div className="flex items-center gap-1 bg-amber-950/20 px-1 py-0.5 rounded-lg border border-amber-500/10">
              <button onClick={() => handleUpdateStatus('integridade_delta', almaAdjust)} className="w-5 h-5 rounded bg-amber-900/40 hover:bg-amber-800/60 border border-amber-500/20 text-amber-300 text-xs font-black flex items-center justify-center cursor-pointer select-none" title="Adicionar valor">+</button>
              <input 
                type="number" 
                value={almaAdjust}
                onChange={(e) => setAlmaAdjust(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-8 h-5 text-center bg-transparent text-amber-300 font-extrabold text-[10px] focus:outline-none border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-0" 
                title="Clique para alterar o valor de ajuste"
              />
              <button onClick={() => handleUpdateStatus('integridade_delta', -almaAdjust)} className="w-5 h-5 rounded bg-amber-900/40 hover:bg-amber-800/60 border border-amber-500/20 text-amber-300 text-xs font-black flex items-center justify-center cursor-pointer select-none" title="Subtrair valor">-</button>
            </div>
          </div>
          <div className="flex items-center justify-between my-2">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-500 font-bold">ESTADO</span>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">{char.status?.estado_alma || 'Estável'}</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-white">{char.status?.integridade_atual}</span>
              <span className="text-gray-500 font-medium">/ {char.status?.integridade_max}</span>
            </div>
          </div>
          <div className="w-full h-2.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full transition-all duration-300" style={{ width: `${intPercent}%` }} />
          </div>
        </div>
      </motion.div>

      {/* Tabs navigation bar with layoutId transition animation */}
      <div className="w-full bg-neutral-950/60 border border-white/5 rounded-2xl p-2.5 mb-8 flex flex-nowrap lg:flex-wrap gap-2 items-center overflow-x-auto lg:justify-center relative overflow-y-hidden custom-scrollbar-horizontal scrollbar-none shrink-0">
        {[
          { id: 'atributos', label: 'Atributos & Perícias', icon: <Activity className="w-3.5 h-3.5 inline mr-1.5 shrink-0" /> },
          { id: 'combate', label: 'Combate & Ataques', icon: <Swords className="w-3.5 h-3.5 inline mr-1.5 text-red-500 shrink-0" /> },
          { id: 'feiticos', label: 'Grimório Feitiços', icon: <Scroll className="w-3.5 h-3.5 inline mr-1.5 text-purple-400 shrink-0" /> },
          { id: 'talentos', label: 'Talentos Inatos', icon: <Sparkles className="w-3.5 h-3.5 inline mr-1.5 text-amber-400 shrink-0" /> },
          { id: 'shikigami', label: 'Shikigamis', icon: <PawPrint className="w-3.5 h-3.5 inline mr-1.5 text-indigo-400 shrink-0" /> },
          { id: 'inventario', label: 'Inventário', icon: <Briefcase className="w-3.5 h-3.5 inline mr-1.5 text-emerald-400 shrink-0" /> },
          { id: 'diario', label: 'Diário da Alma', icon: <FileText className="w-3.5 h-3.5 inline mr-1.5 text-gray-400 shrink-0" /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer relative z-10 font-sans flex items-center justify-center shrink-0"
            style={{ color: activeTab === tab.id ? 'var(--text-color)' : 'var(--text-muted)' }}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-xl -z-10"
                style={{ backgroundColor: 'rgba(var(--cursed-color-rgb), 0.15)', border: '1px solid rgba(var(--cursed-color-rgb), 0.3)' }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tabs panels render */}
      <div className="w-full min-h-[450px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {/* ── TAB: ATRIBUTOS ── */}
            {activeTab === 'atributos' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Attributes Grid & Evolution */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                  <div className="glass-card rounded-2xl p-5 border border-white/5">
                    <h3 className="text-md font-bold font-jujutsu text-white mb-4 flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-purple-400" /> Atributos de Alma</span>
                      {char.pontos_atributos > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 font-extrabold animate-pulse">
                          +{char.pontos_atributos} PONTOS
                        </span>
                      )}
                    </h3>

                    {/* Interactive Neon Attributes Radar Chart */}
                    <AttributesRadarChart attributes={char.attributes} color={char.cor_energia} />

                    <div className="flex flex-col gap-3 font-sans">
                      {[
                        { key: 'forca', label: 'Força (FOR)', icon: <Swords className="w-5 h-5 text-red-400 shrink-0" /> },
                        { key: 'destreza', label: 'Destreza (DES)', icon: <Activity className="w-5 h-5 text-blue-400 shrink-0" /> },
                        { key: 'constituicao', label: 'Constituição (CON)', icon: <Shield className="w-5 h-5 text-orange-400 shrink-0" /> },
                        { key: 'inteligencia', label: 'Inteligência (INT)', icon: <Brain className="w-5 h-5 text-purple-400 shrink-0" /> },
                        { key: 'sabedoria', label: 'Sabedoria (SAB)', icon: <Compass className="w-5 h-5 text-green-400 shrink-0" /> },
                        { key: 'presenca', label: 'Presença (PRE)', icon: <Eye className="w-5 h-5 text-pink-400 shrink-0" /> }
                      ].map(attr => {
                        const originalScore = char.attributes?.[attr.key] || 10
                        const allocated = allocatedAttrs[attr.key]
                        const finalScore = originalScore + allocated
                        const finalMod = calculateModifier(finalScore)
                        const finalModSign = finalMod >= 0 ? `+${finalMod}` : finalMod

                        return (
                          <div key={attr.key} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl p-3 hover:border-white/10 transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{attr.icon}</span>
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-white">{attr.label}</span>
                                <span className="text-[10px] text-gray-500 font-medium">Básico: {originalScore}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {/* Click to roll attribute */}
                              <button 
                                onClick={() => triggerAttrRoll(attr.key, finalScore)}
                                className="px-2.5 py-1 bg-neutral-900 border border-white/10 text-xs font-bold rounded-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                style={{ color: 'var(--cursed-color)', borderColor: 'rgba(var(--cursed-color-rgb), 0.2)' }}
                              >
                                {finalModSign}
                              </button>

                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-extrabold text-white text-center w-6">{finalScore}</span>
                                {char.pontos_atributos > 0 && (
                                  <>
                                    <button 
                                      onClick={() => changeAllocatedAttr(attr.key, 1)} 
                                      className="w-5 h-5 rounded font-bold text-xs flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
                                      style={{ 
                                        backgroundColor: 'rgba(var(--cursed-color-rgb), 0.15)', 
                                        borderColor: 'rgba(var(--cursed-color-rgb), 0.3)', 
                                        color: 'var(--cursed-color)',
                                        borderWidth: '1px'
                                      }}
                                    >
                                      +
                                    </button>
                                    <button 
                                      onClick={() => changeAllocatedAttr(attr.key, -1)} 
                                      className="w-5 h-5 rounded font-bold text-xs flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
                                      style={{ 
                                        backgroundColor: 'rgba(var(--cursed-color-rgb), 0.05)', 
                                        borderColor: 'rgba(var(--cursed-color-rgb), 0.15)', 
                                        color: 'rgba(var(--cursed-color-rgb), 0.7)',
                                        borderWidth: '1px'
                                      }}
                                    >
                                      -
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Commit points */}
                    {Object.values(allocatedAttrs).reduce((a, b) => a + b, 0) > 0 && (
                      <button
                        onClick={handleConfirmEvolution}
                        className="w-full py-3 mt-4 rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-all cursor-pointer font-sans"
                        style={{ backgroundColor: 'var(--cursed-color)', boxShadow: '0 0 10px var(--cursed-color)' }}
                      >
                        <Activity className="w-4 h-4 mr-1 inline" /> Confirmar Lapidação de Atributos
                      </button>
                    )}
                  </div>

                  {/* Jogadas de Ataque Card */}
                  <div className="glass-card rounded-2xl p-5 border border-white/5 font-sans">
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Swords className="w-3.5 h-3.5 text-red-500" /> Jogadas de Ataque
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      {/* Melee */}
                      <div className="flex flex-col bg-neutral-900/60 border border-white/5 rounded-xl p-2.5">
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase mb-1">Corpo a Corpo</span>
                        <button
                          onClick={() => triggerAtaqueJogadaRoll('Corpo a Corpo', char.bonus_corpo_corpo)}
                          className="text-xl font-black text-white hover:scale-105 active:scale-95 transition-all cursor-pointer py-1 bg-black/40 border border-white/5 rounded-lg mb-2"
                        >
                          +{char.bonus_corpo_corpo ?? 0}
                        </button>
                        
                        <div className="grid grid-cols-2 gap-1.5 items-center mb-2">
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] text-gray-500 font-bold mb-0.5">T</span>
                            <input 
                              type="checkbox"
                              checked={char.configuracoes?.ataque_corpo_corpo?.treinada ?? false}
                              onChange={(e) => handleUpdateAttackJogada('ataque_corpo_corpo', 'treinada', e.target.checked)}
                              className="w-3.5 h-3.5 accent-purple-500 rounded cursor-pointer"
                            />
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] text-gray-500 font-bold mb-0.5">Outros</span>
                            <input 
                              type="number"
                              value={char.configuracoes?.ataque_corpo_corpo?.outros ?? 0}
                              onChange={(e) => handleUpdateAttackJogada('ataque_corpo_corpo', 'outros', parseInt(e.target.value) || 0)}
                              className="w-10 bg-transparent text-center text-xs font-bold text-white border border-white/10 rounded-lg focus:outline-none focus:bg-white/5 py-0.5"
                            />
                          </div>
                        </div>
                        
                        <span className="text-[8px] text-gray-500 font-bold mb-0.5">Atributo</span>
                        <select
                          value={char.configuracoes?.ataque_corpo_corpo?.atributo ?? 'forca'}
                          onChange={(e) => handleUpdateAttackJogada('ataque_corpo_corpo', 'atributo', e.target.value)}
                          className="bg-transparent border border-white/10 text-[10px] font-extrabold text-gray-300 rounded-lg p-1 text-center focus:outline-none cursor-pointer"
                        >
                          <option value="forca">FOR</option>
                          <option value="destreza">DES</option>
                          <option value="constituicao">CON</option>
                          <option value="inteligencia">INT</option>
                          <option value="sabedoria">SAB</option>
                          <option value="presenca">PRE</option>
                        </select>
                      </div>

                      {/* Ranged */}
                      <div className="flex flex-col bg-neutral-900/60 border border-white/5 rounded-xl p-2.5">
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase mb-1">A Distância</span>
                        <button
                          onClick={() => triggerAtaqueJogadaRoll('A Distância', char.bonus_a_distancia)}
                          className="text-xl font-black text-white hover:scale-105 active:scale-95 transition-all cursor-pointer py-1 bg-black/40 border border-white/5 rounded-lg mb-2"
                        >
                          +{char.bonus_a_distancia ?? 0}
                        </button>
                        
                        <div className="grid grid-cols-2 gap-1.5 items-center mb-2">
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] text-gray-500 font-bold mb-0.5">T</span>
                            <input 
                              type="checkbox"
                              checked={char.configuracoes?.ataque_a_distancia?.treinada ?? false}
                              onChange={(e) => handleUpdateAttackJogada('ataque_a_distancia', 'treinada', e.target.checked)}
                              className="w-3.5 h-3.5 accent-purple-500 rounded cursor-pointer"
                            />
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] text-gray-500 font-bold mb-0.5">Outros</span>
                            <input 
                              type="number"
                              value={char.configuracoes?.ataque_a_distancia?.outros ?? 0}
                              onChange={(e) => handleUpdateAttackJogada('ataque_a_distancia', 'outros', parseInt(e.target.value) || 0)}
                              className="w-10 bg-transparent text-center text-xs font-bold text-white border border-white/10 rounded-lg focus:outline-none focus:bg-white/5 py-0.5"
                            />
                          </div>
                        </div>
                        
                        <span className="text-[8px] text-gray-500 font-bold mb-0.5">Atributo</span>
                        <select
                          value={char.configuracoes?.ataque_a_distancia?.atributo ?? 'destreza'}
                          onChange={(e) => handleUpdateAttackJogada('ataque_a_distancia', 'atributo', e.target.value)}
                          className="bg-transparent border border-white/10 text-[10px] font-extrabold text-gray-300 rounded-lg p-1 text-center focus:outline-none cursor-pointer"
                        >
                          <option value="forca">FOR</option>
                          <option value="destreza">DES</option>
                          <option value="constituicao">CON</option>
                          <option value="inteligencia">INT</option>
                          <option value="sabedoria">SAB</option>
                          <option value="presenca">PRE</option>
                        </select>
                      </div>

                      {/* Cursed */}
                      <div className="flex flex-col bg-neutral-900/60 border border-white/5 rounded-xl p-2.5">
                        <span className="text-[10px] text-gray-400 font-extrabold uppercase mb-1">Amaldiçoado</span>
                        <button
                          onClick={() => triggerAtaqueJogadaRoll('Amaldiçoado', char.bonus_amaldicoado)}
                          className="text-xl font-black text-white hover:scale-105 active:scale-95 transition-all cursor-pointer py-1 bg-black/40 border border-white/5 rounded-lg mb-2"
                        >
                          +{char.bonus_amaldicoado ?? 0}
                        </button>
                        
                        <div className="grid grid-cols-2 gap-1.5 items-center mb-2">
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] text-gray-500 font-bold mb-0.5">T</span>
                            <input 
                              type="checkbox"
                              checked={char.configuracoes?.ataque_amaldicoado?.treinada ?? false}
                              onChange={(e) => handleUpdateAttackJogada('ataque_amaldicoado', 'treinada', e.target.checked)}
                              className="w-3.5 h-3.5 accent-purple-500 rounded cursor-pointer"
                            />
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] text-gray-500 font-bold mb-0.5">Outros</span>
                            <input 
                              type="number"
                              value={char.configuracoes?.ataque_amaldicoado?.outros ?? 0}
                              onChange={(e) => handleUpdateAttackJogada('ataque_amaldicoado', 'outros', parseInt(e.target.value) || 0)}
                              className="w-10 bg-transparent text-center text-xs font-bold text-white border border-white/10 rounded-lg focus:outline-none focus:bg-white/5 py-0.5"
                            />
                          </div>
                        </div>
                        
                        <span className="text-[8px] text-gray-500 font-bold mb-0.5">Atributo</span>
                        <select
                          value={char.configuracoes?.ataque_amaldicoado?.atributo ?? 'presenca'}
                          onChange={(e) => handleUpdateAttackJogada('ataque_amaldicoado', 'atributo', e.target.value)}
                          className="bg-transparent border border-white/10 text-[10px] font-extrabold text-gray-300 rounded-lg p-1 text-center focus:outline-none cursor-pointer"
                        >
                          <option value="forca">FOR</option>
                          <option value="destreza">DES</option>
                          <option value="constituicao">CON</option>
                          <option value="inteligencia">INT</option>
                          <option value="sabedoria">SAB</option>
                          <option value="presenca">PRE</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* General Combat Derived Stats */}
                  <div className="glass-card rounded-2xl p-5 border border-white/5 font-sans">
                    <h3 className="text-md font-bold font-jujutsu text-white mb-4 flex items-center gap-1.5"><Shield className="w-4 h-4 text-purple-400" /> Defesa e Derivados</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Initiative */}
                      <div 
                        onClick={() => rollDice(`1d20+${char.iniciativa || 0}`, "Rolagem de Iniciativa", char.iniciativa || 0)}
                        className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-purple-500/30 transition-all"
                      >
                        <span className="text-[10px] text-gray-400 font-bold uppercase">INICIATIVA</span>
                        <span className="text-2xl font-extrabold text-white">+{char.iniciativa || 0}</span>
                        <span className="text-[8px] text-purple-400">Clique para Rolar d20</span>
                      </div>
                      
                      {/* Passive Attention */}
                      <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col items-center justify-center gap-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">ATENÇÃO PASSIVA</span>
                        <span className="text-2xl font-extrabold text-white">{char.atencao_passiva || 10}</span>
                        <span className="text-[8px] text-gray-500">Percepção Passiva</span>
                      </div>

                      {/* Spell CD */}
                      <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col items-center justify-center gap-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">CD FEITIÇOS</span>
                        <span className="text-2xl font-extrabold text-white">{char.cd_especializacao || 12}</span>
                        <span className="text-[8px] text-gray-500">Dificuldade da Inata</span>
                      </div>

                      {/* Defense */}
                      <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col items-center justify-center gap-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">DEFESA GERAL</span>
                        <span className="text-2xl font-extrabold text-white">{char.status?.defesa || 10}</span>
                        <span className="text-[8px] text-gray-500">Aparar / Esquivar</span>
                      </div>
                    </div>

                    {/* Death Saves */}
                    <div className="bg-black/40 border border-white/5 rounded-xl p-4 mt-4 flex flex-col gap-3">
                      <span className="text-[10px] text-red-400 font-extrabold uppercase flex items-center gap-1.5"><Skull className="w-3.5 h-3.5 text-red-500" /> Testes de Salvamento contra Morte</span>
                      <div className="flex justify-between items-center gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-gray-400 font-medium">SUCESSOS ({char.status?.sucessos_morte || 0}/3):</span>
                          <div className="flex gap-1.5">
                            {[1, 2, 3].map(i => (
                              <button 
                                key={i}
                                onClick={() => handleUpdateStatus('sucessos_delta', char.status?.sucessos_morte >= i ? -1 : 1)}
                                className={`w-6 h-6 rounded-full border text-xs cursor-pointer flex items-center justify-center transition-all ${char.status?.sucessos_morte >= i ? 'bg-green-600 border-green-500 text-white' : 'border-white/10 text-gray-600'}`}
                              >
                                <Heart className="w-3.5 h-3.5 fill-current" />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-gray-400 font-medium">FALHAS ({char.status?.falhas_morte || 0}/3):</span>
                          <div className="flex gap-1.5">
                            {[1, 2, 3].map(i => (
                              <button 
                                key={i}
                                onClick={() => handleUpdateStatus('falhas_delta', char.status?.falhas_morte >= i ? -1 : 1)}
                                className={`w-6 h-6 rounded-full border text-xs cursor-pointer flex items-center justify-center transition-all ${char.status?.falhas_morte >= i ? 'bg-red-600 border-red-500 text-white' : 'border-white/10 text-gray-600'}`}
                              >
                                <Skull className="w-3.5 h-3.5 fill-current" />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Perícias Grid (2 cols) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <div className="glass-card rounded-2xl p-5 border border-white/5">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-md font-bold font-jujutsu text-white flex items-center gap-2">
                        <Scroll className="w-4 h-4 text-purple-400" /> Perícias do Feiticeiro
                      </h3>
                      <span className="text-[10px] text-gray-500 font-sans">
                        Clique no modificador da perícia para rolar um d20 sintonizado.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[580px] overflow-y-auto pr-2 custom-scrollbar font-sans">
                      {char.pericias && Object.entries(char.pericias)
                        .filter(([name]) => !name.startsWith('_'))
                        .map(([name, pData]) => {
                          const attrMod = mods[pData.attr] || 0
                          const trainedBonus = pData.treinada ? char.training_bonus : 0
                          const finalBonus = attrMod + char.half_level + trainedBonus + (pData.bonus || 0)
                          const finalSign = finalBonus >= 0 ? `+${finalBonus}` : finalBonus

                          return (
                            <div key={name} className="flex items-center justify-between bg-black/30 border border-white/5 rounded-xl p-3 hover:border-white/10 transition-colors">
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-white">{name}</span>
                                  {pData.treinada && (
                                    <span className="px-1.5 py-0.5 rounded bg-green-950/60 border border-green-500/20 text-green-400 font-extrabold text-[8px] uppercase tracking-widest">
                                      TREINADA
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">
                                  {pData.attr} • Bônus extra: +{pData.bonus || 0}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleOpenEditPericia(name, pData)}
                                  className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
                                  title="Ajustar Perícia"
                                >
                                  <Settings className="w-3.5 h-3.5 text-gray-500 hover:text-white transition-colors" />
                                </button>
                                <button
                                  onClick={() => triggerPericiaRoll(name, pData)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-neutral-900 border border-white/10 text-white cursor-pointer hover:border-purple-500/40 active:scale-95 transition-all w-14 text-center"
                                >
                                  {finalSign}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                    </div>

                  </div>

                  {/* Resistances & RDs Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Resistances panel */}
                    <div className="glass-card rounded-2xl p-5 border border-white/5 font-sans">
                      <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-purple-400" /> Resistências</h3>
                      <div className="flex flex-col gap-2">
                        {char.resistencias && Object.entries(char.resistencias).map(([name, rData]) => {
                          const attrMod = mods[rData.attr] || 0
                          const trainedBonus = rData.treinada ? char.training_bonus : 0
                          const mestreBonus = rData.mestre ? (char.training_bonus * 2) : 0
                          const finalBonus = attrMod + char.half_level + trainedBonus + mestreBonus + (rData.bonus || 0)
                          const finalSign = finalBonus >= 0 ? `+${finalBonus}` : finalBonus

                          return (
                            <div key={name} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl p-2.5 hover:border-white/10 transition-colors">
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-bold text-white">{name}</span>
                                  {rData.treinada && (
                                    <span className="text-[7px] text-green-400 font-extrabold bg-green-950/40 px-1 py-0.5 rounded">T</span>
                                  )}
                                  {rData.mestre && (
                                    <span className="text-[7px] text-amber-400 font-extrabold bg-amber-950/40 px-1 py-0.5 rounded">M</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleOpenEditResistance(name, rData)} className="text-xs text-gray-500 hover:text-white cursor-pointer flex items-center justify-center"><Settings className="w-3.5 h-3.5 text-gray-500 hover:text-white cursor-pointer" /></button>
                                <button 
                                  onClick={() => triggerResistanceRoll(name, rData)}
                                  className="px-2.5 py-1 rounded bg-neutral-900 border border-white/10 text-xs font-bold text-white hover:border-purple-500/40 active:scale-95 transition-all text-center w-12"
                                >
                                  {finalSign}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Damage Reductions (RDs) */}
                    <div className="glass-card rounded-2xl p-5 border border-white/5 font-sans">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-purple-400" /> Reduções de Dano (RD)</h3>
                        <button 
                          onClick={async () => {
                            const newRds = await showConfirmModal("Resetar RDs", "Resetar todas as RDs para zero?")
                            if (!newRds) return
                            const cleared = {}
                            Object.keys(char.rds || {}).forEach(k => { cleared[k] = 0 })
                            try {
                              const res = await axios.post(`/api/update_rds/${char.id}`, { rds: cleared })
                              setChar(res.data.character)
                              showCursedToast("RDs Zeradas", "Reduções de dano resetadas.", "info")
                            } catch {}
                          }} 
                          className="text-[9px] text-red-400 hover:text-red-300 font-bold"
                        >
                          RESET
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 max-h-[180px] overflow-y-auto pr-1">
                        {char.rds && Object.entries(char.rds).map(([abbrev, val]) => (
                          <div key={abbrev} className="bg-black/40 border border-white/5 rounded-lg p-2 flex flex-col items-center gap-1 relative group">
                            <span className="text-[10px] text-gray-400 font-extrabold">{abbrev}</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={val}
                                onChange={async (e) => {
                                  const newVal = parseInt(e.target.value) || 0
                                  try {
                                    const updatedRds = { ...char.rds, [abbrev]: newVal }
                                    const res = await axios.post(`/api/update_rds/${char.id}`, { rds: updatedRds })
                                    setChar(res.data.character)
                                  } catch {}
                                }}
                                className="w-10 bg-transparent text-xs font-bold text-center text-white focus:outline-none focus:bg-white/5 rounded border border-white/10"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* ── TAB: COMBATE & ATAQUES ── */}
            {activeTab === 'combate' && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1 font-sans">
                    <h3 className="text-md font-bold font-jujutsu text-white flex items-center gap-2">
                      <Swords className="w-4 h-4 text-red-500" /> Arsenal de Combate & Ataques Inatos
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">
                        Golpes e Técnicas Corporais: <strong className="text-white">{(char.ataques || []).length} cadastrados</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAddAttack(true)}
                    className="px-4 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all cursor-pointer font-sans flex items-center gap-1.5"
                    style={{ backgroundColor: 'var(--cursed-color)', boxShadow: '0 0 10px var(--cursed-color)' }}
                  >
                    <Plus className="w-4 h-4" /> Adicionar Ataque Físico
                  </button>
                </div>

                {(!char.ataques || char.ataques.length === 0) ? (
                  <div className="glass-card rounded-2xl p-12 text-center border border-white/5 flex flex-col items-center gap-3">
                    <Swords className="w-12 h-12 text-gray-500 animate-pulse" />
                    <h4 className="text-md font-bold text-white font-jujutsu">Punhos Desarmados</h4>
                    <p className="text-xs text-gray-400 max-w-sm font-sans">
                      Você não adicionou técnicas de combate ainda. Use o botão acima para adicionar um ataque com arma, feitiço físico ou soco.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                    {char.ataques.map((att) => (
                      <div 
                        key={att.id} 
                        className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden flex flex-col justify-between gap-4 group hover:border-red-500/20 transition-all"
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-extrabold text-white font-jujutsu truncate max-w-[65%]">
                              {att.nome}
                            </h4>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingAttack(att)}
                                className="text-xs text-gray-500 hover:text-purple-400 cursor-pointer flex items-center justify-center"
                                title="Editar Ataque"
                              >
                                <Settings className="w-4 h-4 text-gray-500 hover:text-purple-400 transition-colors" />
                              </button>
                              <button
                                onClick={() => handleDeleteAttack(att.id)}
                                className="text-xs text-gray-500 hover:text-red-400 cursor-pointer flex items-center justify-center"
                                title="Remover Ataque"
                              >
                                <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-400 transition-colors" />
                              </button>
                            </div>
                          </div>
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mt-1">
                            {att.tipo} • {att.alcance}
                          </span>

                          <div className="grid grid-cols-2 gap-2.5 mt-3 text-xs bg-black/30 border border-white/5 rounded-xl p-2.5">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] text-gray-500 font-bold uppercase">PERÍCIA</span>
                              <span className="text-white truncate font-semibold">{att.pericia}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] text-gray-500 font-bold uppercase">ACERTO</span>
                              <span className="text-white font-semibold">+{att.bonus_acerto}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] text-gray-500 font-bold uppercase">DADO DANO</span>
                              <span className="text-red-400 font-semibold">{att.dano_dados}</span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[8px] text-gray-500 font-bold uppercase">ATTR DANO</span>
                              <span className="text-white truncate font-semibold uppercase">{att.dano_attr || 'none'}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleUseAttack(att.id, att.nome)}
                          className="w-full py-2.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-300 font-bold text-xs uppercase tracking-wider hover:bg-red-900/40 active:scale-95 transition-all cursor-pointer font-sans flex items-center justify-center gap-1.5"
                        >
                          <Swords className="w-4 h-4" /> Rolar Ataque
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* ── TAB: GRIMÓRIO FEITIÇOS ── */}
            {activeTab === 'feiticos' && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1 font-sans">
                    <h3 className="text-md font-bold font-jujutsu text-white flex items-center gap-2">
                      <Scroll className="w-4 h-4 text-purple-400" /> Grimório de Rituais & Feitiços Amaldiçoados
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">
                        Técnicas Inatas: <strong className="text-white">{(char.feiticos || []).length}</strong> • Conjuradas: <strong className="text-white">{(char.feiticos || []).filter(s => s.equipado).length} preparadas</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAddSpell(true)}
                    className="px-4 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all cursor-pointer font-sans flex items-center gap-1.5"
                    style={{ backgroundColor: 'var(--cursed-color)', boxShadow: '0 0 10px var(--cursed-color)' }}
                  >
                    <Plus className="w-4 h-4" /> Adicionar Feitiço Inato
                  </button>
                </div>

                {/* Expansão de Domínio Segment */}
                {char.dominio && char.dominio !== '{}' && (() => {
                  const domObj = (() => {
                    try { return JSON.parse(char.dominio) || {}; }
                    catch { return {}; }
                  })()

                  return (
                    <div 
                      className="glass-card rounded-2xl p-6 border border-purple-500/25 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 mb-6"
                      style={{
                        backgroundImage: 'radial-gradient(circle at top right, rgba(138, 43, 226, 0.15), transparent)',
                        boxShadow: '0 0 15px rgba(138, 43, 226, 0.1)'
                      }}
                    >
                      <div className="flex flex-col gap-2 max-w-xl">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded bg-purple-950 text-purple-300 font-extrabold text-[9px] uppercase tracking-widest border border-purple-500/30">
                            SUPREMA EXPANSÃO DE DOMÍNIO
                          </span>
                        </div>
                        <h4 className="text-xl font-black font-jujutsu text-white tracking-wide">
                          {domObj.nome || 'Expansão de Domínio'}
                        </h4>
                        <p className="text-xs text-gray-400 font-medium">
                          {domObj.descricao || 'Técnica barreira inata que garante acerto absoluto.'}
                        </p>
                        <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold uppercase mt-1">
                          <span>Custo: <strong className="text-purple-400">
                            {domObj.custo || 20} PE
                          </strong></span>
                          <span>Tipo: <strong className="text-purple-400">
                            {domObj.tipo || 'Letal'}
                          </strong></span>
                        </div>
                      </div>
                      
                      <button
                        onClick={async () => {
                          const cost = domObj.custo || 20;
                          if (char.status.pe_atual < cost) {
                            showCursedToast("Energia Insuficiente", "Você não tem PE suficiente para expandir seu domínio!", "error");
                            return;
                          }
                          
                          try {
                            showCursedToast("Iniciando Ryoiki Tenkai", "Canalizando energia de barreira...", "info");
                            const res = await axios.post(`/api/manifestar_dominio/${char.id}`);
                            setChar(res.data.character);
                            
                            // Dispatch the global anime animation!
                            const ryoikiEvent = new CustomEvent('trigger-ryoiki', {
                              detail: {
                                nome: domObj.nome || 'Expansão de Domínio',
                                tipo: domObj.tipo || 'Letal',
                                descricao: domObj.descricao || 'Técnica barreira inata que garante acerto absoluto.'
                              }
                            });
                            window.dispatchEvent(ryoikiEvent);
                            
                            showCursedToast("Domínio Expandido", `Manifestou ${domObj.nome || 'Expansão de Domínio'}!`, "success");
                          } catch {
                            showCursedToast("Erro de Domínio", "Não foi possível manifestar o domínio.", "error");
                          }
                        }}
                        className="px-6 py-3 rounded-xl text-white font-extrabold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all cursor-pointer font-sans shrink-0"
                        style={{
                          backgroundColor: '#8a2be2',
                          boxShadow: '0 0 15px #8a2be2'
                        }}
                      >
                        EXPANDIR DOMÍNIO
                      </button>
                    </div>
                  )
                })()}

                {(!char.feiticos || char.feiticos.length === 0) ? (
                  <div className="glass-card rounded-2xl p-12 text-center border border-white/5 flex flex-col items-center gap-3">
                    <Scroll className="w-12 h-12 text-purple-400 animate-pulse" />
                    <h4 className="text-md font-bold text-white font-jujutsu">Canalizador Vazio</h4>
                    <p className="text-xs text-gray-400 max-w-sm font-sans">
                      Nenhum feitiço inato ou ritual aprendido. Utilize o botão acima para desenhar suas fórmulas rituais!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                    {char.feiticos.map((spell) => (
                      <div 
                        key={spell.id} 
                        className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden flex flex-col justify-between gap-4 group hover:border-purple-500/20 transition-all"
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-extrabold text-white font-jujutsu truncate max-w-[50%]">
                              {spell.nome}
                            </h4>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await axios.post(`/api/update_spell/${char.id}/${spell.id}`, { equipado: !spell.equipado })
                                    setChar(prev => ({ ...prev, feiticos: res.data }))
                                    showCursedToast(spell.equipado ? "Despreparado" : "Preparado", `${spell.nome} foi ${spell.equipado ? 'removido dos preparados' : 'preparado para combate'}!`, "success")
                                  } catch {
                                    showCursedToast("Erro", "Falha ao preparar feitiço.", "error")
                                  }
                                }}
                                className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase border tracking-wider transition-all cursor-pointer ${
                                  spell.equipado 
                                    ? 'bg-purple-950/60 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                                    : 'border-white/10 text-gray-500 hover:text-white'
                                }`}
                              >
                                {spell.equipado ? "Preparado" : "Preparar"}
                              </button>
                              <button
                                onClick={() => setEditingSpell(spell)}
                                className="text-xs text-gray-500 hover:text-purple-400 cursor-pointer flex items-center justify-center"
                                title="Editar Feitiço"
                              >
                                <Settings className="w-4 h-4 text-gray-500 hover:text-purple-400 transition-colors" />
                              </button>
                              <button
                                onClick={() => handleDeleteSpell(spell.id)}
                                className="text-xs text-gray-500 hover:text-red-400 cursor-pointer flex items-center justify-center"
                                title="Remover Feitiço"
                              >
                                <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-400 transition-colors" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-1.5 py-0.5 rounded bg-purple-950/40 border border-purple-800/30 text-[8px] text-purple-300 font-extrabold uppercase font-sans">
                              Lvl {spell.nivel ?? 1}
                            </span>
                            {spell.tipo === 'Passivo' && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-800/30 text-[8px] text-amber-400 font-extrabold uppercase font-sans">
                                Passivo
                              </span>
                            )}
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block font-sans">
                              {spell.alcance} • {spell.duracao}
                            </span>
                          </div>

                          <p className="text-[10px] text-gray-400 mt-2.5 font-sans leading-relaxed italic line-clamp-3">
                            "{spell.descricao || 'Sem descrição ritual registrada.'}"
                          </p>

                          <div className="grid grid-cols-3 gap-2 mt-3.5 text-xs bg-black/30 border border-white/5 rounded-xl p-2 font-mono text-center">
                            <div className="flex flex-col">
                              <span className="text-[8px] text-gray-500 font-bold">
                                {spell.tipo === 'Passivo' ? 'REDUÇÃO PE MÁX' : 'CUSTO'}
                              </span>
                              <span className={spell.tipo === 'Passivo' ? 'text-amber-400 font-bold' : 'text-purple-400 font-bold'}>
                                {spell.tipo === 'Passivo' ? `-${spell.custo || 0} MÁX` : `${spell.custo || 0} PE`}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[8px] text-gray-500 font-bold">AÇÃO</span>
                              <span className="text-white truncate">{spell.acao || 'Padrão'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[8px] text-gray-500 font-bold">EFEITO</span>
                              <span className="text-red-400 font-bold">{spell.dano || '—'}</span>
                            </div>
                          </div>
                        </div>

                        {spell.tipo === 'Passivo' ? (
                          <div className="w-full py-2.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-amber-400 font-extrabold text-xs uppercase tracking-wider text-center font-sans">
                            Efeito Passivo Ativo
                          </div>
                        ) : (
                          <button
                            onClick={() => handleUseSpell(spell.id, spell.nome, spell.custo || 2)}
                            className="w-full py-2.5 rounded-xl bg-purple-950/40 border border-purple-500/20 text-purple-300 font-bold text-xs uppercase tracking-wider hover:bg-purple-900/40 active:scale-95 transition-all cursor-pointer font-sans flex items-center justify-center gap-1.5"
                          >
                            <Zap className="w-4 h-4" /> Conjurar Feitiço
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* ── TAB: TALENTOS INATOS ── */}
            {activeTab === 'talentos' && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1 font-sans">
                    <h3 className="text-md font-bold font-jujutsu text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Talentos, Habilidades de Classe & Pactos
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">
                        Passivas, Votos e Atributos: <strong className="text-white">{(char.habilidades_talentos || []).length} cadastrados</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAddTalent(true)}
                    className="px-4 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all cursor-pointer font-sans flex items-center gap-1.5"
                    style={{ backgroundColor: 'var(--cursed-color)', boxShadow: '0 0 10px var(--cursed-color)' }}
                  >
                    <Plus className="w-4 h-4" /> Adicionar Talento
                  </button>
                </div>

                {(!char.habilidades_talentos || char.habilidades_talentos.length === 0) ? (
                  <div className="glass-card rounded-2xl p-12 text-center border border-white/5 flex flex-col items-center gap-3">
                    <Sparkles className="w-12 h-12 text-amber-400 animate-pulse" />
                    <h4 className="text-md font-bold text-white font-jujutsu">Livre de Fórmulas</h4>
                    <p className="text-xs text-gray-400 max-w-sm font-sans">
                      Nenhuma habilidade de classe ou talento passivo adicionado. Utilize o botão acima para documentar seus talentos.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                    {char.habilidades_talentos.map((talent) => (
                      <div 
                        key={talent.id} 
                        className="glass-card rounded-2xl p-5 border border-white/5 relative overflow-hidden flex flex-col justify-between gap-4 group hover:border-amber-500/20 transition-all"
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-extrabold text-white font-jujutsu truncate max-w-[70%]">
                              {talent.nome}
                            </h4>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingTalent(talent)}
                                className="text-xs text-gray-500 hover:text-purple-400 cursor-pointer flex items-center justify-center"
                                title="Editar Talento"
                              >
                                <Settings className="w-4 h-4 text-gray-500 hover:text-purple-400 transition-colors" />
                              </button>
                              <button
                                onClick={() => handleDeleteTalent(talent.id)}
                                className="text-xs text-gray-500 hover:text-red-400 cursor-pointer flex items-center justify-center"
                                title="Remover Talento"
                              >
                                <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-400 transition-colors" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-800/30 text-[8px] text-amber-300 font-extrabold uppercase">
                              {talent.tipo || 'Classe'}
                            </span>
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block font-sans">
                              {talent.execucao || 'Passivo'} • Cost: {talent.custo || 0} PE
                            </span>
                          </div>

                          <p className="text-[10px] text-gray-400 mt-2.5 font-sans leading-relaxed italic line-clamp-3">
                            "{talent.descricao || 'Sem descrição registrada.'}"
                          </p>

                          {talent.dado_rolagem && (
                            <span className="text-[9px] font-mono text-amber-400 mt-2 flex items-center gap-1 font-sans">
                              <Dice5 className="w-3.5 h-3.5 text-purple-400" /> Rola Dado Associado: <strong>{talent.dado_rolagem}</strong>
                            </span>
                          )}
                        </div>

                        {talent.custo > 0 || talent.dado_rolagem ? (
                          <button
                            onClick={() => handleUseTalent(talent.id, talent.nome, talent.custo || 0)}
                            className="w-full py-2.5 rounded-xl bg-amber-950/40 border border-amber-500/20 text-amber-300 font-bold text-xs uppercase tracking-wider hover:bg-amber-900/40 active:scale-95 transition-all cursor-pointer font-sans flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-4 h-4" /> Ativar Talento
                          </button>
                        ) : (
                          <div className="bg-black/20 text-center py-2 text-[9px] text-gray-500 uppercase tracking-widest font-extrabold border border-white/5 rounded-xl font-sans">
                            Talento Passivo Constante
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* ── TAB: SHIKIGAMIS ── */}
            {activeTab === 'shikigami' && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1 font-sans">
                    <h3 className="text-md font-bold font-jujutsu text-white flex items-center gap-2">
                      <PawPrint className="w-4 h-4 text-indigo-400" /> Shikigamis, Invocações & Criaturas das Sombras
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">
                        Sombras Controladas: <strong className="text-white">{(char.invocacoes || []).length} ativas</strong>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAddSummon(true)}
                    className="px-4 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all cursor-pointer font-sans flex items-center gap-1.5"
                    style={{ backgroundColor: 'var(--cursed-color)', boxShadow: '0 0 10px var(--cursed-color)' }}
                  >
                    <Plus className="w-4 h-4" /> Invocar Novo Shikigami
                  </button>
                </div>

                {(!char.invocacoes || char.invocacoes.length === 0) ? (
                  <div className="glass-card rounded-2xl p-12 text-center border border-white/5 flex flex-col items-center gap-3">
                    <PawPrint className="w-12 h-12 text-indigo-400 animate-pulse" />
                    <h4 className="text-md font-bold text-white font-jujutsu">Sombras Desocupadas</h4>
                    <p className="text-xs text-gray-400 max-w-sm font-sans">
                      Você não firmou pactos com Shikigamis ou possui invocações. Utilize o botão acima para materializar suas sombras!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                    {char.invocacoes.map((summon) => {
                      const hpPct = Math.max(0, Math.min(100, summon.hp_max > 0 ? (summon.hp_atual / summon.hp_max) * 100 : 0))
                      const pePct = Math.max(0, Math.min(100, summon.pe_max > 0 ? (summon.pe_atual / summon.pe_max) * 100 : 0))

                      return (
                        <div 
                          key={summon.id} 
                          className="glass-card rounded-3xl p-5 border border-white/5 relative overflow-hidden flex flex-col justify-between gap-4 hover:border-purple-500/20 transition-all shadow-xl"
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="text-sm font-extrabold text-white font-jujutsu flex items-center gap-1.5">
                                <PawPrint className="w-4 h-4 text-indigo-400" /> {summon.nome}
                              </h4>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setEditingSummon(summon)}
                                  className="text-xs text-gray-500 hover:text-purple-400 cursor-pointer flex items-center justify-center"
                                  title="Editar Shikigami"
                                >
                                  <Settings className="w-4 h-4 text-gray-500 hover:text-purple-400 transition-colors" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSummon(summon.id)}
                                  className="text-xs text-gray-500 hover:text-red-400 cursor-pointer flex items-center justify-center"
                                >
                                  <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-400 transition-colors" />
                                </button>
                              </div>
                            </div>

                            <p className="text-[10px] text-gray-400 mt-2 font-sans italic leading-relaxed">
                              "{summon.desc || 'Sem descrição particular registrada.'}"
                            </p>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                              {/* HP Shikigami */}
                              <div className="flex flex-col gap-1.5 bg-black/40 border border-white/5 rounded-2xl p-3">
                                <div className="flex justify-between text-[10px] font-bold text-red-400 items-center gap-1">
                                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 fill-current" /> Vida</span>
                                  <span>{summon.hp_atual} / {summon.hp_max}</span>
                                </div>
                                <div className="w-full h-2 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-red-600 rounded-full transition-all duration-300" style={{ width: `${hpPct}%` }} />
                                </div>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                  <button onClick={() => handleUpdateSummonStats(summon.id, { hp_atual: Math.min(summon.hp_max, summon.hp_atual + 1) })} className="px-1.5 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-900/30 text-[9px] cursor-pointer font-bold">+</button>
                                  <button onClick={() => handleUpdateSummonStats(summon.id, { hp_atual: Math.max(0, summon.hp_atual - 1) })} className="px-1.5 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-900/30 text-[9px] cursor-pointer font-bold">-</button>
                                </div>
                              </div>

                              {/* PE Shikigami */}
                              <div className="flex flex-col gap-1.5 bg-black/40 border border-white/5 rounded-2xl p-3">
                                <div className="flex justify-between text-[10px] font-bold text-purple-400 items-center gap-1">
                                  <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 fill-current" /> Energia</span>
                                  <span>{summon.pe_atual} / {summon.pe_max}</span>
                                </div>
                                <div className="w-full h-2 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-purple-600 rounded-full transition-all duration-300" style={{ width: `${pePct}%` }} />
                                </div>
                                <div className="flex items-center justify-center gap-2 mt-1">
                                  <button onClick={() => handleUpdateSummonStats(summon.id, { pe_atual: Math.min(summon.pe_max, summon.pe_atual + 1) })} className="px-1.5 py-0.5 rounded bg-purple-950/40 text-purple-400 border border-purple-900/30 text-[9px] cursor-pointer font-bold">+</button>
                                  <button onClick={() => handleUpdateSummonStats(summon.id, { pe_atual: Math.max(0, summon.pe_atual - 1) })} className="px-1.5 py-0.5 rounded bg-purple-950/40 text-purple-400 border border-purple-900/30 text-[9px] cursor-pointer font-bold">-</button>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-3 text-xs bg-black/30 border border-white/5 rounded-xl p-2.5">
                              <div className="flex flex-col">
                                <span className="text-[8px] text-gray-500 font-bold uppercase">ATAQUE DE GARRA</span>
                                <span 
                                  onClick={() => rollDice(summon.ataque, `Invocação: Ataque de ${summon.nome}`)}
                                  className="text-white font-semibold font-mono tracking-wide cursor-pointer hover:text-red-400 flex items-center gap-1"
                                >
                                  <Swords className="w-3.5 h-3.5 fill-current text-red-500" /> {summon.ataque}
                                </span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] text-gray-500 font-bold uppercase">DEFESA GERAL</span>
                                <span className="text-white font-semibold font-mono">{summon.defesa}</span>
                              </div>
                            </div>

                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

              </div>
            )}

            {/* ── TAB: INVENTÁRIO ── */}
            {activeTab === 'inventario' && (
              <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-1 font-sans">
                    <h3 className="text-md font-bold font-jujutsu text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-emerald-400" /> Inventário e Equipamento
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">
                        Carga Carregada: <strong className="text-white">{carriedWeight.toFixed(1)}kg</strong> / {weightLimit}kg
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowAddItem(true)}
                    className="px-4 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all cursor-pointer font-sans flex items-center gap-1.5"
                    style={{ backgroundColor: 'var(--cursed-color)', boxShadow: '0 0 10px var(--cursed-color)' }}
                  >
                    <Plus className="w-4 h-4" /> Guardar Novo Item
                  </button>
                </div>

                {/* Carried weight bar indicator */}
                <div className="w-full bg-neutral-900 border border-white/5 rounded-full h-3 overflow-hidden font-sans">
                  <div 
                    className="h-full rounded-full transition-all duration-300 bg-gradient-to-r"
                    style={{ 
                      width: `${weightPercent}%`,
                      backgroundImage: weightPercent > 85 
                        ? 'linear-gradient(to right, #ea580c, #dc2626)' 
                        : 'linear-gradient(to right, var(--cursed-color), #8b5cf6)' 
                    }}
                  />
                </div>

                {(!char.inventario || char.inventario.length === 0) ? (
                  <div className="glass-card rounded-2xl p-12 text-center border border-white/5 flex flex-col items-center gap-3">
                    <Briefcase className="w-12 h-12 text-emerald-500 animate-pulse" />
                    <h4 className="text-md font-bold text-white font-jujutsu">Inventário Vazio</h4>
                    <p className="text-xs text-gray-400 max-w-sm font-sans">
                      Você não carrega nenhum suprimento amaldiçoado ou arma. Guarde um item no seu arsenal.
                    </p>
                  </div>
                ) : (
                  <div className="glass-card rounded-2xl border border-white/5 overflow-hidden font-sans">
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-neutral-950/80 border-b border-white/5 text-gray-400 font-extrabold uppercase text-[10px]">
                            <th className="p-4">Item / Equipamento</th>
                            <th className="p-4 text-center">Quantidade</th>
                            <th className="p-4 text-center">Peso Unitário</th>
                            <th className="p-4 text-center">Peso Total</th>
                            <th className="p-4 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {char.inventario.map((item) => (
                            <tr key={item.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${item.equipado ? 'bg-emerald-950/10' : ''}`}>
                              <td className="p-4 font-bold text-white text-xs truncate max-w-xs flex items-center gap-2">
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await axios.post(`/api/update_item/${char.id}/${item.id}`, { equipado: !item.equipado })
                                      setChar(prev => ({ ...prev, inventario: res.data }))
                                      showCursedToast(item.equipado ? "Desequipado" : "Equipado", `${item.nome} foi ${item.equipado ? 'desequipado' : 'equipado'}!`, "success")
                                    } catch {
                                      showCursedToast("Erro", "Falha ao equipar item.", "error")
                                    }
                                  }}
                                  className={`w-5 h-5 rounded border flex items-center justify-center transition-all cursor-pointer ${
                                    item.equipado 
                                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                                      : 'border-white/10 text-gray-500 hover:text-white hover:border-white/30'
                                  }`}
                                  title={item.equipado ? "Desequipar Item" : "Equipar Item"}
                                >
                                  <Briefcase className="w-3.5 h-3.5" />
                                </button>
                                <span className={item.equipado ? 'text-emerald-400 font-extrabold' : ''}>{item.nome}</span>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => handleUpdateItemQty(item.id, item.qtd || 1, -1)} className="w-5 h-5 rounded bg-neutral-900 border border-white/10 text-white flex items-center justify-center font-bold font-sans cursor-pointer">-</button>
                                  <span className="font-extrabold text-white w-6">{item.qtd || 1}</span>
                                  <button onClick={() => handleUpdateItemQty(item.id, item.qtd || 1, 1)} className="w-5 h-5 rounded bg-neutral-900 border border-white/10 text-white flex items-center justify-center font-bold font-sans cursor-pointer">+</button>
                                </div>
                              </td>
                              <td className="p-4 text-center text-gray-400 font-medium font-mono">
                                {(item.peso || 0).toFixed(1)} kg
                              </td>
                              <td className="p-4 text-center text-purple-300 font-bold font-mono">
                                {((item.qtd || 1) * (item.peso || 0)).toFixed(1)} kg
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="px-2.5 py-1 rounded bg-red-950/40 border border-red-500/20 text-red-400 hover:bg-red-900/40 text-[10px] font-bold uppercase transition-all cursor-pointer font-sans"
                                >
                                  Jogar Fora
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ── TAB: DIÁRIO DA ALMA ── */}
            {activeTab === 'diario' && (
              <div className="flex flex-col gap-6 font-sans">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-md font-bold font-jujutsu text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" /> Diário da Alma e Memórias de Combate
                    </h3>
                    <span className="text-[10px] text-gray-500">
                      Rascunhe estratégias, treinos e notas de campanha. Clique no botão ao lado para gravar permanentemente.
                    </span>
                  </div>

                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="px-5 py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                    style={{ backgroundColor: 'var(--cursed-color)', boxShadow: '0 0 10px var(--cursed-color)' }}
                  >
                    {isSavingNotes ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin mr-1" />
                        Gravando Alma...
                      </>
                    ) : (
                      <span className="flex items-center gap-1.5"><Save className="w-4 h-4" /> Gravar Diário</span>
                    )}
                  </button>
                </div>

                <div className="glass-card rounded-2xl p-6 border border-white/5 shadow-2xl relative overflow-hidden flex flex-col gap-4">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Escreva aqui suas técnicas ocultas, objetivos, diário do personagem..."
                    className="w-full min-h-[420px] bg-neutral-900/40 border border-white/5 rounded-2xl p-4 text-xs font-sans text-gray-300 focus:outline-none focus:border-purple-500/30 transition-colors leading-relaxed placeholder-gray-600 resize-y"
                  />
                  <div className="text-[9px] text-gray-500 italic text-right">
                    Notas e diário são salvos no banco SQLite sincronizados com seu login.
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MODALS IMPLEMENTATIONS
          ═══════════════════════════════════════════════════════════════════ */}

      {/* Modal Pericia update */}
      <AnimatePresence>
        {editingPericia && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-6 border border-white/10 max-w-sm w-full font-sans flex flex-col gap-5 shadow-2xl"
            >
              <h3 className="text-md font-bold font-jujutsu text-white flex items-center gap-1.5"><Settings className="w-4 h-4 text-purple-400" /> Calibrar Perícia: {editingPericia.nome}</h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-bold">TREINADA (Custo de Proficiência)</span>
                  <input
                    type="checkbox"
                    checked={editingPericia.treinada}
                    onChange={(e) => setEditingPericia(prev => ({ ...prev, treinada: e.target.checked }))}
                    className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 font-bold">BÔNUS ADICIONAL FIXO</span>
                  <input
                    type="number"
                    value={editingPericia.bonus}
                    onChange={(e) => setEditingPericia(prev => ({ ...prev, bonus: parseInt(e.target.value) || 0 }))}
                    placeholder="Bônus e.g. +2"
                    className="px-3.5 py-2.5 rounded-xl text-xs bg-neutral-900 border border-white/10 text-white font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <button onClick={handleSavePericia} className="flex-1 py-2.5 bg-green-700/80 hover:bg-green-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Confirmar</button>
                <button onClick={() => setEditingPericia(null)} className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Cancelar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Resistência update */}
      <AnimatePresence>
        {editingResistance && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-6 border border-white/10 max-w-sm w-full font-sans flex flex-col gap-5 shadow-2xl"
            >
              <h3 className="text-md font-bold font-jujutsu text-white flex items-center gap-1.5"><Settings className="w-4 h-4 text-purple-400" /> Calibrar Resistência: {editingResistance.nome}</h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-bold">TREINADA</span>
                  <input
                    type="checkbox"
                    checked={editingResistance.treinada}
                    onChange={(e) => setEditingResistance(prev => ({ ...prev, treinada: e.target.checked }))}
                    className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 font-bold">MESTRE</span>
                  <input
                    type="checkbox"
                    checked={editingResistance.mestre}
                    onChange={(e) => setEditingResistance(prev => ({ ...prev, mestre: e.target.checked }))}
                    className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 font-bold">BÔNUS ADICIONAL FIXO</span>
                  <input
                    type="number"
                    value={editingResistance.bonus}
                    onChange={(e) => setEditingResistance(prev => ({ ...prev, bonus: parseInt(e.target.value) || 0 }))}
                    placeholder="Bônus e.g. +2"
                    className="px-3.5 py-2.5 rounded-xl text-xs bg-neutral-900 border border-white/10 text-white font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <button onClick={handleSaveResistance} className="flex-1 py-2.5 bg-green-700/80 hover:bg-green-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Confirmar</button>
                <button onClick={() => setEditingResistance(null)} className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Cancelar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Add Attack */}
      <AnimatePresence>
        {showAddAttack && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-6 border border-white/10 max-w-md w-full font-sans flex flex-col gap-4 shadow-2xl my-8"
            >
              <h3 className="text-md font-bold font-jujutsu text-white flex items-center gap-1.5"><Swords className="w-4 h-4 text-red-500" /> Adicionar Ataque Arsenal</h3>
              <form onSubmit={handleAddAttack} className="flex flex-col gap-3 text-xs">
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold">NOME DO ATAQUE</label>
                  <input
                    type="text"
                    value={attackForm.nome}
                    onChange={(e) => setAttackForm(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="e.g. Soco Concentrado de Energia..."
                    className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">PERÍCIA USADA</label>
                    <select
                      value={attackForm.pericia}
                      onChange={(e) => setAttackForm(prev => ({ ...prev, pericia: e.target.value }))}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white outline-none cursor-pointer"
                    >
                      <option value="Luta">Luta</option>
                      <option value="Pontaria">Pontaria</option>
                      <option value="Feitiçaria">Feitiçaria</option>
                      <option value="Iniciativa">Iniciativa</option>
                      <option value="Reflexos">Reflexos</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">TIPO DANO</label>
                    <input
                      type="text"
                      value={attackForm.tipo}
                      onChange={(e) => setAttackForm(prev => ({ ...prev, tipo: e.target.value }))}
                      placeholder="e.g. Impacto, Corte..."
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">DADOS DANO</label>
                    <input
                      type="text"
                      value={attackForm.dano_dados}
                      onChange={(e) => setAttackForm(prev => ({ ...prev, dano_dados: e.target.value }))}
                      placeholder="e.g. 2d6, 1d8..."
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none font-mono"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">ATRIBUTO DANO</label>
                    <select
                      value={attackForm.dano_attr}
                      onChange={(e) => setAttackForm(prev => ({ ...prev, dano_attr: e.target.value }))}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white outline-none cursor-pointer"
                    >
                      <option value="forca">Força (FOR)</option>
                      <option value="destreza">Destreza (DES)</option>
                      <option value="none">Nenhum (Somente Dados)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">BÔNUS ACERTO FIXO</label>
                    <input
                      type="number"
                      value={attackForm.bonus_acerto}
                      onChange={(e) => setAttackForm(prev => ({ ...prev, bonus_acerto: parseInt(e.target.value) || 0 }))}
                      placeholder="e.g. +2"
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">BÔNUS DANO FIXO</label>
                    <input
                      type="number"
                      value={attackForm.bonus_dano}
                      onChange={(e) => setAttackForm(prev => ({ ...prev, bonus_dano: parseInt(e.target.value) || 0 }))}
                      placeholder="e.g. +2"
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">MARGEM CRÍTICO</label>
                    <input
                      type="text"
                      value={attackForm.critico}
                      onChange={(e) => setAttackForm(prev => ({ ...prev, critico: e.target.value }))}
                      placeholder="e.g. 20 / x2..."
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">ALCANCE</label>
                    <input
                      type="text"
                      value={attackForm.alcance}
                      onChange={(e) => setAttackForm(prev => ({ ...prev, alcance: e.target.value }))}
                      placeholder="e.g. Corpo a Corpo, 9m..."
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <button type="submit" className="flex-1 py-2.5 bg-green-700/80 hover:bg-green-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Adicionar</button>
                  <button type="button" onClick={() => setShowAddAttack(false)} className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Cancelar</button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Edit Attack */}
      <AnimatePresence>
        {editingAttack && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-6 border border-white/10 max-w-md w-full font-sans flex flex-col gap-4 shadow-2xl my-8"
            >
              <h3 className="text-md font-bold font-jujutsu text-white flex items-center gap-1.5"><Swords className="w-4 h-4 text-red-500" /> Editar Técnica / Ataque</h3>
              <form onSubmit={handleSaveEditAttack} className="flex flex-col gap-3 text-xs">
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold">NOME DO ATAQUE</label>
                  <input
                    type="text"
                    value={editingAttack.nome}
                    onChange={(e) => setEditingAttack(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="e.g. Soco Concentrado de Energia..."
                    className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">PERÍCIA USADA</label>
                    <select
                      value={editingAttack.pericia}
                      onChange={(e) => setEditingAttack(prev => ({ ...prev, pericia: e.target.value }))}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white outline-none cursor-pointer"
                    >
                      <option value="Luta">Luta</option>
                      <option value="Pontaria">Pontaria</option>
                      <option value="Feitiçaria">Feitiçaria</option>
                      <option value="Iniciativa">Iniciativa</option>
                      <option value="Reflexos">Reflexos</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">TIPO DANO</label>
                    <input
                      type="text"
                      value={editingAttack.tipo}
                      onChange={(e) => setEditingAttack(prev => ({ ...prev, tipo: e.target.value }))}
                      placeholder="e.g. Impacto, Corte..."
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">DADOS DANO</label>
                    <input
                      type="text"
                      value={editingAttack.dano_dados}
                      onChange={(e) => setEditingAttack(prev => ({ ...prev, dano_dados: e.target.value }))}
                      placeholder="e.g. 2d6, 1d8..."
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none font-mono"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">ATRIBUTO DANO</label>
                    <select
                      value={editingAttack.dano_attr}
                      onChange={(e) => setEditingAttack(prev => ({ ...prev, dano_attr: e.target.value }))}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white outline-none cursor-pointer"
                    >
                      <option value="forca">Força (FOR)</option>
                      <option value="destreza">Destreza (DES)</option>
                      <option value="none">Nenhum (Somente Dados)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">BÔNUS ACERTO FIXO</label>
                    <input
                      type="number"
                      value={editingAttack.bonus_acerto}
                      onChange={(e) => setEditingAttack(prev => ({ ...prev, bonus_acerto: parseInt(e.target.value) || 0 }))}
                      placeholder="e.g. +2"
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">BÔNUS DANO FIXO</label>
                    <input
                      type="number"
                      value={editingAttack.bonus_dano}
                      onChange={(e) => setEditingAttack(prev => ({ ...prev, bonus_dano: parseInt(e.target.value) || 0 }))}
                      placeholder="e.g. +2"
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">MARGEM CRÍTICO</label>
                    <input
                      type="text"
                      value={editingAttack.critico}
                      onChange={(e) => setEditingAttack(prev => ({ ...prev, critico: e.target.value }))}
                      placeholder="e.g. 20 / x2..."
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">ALCANCE</label>
                    <input
                      type="text"
                      value={editingAttack.alcance}
                      onChange={(e) => setEditingAttack(prev => ({ ...prev, alcance: e.target.value }))}
                      placeholder="e.g. Corpo a Corpo, 9m..."
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <button type="submit" className="flex-1 py-2.5 bg-green-700/80 hover:bg-green-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Salvar</button>
                  <button type="button" onClick={() => setEditingAttack(null)} className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Cancelar</button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Add Spell */}
      <AnimatePresence>
        {showAddSpell && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-6 border border-white/10 max-w-md w-full font-sans flex flex-col gap-4 shadow-2xl my-8"
            >
              <h3 className="text-md font-bold font-jujutsu text-white flex items-center gap-1.5"><Scroll className="w-4 h-4 text-purple-400" /> Registrar Feitiço / Ritual</h3>
              <form onSubmit={handleAddSpell} className="flex flex-col gap-3 text-xs">
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold">NOME DO FEITIÇO / TÉCNICA</label>
                  <input
                    type="text"
                    value={spellForm.nome}
                    onChange={(e) => setSpellForm(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="e.g. Raio de Energia Oculta..."
                    className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">NÍVEL (0 A 5)</label>
                    <select
                      value={spellForm.nivel}
                      onChange={(e) => updateSpellLevelOrType('nivel', parseInt(e.target.value) || 0)}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    >
                      <option value={0}>Nível 0</option>
                      <option value={1}>Nível 1</option>
                      <option value={2}>Nível 2</option>
                      <option value={3}>Nível 3</option>
                      <option value={4}>Nível 4</option>
                      <option value={5}>Nível 5</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">TIPO</label>
                    <select
                      value={spellForm.tipo}
                      onChange={(e) => updateSpellLevelOrType('tipo', e.target.value)}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Passivo">Passivo</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">
                      {spellForm.tipo === 'Passivo' ? 'REDUÇÃO MÁX' : 'CUSTO PE'}
                    </label>
                    <input
                      type="text"
                      value={spellForm.custo}
                      disabled
                      className="px-3 py-2 rounded-lg bg-neutral-800 border border-white/10 text-gray-400 font-bold text-center focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">AÇÃO EXECUT.</label>
                    <input
                      type="text"
                      value={spellForm.acao}
                      onChange={(e) => setSpellForm(prev => ({ ...prev, acao: e.target.value }))}
                      placeholder="Padrão"
                      className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">ALCANCE</label>
                    <input
                      type="text"
                      value={spellForm.alcance}
                      onChange={(e) => setSpellForm(prev => ({ ...prev, alcance: e.target.value }))}
                      placeholder="Médio (9m)"
                      className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">DURAÇÃO</label>
                    <input
                      type="text"
                      value={spellForm.duracao}
                      onChange={(e) => setSpellForm(prev => ({ ...prev, duracao: e.target.value }))}
                      placeholder="Instantânea"
                      className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold">DADO DE DANO / CURA</label>
                  <input
                    type="text"
                    value={spellForm.dano}
                    onChange={(e) => setSpellForm(prev => ({ ...prev, dano: e.target.value }))}
                    placeholder="e.g. 3d8 (energia) ou 2d6 (cura)"
                    className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold">DESCRIÇÃO E EFEITO</label>
                  <textarea
                    value={spellForm.descricao}
                    onChange={(e) => setSpellForm(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descreva as amarras rituais e o efeito prático deste ritual..."
                    className="w-full h-24 bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-green-700/80 hover:bg-green-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Gravar Ritual</button>
                  <button type="button" onClick={() => setShowAddSpell(false)} className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Cancelar</button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Edit Spell */}
      <AnimatePresence>
        {editingSpell && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-6 border border-white/10 max-w-md w-full font-sans flex flex-col gap-4 shadow-2xl my-8"
            >
              <h3 className="text-md font-bold font-jujutsu text-white flex items-center gap-1.5"><Scroll className="w-4 h-4 text-purple-400" /> Editar Feitiço / Ritual</h3>
              <form onSubmit={handleSaveEditSpell} className="flex flex-col gap-3 text-xs">
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold">NOME DO FEITIÇO / TÉCNICA</label>
                  <input
                    type="text"
                    value={editingSpell.nome}
                    onChange={(e) => setEditingSpell(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="e.g. Raio de Energia Oculta..."
                    className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">NÍVEL (0 A 5)</label>
                    <select
                      value={editingSpell.nivel}
                      onChange={(e) => {
                        const lvl = parseInt(e.target.value) || 0;
                        setEditingSpell(prev => {
                          const updated = { ...prev, nivel: lvl };
                          const t = updated.tipo;
                          if (t === 'Passivo') {
                            const map = { 0: 0, 1: 2, 2: 4, 3: 6, 4: 8, 5: 10 };
                            updated.custo = map[lvl] !== undefined ? map[lvl] : lvl * 2;
                          } else {
                            const map = { 0: 0, 1: 2, 2: 5, 3: 8, 4: 12, 5: 20 };
                            updated.custo = map[lvl] !== undefined ? map[lvl] : lvl * 4;
                          }
                          return updated;
                        });
                      }}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    >
                      <option value={0}>Nível 0</option>
                      <option value={1}>Nível 1</option>
                      <option value={2}>Nível 2</option>
                      <option value={3}>Nível 3</option>
                      <option value={4}>Nível 4</option>
                      <option value={5}>Nível 5</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">TIPO</label>
                    <select
                      value={editingSpell.tipo}
                      onChange={(e) => {
                        const t = e.target.value;
                        setEditingSpell(prev => {
                          const updated = { ...prev, tipo: t };
                          const lvl = updated.nivel;
                          if (t === 'Passivo') {
                            const map = { 0: 0, 1: 2, 2: 4, 3: 6, 4: 8, 5: 10 };
                            updated.custo = map[lvl] !== undefined ? map[lvl] : lvl * 2;
                          } else {
                            const map = { 0: 0, 1: 2, 2: 5, 3: 8, 4: 12, 5: 20 };
                            updated.custo = map[lvl] !== undefined ? map[lvl] : lvl * 4;
                          }
                          return updated;
                        });
                      }}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Passivo">Passivo</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">
                      {editingSpell.tipo === 'Passivo' ? 'REDUÇÃO MÁX' : 'CUSTO PE'}
                    </label>
                    <input
                      type="text"
                      value={editingSpell.custo}
                      disabled
                      className="px-3 py-2 rounded-lg bg-neutral-800 border border-white/10 text-gray-400 font-bold text-center focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">AÇÃO EXECUT.</label>
                    <input
                      type="text"
                      value={editingSpell.acao}
                      onChange={(e) => setEditingSpell(prev => ({ ...prev, acao: e.target.value }))}
                      placeholder="Padrão"
                      className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">ALCANCE</label>
                    <input
                      type="text"
                      value={editingSpell.alcance}
                      onChange={(e) => setEditingSpell(prev => ({ ...prev, alcance: e.target.value }))}
                      placeholder="Médio (9m)"
                      className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">DURAÇÃO</label>
                    <input
                      type="text"
                      value={editingSpell.duracao}
                      onChange={(e) => setEditingSpell(prev => ({ ...prev, duracao: e.target.value }))}
                      placeholder="Instantânea"
                      className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold">DADO DE DANO / CURA</label>
                  <input
                    type="text"
                    value={editingSpell.dano}
                    onChange={(e) => setEditingSpell(prev => ({ ...prev, dano: e.target.value }))}
                    placeholder="e.g. 3d8 (energia) ou 2d6 (cura)"
                    className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold">DESCRIÇÃO E EFEITO</label>
                  <textarea
                    value={editingSpell.descricao}
                    onChange={(e) => setEditingSpell(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descreva as amarras rituais e o efeito prático deste ritual..."
                    className="w-full h-24 bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-green-700/80 hover:bg-green-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Salvar</button>
                  <button type="button" onClick={() => setEditingSpell(null)} className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Cancelar</button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Add Talent */}
      <AnimatePresence>
        {showAddTalent && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-6 border border-white/10 max-w-md w-full font-sans flex flex-col gap-4 shadow-2xl my-8"
            >
              <h3 className="text-md font-bold font-jujutsu text-white flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-400" /> Sintonizar Talento Inato</h3>
              <form onSubmit={handleAddTalent} className="flex flex-col gap-3 text-xs">
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold">NOME DO TALENTO</label>
                  <input
                    type="text"
                    value={talentForm.nome}
                    onChange={(e) => setTalentForm(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="e.g. Flash Negro (Kokusen)..."
                    className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">TIPO TALENTO</label>
                    <select
                      value={talentForm.tipo}
                      onChange={(e) => setTalentForm(prev => ({ ...prev, tipo: e.target.value }))}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white outline-none cursor-pointer"
                    >
                      <option value="Classe">Classe</option>
                      <option value="Origem">Origem</option>
                      <option value="Passiva">Talento Passivo</option>
                      <option value="Pacto">Pacto Restritivo</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">CUSTO PE</label>
                    <input
                      type="number"
                      value={talentForm.custo}
                      onChange={(e) => setTalentForm(prev => ({ ...prev, custo: parseInt(e.target.value) || 0 }))}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">EXECUÇÃO</label>
                    <input
                      type="text"
                      value={talentForm.execucao}
                      onChange={(e) => setTalentForm(prev => ({ ...prev, execucao: e.target.value }))}
                      placeholder="Passiva / Padrão"
                      className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">ALCANCE</label>
                    <input
                      type="text"
                      value={talentForm.alcance}
                      onChange={(e) => setTalentForm(prev => ({ ...prev, alcance: e.target.value }))}
                      placeholder="Pessoal"
                      className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">DURAÇÃO</label>
                    <input
                      type="text"
                      value={talentForm.duracao}
                      onChange={(e) => setTalentForm(prev => ({ ...prev, duracao: e.target.value }))}
                      placeholder="Instantânea"
                      className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold">ROLAGEM ASSOCIADA (OPCIONAL)</label>
                  <input
                    type="text"
                    value={talentForm.dado_rolagem}
                    onChange={(e) => setTalentForm(prev => ({ ...prev, dado_rolagem: e.target.value }))}
                    placeholder="e.g. 1d20+5 ou 1d8..."
                    className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold">DESCRIÇÃO DO TALENTO</label>
                  <textarea
                    value={talentForm.descricao}
                    onChange={(e) => setTalentForm(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descreva o escopo e efeito ativo deste talento..."
                    className="w-full h-24 bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-green-700/80 hover:bg-green-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Sintonizar</button>
                  <button type="button" onClick={() => setShowAddTalent(false)} className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Cancelar</button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Edit Talent */}
      <AnimatePresence>
        {editingTalent && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-6 border border-white/10 max-w-md w-full font-sans flex flex-col gap-4 shadow-2xl my-8"
            >
              <h3 className="text-md font-bold font-jujutsu text-white flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-amber-400" /> Editar Talento Inato</h3>
              <form onSubmit={handleSaveEditTalent} className="flex flex-col gap-3 text-xs">
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold">NOME DO TALENTO</label>
                  <input
                    type="text"
                    value={editingTalent.nome}
                    onChange={(e) => setEditingTalent(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="e.g. Flash Negro (Kokusen)..."
                    className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">TIPO TALENTO</label>
                    <select
                      value={editingTalent.tipo}
                      onChange={(e) => setEditingTalent(prev => ({ ...prev, tipo: e.target.value }))}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white outline-none cursor-pointer"
                    >
                      <option value="Classe">Classe</option>
                      <option value="Origem">Origem</option>
                      <option value="Passiva">Talento Passivo</option>
                      <option value="Pacto">Pacto Restritivo</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">CUSTO PE</label>
                    <input
                      type="number"
                      value={editingTalent.custo}
                      onChange={(e) => setEditingTalent(prev => ({ ...prev, custo: parseInt(e.target.value) || 0 }))}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">EXECUÇÃO</label>
                    <input
                      type="text"
                      value={editingTalent.execucao}
                      onChange={(e) => setEditingTalent(prev => ({ ...prev, execucao: e.target.value }))}
                      placeholder="Passiva / Padrão"
                      className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">ALCANCE</label>
                    <input
                      type="text"
                      value={editingTalent.alcance}
                      onChange={(e) => setEditingTalent(prev => ({ ...prev, alcance: e.target.value }))}
                      placeholder="Pessoal"
                      className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">DURAÇÃO</label>
                    <input
                      type="text"
                      value={editingTalent.duracao}
                      onChange={(e) => setEditingTalent(prev => ({ ...prev, duracao: e.target.value }))}
                      placeholder="Instantânea"
                      className="px-3.5 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold">ROLAGEM ASSOCIADA (OPCIONAL)</label>
                  <input
                    type="text"
                    value={editingTalent.dado_rolagem || ''}
                    onChange={(e) => setEditingTalent(prev => ({ ...prev, dado_rolagem: e.target.value }))}
                    placeholder="e.g. 1d20+5 ou 1d8..."
                    className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold">DESCRIÇÃO DO TALENTO</label>
                  <textarea
                    value={editingTalent.descricao}
                    onChange={(e) => setEditingTalent(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descreva o escopo e efeito ativo deste talento..."
                    className="w-full h-24 bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-green-700/80 hover:bg-green-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Salvar</button>
                  <button type="button" onClick={() => setEditingTalent(null)} className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Cancelar</button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Add Summon */}
      <AnimatePresence>
        {showAddSummon && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-6 border border-white/10 max-w-md w-full font-sans flex flex-col gap-4 shadow-2xl my-8"
            >
              <h3 className="text-md font-bold font-jujutsu text-white flex items-center gap-1.5"><PawPrint className="w-4 h-4 text-indigo-400" /> Evocar Shikigami / Sombra</h3>
              <form onSubmit={handleAddSummon} className="flex flex-col gap-3 text-xs">
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold">NOME DO SHIKIGAMI</label>
                  <input
                    type="text"
                    value={summonForm.nome}
                    onChange={(e) => setSummonForm(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="e.g. Cão Divino (Gyokuken)..."
                    className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">PONTOS DE VIDA MÁX (HP)</label>
                    <input
                      type="number"
                      value={summonForm.hp_max}
                      onChange={(e) => setSummonForm(prev => ({ ...prev, hp_max: parseInt(e.target.value) || 10 }))}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">PE MÁX</label>
                    <input
                      type="number"
                      value={summonForm.pe_max}
                      onChange={(e) => setSummonForm(prev => ({ ...prev, pe_max: parseInt(e.target.value) || 5 }))}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">FÓRMULA ATAQUE</label>
                    <input
                      type="text"
                      value={summonForm.ataque}
                      onChange={(e) => setSummonForm(prev => ({ ...prev, ataque: e.target.value }))}
                      placeholder="e.g. 1d6+2"
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none font-mono"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">DEFESA GERAL</label>
                    <input
                      type="number"
                      value={summonForm.defesa}
                      onChange={(e) => setSummonForm(prev => ({ ...prev, defesa: parseInt(e.target.value) || 12 }))}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold">DESCRIÇÃO DO RITUAL DE INVOCAÇÃO</label>
                  <textarea
                    value={summonForm.desc}
                    onChange={(e) => setSummonForm(prev => ({ ...prev, desc: e.target.value }))}
                    placeholder="Descreva as habilidades especiais do Shikigami ou suas restrições das sombras..."
                    className="w-full h-24 bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-green-700/80 hover:bg-green-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Pactuar Sombra</button>
                  <button type="button" onClick={() => setShowAddSummon(false)} className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Cancelar</button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Edit Summon */}
      <AnimatePresence>
        {editingSummon && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-6 border border-white/10 max-w-md w-full font-sans flex flex-col gap-4 shadow-2xl my-8"
            >
              <h3 className="text-md font-bold font-jujutsu text-white flex items-center gap-1.5"><PawPrint className="w-4 h-4 text-indigo-400" /> Editar Shikigami / Sombra</h3>
              <form onSubmit={handleSaveEditSummon} className="flex flex-col gap-3 text-xs">
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold">NOME DO SHIKIGAMI</label>
                  <input
                    type="text"
                    value={editingSummon.nome}
                    onChange={(e) => setEditingSummon(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="e.g. Cão Divino (Gyokuken)..."
                    className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">PONTOS DE VIDA ATUAL (HP)</label>
                    <input
                      type="number"
                      value={editingSummon.hp_atual}
                      onChange={(e) => setEditingSummon(prev => ({ ...prev, hp_atual: parseInt(e.target.value) || 0 }))}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">PONTOS DE VIDA MÁX (HP)</label>
                    <input
                      type="number"
                      value={editingSummon.hp_max}
                      onChange={(e) => setEditingSummon(prev => ({ ...prev, hp_max: parseInt(e.target.value) || 0 }))}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">PE ATUAL</label>
                    <input
                      type="number"
                      value={editingSummon.pe_atual}
                      onChange={(e) => setEditingSummon(prev => ({ ...prev, pe_atual: parseInt(e.target.value) || 0 }))}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">PE MÁX</label>
                    <input
                      type="number"
                      value={editingSummon.pe_max}
                      onChange={(e) => setEditingSummon(prev => ({ ...prev, pe_max: parseInt(e.target.value) || 0 }))}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">FÓRMULA ATAQUE</label>
                    <input
                      type="text"
                      value={editingSummon.ataque}
                      onChange={(e) => setEditingSummon(prev => ({ ...prev, ataque: e.target.value }))}
                      placeholder="e.g. 1d6+2"
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none font-mono"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">DEFESA GERAL</label>
                    <input
                      type="number"
                      value={editingSummon.defesa}
                      onChange={(e) => setEditingSummon(prev => ({ ...prev, defesa: parseInt(e.target.value) || 0 }))}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold">DESCRIÇÃO DO RITUAL DE INVOCAÇÃO</label>
                  <textarea
                    value={editingSummon.desc || ''}
                    onChange={(e) => setEditingSummon(prev => ({ ...prev, desc: e.target.value }))}
                    placeholder="Descreva as habilidades especiais do Shikigami ou suas restrições das sombras..."
                    className="w-full h-24 bg-neutral-900 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-green-700/80 hover:bg-green-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Salvar</button>
                  <button type="button" onClick={() => setEditingSummon(null)} className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Cancelar</button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Add Item */}
      <AnimatePresence>
        {showAddItem && (
          <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-6 border border-white/10 max-w-sm w-full font-sans flex flex-col gap-4 shadow-2xl"
            >
              <h3 className="text-md font-bold font-jujutsu text-white flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-emerald-400" /> Guardar Item Arsenal</h3>
              <form onSubmit={handleAddItem} className="flex flex-col gap-3 text-xs">
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-gray-400 font-bold">NOME DO ITEM</label>
                  <input
                    type="text"
                    value={itemForm.nome}
                    onChange={(e) => setItemForm(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="e.g. Óculos Selados, Amuleto..."
                    className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">QUANTIDADE</label>
                    <input
                      type="number"
                      value={itemForm.qtd}
                      onChange={(e) => setItemForm(prev => ({ ...prev, qtd: parseInt(e.target.value) || 1 }))}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-bold">PESO UNITÁRIO (KG)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={itemForm.peso}
                      onChange={(e) => setItemForm(prev => ({ ...prev, peso: parseFloat(e.target.value) || 0 }))}
                      className="px-3 py-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <button type="submit" className="flex-1 py-2.5 bg-green-700/80 hover:bg-green-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Guardar</button>
                  <button type="button" onClick={() => setShowAddItem(false)} className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer">Cancelar</button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
 
      {/* Modal Cropper de Retrato */}
      <AnimatePresence>
        {cropperOpen && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-3xl p-6 border border-white/10 max-w-sm w-full font-sans flex flex-col items-center gap-5 shadow-2xl my-8 text-center"
            >
              <div>
                <h3 className="text-md font-bold font-jujutsu text-white flex items-center justify-center gap-1.5"><Scale className="w-4 h-4 text-purple-400" /> Selar Retrato da Alma</h3>
                <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Ajuste a manifestação visual do seu feiticeiro</p>
              </div>

              {/* Crop Box Container */}
              <div 
                className="w-64 h-64 rounded-2xl border-2 overflow-hidden relative cursor-move select-none shadow-[0_0_30px_rgba(var(--cursed-color-rgb),0.15)]"
                style={{ borderColor: 'var(--cursed-color)' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                {rawImage && (
                  <img
                    src={rawImage}
                    alt="Ajuste"
                    draggable={false}
                    className="absolute max-w-none origin-center pointer-events-none"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) translate(${panX}px, ${panY}px) rotate(${rotation}deg) scale(${zoom * scaleToFitFactor})`,
                      width: imageSize.width,
                      height: imageSize.height,
                    }}
                  />
                )}
                {/* Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/40 pointer-events-none" />
                <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] rounded-2xl pointer-events-none" />
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed">
                Arraste a imagem para posicionar. Use as barras abaixo para calibrar a escala e rotação.
              </p>

              {/* Controls */}
              <div className="w-full flex flex-col gap-4 font-sans text-xs">
                {/* Zoom Control */}
                <div className="flex flex-col gap-1.5 text-left">
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase items-center gap-1">
                    <span className="flex items-center gap-1"><Search className="w-3.5 h-3.5 text-purple-400" /> ESCALA / ZOOM</span>
                    <span className="text-white font-mono" style={{ color: 'var(--cursed-color)' }}>{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none bg-neutral-900 cursor-pointer outline-none accent-current"
                    style={{ color: 'var(--cursed-color)' }}
                  />
                </div>

                {/* Rotation Control */}
                <div className="flex flex-col gap-1.5 text-left">
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase items-center gap-1">
                    <span className="flex items-center gap-1"><RotateCw className="w-3.5 h-3.5 text-purple-400" /> ROTAÇÃO</span>
                    <span className="text-white font-mono" style={{ color: 'var(--cursed-color)' }}>{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    value={rotation}
                    onChange={(e) => setRotation(parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none bg-neutral-900 cursor-pointer outline-none accent-current"
                    style={{ color: 'var(--cursed-color)' }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-3 w-full mt-2">
                <button
                  type="button"
                  disabled={isSavingAvatar}
                  onClick={handleCropAndSave}
                  className="flex-1 py-2.5 bg-green-700/80 hover:bg-green-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-lg flex items-center justify-center gap-2"
                >
                  {isSavingAvatar ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-white animate-spin mr-1" />
                      <span>Selando...</span>
                    </>
                  ) : (
                    <span>Aplicar Selo</span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isSavingAvatar}
                  onClick={() => {
                    setCropperOpen(false)
                    setRawImage(null)
                  }}
                  className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-gray-300 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
