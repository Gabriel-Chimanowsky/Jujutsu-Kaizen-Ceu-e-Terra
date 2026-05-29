import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { showCursedToast } from '../utils/toast'
import { Sparkles, Scroll, Swords, FolderOpen, Activity, User, ArrowLeft, Dices } from 'lucide-react'
import { rollDice } from '../utils/dice'

const ORIGENS_DETAILS = {
  Inato: {
    nome: "Inato",
    desc: "O Inato é possivelmente a origem mais comum no mundo do Jujutsu, sendo aqueles que nasceram com a afinidade para usar energia amaldiçoada e com uma técnica própria, a qual se manifesta em algum ponto. Por ser única no mundo, a sua técnica é imprevisível e você tem o potencial de se inovar cada vez mais.",
    exemplo: "Exemplos: Nobara Kugisaki e Kento Nanami",
    features: [
      {
        titulo: "Bônus em Atributo",
        desc: "Aumenta o valor de um atributo em 2 pontos e o de outro em 1 ponto."
      },
      {
        titulo: "Talento Natural",
        desc: "Você recebe um Talento à sua escolha no 1° nível. Além disso, uma única vez a partir do 4° nível, você pode escolher receber uma aptidão, desde que cumpra seus pré-requisitos."
      },
      {
        titulo: "Marca Registrada",
        desc: "Você recebe um Feitiço adicional, o qual terá o seu custo reduzido em 1 PE."
      }
    ]
  },
  Derivado: {
    nome: "Derivado",
    desc: "Existem raros casos de pessoas cuja energia e técnica amaldiçoada derivaram de uma fonte alternativa, a qual veio em momentos posteriores da sua vida e possivelmente de maneira não natural, seja pelo consumo de um objeto amaldiçoado ou alguma alteração na alma.",
    exemplo: "Exemplos: Yuuji Itadori e Junpei Yoshino",
    features: [
      {
        titulo: "Bônus em Atributo",
        desc: "Aumenta o valor de um atributo em 2 pontos e o de outro em 1 ponto."
      },
      {
        titulo: "Energia Antinatural",
        desc: "Você possui uma pequena reserva oculta de energia. Como uma Ação Bônus em combate, você pode recuperar PE igual ao dobro do seu bônus de treinamento (1x por dia)."
      },
      {
        titulo: "Fonte do Despertar (Caminhos)",
        desc: "Escolha entre Consumidor (pode assimilar técnicas de objetos consumidos, recebendo 2 feitiços por técnica) ou Experimento (+2 feitiços de modificação corporal, limite de um Atributo Mental aumentado em 30, e Energia Antinatural usável 2x por descanso longo)."
      }
    ]
  },
  "Feiticeiro Reencarnado": {
    nome: "Feiticeiro Reencarnado",
    desc: "Feiticeiros do passado que realizaram um contrato com Kenjaku para se tornarem objetos amaldiçoados após a morte, reencarnando na era moderna ao possuírem o corpo de um hospedeiro compatível. Mantêm as suas memórias, experiência e técnicas lendárias de suas eras de origem.",
    exemplo: "Exemplos: Hajime Kashimo e Ryu Ishigori",
    features: [
      {
        titulo: "Bônus em Atributo",
        desc: "Aumenta o valor de um atributo em 2 pontos e o de outro em 1 ponto."
      },
      {
        titulo: "Contrato de Reencarnação",
        desc: "O feiticeiro possui vasto conhecimento ancestral de combate e fluxo de energia, trazendo consigo a maestria e técnicas refinadas de sua vida passada."
      },
      {
        titulo: "Pendente de Revisão",
        desc: "Esta origem e suas características de suporte completas serão detalhadas e polidas nas próximas revisões da versão 2.5.5."
      }
    ]
  }
}

export default function CreateCharacterView({ navigate }) {
  const [activeOption, setActiveOption] = useState('zero') // 'zero' | 'excel'
  
  // Manual Option States
  const [nome, setNome] = useState('')
  const [origem, setOrigem] = useState('Inato')
  const [especializacao, setEspecializacao] = useState('Feiticeiro de Combate')
  const [peso, setPeso] = useState('72kg')
  const [altura, setAltura] = useState('1.82m')
  const [afiliacao, setAfiliacao] = useState('Colégio Técnico de Jujutsu')
  const [votosAtivos, setVotosAtivos] = useState('Revelação da Técnica (+2 CD Feitiços)')

  // Point-rolling states
  const [rolls, setRolls] = useState([null, null, null])
  const [selectedRollIndex, setSelectedRollIndex] = useState(null)
  const [rollingSlots, setRollingSlots] = useState([false, false, false])

  // Attributes starting at 10
  const [attrs, setAttrs] = useState({
    forca: 10,
    destreza: 10,
    constituicao: 10,
    inteligencia: 10,
    sabedoria: 10,
    presenca: 10
  })

  // Excel Option States
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  const [googleSheetsUrl, setGoogleSheetsUrl] = useState('')
  const [syncingGoogleSheets, setSyncingGoogleSheets] = useState(false)

  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const rollPointsSlot = (index) => {
    if (rollingSlots[index]) return

    setRollingSlots(prev => {
      const copy = [...prev]
      copy[index] = true
      return copy
    })

    rollDice("4d6", `Energia do Destino (Slot ${index + 1})`, 0)

    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1
      const d2 = Math.floor(Math.random() * 6) + 1
      const d3 = Math.floor(Math.random() * 6) + 1
      const d4 = Math.floor(Math.random() * 6) + 1
      
      const dice = [d1, d2, d3, d4]
      const sorted = [...dice].sort((a, b) => a - b)
      
      const lowest = sorted[0]
      const highestThree = sorted.slice(1)
      const sum = highestThree.reduce((a, b) => a + b, 0) - lowest

      setRolls(prev => {
        const copy = [...prev]
        copy[index] = {
          rawRolls: dice,
          lowest,
          highestThree,
          sum
        }
        return copy
      })

      setRollingSlots(prev => {
        const copy = [...prev]
        copy[index] = false
        return copy
      })

      showCursedToast("Destino Canalizado", `Slot ${index + 1} obteve ${sum} pontos!`, "success")
    }, 1000)
  }

  const selectRollSlot = (index) => {
    if (rolls[index] === null) {
      showCursedToast("Slot Vazio", "Por favor, canalize a energia deste slot antes de selecioná-lo.", "warning")
      return
    }
    setSelectedRollIndex(index)
    setAttrs({
      forca: 10,
      destreza: 10,
      constituicao: 10,
      inteligencia: 10,
      sabedoria: 10,
      presenca: 10
    })
  }

  const usedPoints = Object.values(attrs).reduce((acc, val) => acc + (val - 10), 0)
  const totalPoints = selectedRollIndex !== null ? (rolls[selectedRollIndex] ? rolls[selectedRollIndex].sum : 0) : 0
  const remainingPoints = totalPoints - usedPoints

  const handleAttrChange = (key, delta) => {
    if (selectedRollIndex === null) {
      showCursedToast("Atributos Bloqueados", "Por favor, canalize a energia do destino e selecione um resultado antes de distribuir pontos.", "warning")
      return
    }

    const currentVal = attrs[key]
    const limit = rolls[selectedRollIndex].sum

    if (delta > 0) {
      if (usedPoints >= limit) {
        showCursedToast("Sem Pontos", "Você já distribuiu todos os seus pontos de atributo.", "warning")
        return
      }
      if (currentVal >= 30) return
      setAttrs(prev => ({ ...prev, [key]: currentVal + 1 }))
    } else {
      if (currentVal <= 10) {
        showCursedToast("Mínimo Atingido", "Os atributos iniciais não podem ser menores que 10.", "warning")
        return
      }
      setAttrs(prev => ({ ...prev, [key]: currentVal - 1 }))
    }
  }

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith('.xlsx')) {
        setSelectedFile(file)
      } else {
        showCursedToast("Arquivo Inválido", "Por favor, envie um arquivo de planilha do Excel (.xlsx)!", "error")
      }
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    if (selectedRollIndex === null) {
      showCursedToast("Destino Indefinido", "Por favor, role os dados de energia e selecione um resultado.", "warning")
      return
    }
    if (remainingPoints > 0) {
      showCursedToast("Pontos Restantes", `Você ainda tem ${remainingPoints} pontos para distribuir.`, "warning")
      return
    }
    if (remainingPoints < 0) {
      showCursedToast("Distribuição Inválida", "Você excedeu os pontos permitidos.", "warning")
      return
    }
    if (!nome.trim()) {
      showCursedToast("Faltando Nome", "Por favor, insira o nome do seu feiticeiro.", "warning")
      return
    }

    setLoading(true)
    try {
      const formData = new URLSearchParams()
      formData.append('nome', nome)
      formData.append('origem', origem)
      formData.append('especializacao', especializacao)
      formData.append('peso', peso)
      formData.append('altura', altura)
      formData.append('afiliacao', afiliacao)
      formData.append('votos_ativos', votosAtivos)
      
      // Add attributes
      formData.append('forca', String(attrs.forca))
      formData.append('destreza', String(attrs.destreza))
      formData.append('constituicao', String(attrs.constituicao))
      formData.append('inteligencia', String(attrs.inteligencia))
      formData.append('sabedoria', String(attrs.sabedoria))
      formData.append('presenca', String(attrs.presenca))

      await axios.post('/create_character', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })

      showCursedToast("Invocação Concluída", "Seu feiticeiro foi criado com sucesso!", "success")
      navigate('/lobby')
    } catch {
      showCursedToast("Falha no Nascimento", "Não foi possível criar o personagem.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleExcelSubmit = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      showCursedToast("Nenhum Arquivo", "Por favor, selecione ou arraste um arquivo de planilha.", "warning")
      return
    }

    setLoading(true)
    setUploadProgress(10)
    setUploadStatus("Invocando energia amaldiçoada do arquivo...")

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Simulate step-by-step spreadsheet processing log
      const progressPhases = [
        { progress: 30, msg: "Manifestando Atributos do Feiticeiro..." },
        { progress: 50, msg: "Lendo Perícias & Resistências de Combate..." },
        { progress: 70, msg: "Extraindo Armas, Defesas & Técnicas de Ataque..." },
        { progress: 85, msg: "Invocando Shikigamis & Inventário..." },
        { progress: 95, msg: "Selando barreira espiritual e gerando ficha..." }
      ]

      let currentPhase = 0
      const interval = setInterval(() => {
        if (currentPhase < progressPhases.length) {
          setUploadProgress(progressPhases[currentPhase].progress)
          setUploadStatus(progressPhases[currentPhase].msg)
          currentPhase++
        } else {
          clearInterval(interval)
        }
      }, 800)

      await axios.post('/api/create_character_from_excel', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      clearInterval(interval)
      setUploadProgress(100)
      setUploadStatus("Invocação concluída com total sucesso!")
      
      showCursedToast("Invocação Realizada", "Personagem criado e importado com total sucesso!", "success")
      setTimeout(() => {
        navigate('/lobby')
      }, 1000)
    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.error || "Erro ao processar as abas da planilha do Excel."
      showCursedToast("Falha na Invocação", errorMsg, "error")
      setUploadProgress(0)
      setUploadStatus("")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSheetsSubmit = async (e) => {
    e.preventDefault()
    if (!googleSheetsUrl.trim()) {
      showCursedToast("Link Vazio", "Por favor, insira o link do Google Sheets.", "warning")
      return
    }

    setLoading(true)
    setSyncingGoogleSheets(true)
    setUploadProgress(15)
    setUploadStatus("Invocando energia amaldiçoada do Google Sheets...")

    try {
      const progressPhases = [
        { progress: 35, msg: "Estabelecendo barreira com servidores do Google..." },
        { progress: 55, msg: "Manifestando Atributos do Feiticeiro..." },
        { progress: 75, msg: "Extraindo Armas, Defesas & Técnicas de Ataque..." },
        { progress: 90, msg: "Selando barreira espiritual e gerando ficha..." }
      ]

      let currentPhase = 0
      const interval = setInterval(() => {
        if (currentPhase < progressPhases.length) {
          setUploadProgress(progressPhases[currentPhase].progress)
          setUploadStatus(progressPhases[currentPhase].msg)
          currentPhase++
        } else {
          clearInterval(interval)
        }
      }, 700)

      await axios.post('/api/create_character_from_excel_url', {
        url: googleSheetsUrl
      })

      clearInterval(interval)
      setUploadProgress(100)
      setUploadStatus("Invocação concluída com total sucesso!")
      
      showCursedToast("Invocação Realizada", "Personagem criado e importado via link com total sucesso!", "success")
      setGoogleSheetsUrl('')
      setTimeout(() => {
        navigate('/lobby')
      }, 1000)
    } catch (err) {
      console.error(err)
      const errorMsg = err.response?.data?.error || "Erro ao conectar ou sincronizar a planilha pública."
      showCursedToast("Falha na Invocação", errorMsg, "error")
      setUploadProgress(0)
      setUploadStatus("")
    } finally {
      setLoading(false)
      setSyncingGoogleSheets(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 relative z-20 w-full max-w-4xl mx-auto">
      
      {/* Back button */}
      <button 
        onClick={() => navigate('/lobby')}
        className="self-start text-sm text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 font-sans mb-6 bg-transparent border-0"
      >
        <ArrowLeft className="w-4 h-4 text-gray-400" /> Cancelar Criação
      </button>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-neutral-950/80 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 35px var(--cursed-color)15'
        }}
      >
        <div className="flex flex-col items-center gap-1 mb-6 text-center">
          <User className="w-12 h-12 text-purple-400 filter drop-shadow-[0_0_8px_var(--cursed-color)] animate-pulse" />
          <h2 className="text-2xl font-bold font-jujutsu bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Criação de Feiticeiro
          </h2>
          <p className="text-xs text-gray-500 font-sans">
            Escolha criar seu personagem manualmente ou invocar seus detalhes diretamente da planilha do livro de regras.
          </p>
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="flex w-full border-b border-white/10 mb-8 font-sans">
          <button
            type="button"
            onClick={() => !loading && setActiveOption('zero')}
            disabled={loading}
            className={`flex-1 text-center py-3 text-xs font-bold uppercase tracking-wider relative transition-colors duration-300 cursor-pointer bg-transparent border-0 outline-none ${activeOption === 'zero' ? 'text-white' : 'text-gray-500 hover:text-gray-300'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Criar do Zero
            {activeOption === 'zero' && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ backgroundColor: 'var(--cursed-color)' }}
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => !loading && setActiveOption('excel')}
            disabled={loading}
            className={`flex-1 text-center py-3 text-xs font-bold uppercase tracking-wider relative transition-colors duration-300 cursor-pointer bg-transparent border-0 outline-none ${activeOption === 'excel' ? 'text-white' : 'text-gray-500 hover:text-gray-300'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Invocar via Planilha (.xlsx)
            {activeOption === 'excel' && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ backgroundColor: 'var(--cursed-color)' }}
              />
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeOption === 'zero' ? (
            <motion.form 
              key="manual"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleManualSubmit} 
              className="flex flex-col gap-8"
            >
              {/* Passo 1: Canalizar Pontos da Alma (4d6) */}
              <div className="flex flex-col gap-5">
                <h3 className="text-sm font-extrabold text-white font-jujutsu border-b border-white/5 pb-2 flex items-center gap-2">
                  <Dices className="w-4 h-4 text-purple-400 animate-pulse" /> Passo 1: Canalizar Pontos da Alma (4d6)
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed font-sans">
                  Gire os dados de energia espiritual para definir o seu pool inicial de pontos de atributos. 
                  Você rolará 4d6, somará os 3 maiores resultados e subtrairá o menor valor. 
                  Você pode canalizar o destino até 3 vezes e escolher um dos resultados obtidos.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-sans">
                  {rolls.map((roll, idx) => {
                    const isRolling = rollingSlots[idx]
                    const isSelected = selectedRollIndex === idx

                    return (
                      <div
                        key={idx}
                        onClick={() => roll && !isRolling && selectRollSlot(idx)}
                        className={`relative p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between min-h-[140px] cursor-pointer ${
                          isSelected
                            ? 'border-purple-500 bg-purple-950/20 shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                            : roll
                            ? 'border-white/10 hover:border-purple-500/40 bg-neutral-900/40 hover:bg-neutral-900/60'
                            : 'border-dashed border-white/10 hover:border-purple-500/30 bg-neutral-950/40'
                        }`}
                      >
                        {/* Selected Indicator badge */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-purple-500 text-[8px] font-black uppercase text-white tracking-wider">
                            Ativo
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                            Canalização {idx + 1}
                          </span>

                          {isRolling ? (
                            <div className="flex flex-col gap-2 items-center justify-center my-2">
                              <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                              <span className="text-[10px] text-purple-400 font-extrabold uppercase animate-pulse">
                                Conjurando...
                              </span>
                            </div>
                          ) : roll ? (
                            <div className="flex flex-col gap-1">
                              <span className="text-3xl font-black text-white">
                                {roll.sum} <span className="text-xs font-normal text-gray-400">pts</span>
                              </span>
                              <span className="text-[10px] text-gray-400">
                                Dados: [{roll.rawRolls.join(', ')}]
                              </span>
                              <span className="text-[9px] text-purple-300 font-medium">
                                ({roll.highestThree.join(' + ')}) - {roll.lowest}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1 py-1">
                              <span className="text-sm font-semibold text-gray-500">
                                Energia Adormecida
                              </span>
                              <span className="text-[10px] text-gray-600">
                                Destino não canalizado
                              </span>
                            </div>
                          )}
                        </div>

                        {!roll && !isRolling && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              rollPointsSlot(idx)
                            }}
                            className="mt-3 py-2 px-4 rounded-xl text-white font-bold text-[10px] uppercase tracking-wider bg-purple-600 hover:bg-purple-700 active:scale-95 transition-all cursor-pointer border-0 w-full"
                          >
                            Canalizar Destino
                          </button>
                        )}

                        {roll && !isRolling && !isSelected && (
                          <div className="mt-3 text-[10px] text-purple-400 font-extrabold uppercase tracking-wider text-center group-hover:text-purple-300">
                            Clique para Selecionar
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Section 1: Basic details */}
              <div className="flex flex-col gap-5">
                <h3 className="text-sm font-extrabold text-white font-jujutsu border-b border-white/5 pb-2 flex items-center gap-2">
                  <Scroll className="w-4 h-4 text-purple-400" /> Passo 2: Características Básicas
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-sans">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-purple-300 font-extrabold uppercase tracking-widest">
                      Nome do Feiticeiro
                    </label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Ex: Ryuma Kento..."
                      className="px-4 py-2.5 rounded-xl text-sm focus:outline-none bg-neutral-900 border border-white/10 text-white focus:border-purple-500"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-purple-300 font-extrabold uppercase tracking-widest">
                      Origem do Xamã
                    </label>
                    <select
                      value={origem}
                      onChange={(e) => setOrigem(e.target.value)}
                      className="px-4 py-2.5 rounded-xl text-sm bg-gray-900 border border-white/10 text-gray-300 focus:border-purple-500 cursor-pointer"
                    >
                      <option value="Inato">Inato</option>
                      <option value="Derivado">Derivado</option>
                      <option value="Feiticeiro Reencarnado">Feiticeiro Reencarnado</option>
                    </select>
                    {ORIGENS_DETAILS[origem] && (
                      <div className="mt-3 p-4 rounded-xl border font-sans text-left transition-all duration-300"
                           style={{
                             background: 'linear-gradient(135deg, rgba(8,4,18,0.7) 0%, rgba(18,9,36,0.7) 100%)',
                             borderColor: 'rgba(168, 85, 247, 0.15)',
                             boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
                           }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest">
                            Detalhes da Origem: {ORIGENS_DETAILS[origem].nome}
                          </span>
                          <span className="text-[8px] text-amber-400 font-extrabold uppercase tracking-widest bg-amber-950/30 border border-amber-500/25 px-1.5 py-0.25 rounded">
                            F&M 2.5.5
                          </span>
                        </div>
                        <p className="text-[10.5px] text-gray-400 leading-relaxed mb-2 font-medium">
                          {ORIGENS_DETAILS[origem].desc}
                        </p>
                        <p className="text-[9px] text-gray-500 italic mb-3 font-semibold">
                          {ORIGENS_DETAILS[origem].exemplo}
                        </p>
                        <div className="flex flex-col gap-2">
                          {ORIGENS_DETAILS[origem].features.map((feat, fIdx) => (
                            <div key={fIdx} className="bg-black/35 border border-white/[0.02] p-2.5 rounded-lg flex flex-col gap-0.5 hover:border-white/5 transition-all">
                              <span className="text-[9.5px] font-extrabold text-white flex items-center gap-1.5">
                                <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                                {feat.titulo}
                              </span>
                              <span className="text-[9.5px] text-gray-400 leading-relaxed font-medium">
                                {feat.desc}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-purple-300 font-extrabold uppercase tracking-widest">
                      Especialização Jujutsu
                    </label>
                    <input
                      type="text"
                      value={especializacao}
                      onChange={(e) => setEspecializacao(e.target.value)}
                      placeholder="Ex: Feiticeiro de Combate..."
                      className="px-4 py-2.5 rounded-xl text-sm focus:outline-none bg-neutral-900 border border-white/10 text-white focus:border-purple-500"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-purple-300 font-extrabold uppercase tracking-widest">
                      Afiliação Organizacional
                    </label>
                    <input
                      type="text"
                      value={afiliacao}
                      onChange={(e) => setAfiliacao(e.target.value)}
                      className="px-4 py-2.5 rounded-xl text-sm focus:outline-none bg-neutral-900 border border-white/10 text-white focus:border-purple-500"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-purple-300 font-extrabold uppercase tracking-widest">
                      Peso & Altura
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={peso}
                        onChange={(e) => setPeso(e.target.value)}
                        placeholder="Ex: 72kg"
                        className="px-4 py-2.5 rounded-xl text-sm focus:outline-none text-center bg-neutral-900 border border-white/10 text-white focus:border-purple-500"
                        required
                      />
                      <input
                        type="text"
                        value={altura}
                        onChange={(e) => setAltura(e.target.value)}
                        placeholder="Ex: 1.82m"
                        className="px-4 py-2.5 rounded-xl text-sm focus:outline-none text-center bg-neutral-900 border border-white/10 text-white focus:border-purple-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-purple-300 font-extrabold uppercase tracking-widest">
                      Votos Ativos
                    </label>
                    <input
                      type="text"
                      value={votosAtivos}
                      onChange={(e) => setVotosAtivos(e.target.value)}
                      className="px-4 py-2.5 rounded-xl text-sm focus:outline-none bg-neutral-900 border border-white/10 text-white focus:border-purple-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Attributes */}
              <div className="flex flex-col gap-5">
                <div className="flex justify-between items-center w-full border-b border-white/5 pb-2">
                  <h3 className="text-sm font-extrabold text-white font-jujutsu flex items-center gap-2">
                    <Swords className="w-4 h-4 text-red-500" /> Passo 3: Distribuição de Atributos
                  </h3>
                  <div className="px-3 py-1 rounded-full bg-neutral-900 border border-white/10 text-[10px] font-black uppercase tracking-wider">
                    {selectedRollIndex !== null ? (
                      <span className={remainingPoints === 0 ? 'text-emerald-400 font-extrabold' : 'text-purple-400 font-extrabold animate-pulse'}>
                        Pontos Restantes: {remainingPoints} / {totalPoints}
                      </span>
                    ) : (
                      <span className="text-gray-500 font-extrabold">Aguardando Rolagem</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 font-sans">
                  {Object.keys(attrs).map((key) => {
                    const label = 
                      key === 'forca' ? 'Força (FOR)' :
                      key === 'destreza' ? 'Destreza (DES)' :
                      key === 'constituicao' ? 'Constituição (CON)' :
                      key === 'inteligencia' ? 'Inteligência (INT)' :
                      key === 'sabedoria' ? 'Sabedoria (SAB)' :
                      'Presença (PRE)'

                    return (
                      <div 
                        key={key} 
                        className={`bg-neutral-900/60 rounded-2xl p-4 border border-white/5 flex flex-col items-center gap-3 transition-all duration-300 ${
                          selectedRollIndex === null ? 'opacity-40 select-none' : ''
                        }`}
                      >
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          {label}
                        </span>

                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            disabled={selectedRollIndex === null || attrs[key] <= 10}
                            onClick={() => handleAttrChange(key, -1)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg select-none transition-all border text-white ${
                              (selectedRollIndex === null || attrs[key] <= 10)
                                ? 'bg-white/5 border-white/5 opacity-30 cursor-not-allowed'
                                : 'bg-white/5 hover:bg-white/10 border-white/15 active:scale-95 cursor-pointer'
                            }`}
                          >
                            -
                          </button>
                          <span className="text-2xl font-black text-white w-8 text-center">
                            {attrs[key]}
                          </span>
                          <button
                            type="button"
                            disabled={selectedRollIndex === null || remainingPoints <= 0 || attrs[key] >= 30}
                            onClick={() => handleAttrChange(key, 1)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg select-none transition-all border text-white ${
                              (selectedRollIndex === null || remainingPoints <= 0 || attrs[key] >= 30)
                                ? 'bg-white/5 border-white/5 opacity-30 cursor-not-allowed'
                                : 'bg-white/5 hover:bg-white/10 border-white/15 active:scale-95 cursor-pointer'
                            }`}
                          >
                            +
                          </button>
                        </div>

                        <span className="text-[10px] text-purple-300 font-medium">
                          Mod: {Math.floor((attrs[key] - 10) / 2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || selectedRollIndex === null || remainingPoints !== 0}
                className={`w-full py-4 mt-4 rounded-xl text-white font-bold text-xs uppercase tracking-widest active:scale-95 transition-all font-sans border-0 transition-all duration-300 ${
                  (loading || selectedRollIndex === null || remainingPoints !== 0)
                    ? 'opacity-40 cursor-not-allowed bg-purple-950/40'
                    : 'cursor-pointer bg-purple-600 hover:bg-purple-700'
                }`}
                style={!(loading || selectedRollIndex === null || remainingPoints !== 0) ? {
                  backgroundColor: 'var(--cursed-color)',
                  boxShadow: '0 0 15px var(--cursed-color)'
                } : {}}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <User className="w-4 h-4 animate-pulse" /> Conjurando Corpo...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" /> Concluir Invocação
                  </span>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div 
              key="excel"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6 font-sans text-left"
            >
              <h3 className="text-sm font-extrabold text-white font-jujutsu border-b border-white/5 pb-2 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-blue-400" /> Importação de Planilha Espiritual
              </h3>

              <p className="text-xs text-gray-400">
                Invoque todos os detalhes de seu feiticeiro (atributos, perícias, resistências, RDs, ataques, feitiços, Shikigamis, inventário) diretamente da planilha de regras <strong>Modelo de Ficha - Feiticeiros & Maldições 2.5.xlsx</strong>.
              </p>

              {/* Progress Container (Global during creation) */}
              {loading && uploadProgress > 0 && (
                <div className="bg-neutral-900 border border-white/5 rounded-xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black tracking-widest text-purple-300 uppercase animate-pulse">{uploadStatus}</span>
                    <span className="text-xs font-black text-purple-300" style={{ color: 'var(--cursed-color)' }}>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-black border border-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full rounded-full"
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                      style={{ backgroundColor: 'var(--cursed-color)' }}
                    />
                  </div>
                </div>
              )}

              {/* Option A: Excel File Upload */}
              <form onSubmit={handleExcelSubmit} className="flex flex-col gap-4">
                <span className="text-[10px] text-purple-300 font-extrabold uppercase tracking-widest block">
                  OPÇÃO A: Enviar Arquivo Físico (.xlsx)
                </span>
                
                {/* Drag and Drop Container */}
                <div 
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group min-h-[140px] ${
                    dragActive 
                      ? 'border-purple-500 bg-purple-950/15' 
                      : 'border-white/10 hover:border-purple-500/50 bg-neutral-900/40 hover:bg-neutral-900/60'
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => !loading && fileInputRef.current?.click()}
                  style={dragActive ? { borderColor: 'var(--cursed-color)' } : {}}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                    accept=".xlsx" 
                    className="hidden" 
                  />

                  <Activity className="w-10 h-10 mb-2 text-purple-400 filter drop-shadow-[0_0_6px_var(--cursed-color)] group-hover:scale-110 transition-transform" />
                  {selectedFile ? (
                    <div className="text-center">
                      <p className="text-xs text-white font-bold tracking-wide">{selectedFile.name}</p>
                      <p className="text-[9px] text-gray-500 uppercase mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB • Pronto para Invocar</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-xs text-gray-300 font-bold group-hover:text-white transition-colors">Arraste a Planilha Excel aqui</p>
                      <p className="text-[9px] text-gray-500 uppercase mt-0.5">ou clique para procurar no seu computador (.xlsx)</p>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !selectedFile}
                  className={`w-full py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest active:scale-95 transition-all cursor-pointer border-0 bg-emerald-600 ${
                    (!selectedFile || loading) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  style={selectedFile && !loading ? {
                    backgroundColor: 'var(--cursed-color)',
                    boxShadow: '0 0 15px var(--cursed-color)'
                  } : {}}
                >
                  {loading && !syncingGoogleSheets ? (
                    <span className="flex items-center justify-center gap-2">
                      <Scroll className="w-4 h-4 animate-pulse" /> Canalizando Planilha...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" /> Invocar do Excel
                    </span>
                  )}
                </button>
              </form>

              {/* Elegant Divider */}
              <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-white/5"></div>
                <span className="flex-shrink mx-4 text-[9px] text-gray-500 font-bold tracking-widest uppercase">OU</span>
                <div className="flex-grow border-t border-white/5"></div>
              </div>

              {/* Option B: Google Sheets URL Import */}
              <form onSubmit={handleGoogleSheetsSubmit} className="flex flex-col gap-4">
                <span className="text-[10px] text-purple-300 font-extrabold uppercase tracking-widest block">
                  OPÇÃO B: Sintonizar Link do Google Sheets (Nuvem)
                </span>

                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <input
                    type="text"
                    placeholder="Cole o link de compartilhamento do Google Sheets aqui..."
                    value={googleSheetsUrl}
                    onChange={(e) => setGoogleSheetsUrl(e.target.value)}
                    disabled={loading}
                    className="flex-grow px-4 py-3 rounded-xl text-xs bg-neutral-900 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 font-semibold disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={loading || !googleSheetsUrl.trim()}
                    className="px-6 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-widest active:scale-95 transition-all cursor-pointer border-0 bg-purple-600 flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(139,92,246,0.15)] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    style={googleSheetsUrl.trim() && !loading ? {
                      backgroundColor: 'var(--cursed-color)',
                      boxShadow: '0 0 15px var(--cursed-color)'
                    } : {}}
                  >
                    {syncingGoogleSheets ? (
                      <span className="flex items-center gap-1.5 font-extrabold">
                        <Activity className="w-4 h-4 animate-spin" /> Conectando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 font-extrabold">
                        <Sparkles className="w-4 h-4" /> Invocar via Link
                      </span>
                    )}
                  </button>
                </div>
                <span className="text-[9px] text-gray-500 leading-relaxed block text-left">
                  Certifique-se de que a planilha do Google Sheets esteja configurada como pública para leitura (Qualquer pessoa com o link configurado para Leitor) para permitir a invocação espiritual.
                </span>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

