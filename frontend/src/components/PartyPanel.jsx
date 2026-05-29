import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import {
  X, Shield, Zap, Activity, Swords, Scroll, Crown, Users, User,
  PlusCircle, Skull, ChevronDown, ChevronUp, Link, Sparkles, Star,
  AlertTriangle, Clock, Eye, Heart
} from 'lucide-react'
import AttributesRadarChart from './AttributesRadarChart'
import PlayerHoverCard from './PlayerHoverCard'
import { showCursedToast } from '../utils/toast'
import { showConfirmModal } from '../utils/confirm'

// ─── Mini stat bar ────────────────────────────────────────────────────────────
function StatBar({ value, max, color, icon: Icon, label, iconClass }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 font-sans">
        <span className="flex items-center gap-1">
          <Icon className={`w-2.5 h-2.5 ${iconClass}`} />
          {label}
        </span>
        <span className="text-white">{value}/{max}</span>
      </div>
      <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}80` }}
        />
      </div>
    </div>
  )
}

// ─── Single character row in the panel ────────────────────────────────────────
function CharRow({
  char, isMine, isMaster, authStatus,
  onUseSpell, onUseAttack, onGrantXp,
  xpAmount, onXpChange,
  onKick, onNavigate,
  accentColor = '#8a2be2',
  showHoverOnLeft = false
}) {
  const [expanded, setExpanded] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const hoverTimeout = useRef(null)

  const color = char.cor_energia || accentColor
  const isRestringido = char.origem?.toLowerCase() === 'restringido'
  const resourceLabel = isRestringido ? 'Estamina' : 'PE'
  const attacks = char.ataques || []
  const spells = (char.feiticos || []).filter(s => s.tipo !== 'Passivo')
  const passives = (char.feiticos || []).filter(s => s.tipo === 'Passivo')

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const tooltipHeight = 360

    let top = rect.top
    // Shift up if tooltip goes off-screen vertically
    if (top + tooltipHeight > viewportHeight) {
      top = Math.max(12, viewportHeight - tooltipHeight - 12)
    }

    // Anchor to the right if sidebar is on the left, or to the left if sidebar is on the right
    const left = showHoverOnLeft ? rect.right + 12 : rect.left - 236

    setCoords({ top, left })

    clearTimeout(hoverTimeout.current)
    hoverTimeout.current = setTimeout(() => setHovering(true), 120)
  }

  const handleMouseLeave = () => {
    clearTimeout(hoverTimeout.current)
    setHovering(false)
  }

  return (
    <motion.div
      layout
      className="rounded-2xl border overflow-hidden relative"
      style={{
        borderColor: `${color}25`,
        background: isMine
          ? `linear-gradient(135deg, rgba(${hexToRgb(color)},0.08) 0%, rgba(0,0,0,0.5) 100%)`
          : 'rgba(0,0,0,0.35)'
      }}
    >
      {/* Hover tooltip portal */}
      <PlayerHoverCard char={char} visible={hovering} coords={coords} />

      {/* Wrapper */}
      <div className="relative">

        {/* Header row */}
        <div className="flex items-center gap-2.5 p-3">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-xl border-2 flex items-center justify-center overflow-hidden shrink-0 bg-neutral-900"
            style={{ borderColor: color }}
          >
            {char.imagem_url
              ? <img src={char.imagem_url} alt={char.nome} className="w-full h-full object-cover" />
              : <User className="w-5 h-5 text-gray-500" />
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-white font-black text-xs font-jujutsu truncate leading-tight" style={{ maxWidth: 120 }}>
                {char.nome}
              </span>
              {isMine && (
                <span className="px-1.5 py-0.25 rounded text-[6px] font-extrabold uppercase tracking-widest font-sans border"
                  style={{ backgroundColor: `${color}20`, borderColor: `${color}40`, color }}>
                  VOCÊ
                </span>
              )}
            </div>
            <p className="text-gray-500 text-[9px] font-sans truncate">{char.especializacao} · {char.grau} · Lvl {char.nivel}</p>
          </div>

          {/* Stats Hover Badge "EQ" */}
          <div 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="px-1.5 py-0.5 rounded-lg border text-[7.5px] font-black tracking-widest cursor-help select-none transition-all flex items-center gap-0.5 bg-black/40 shrink-0"
            style={{ 
              borderColor: `${color}40`, 
              color: color,
              boxShadow: `0 0 8px ${color}20`
            }}
            title="Ver Estatísticas e Gráfico (Hover)"
          >
            <Activity className="w-2.5 h-2.5 animate-pulse" />
            EQ
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(p => !p)}
            className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer shrink-0"
            title="Técnicas e Feitiços"
          >
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Vitals */}
        <div className="px-3 pb-3 flex flex-col gap-1.5">
          <StatBar
            value={char.pv_atual} max={char.pv_max}
            color="#ef4444" icon={Shield} label="PV" iconClass="text-red-400"
          />
          <StatBar
            value={char.pe_atual} max={char.pe_max}
            color={isRestringido ? '#10b981' : color}
            icon={isRestringido ? Activity : Zap}
            label={resourceLabel}
            iconClass={isRestringido ? 'text-emerald-400' : ''}
          />
          {char.integridade_max > 0 && (
            <StatBar
              value={char.integridade_atual} max={char.integridade_max}
              color="#f59e0b" icon={Heart} label={`Alma (${char.estado_alma || 'Estável'})`} iconClass="text-amber-500 animate-pulse"
            />
          )}
        </div>
      </div>

      {/* Combat logs strip */}
      {(char.recent_logs || []).length > 0 && !expanded && (
        <div className="px-3 pb-2 border-t font-sans" style={{ borderColor: `${color}15` }}>
          <div className="flex items-center gap-1 pt-1.5">
            <Clock className="w-2.5 h-2.5 text-gray-600 shrink-0" />
            <p className="text-[8px] text-gray-500 truncate"
              title={char.recent_logs[0]?.content}>
              <span className="font-bold" style={{ color }}>{char.recent_logs[0]?.title}</span>
              {' · '}{char.recent_logs[0]?.time}
            </p>
          </div>
        </div>
      )}

      {/* Expanded HUD */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t font-sans"
            style={{ borderColor: `${color}20` }}
          >
            <div className="p-3 flex flex-col gap-3">

              {/* XP for master */}
              {isMaster && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    placeholder="+XP"
                    value={xpAmount || ''}
                    onChange={e => onXpChange(e.target.value)}
                    className="w-14 px-2 py-1.5 rounded-lg text-[10px] font-sans text-center focus:outline-none bg-black/40 border border-white/10 text-white"
                  />
                  <button
                    onClick={() => onGrantXp(char.id, char.nome)}
                    className="flex-1 py-1.5 rounded-lg text-white font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-all active:scale-95"
                    style={{ backgroundColor: `${color}cc`, boxShadow: `0 0 8px ${color}50` }}
                  >
                    Dar XP
                  </button>
                  <button
                    onClick={() => onNavigate(`/ficha/${char.id}`)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all"
                    title="Ficha completa"
                  >
                    <Eye className="w-3.5 h-3.5 text-gray-300" />
                  </button>
                  {!isMine && (
                    <button
                      onClick={() => onKick(char.user_id, char.nome)}
                      className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 cursor-pointer transition-all"
                      title="Banir"
                    >
                      <Skull className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  )}
                </div>
              )}

              {/* Own actions */}
              {isMine && (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onNavigate(`/ficha/${char.id}`)}
                    className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[9px] uppercase cursor-pointer transition-all text-center"
                  >
                    Ficha Completa
                  </button>
                </div>
              )}

              {/* Attacks */}
              {attacks.length > 0 && (
                <div>
                  <p className="text-[8px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Ataques</p>
                  <div className="flex flex-col gap-1">
                    {attacks.map(att => (
                      <div key={att.id} className="flex items-center justify-between p-1.5 rounded-lg bg-black/30 border border-white/5">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-white truncate">{att.nome}</p>
                          <p className="text-[8px] text-gray-500">Dano: {att.dano} · +{att.teste}</p>
                        </div>
                        {isMine || isMaster ? (
                          <button
                            onClick={() => onUseAttack(char.id, att.id, att.nome)}
                            className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase cursor-pointer transition-all shrink-0 ml-2 bg-red-950/50 hover:bg-red-900/70 border border-red-500/25 text-red-300 hover:text-white"
                          >
                            <Swords className="w-3 h-3 inline mr-0.5" />Atacar
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[7px] font-extrabold uppercase bg-neutral-800/80 border border-white/5 text-gray-400 select-none font-sans shrink-0 ml-2">
                            Pronto
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spells */}
              {spells.length > 0 && (
                <div>
                  <p className="text-[8px] font-extrabold text-gray-500 uppercase tracking-wider mb-1">Feitiços</p>
                  <div className="flex flex-col gap-1">
                    {spells.map(spell => (
                      <div key={spell.id} className="flex items-center justify-between p-1.5 rounded-lg bg-black/30 border border-white/5">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-white truncate">{spell.nome}</p>
                          <p className="text-[8px] text-gray-500">
                            Custo: {spell.custo} {resourceLabel} · {spell.dano || '—'}
                          </p>
                        </div>
                        {isMine || isMaster ? (
                          <button
                            onClick={() => onUseSpell(
                              char.id, spell.id, spell.nome, spell.custo,
                              isRestringido, char.pe_atual, spell.dano, char
                            )}
                            className="px-2 py-0.5 rounded text-[8px] font-extrabold uppercase cursor-pointer transition-all shrink-0 ml-2 border"
                            style={{
                              backgroundColor: `${color}25`,
                              borderColor: `${color}40`,
                              color: color
                            }}
                          >
                            <Scroll className="w-3 h-3 inline mr-0.5" />Conjurar
                          </button>
                        ) : (
                          <span 
                            className="px-2 py-0.5 rounded text-[7px] font-extrabold uppercase border select-none font-sans shrink-0 ml-2"
                            style={{
                              backgroundColor: `${color}10`,
                              borderColor: `${color}25`,
                              color: color
                            }}
                          >
                            Preparado
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {attacks.length === 0 && spells.length === 0 && (
                <p className="text-[9px] text-gray-600 italic text-center">
                  Nenhuma técnica cadastrada.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label, count, color = '#8a2be2', badge }) {
  return (
    <div className="flex items-center gap-2 px-1 mb-2">
      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-white font-sans flex-1">
        {label}
      </span>
      {count !== undefined && (
        <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold font-sans"
          style={{ backgroundColor: `${color}25`, color }}>
          {count}
        </span>
      )}
      {badge}
    </div>
  )
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}

// ─── Main PartyPanel ─────────────────────────────────────────────────────────
export default function PartyPanel({
  isOpen, onClose,
  lobbyData, authStatus, isMaster, myCharacter,
  onUseSpell, onUseAttack, onGrantXp, onKickPlayer,
  xpAmounts, onXpChange,
  navigate, fetchLobbyData,
  addUsernameInput, setAddUsernameInput,
  onAddPlayer,
  sidebarSide = 'right'
}) {
  const [connectCodeInput, setConnectCodeInput] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [showConnectLobby, setShowConnectLobby] = useState(false)

  const characters = lobbyData?.characters || []
  const members = lobbyData?.members || []
  const connectedParty = lobbyData?.connected_party || []
  const connectedLobbyName = lobbyData?.connected_lobby_name || null
  const otherActiveLobbies = lobbyData?.other_active_lobbies || []
  const connectedLobbies = lobbyData?.connected_lobbies || []
  const cursedColor = 'var(--cursed-color, #8a2be2)'

  const myChar = characters.find(c => c.user_id === authStatus?.user_id)
  const partyChars = characters.filter(c => c.user_id !== authStatus?.user_id)

  const handleConnectSpecific = async (lobbyId) => {
    try {
      await axios.post('/lobby/connect', { lobby_id_externo: lobbyId })
      showCursedToast("Domínio Sintonizado", "Lobby externo sintonizado com sucesso!", "success")
      fetchLobbyData(false)
    } catch (err) {
      showCursedToast("Falha de Conexão", err.response?.data?.error || "Erro ao conectar lobby.", "error")
    }
  }

  const handleDisconnectSpecific = async (lobbyId) => {
    try {
      await axios.post('/lobby/disconnect', { lobby_id_externo: lobbyId })
      showCursedToast("Sintonização Rompida", "O lobby externo foi desconectado.", "info")
      fetchLobbyData(false)
    } catch (err) {
      showCursedToast("Erro", err.response?.data?.error || "Erro ao desconectar lobby.", "error")
    }
  }

  const handleConnectLobby = async (e) => {
    e.preventDefault()
    const code = connectCodeInput.trim().toUpperCase()
    if (!code) return
    setIsConnecting(true)
    try {
      await axios.post('/lobby/connect', { codigo_externo: code })
      showCursedToast('Lobbies Conectados!', `Party do lobby ${code} aparecerá no painel.`, 'success')
      setConnectCodeInput('')
      setShowConnectLobby(false)
      fetchLobbyData(false)
    } catch (err) {
      showCursedToast('Falha na Conexão', err.response?.data?.error || 'Erro ao conectar lobbies.', 'error')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnectLobby = async () => {
    try {
      await axios.post('/lobby/disconnect')
      showCursedToast('Lobby Desconectado', 'A party externa foi removida.', 'info')
      fetchLobbyData(false)
    } catch (err) {
      showCursedToast('Erro', 'Não foi possível desconectar.', 'error')
    }
  }

  return (
    <>
      {/* Backdrop (mobile only) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <motion.div
        initial={false}
        animate={{ x: isOpen ? 0 : (sidebarSide === 'left' ? '-105%' : '105%') }}
        transition={{ type: 'spring', stiffness: 340, damping: 34 }}
        className={`
          absolute md:absolute fixed top-0 bottom-0 ${sidebarSide === 'left' ? 'left-0' : 'right-0'} h-full z-[100] md:z-30
          w-full max-w-xs sm:max-w-sm
          flex flex-col
          ${sidebarSide === 'left' ? 'border-r' : 'border-l'}
          overflow-hidden
          party-panel
        `}
        style={{
          background: 'var(--panel-gradient, linear-gradient(180deg, rgba(8,4,18,0.98) 0%, rgba(12,6,24,0.98) 100%))',
          borderColor: 'var(--panel-border, rgba(255,255,255,0.08))',
          boxShadow: isOpen 
            ? (sidebarSide === 'left' 
              ? '8px 0 40px var(--shadow-color), 2px 0 0 rgba(138,43,226,0.15)' 
              : '-8px 0 40px var(--shadow-color), -2px 0 0 rgba(138,43,226,0.15)')
            : 'none'
        }}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-extrabold text-white uppercase tracking-widest font-sans">
              Party &amp; Combate
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5 custom-scrollbar">

          {/* ── SEU PERSONAGEM ────────────────────────────── */}
          <section>
            <SectionHeader icon={Star} label="Seu Personagem" color="#c084fc" />
            {myChar ? (
              <CharRow
                char={myChar}
                isMine={true}
                isMaster={isMaster}
                authStatus={authStatus}
                onUseSpell={onUseSpell}
                onUseAttack={onUseAttack}
                onGrantXp={onGrantXp}
                onKick={onKickPlayer}
                xpAmount={xpAmounts[myChar.id]}
                onXpChange={val => onXpChange(myChar.id, val)}
                onNavigate={navigate}
                accentColor="#c084fc"
                showHoverOnLeft={sidebarSide === 'left'}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 p-4 text-center">
                <User className="w-6 h-6 text-gray-600 mx-auto mb-1.5" />
                <p className="text-[9px] text-gray-500 font-sans">
                  {isMaster
                    ? 'Mestre não possui ficha de personagem.'
                    : 'Você ainda não criou um personagem.'
                  }
                </p>
                {!isMaster && (
                  <button
                    onClick={() => navigate('/create_character')}
                    className="mt-2 px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider text-white cursor-pointer transition-all"
                    style={{ backgroundColor: 'var(--cursed-color)', boxShadow: '0 0 8px var(--cursed-color)60' }}
                  >
                    Criar Personagem
                  </button>
                )}
              </div>
            )}
          </section>

          {/* ── MEMBROS DA PARTY ─────────────────────────── */}
          <section>
            <SectionHeader
              icon={Users}
              label="Membros da Party"
              count={partyChars.length + (isMaster && !myChar ? 0 : 0)}
              color="#8a2be2"
              badge={
                isMaster && (
                  <button
                    onClick={() => setShowAddPlayer(p => !p)}
                    className="p-1 rounded-lg text-purple-400 hover:text-purple-200 hover:bg-purple-950/30 transition-all cursor-pointer"
                    title="Convocar jogador"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                  </button>
                )
              }
            />

            {/* Add player form (master) */}
            <AnimatePresence>
              {showAddPlayer && isMaster && (
                <motion.form
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  onSubmit={onAddPlayer}
                  className="overflow-hidden mb-2"
                >
                  <div className="flex gap-1.5 mb-2">
                    <input
                      type="text"
                      value={addUsernameInput}
                      onChange={e => setAddUsernameInput(e.target.value)}
                      placeholder="Username..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg text-[10px] font-sans bg-black/40 border border-white/10 text-white focus:outline-none focus:border-purple-500/40"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg text-white font-bold text-[9px] uppercase cursor-pointer transition-all"
                      style={{ backgroundColor: 'var(--cursed-color)' }}
                    >
                      +
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Members list */}
            {members.length === 0 ? (
              <div className="text-center py-3">
                <p className="text-[9px] text-gray-600 italic font-sans">Nenhum membro sintonizado.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Member user list (top info) */}
                <div className="flex flex-col gap-1 mb-1">
                  {members.filter(m => m.user_id !== authStatus?.user_id).map(m => (
                    <div key={m.user_id} className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-black/30 border border-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-white font-sans">{m.username}</span>
                        {m.is_master && (
                          <Crown className="w-3 h-3 text-amber-400" />
                        )}
                      </div>
                      <span className="text-[8px] text-gray-500 font-sans truncate max-w-[80px]">
                        {m.char_nome || '—'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Character cards for party */}
                {partyChars.map(char => (
                  <CharRow
                    key={char.id}
                    char={char}
                    isMine={false}
                    isMaster={isMaster}
                    authStatus={authStatus}
                    onUseSpell={onUseSpell}
                    onUseAttack={onUseAttack}
                    onGrantXp={onGrantXp}
                    onKick={onKickPlayer}
                    xpAmount={xpAmounts[char.id]}
                    onXpChange={val => onXpChange(char.id, val)}
                    onNavigate={navigate}
                    showHoverOnLeft={sidebarSide === 'left'}
                  />
                ))}

                {partyChars.length === 0 && (
                  <p className="text-[9px] text-gray-600 italic font-sans text-center py-2">
                    Nenhum personagem sintonizado ainda.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* ── LOBBY CONECTADO ──────────────────────────── */}
          {(connectedParty.length > 0 || isMaster) && (
            <section>
              <SectionHeader
                icon={Link}
                label={connectedLobbyName ? `Party "${connectedLobbyName}"` : 'Conectar Lobby'}
                color="#f59e0b"
                badge={
                  isMaster && connectedLobbyName && (
                    <button
                      onClick={handleDisconnectLobby}
                      className="p-1 rounded-lg text-amber-400 hover:text-red-400 hover:bg-red-950/30 transition-all cursor-pointer"
                      title="Desconectar lobby externo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )
                }
              />

              {isMaster && (
                <div className="flex flex-col gap-2 bg-neutral-950/30 border border-white/5 p-3 rounded-2xl mb-3 font-sans">
                  <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Domínios Ativos
                  </p>
                  
                  <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar mt-1">
                    {otherActiveLobbies.length === 0 ? (
                      <p className="text-[8px] text-gray-500 italic text-center">Nenhum outro domínio ativo.</p>
                    ) : (
                      otherActiveLobbies.map(lob => {
                        const isConnected = connectedLobbies.some(cl => cl.id === lob.id);
                        return (
                          <div key={lob.id} className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-all">
                            <div className="text-left min-w-0">
                              <p className="text-[10px] font-bold text-white truncate max-w-[120px]">{lob.nome}</p>
                              <p className="text-[8px] text-gray-500">Mestre: {lob.master_nome}</p>
                            </div>
                            <button
                              onClick={() => isConnected ? handleDisconnectSpecific(lob.id) : handleConnectSpecific(lob.id)}
                              className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                                isConnected
                                  ? 'bg-red-950/40 border border-red-500/20 text-red-400 hover:bg-red-900/60 hover:text-white'
                                  : 'bg-amber-950/40 border border-amber-500/20 text-amber-400 hover:bg-amber-900/60 hover:text-white'
                              }`}
                            >
                              {isConnected ? 'Remover' : 'Ligar'}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {isMaster && !connectedLobbyName && (
                <div className="flex flex-col gap-2">
                  <p className="text-[9px] text-gray-500 font-sans leading-relaxed">
                    Ou conecte por código manual para sintonizar:
                  </p>
                  <AnimatePresence>
                    {showConnectLobby ? (
                      <motion.form
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        onSubmit={handleConnectLobby}
                        className="overflow-hidden"
                      >
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={connectCodeInput}
                            onChange={e => setConnectCodeInput(e.target.value)}
                            placeholder="Código do lobby..."
                            maxLength={6}
                            className="flex-1 px-2.5 py-1.5 rounded-lg text-[10px] font-sans text-center uppercase tracking-widest bg-black/40 border border-amber-500/20 text-white focus:outline-none focus:border-amber-500/50 font-bold"
                          />
                          <button
                            type="submit"
                            disabled={isConnecting}
                            className="px-3 py-1.5 rounded-lg text-white font-bold text-[9px] uppercase cursor-pointer transition-all disabled:opacity-50"
                            style={{ backgroundColor: '#d97706' }}
                          >
                            {isConnecting ? '...' : 'Ligar'}
                          </button>
                        </div>
                      </motion.form>
                    ) : (
                      <button
                        onClick={() => setShowConnectLobby(true)}
                        className="w-full py-2 rounded-xl border border-dashed border-amber-500/25 text-amber-400 text-[9px] font-bold uppercase tracking-wider hover:bg-amber-950/20 transition-all cursor-pointer font-sans flex items-center justify-center gap-1.5"
                      >
                        <Link className="w-3.5 h-3.5" />
                        Conectar via Código
                      </button>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {connectedParty.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  {connectedParty.map(char => (
                    <CharRow
                      key={`ext-${char.id}`}
                      char={char}
                      isMine={false}
                      isMaster={isMaster}
                      authStatus={authStatus}
                      onUseSpell={onUseSpell}
                      onUseAttack={onUseAttack}
                      onGrantXp={onGrantXp}
                      onKick={() => {}}
                      xpAmount={xpAmounts[char.id]}
                      onXpChange={val => onXpChange(char.id, val)}
                      onNavigate={navigate}
                      accentColor="#f59e0b"
                      showHoverOnLeft={sidebarSide === 'left'}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── FEED DE AÇÕES ────────────────────────────── */}
          {(() => {
            const allLogs = characters.flatMap(c =>
              (c.recent_logs || []).map(l => ({ ...l, charNome: c.nome, charColor: c.cor_energia || '#8a2be2' }))
            ).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 8)

            if (allLogs.length === 0) return null

            return (
              <section>
                <SectionHeader icon={AlertTriangle} label="Feed de Combate" color="#ef4444" />
                <div className="flex flex-col gap-2">
                  {allLogs.map((log, i) => (
                    <div key={i}
                      className="p-3 rounded-xl bg-neutral-900/50 border border-white/10 font-sans shadow-md"
                      style={{ borderLeftColor: log.charColor, borderLeftWidth: 3 }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9.5px] font-black uppercase tracking-wider" style={{ color: log.charColor }}>
                          {log.charNome}
                        </span>
                        <span className="text-[8px] text-gray-400 font-medium">{log.time}</span>
                      </div>
                      <p className="text-[11px] text-white font-extrabold tracking-wide">{log.title}</p>
                      <p className="text-[10.5px] text-gray-200 mt-1 leading-relaxed [&_b]:text-white [&_b]:font-black"
                        dangerouslySetInnerHTML={{ __html: log.content }} />
                    </div>
                  ))}
                </div>
              </section>
            )
          })()}

        </div>
      </motion.div>
    </>
  )
}
