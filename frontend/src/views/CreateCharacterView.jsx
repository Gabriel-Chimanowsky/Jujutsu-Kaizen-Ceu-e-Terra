import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { showCursedToast } from '../utils/toast'
import { Sparkles, Scroll, Swords, FolderOpen, Activity, User, Skull, ArrowLeft } from 'lucide-react'

export default function CreateCharacterView({ navigate }) {
  const [activeOption, setActiveOption] = useState('zero') // 'zero' | 'excel'
  
  // Manual Option States
  const [nome, setNome] = useState('')
  const [origem, setOrigem] = useState('Humano')
  const [especializacao, setEspecializacao] = useState('Feiticeiro de Combate')
  const [peso, setPeso] = useState('72kg')
  const [altura, setAltura] = useState('1.82m')
  const [afiliacao, setAfiliacao] = useState('Colégio Técnico de Jujutsu')
  const [votosAtivos, setVotosAtivos] = useState('Revelação da Técnica (+2 CD Feitiços)')

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

  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef(null)

  const handleAttrChange = (key, delta) => {
    setAttrs(prev => ({
      ...prev,
      [key]: Math.max(1, Math.min(30, prev[key] + delta))
    }))
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
    } catch (err) {
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

      const response = await axios.post('/api/create_character_from_excel', formData, {
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
              {/* Section 1: Basic details */}
              <div className="flex flex-col gap-5">
                <h3 className="text-sm font-extrabold text-white font-jujutsu border-b border-white/5 pb-2 flex items-center gap-2">
                  <Scroll className="w-4 h-4 text-purple-400" /> Características Básicas
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
                      <option value="Humano">Humano</option>
                      <option value="Clã Tradicional">Clã Tradicional</option>
                      <option value="Mestiço">Mestiço</option>
                      <option value="Mutação Inata">Mutação Inata</option>
                    </select>
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
                <h3 className="text-sm font-extrabold text-white font-jujutsu border-b border-white/5 pb-2 flex items-center gap-2">
                  <Swords className="w-4 h-4 text-red-500" /> Distribuição de Atributos
                </h3>

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
                      <div key={key} className="bg-neutral-900/60 rounded-2xl p-4 border border-white/5 flex flex-col items-center gap-3">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          {label}
                        </span>

                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => handleAttrChange(key, -1)}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center font-bold text-lg select-none cursor-pointer border border-white/15 text-white"
                          >
                            -
                          </button>
                          <span className="text-2xl font-black text-white w-8 text-center">
                            {attrs[key]}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAttrChange(key, 1)}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center font-bold text-lg select-none cursor-pointer border border-white/15 text-white"
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
                disabled={loading}
                className="w-full py-4 mt-4 rounded-xl text-white font-bold text-xs uppercase tracking-widest active:scale-95 transition-all cursor-pointer font-sans bg-purple-600 border-0"
                style={{
                  backgroundColor: 'var(--cursed-color)',
                  boxShadow: '0 0 15px var(--cursed-color)'
                }}
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
            <motion.form 
              key="excel"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleExcelSubmit} 
              className="flex flex-col gap-6 font-sans"
            >
              <h3 className="text-sm font-extrabold text-white font-jujutsu border-b border-white/5 pb-2 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-blue-400" /> Importação de Planilha Espiritual
              </h3>

              <p className="text-xs text-gray-400">
                Arraste ou selecione a planilha de ficha <strong>Modelo de Ficha - Feiticeiros & Maldições 2.5.xlsx</strong>. 
                O sistema fará a leitura automática de todos os atributos, perícias, resistências, RDs, ataques, feitiços, Shikigamis, inventário e checkboxes de treinamento.
              </p>

              {/* Drag and Drop Container */}
              <div 
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 relative group min-h-[180px] ${
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

                <Activity className="w-12 h-12 mb-3 text-purple-400 filter drop-shadow-[0_0_6px_var(--cursed-color)] group-hover:scale-110 transition-transform" />
                {selectedFile ? (
                  <div className="text-center">
                    <p className="text-sm text-white font-bold tracking-wide">{selectedFile.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase mt-1">{(selectedFile.size / 1024).toFixed(1)} KB • Pronto para Invocar</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-300 font-bold group-hover:text-white transition-colors">Arraste a Planilha Excel aqui</p>
                    <p className="text-[10px] text-gray-500 uppercase mt-1">ou clique para procurar no seu computador (.xlsx)</p>
                  </div>
                )}
              </div>

              {/* Progress Container */}
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

              <button
                type="submit"
                disabled={loading || !selectedFile}
                className={`w-full py-4 mt-2 rounded-xl text-white font-bold text-xs uppercase tracking-widest active:scale-95 transition-all cursor-pointer border-0 bg-emerald-600 ${
                  (!selectedFile || loading) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={selectedFile && !loading ? {
                  backgroundColor: 'var(--cursed-color)',
                  boxShadow: '0 0 15px var(--cursed-color)'
                } : {}}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Scroll className="w-4 h-4 animate-pulse" /> Canalizando Planilha...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" /> Invocar do Excel
                  </span>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

