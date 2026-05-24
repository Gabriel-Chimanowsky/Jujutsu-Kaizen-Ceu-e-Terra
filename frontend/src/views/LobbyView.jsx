import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { showCursedToast } from '../utils/toast'
import { showConfirmModal } from '../utils/confirm'
import CursedLogo from '../components/CursedLogo'
import AttributesRadarChart from '../components/AttributesRadarChart'
import UnifiedRadarChart from '../components/UnifiedRadarChart'
import { 
  Zap, 
  RotateCw, 
  Swords, 
  Shield, 
  Scroll, 
  BookOpen, 
  Sparkles, 
  FolderOpen, 
  Award, 
  TrendingUp, 
  X, 
  MessageSquare, 
  AlertTriangle, 
  Eye, 
  Skull, 
  Ghost, 
  HelpCircle, 
  FileText, 
  User, 
  PlusCircle, 
  ArrowLeft, 
  Compass, 
  Crown, 
  LogOut, 
  Copy, 
  Home, 
  Users,
  Briefcase,
  Activity,
  Heart,
  ChevronDown,
  ChevronUp,
  ShieldAlert
} from 'lucide-react'

export default function LobbyView({ authStatus, reloadAuth, navigate }) {
  const [loading, setLoading] = useState(true)
  const [lobbyData, setLobbyData] = useState(null)
  
  // Form states
  const [lobbyName, setLobbyName] = useState('')
  const [lobbyCodeInput, setLobbyCodeInput] = useState('')
  const [addUsernameInput, setAddUsernameInput] = useState('')
  const [xpAmounts, setXpAmounts] = useState({}) // { charId: amount }
  const [expandedHuds, setExpandedHuds] = useState({}) // { charId: bool }
  const [expandedCharts, setExpandedCharts] = useState({}) // { charId: bool }
  const [selectedCompareIds, setSelectedCompareIds] = useState([])

  useEffect(() => {
    if (lobbyData?.characters) {
      const charIds = lobbyData.characters.map(c => c.id);
      setSelectedCompareIds(prev => {
        if (prev.length > 0 && prev.every(id => charIds.includes(id))) {
          return prev;
        }
        return charIds;
      });
    }
  }, [lobbyData?.characters])


  // Load and poll lobby status
  const fetchLobbyData = async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const response = await axios.get('/lobby', {
        params: { format: 'json' },
        headers: { 'Accept': 'application/json' }
      })
      setLobbyData(response.data)
    } catch (err) {
      console.error("Error loading lobby data:", err)
      showCursedToast("Erro de Conexão", "Não foi possível sincronizar o Lobby.", "error")
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    fetchLobbyData(true)

    // Poll lobby data every 4 seconds to sync status in real time
    const interval = setInterval(() => {
      fetchLobbyData(false)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  const handleCreateLobby = async (e) => {
    e.preventDefault()
    const name = lobbyName.trim() || 'Domínio do Mestre'
    setLoading(true)
    try {
      const response = await axios.post('/lobby/criar', { nome: name })
      showCursedToast("Domínio Expandido", `Lobby "${name}" criado com sucesso!`, "success")
      await reloadAuth()
      await fetchLobbyData(true)
    } catch (err) {
      showCursedToast("Falha na Barreira", err.response?.data?.error || "Erro ao criar lobby.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleJoinLobby = async (e) => {
    e.preventDefault()
    const code = lobbyCodeInput.trim().toUpperCase()
    if (!code) return

    setLoading(true)
    try {
      await axios.post('/lobby/entrar', { codigo: code })
      showCursedToast("Lobby Conectado", "Você ingressou no lobby!", "success")
      await reloadAuth()
      await fetchLobbyData(true)
    } catch (err) {
      showCursedToast("Entrada Recusada", err.response?.data?.error || "Erro ao entrar no lobby.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveLobby = async () => {
    setLoading(true)
    try {
      await axios.post('/lobby/sair')
      await reloadAuth()
      setLobbyData(null)
      await fetchLobbyData(true)
    } catch (err) {
      showCursedToast("Erro", "Não foi possível voltar para a lista de lobbies.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleCloseLobby = async () => {
    const confirm = await showConfirmModal(
      "Fechar Domínio", 
      "Tem certeza de que deseja desfazer e fechar este domínio permanentemente? Todos os feiticeiros sintonizados serão removidos."
    )
    if (!confirm) return

    setLoading(true)
    try {
      await axios.post('/lobby/fechar')
      showCursedToast("Domínio Desfeito", "O domínio foi fechado e desfeito.", "info")
      await reloadAuth()
      setLobbyData(null)
      await fetchLobbyData(true)
    } catch (err) {
      showCursedToast("Erro", "Não foi possível fechar o lobby.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectLobby = async (lobbyId) => {
    setLoading(true)
    try {
      await axios.post(`/lobby/select/${lobbyId}`)
      showCursedToast("Conexão Estabelecida", "Você entrou no domínio sintonizado.", "success")
      await reloadAuth()
      await fetchLobbyData(true)
    } catch (err) {
      showCursedToast("Falha na Barreira", err.response?.data?.error || "Erro ao entrar no lobby.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveLobby = async (lobbyId, lobbyNome) => {
    const confirm = await showConfirmModal(
      "Remover Sintonização", 
      `Deseja mesmo sair permanentemente da lista do domínio "${lobbyNome}"?`
    )
    if (!confirm) return

    setLoading(true)
    try {
      await axios.post(`/lobby/remover/${lobbyId}`)
      showCursedToast("Sintonização Removida", "O domínio foi removido da sua lista.", "info")
      await fetchLobbyData(true)
    } catch (err) {
      showCursedToast("Erro", err.response?.data?.error || "Erro ao remover lobby.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleAddPlayer = async (e) => {
    e.preventDefault()
    const username = addUsernameInput.trim()
    if (!username) return

    try {
      await axios.post('/lobby/add', { username })
      showCursedToast("Feiticeiro Convocado", `Jogador "${username}" adicionado com sucesso!`, "success")
      setAddUsernameInput('')
      fetchLobbyData(false)
    } catch (err) {
      showCursedToast("Falha de Invocação", err.response?.data?.error || "Não foi possível convocar o player.", "error")
    }
  }

  const handleKickPlayer = async (userId, username) => {
    const confirm = await showConfirmModal("Expulsar Feiticeiro", `Tem certeza que deseja banir ${username} deste domínio?`)
    if (!confirm) return

    try {
      await axios.post(`/lobby/kick/${userId}`)
      showCursedToast("Purificação", `${username} foi purificado do lobby!`, "info")
      fetchLobbyData(false)
    } catch (err) {
      showCursedToast("Falha", err.response?.data?.error || "Erro ao expulsar jogador.", "error")
    }
  }

  const handleGrantXp = async (charId, charNome) => {
    const amount = parseInt(xpAmounts[charId] || 0)
    if (isNaN(amount) || amount === 0) {
      showCursedToast("XP Inválido", "Insira uma quantidade de XP válida.", "warning")
      return
    }

    try {
      const response = await axios.post(`/api/dar_xp/${charId}`, { quantidade: amount })
      const data = response.data
      showCursedToast(
        "Bênção do Mestre", 
        `${charNome} recebeu ${amount} XP!${data.level_up ? ` -> LEVEL UP! Nível ${data.new_level}!` : ''}`, 
        "success"
      )
      setXpAmounts(prev => ({ ...prev, [charId]: '' }))
      fetchLobbyData(false)
    } catch (err) {
      showCursedToast("Falha", err.response?.data?.error || "Erro ao dar XP.", "error")
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    showCursedToast("Código Copiado", "Código do Lobby copiado para a área de transferência!", "info")
  }

  const handleUseAttackLobby = async (charId, attackId, attackName) => {
    try {
      const res = await axios.post(`/api/use_attack/${charId}/${attackId}`, {
        target_id: null
      })
      const data = res.data

      if (typeof window.rollDice === 'function') {
        window.rollDice("1d20", `Ataque: ${attackName}`, data.total_acerto - data.d20_roll)
      }

      setTimeout(() => {
        showCursedToast(
          data.hit ? "Ataque Desferido!" : "Ataque Realizado",
          data.hit 
            ? `Rolado ${data.total_acerto} no acerto. Dano causado: ${data.final_damage} PV!`
            : `Rolado ${data.total_acerto} no acerto. Dano: ${data.final_damage} PV.`,
          "success",
          5000
        )
        fetchLobbyData(false)
      }, 1000)
    } catch (err) {
      showCursedToast("Técnica Interrompida", err.response?.data?.error || "Erro ao atacar.", "error")
    }
  }

  const handleUseSpellLobby = async (charId, spellId, spellName, spellCost, isRestringido, currentPe) => {
    if (currentPe < spellCost) {
      const resourceName = isRestringido ? "Estamina" : "PE";
      const toastTitle = isRestringido ? "Estamina Esgotada" : "Energia Esgotada";
      showCursedToast(toastTitle, `Você necessita de ${spellCost} ${resourceName} para canalizar ${spellName}.`, "error")
      return
    }
    try {
      const res = await axios.post(`/api/use_spell/${charId}/${spellId}`, {
        target_id: null
      })
      const data = res.data

      showCursedToast(
        "Fórmula Conjurada",
        `Técnica conjurada. Consumiu ${spellCost} ${isRestringido ? 'Estamina' : 'PE'}. Efeito: ${data.damage_roll_desc || 'Ativado'} (${data.final_effect} PV afetados)`,
        data.is_healing ? "success" : "info",
        6000
      )
      fetchLobbyData(false)
    } catch (err) {
      showCursedToast("Falha de Fórmula", err.response?.data?.error || "Erro ao conjurar feitiço.", "error")
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative z-20">
        <Sparkles className="w-12 h-12 text-purple-400 animate-bounce filter drop-shadow-[0_0_8px_#a855f7]" />
        <p className="text-xs text-gray-500 font-sans tracking-widest uppercase mt-3">Canalizando Energia do Domínio...</p>
      </div>
    )
  }

  // ── RENDER NO-LOBBY SCREEN ──
  if (!lobbyData || !lobbyData.in_lobby) {
    const hasSintonized = lobbyData?.joined_lobbies && lobbyData.joined_lobbies.length > 0;
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-start p-6 relative z-20">
        
        {/* Back button */}
        <button 
          onClick={() => navigate('/')}
          className="self-start text-sm text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 font-sans mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Início
        </button>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full bg-neutral-950/80 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-300 ${
            hasSintonized ? 'max-w-4xl' : 'max-w-2xl'
          }`}
          style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 35px var(--cursed-color)15' }}
        >
          <div className="flex flex-col items-center gap-2 mb-8 text-center">
            <Swords className="w-10 h-10 text-purple-400 filter drop-shadow-[0_0_8px_var(--cursed-color)] animate-pulse" />
            <h2 className="text-2xl font-bold font-jujutsu bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Barreira do Lobby
            </h2>
            <p className="text-xs text-gray-500 font-sans">
              Gerencie seus domínios sintonizados ou ingresse em novas batalhas.
            </p>
          </div>

          <div className={`grid grid-cols-1 ${hasSintonized ? 'lg:grid-cols-5' : 'md:grid-cols-2'} gap-8 items-stretch`}>
            
            {/* Lobbies Sintonizados List (Shown only if hasSintonized is true) */}
            {hasSintonized && (
              <div className="lg:col-span-3 glass-card rounded-2xl p-6 border border-white/5 flex flex-col justify-start gap-4">
                <h3 className="text-md font-extrabold text-white font-jujutsu flex items-center gap-1.5 border-b border-white/5 pb-2">
                  <Shield className="w-4 h-4 text-purple-400" /> Domínios Sintonizados
                </h3>

                {authStatus.character_id && (
                  <button
                    onClick={() => navigate(`/ficha/${authStatus.character_id}`)}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-900/60 to-indigo-900/50 hover:from-purple-800/70 hover:to-indigo-800/60 border border-purple-500/20 text-white font-extrabold text-[10px] uppercase tracking-widest active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(139,92,246,0.15)]"
                  >
                    <Shield className="w-3.5 h-3.5 text-purple-300 filter drop-shadow-[0_0_3px_rgba(168,85,247,0.4)]" />
                    Acessar Ficha de Feiticeiro
                  </button>
                )}

                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {lobbyData.joined_lobbies.map((lob) => (
                    <div 
                      key={lob.id}
                      className="glass-card p-3.5 rounded-xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 hover:border-white/10 transition-all bg-black/35"
                    >
                      <div className="text-left flex flex-col gap-0.5 min-w-0">
                        <span className="text-[9px] text-purple-400 font-extrabold uppercase tracking-wider font-sans">
                          CÓDIGO: {lob.codigo}
                        </span>
                        <h4 className="text-xs font-extrabold text-white font-jujutsu truncate">
                          {lob.nome}
                        </h4>
                        <span className="text-[9px] text-gray-500 font-sans truncate">
                          Mestre: {lob.master_nome} • {lob.num_membros} sintonizados
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto">
                        <button
                          onClick={() => handleSelectLobby(lob.id)}
                          className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 shadow-[0_0_8px_rgba(139,92,246,0.2)]"
                        >
                          <Zap className="w-3 h-3 animate-pulse" /> Entrar
                        </button>
                        <button
                          onClick={() => handleRemoveLobby(lob.id, lob.nome)}
                          className="px-2.5 py-1.5 bg-red-950/40 border border-red-500/25 text-red-400 hover:bg-red-900/60 hover:text-white rounded-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center"
                          title="Remover Sintonização"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Forms section */}
            <div className={`flex flex-col gap-6 ${hasSintonized ? 'lg:col-span-2' : ''}`}>
              {/* Join Lobby (Players & Masters) */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-sm font-extrabold text-white font-jujutsu flex items-center gap-1.5">
                    <Scroll className="w-4 h-4 text-purple-400" /> Ingressar via Código
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-1 font-sans leading-relaxed">
                    Insira o código de 6 caracteres do seu Mestre para sintonizar sua energia neste lobby.
                  </p>
                </div>

                <form onSubmit={handleJoinLobby} className="flex flex-col gap-3">
                  <input
                    type="text"
                    maxLength={6}
                    value={lobbyCodeInput}
                    onChange={(e) => setLobbyCodeInput(e.target.value)}
                    placeholder="Código do Lobby (Ex: KUROI1)..."
                    className="px-3.5 py-2 rounded-xl text-xs font-sans text-center uppercase tracking-widest focus:outline-none font-bold"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest active:scale-95 transition-all cursor-pointer font-sans flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: 'var(--cursed-color)', boxShadow: '0 0 10px var(--cursed-color)' }}
                  >
                    <Swords className="w-3.5 h-3.5" /> Ingressar no Lobby
                  </button>
                </form>
              </div>

              {/* Create Lobby (Master only) */}
              <div className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-sm font-extrabold text-white font-jujutsu flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" /> Expandir Domínio
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-1 font-sans leading-relaxed">
                    Crie uma sala de combate para gerenciar seus jogadores e dar XP em tempo real.
                  </p>
                </div>

                {authStatus.role === 'Mestre' ? (
                  <form onSubmit={handleCreateLobby} className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={lobbyName}
                      onChange={(e) => setLobbyName(e.target.value)}
                      placeholder="Nome do Domínio (Ex: Kyoto)..."
                      className="px-3.5 py-2 rounded-xl text-xs font-sans focus:outline-none"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest active:scale-95 transition-all cursor-pointer font-sans flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: 'var(--cursed-color)', boxShadow: '0 0 10px var(--cursed-color)' }}
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Criar Domínio
                    </button>
                  </form>
                ) : (
                  <div className="bg-black/30 border border-white/5 rounded-xl p-3 text-center text-[10px] text-red-400 font-sans italic">
                    Apenas usuários com a classe de Mestre podem criar novos lobbies.
                  </div>
                )}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    )
  }

  // ── RENDER ACTIVE LOBBY SCREEN ──
  const isMaster = lobbyData.is_master
  const members = lobbyData.members || []
  const characters = lobbyData.characters || []

  // Check if player has a character loaded
  const myCharacter = characters.find(c => c.user_id === authStatus.user_id)

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 relative z-20 w-full max-w-7xl mx-auto">
      
      {/* Header glass panel */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-neutral-950/80 border border-white/10 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6"
        style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.5), 0 0 20px var(--cursed-color)0b' }}
      >
        <div className="flex items-center gap-3">
          <CursedLogo size={36} className="text-purple-400 filter drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
          <div className="flex flex-col md:items-start text-center md:text-left gap-0.5">
            <span className="text-[10px] text-purple-300 font-extrabold uppercase tracking-widest font-sans">
              Lobby de RPG Ativo
            </span>
            <h2 className="text-xl md:text-2xl font-bold font-jujutsu text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" /> {lobbyData.lobby?.nome || 'Domínio de Jujutsu'}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Lobby Code Display */}
          <div 
            onClick={() => copyToClipboard(lobbyData.lobby?.codigo)}
            className="px-4 py-2 bg-purple-950/30 border border-purple-500/20 rounded-xl flex items-center gap-2 cursor-pointer hover:border-purple-500/50 transition-all"
          >
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest font-sans">CÓDIGO:</span>
            <span className="text-sm font-bold font-mono tracking-wider text-white">
              {lobbyData.lobby?.codigo}
            </span>
            <Copy className="w-3.5 h-3.5 text-purple-400" />
          </div>

          <button
            onClick={handleLeaveLobby}
            className="px-4 py-2 rounded-xl bg-neutral-900/60 border border-white/10 text-gray-300 hover:bg-neutral-800 hover:text-white font-bold text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer font-sans flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4 text-purple-400" /> Voltar aos Lobbies
          </button>

          {isMaster && (
            <button
              onClick={handleCloseLobby}
              className="px-4 py-2 rounded-xl bg-red-950/50 border border-red-500/20 text-red-300 hover:bg-red-900/60 font-bold text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer font-sans flex items-center gap-1.5"
            >
              <X className="w-4 h-4" /> Fechar Domínio
            </button>
          )}
        </div>
      </motion.div>

      {/* Main Grid: Sheet Cards & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 w-full items-start">
        
        {/* Character cards grid (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-bold font-jujutsu text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Feiticeiros no Domínio ({characters.length})
            </h3>

            {!isMaster && !myCharacter && (
              <button
                onClick={() => navigate('/create_character')}
                className="px-4 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all cursor-pointer font-sans flex items-center gap-1.5"
                style={{ backgroundColor: 'var(--cursed-color)', boxShadow: '0 0 10px var(--cursed-color)' }}
              >
                <Scroll className="w-4 h-4" /> Criar Ficha de Feiticeiro
              </button>
            )}
          </div>

          {characters.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center border border-white/5 flex flex-col items-center gap-3">
              <User className="w-12 h-12 text-gray-500" />
              <h4 className="text-md font-bold text-white font-jujutsu">Nenhum feiticeiro invocado</h4>
              <p className="text-xs text-gray-400 max-w-sm font-sans leading-relaxed">
                {isMaster 
                  ? "Aguarde os jogadores entrarem no lobby com o código ou convide-os pelo painel lateral para ver suas fichas aqui."
                  : "Crie a sua ficha de feiticeiro usando o botão acima para sintonizar sua energia neste lobby!"
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              <AnimatePresence>
                {characters.map((char) => {
                  const borderGlow = char.cor_energia || '#8a2be2'
                  const isMine = char.user_id === authStatus.user_id
                  
                  // PV / PE proportions
                  const pvPercent = Math.max(0, Math.min(100, char.pv_max > 0 ? (char.pv_atual / char.pv_max) * 100 : 0))
                  const pePercent = Math.max(0, Math.min(100, char.pe_max > 0 ? (char.pe_atual / char.pe_max) * 100 : 0))

                  return (
                    <motion.div
                      key={char.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="glass-card rounded-2xl p-4 border flex flex-col justify-between gap-4 relative overflow-hidden group hover:scale-[1.01]"
                      style={{
                        borderColor: `${borderGlow}2c`,
                        boxShadow: `0 8px 30px rgba(0,0,0,0.6), 0 0 20px ${borderGlow}08`
                      }}
                    >
                      {/* Character Aura Glow Accent */}
                      <div 
                        className="absolute -top-12 -right-12 w-28 h-28 rounded-full filter blur-2xl opacity-15 pointer-events-none"
                        style={{ backgroundColor: borderGlow }}
                      />

                      {/* Header block (Large Avatar Left & Attribute Radar Chart Right) */}
                      <div className="flex gap-4 items-center justify-between select-none">
                        {/* Large Avatar */}
                        <div 
                          className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 flex items-center justify-center bg-neutral-900 overflow-hidden shrink-0"
                          style={{ borderColor: borderGlow }}
                        >
                          {char.imagem_url ? (
                            <img src={char.imagem_url} alt={char.nome} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-10 h-10 text-gray-500" />
                          )}
                        </div>

                        {/* Attribute Radar Chart block */}
                        <div className="flex-1 flex flex-col items-center justify-center bg-neutral-100/50 dark:bg-black/20 rounded-2xl py-1.5 px-2 border border-neutral-200/20 dark:border-white/[0.03] self-stretch min-w-0 max-w-[170px]">
                          <span className="text-[8px] text-neutral-500 dark:text-gray-500 font-extrabold uppercase tracking-widest font-sans block mb-0.5 text-center leading-none">
                            ATRIBUTOS DO FEITICEIRO
                          </span>
                          <div className="w-full max-w-[155px] flex items-center justify-center">
                            <AttributesRadarChart attributes={char.attributes} color={borderGlow} />
                          </div>
                        </div>
                      </div>

                      {/* Character Info Details Block (Rendered Below) */}
                      <div className="flex flex-col gap-0.5 mt-3 select-none">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm sm:text-base font-black text-white font-jujutsu leading-snug">
                            {char.nome}
                          </h4>
                          {isMine && (
                            <span className="px-1.5 py-0.25 rounded bg-purple-950/40 border border-purple-500/30 text-purple-300 font-extrabold text-[7px] uppercase tracking-widest font-sans">
                              MINHA
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider font-sans leading-none">
                          {char.especializacao}
                        </span>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap font-sans">
                          <span className="px-2 py-0.5 rounded bg-purple-950/40 border border-purple-500/25 text-purple-300 font-extrabold text-[8px] uppercase tracking-widest">
                            {char.grau}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-neutral-800 border border-white/5 text-white font-bold text-[8px]">
                            Lvl {char.nivel}
                          </span>
                          <span className="text-[9px] text-gray-500 font-bold ml-1">
                            XP: {char.xp}
                          </span>
                        </div>
                      </div>

                      {/* Vitals Progress bars */}
                      <div className="flex flex-col gap-2 font-sans">
                        {/* PV (Health) */}
                        <div className="flex flex-col gap-0.5">
                          <div className="flex justify-between text-[9px] font-bold text-gray-400">
                            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-red-500" /> Vida (PV)</span>
                            <span className="text-white-always">{char.pv_atual} / {char.pv_max}</span>
                          </div>
                          <div className="w-full h-1.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-300"
                              style={{ width: `${pvPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* PE (Cursed Energy) / Stamina */}
                        {(() => {
                          const isRestringido = char.origem?.toLowerCase() === 'restringido' || char.especializacao?.toLowerCase() === 'restringido';
                          const resourceName = isRestringido ? "Estamina" : "Energia (PE)";
                          const peColor = isRestringido ? "#10b981" : borderGlow;
                          return (
                            <div className="flex flex-col gap-0.5">
                              <div className="flex justify-between text-[9px] font-bold text-gray-400">
                                <span className="flex items-center gap-1" style={{ color: peColor }}>
                                  {isRestringido ? (
                                    <Activity className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Zap className="w-3 h-3" />
                                  )}
                                  {resourceName}
                                </span>
                                <span className="text-white-always">{char.pe_atual} / {char.pe_max}</span>
                              </div>
                              <div className="w-full h-1.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${pePercent}%`,
                                    backgroundColor: peColor
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Integridade & Alma (Optional, if max > 0) */}
                        {char.integridade_max > 0 && (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex justify-between text-[9px] font-bold text-gray-400">
                              <span className="flex items-center gap-1 text-amber-400">
                                <Heart className="w-3 h-3 text-amber-500 animate-pulse" /> 
                                Alma
                              </span>
                              <span className="text-white-always">{char.integridade_atual} / {char.integridade_max} ({char.estado_alma || 'Estável'})</span>
                            </div>
                            <div className="w-full h-1.5 bg-neutral-900 border border-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full transition-all duration-300"
                                style={{ width: `${Math.max(0, Math.min(100, (char.integridade_atual / char.integridade_max) * 100))}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Ativos do Feiticeiro (Visível a Todos) */}
                      {(() => {
                        const activeItems = (char.inventario || []).filter(i => i.equipado);
                        const activeSpells = (char.feiticos || []).filter(s => s.equipado);
                        const hasActiveAssets = activeItems.length > 0 || activeSpells.length > 0;
                        return (
                          <div className="border-t border-white/5 pt-2">
                            <span className="text-[8px] text-gray-500 font-extrabold uppercase tracking-wider font-sans block mb-1.5">
                              Ativos do Feiticeiro (Visível a Todos)
                            </span>
                            {hasActiveAssets ? (
                              <div className="flex flex-wrap gap-1">
                                {activeItems.map((item, idx) => (
                                  <span 
                                    key={`active-item-${idx}`} 
                                    className="inline-flex items-center gap-1 px-1.5 py-0.25 rounded bg-neutral-900 border border-white/10 text-[8px] font-sans font-bold text-gray-300"
                                    title={item.descricao || 'Item equipado'}
                                  >
                                    <Briefcase className="w-2 h-2 text-emerald-400" />
                                    {item.nome}
                                  </span>
                                ))}
                                {activeSpells.map((spell, idx) => {
                                  const isPassive = spell.tipo === 'Passivo';
                                  return (
                                    <span 
                                      key={`active-spell-${idx}`} 
                                      className={`inline-flex items-center gap-1 px-1.5 py-0.25 rounded text-[8px] font-sans font-bold ${
                                        isPassive 
                                          ? 'bg-amber-950/20 border border-amber-500/20 text-amber-300'
                                          : 'bg-purple-950/20 border border-purple-500/20 text-purple-300'
                                      }`}
                                      title={spell.descricao || (isPassive ? 'Efeito passivo ativo' : 'Feitiço preparado')}
                                    >
                                      <Scroll className={`w-2 h-2 ${isPassive ? 'text-amber-400' : 'text-purple-400'}`} />
                                      {spell.nome}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-[8px] text-gray-600 italic font-sans block">
                                Nenhum item equipado ou feitiço preparado.
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Painel de Ações Rápidas (HUD Retrátil) */}
                      {(() => {
                        const showHud = isMine || isMaster;
                        if (!showHud) return null;

                        const isExpanded = !!expandedHuds[char.id];
                        const attacks = char.ataques || [];
                        const spells = char.feiticos || [];
                        const isRestringido = char.origem?.toLowerCase() === 'restringido' || char.especializacao?.toLowerCase() === 'restringido';
                        const resourceLabel = isRestringido ? "Estamina" : "PE";

                        return (
                          <div className="border-t border-white/5 pt-3">
                            <button
                              onClick={() => setExpandedHuds(prev => ({ ...prev, [char.id]: !isExpanded }))}
                              className="w-full flex items-center justify-between px-3 py-1.5 bg-neutral-900/60 border border-white/5 hover:bg-neutral-900 hover:border-white/10 rounded-xl text-[10px] font-extrabold text-gray-300 transition-all cursor-pointer font-sans"
                            >
                              <span className="flex items-center gap-1.5">
                                <Swords className="w-3 h-3 text-purple-400 animate-pulse" />
                                Painel de Ações Rápidas {isMaster && !isMine && "(Mestre)"}
                              </span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden font-sans"
                                >
                                  <div className="flex flex-col gap-3 mt-2.5 max-h-52 overflow-y-auto pr-1">
                                    {/* Attacks */}
                                    <div>
                                      <span className="text-[8px] text-gray-500 font-extrabold uppercase tracking-wider block mb-1">
                                        Rolagem de Ataques
                                      </span>
                                      {attacks.length > 0 ? (
                                        <div className="flex flex-col gap-1">
                                          {attacks.map((att) => (
                                            <div 
                                              key={att.id}
                                              className="flex items-center justify-between p-1.5 rounded-lg bg-neutral-950/60 border border-white/5 hover:border-white/10 transition-all"
                                            >
                                              <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-bold text-white truncate">{att.nome}</span>
                                                <span className="text-[8px] text-gray-500 truncate">
                                                  Dano: {att.dano} | Teste: +{att.teste}
                                                </span>
                                              </div>
                                              <button
                                                onClick={() => handleUseAttackLobby(char.id, att.id, att.nome)}
                                                className="px-2 py-0.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 text-red-300 hover:text-white rounded text-[8px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shrink-0"
                                              >
                                                Atacar
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <span className="text-[8px] text-gray-600 italic block">Sem ataques cadastrados.</span>
                                      )}
                                    </div>

                                    {/* Spells */}
                                    <div>
                                      <span className="text-[8px] text-gray-500 font-extrabold uppercase tracking-wider block mb-1">
                                        Conjuração de Feitiços
                                      </span>
                                      {spells.length > 0 ? (
                                        <div className="flex flex-col gap-1">
                                          {spells.map((spell) => {
                                            const isPassive = spell.tipo === 'Passivo';
                                            return (
                                              <div 
                                                key={spell.id}
                                                className="flex items-center justify-between p-1.5 rounded-lg bg-neutral-950/60 border border-white/5 hover:border-white/10 transition-all"
                                              >
                                                <div className="flex flex-col min-w-0">
                                                  <div className="flex items-center gap-1 min-w-0 flex-wrap">
                                                    <span className="text-[10px] font-bold text-white truncate">{spell.nome}</span>
                                                    {isPassive && (
                                                      <span className="px-1 rounded bg-amber-950/40 border border-amber-500/25 text-amber-400 font-extrabold text-[6px] uppercase tracking-wider shrink-0">
                                                        PASSIVO
                                                      </span>
                                                    )}
                                                    {spell.equipado && (
                                                      <span className="px-1 rounded bg-emerald-950/40 border border-emerald-500/25 text-emerald-400 font-extrabold text-[6px] uppercase tracking-wider shrink-0">
                                                        PREPARADO
                                                      </span>
                                                    )}
                                                  </div>
                                                  <span className="text-[8px] text-gray-500 truncate">
                                                    {isPassive 
                                                      ? `Redução PE: ${spell.custo} Máx` 
                                                      : `Custo: ${spell.custo} ${resourceLabel}`
                                                    } | Dano: {spell.dano || '—'}
                                                  </span>
                                                </div>
                                                {!isPassive && (
                                                  <button
                                                    onClick={() => handleUseSpellLobby(char.id, spell.id, spell.nome, spell.custo, isRestringido, char.pe_atual)}
                                                    className="px-2 py-0.5 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/20 text-purple-300 hover:text-white rounded text-[8px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shrink-0"
                                                  >
                                                    Conjurar
                                                  </button>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <span className="text-[8px] text-gray-600 italic block">Sem feitiços cadastrados.</span>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })()}




                      {/* Actions footer */}
                      <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-4">
                        {/* XP management for Mestre */}
                        {isMaster ? (
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="number"
                              value={xpAmounts[char.id] || ''}
                              onChange={(e) => setXpAmounts(prev => ({ ...prev, [char.id]: e.target.value }))}
                              placeholder="+XP..."
                              className="w-16 px-2.5 py-1.5 rounded-lg text-xs font-sans text-center font-semibold focus:outline-none shrink-0"
                            />
                            <button
                              onClick={() => handleGrantXp(char.id, char.nome)}
                              className="px-2.5 py-1.5 bg-purple-600/80 hover:bg-purple-600 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg shrink-0 cursor-pointer font-sans"
                            >
                              Dar
                            </button>
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-500 font-medium font-sans">
                            Conectado por {char.user_id === authStatus.user_id ? 'Você' : 'Parceiro'}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          {/* Open sheet */}
                          {(isMine || isMaster) && (
                            <button
                              onClick={() => navigate(`/ficha/${char.id}`)}
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:shadow-[0_0_10px_rgba(255,255,255,0.05)] cursor-pointer font-sans flex items-center gap-1.5"
                            >
                              <Shield className="w-3.5 h-3.5" /> Ficha Completa
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Sidebar panel (1 col) */}
        <div className="flex flex-col gap-6">
          
          {/* Master Panel to summon users */}
          {isMaster && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card rounded-2xl p-5 border border-white/5 flex flex-col gap-4"
            >
              <h3 className="text-sm font-extrabold text-white font-jujutsu flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-purple-400" /> Convocar Feiticeiro
              </h3>
              <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
                Adicione diretamente um jogador pelo seu nome de usuário cadastrado.
              </p>

              <form onSubmit={handleAddPlayer} className="flex flex-col gap-2 font-sans">
                <input
                  type="text"
                  value={addUsernameInput}
                  onChange={(e) => setAddUsernameInput(e.target.value)}
                  placeholder="Nome de usuário..."
                  className="px-3 py-2 rounded-lg text-xs focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg text-white font-bold text-xs uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                  style={{ backgroundColor: 'var(--cursed-color)', boxShadow: '0 0 10px var(--cursed-color)' }}
                >
                  Convocação Direta
                </button>
              </form>
            </motion.div>
          )}

          {/* Members list panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card rounded-2xl p-5 border border-white/5 flex flex-col gap-4"
          >
            <h3 className="text-sm font-extrabold text-white font-jujutsu flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-400" /> Sintonizados ({members.length})
            </h3>
            
            <div className="flex flex-col gap-3 font-sans">
              {members.map((u) => (
                <div key={u.user_id} className="flex items-center justify-between bg-black/40 border border-white/5 rounded-xl p-3">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">
                        {u.username}
                      </span>
                      {u.is_master && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-500/20 text-amber-400 font-extrabold text-[8px] uppercase tracking-widest font-sans">
                          MESTRE
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-gray-500">
                      Ficha: {u.char_nome || '—'}
                    </span>
                  </div>

                  {/* Kick action */}
                  {isMaster && u.user_id !== authStatus.user_id && (
                    <button
                      onClick={() => handleKickPlayer(u.user_id, u.username)}
                      className="text-xs text-red-500 hover:text-red-400 p-1 cursor-pointer"
                      title="Banir Feiticeiro"
                    >
                      <Skull className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Attribute Comparison Panel */}
          {characters.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card rounded-2xl p-5 border border-white/5 flex flex-col gap-4"
            >
              <h3 className="text-sm font-extrabold text-white font-jujutsu flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-purple-400" /> Comparação de Atributos
              </h3>
              
              <UnifiedRadarChart characters={characters} selectedIds={selectedCompareIds} />

              {/* Toggles list */}
              <div className="flex flex-col gap-2 font-sans text-xs">
                <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wider block mb-1">
                  Exibir Feiticeiros
                </span>
                <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                  {characters.map((char) => {
                    const isSelected = selectedCompareIds.includes(char.id);
                    const color = char.cor_energia || '#8a2be2';
                    
                    return (
                      <label 
                        key={`compare-toggle-${char.id}`}
                        className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 hover:bg-black/60 transition-all cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0 filter drop-shadow-[0_0_4px_var(--glow-color)]"
                            style={{ 
                              backgroundColor: color,
                              '--glow-color': color
                            }}
                          />
                          <span className="text-xs font-bold text-white truncate max-w-[120px]">
                            {char.nome}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedCompareIds(prev => prev.filter(id => id !== char.id));
                            } else {
                              setSelectedCompareIds(prev => [...prev, char.id]);
                            }
                          }}
                          className="w-4 h-4 rounded border-white/10 text-purple-600 bg-neutral-900 focus:ring-purple-500 focus:ring-2 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  )
}
