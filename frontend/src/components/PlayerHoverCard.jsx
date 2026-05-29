import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Zap, Activity, Star, TrendingUp } from 'lucide-react'
import { createPortal } from 'react-dom'

// Mini radar chart rendered as inline SVG (no recharts dep)
function MiniRadar({ attributes = {}, color = '#8a2be2' }) {
  const keys = ['forca', 'destreza', 'constituicao', 'inteligencia', 'sabedoria', 'presenca']
  const labels = ['FOR', 'DES', 'CON', 'INT', 'SAB', 'PRE']
  const maxVal = 20
  const cx = 70, cy = 70, r = 52
  const angles = keys.map((_, i) => (Math.PI * 2 * i) / keys.length - Math.PI / 2)

  const getPoint = (angle, val) => {
    const ratio = Math.max(0, Math.min(1, (val || 0) / maxVal))
    return {
      x: cx + Math.cos(angle) * r * ratio,
      y: cy + Math.sin(angle) * r * ratio
    }
  }

  const webPoints = angles.map((a, i) => getPoint(a, attributes[keys[i]] || 0))
  const webPath = webPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'

  const gridLevels = [0.25, 0.5, 0.75, 1]

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="overflow-visible">
      {/* Grid */}
      {gridLevels.map(lvl => {
        const pts = angles.map(a => ({
          x: cx + Math.cos(a) * r * lvl,
          y: cy + Math.sin(a) * r * lvl
        }))
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'
        return <path key={lvl} d={path} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      })}
      {/* Axes */}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy}
          x2={(cx + Math.cos(a) * r).toFixed(1)}
          y2={(cy + Math.sin(a) * r).toFixed(1)}
          stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      ))}
      {/* Data polygon */}
      <path d={webPath} fill={color + '33'} stroke={color} strokeWidth="2"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      {/* Data points */}
      {webPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={color}
          style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
      ))}
      {/* Labels */}
      {angles.map((a, i) => {
        const lx = cx + Math.cos(a) * (r + 14)
        const ly = cy + Math.sin(a) * (r + 14)
        const val = attributes[keys[i]] || 0
        return (
          <g key={i}>
            <text x={lx.toFixed(1)} y={(ly - 4).toFixed(1)}
              textAnchor="middle" fill="rgba(255,255,255,0.5)"
              fontSize="7" fontFamily="sans-serif" fontWeight="bold">
              {labels[i]}
            </text>
            <text x={lx.toFixed(1)} y={(ly + 6).toFixed(1)}
              textAnchor="middle" fill={color}
              fontSize="9" fontFamily="sans-serif" fontWeight="900">
              {val}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default function PlayerHoverCard({ char, visible, coords }) {
  if (!char) return null

  const color = char.cor_energia || '#8a2be2'
  const pvPct = char.pv_max > 0 ? Math.round((char.pv_atual / char.pv_max) * 100) : 0
  const pePct = char.pe_max > 0 ? Math.round((char.pe_atual / char.pe_max) * 100) : 0
  const isRestringido = char.origem?.toLowerCase() === 'restringido'

  const logs = (char.recent_logs || []).slice(0, 2)

  return createPortal(
    <AnimatePresence>
      {visible && coords && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.12 }}
          className="fixed z-[9999] w-56 pointer-events-none text-left"
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.8))'
          }}
        >
          <div
            className="rounded-2xl border overflow-hidden text-left"
            style={{
              background: 'var(--tooltip-bg, linear-gradient(135deg, rgba(10,5,20,0.98) 0%, rgba(20,10,35,0.98) 100%))',
              borderColor: color + '40',
              boxShadow: `0 0 20px ${color}20, 0 4px 24px var(--shadow-color)`
            }}
          >
            {/* Header */}
            <div className="px-3 pt-3 pb-2 border-b flex items-center gap-2" style={{ borderColor: color + '20' }}>
              <div
                className="w-8 h-8 rounded-xl border-2 flex items-center justify-center overflow-hidden shrink-0 bg-neutral-900"
                style={{ borderColor: color }}
              >
                {char.imagem_url
                  ? <img src={char.imagem_url} alt={char.nome} className="w-full h-full object-cover" />
                  : <Star className="w-4 h-4" style={{ color }} />
                }
              </div>
              <div className="min-w-0">
                <p className="text-white font-black text-xs font-jujutsu truncate leading-tight">{char.nome}</p>
                <p className="text-gray-400 text-[9px] font-sans truncate">{char.especializacao} · {char.grau}</p>
              </div>
            </div>

            {/* Radar */}
            <div className="flex justify-center py-2">
              <MiniRadar attributes={char.attributes} color={color} />
            </div>

            {/* Vitals */}
            <div className="px-3 pb-2 flex flex-col gap-1.5 font-sans">
              {/* PV */}
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[9px] font-bold text-gray-400">
                  <span className="flex items-center gap-1"><Shield className="w-2.5 h-2.5 text-red-400" />PV</span>
                  <span className="text-white">{char.pv_atual}/{char.pv_max}</span>
                </div>
                <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full transition-all"
                    style={{ width: `${pvPct}%` }} />
                </div>
              </div>
              {/* PE */}
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[9px] font-bold text-gray-400">
                  <span className="flex items-center gap-1">
                    {isRestringido
                      ? <Activity className="w-2.5 h-2.5 text-emerald-400" />
                      : <Zap className="w-2.5 h-2.5" style={{ color }} />}
                    {isRestringido ? 'Estamina' : 'PE'}
                  </span>
                  <span className="text-white">{char.pe_atual}/{char.pe_max}</span>
                </div>
                <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pePct}%`, backgroundColor: isRestringido ? '#10b981' : color }} />
                </div>
              </div>
              {/* Alma (Integridade) */}
              {char.integridade_max > 0 && (
                <div className="flex flex-col gap-0.5 mt-1">
                  <div className="flex justify-between text-[9px] font-bold text-gray-400">
                    <span className="flex items-center gap-1 text-amber-500 font-extrabold">★ ALMA</span>
                    <span className="text-white font-mono">{char.integridade_atual}/{char.integridade_max} ({char.estado_alma || 'Estável'})</span>
                  </div>
                  <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.round((char.integridade_atual / char.integridade_max) * 100)}%` }} />
                  </div>
                </div>
              )}
              {/* Level badge */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-1.5 py-0.5 rounded bg-neutral-800 border border-white/5 text-white font-bold text-[8px]">Lvl {char.nivel}</span>
                <span className="text-gray-500 text-[8px]">XP: {char.xp}</span>
                <TrendingUp className="w-2.5 h-2.5 text-purple-400 ml-auto" />
              </div>
            </div>

            {/* Last actions */}
            {logs.length > 0 && (
              <div className="px-3 pb-3 border-t mt-1 pt-2 font-sans" style={{ borderColor: color + '15' }}>
                <p className="text-[8px] text-gray-500 font-extrabold uppercase tracking-wider mb-1">Última Ação</p>
                {logs.slice(0, 1).map((log, i) => (
                  <div key={i} className="text-[8.5px] text-gray-300 leading-snug truncate" title={log.content}>
                    <span className="font-bold" style={{ color }}>{log.title}</span>
                    <span className="text-gray-500 ml-1">{log.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  )
}
