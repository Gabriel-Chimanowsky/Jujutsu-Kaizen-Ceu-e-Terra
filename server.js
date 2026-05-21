const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const FLASK_PORT = process.env.FLASK_PORT || 5099;
const TARGET = `http://127.0.0.1:${FLASK_PORT}`;
const PORT = process.env.PORT || 3000;

// Inicializa ou limpa o arquivo de log de erros do Python no diretório temporário do sistema
// Isso evita que alterações no arquivo de log disparem o file watcher do Hostinger (evitando loops infinitos de reinicialização)
const logPath = path.join(os.tmpdir(), 'jjrpg_python_error.log');
try {
    fs.writeFileSync(logPath, `--- LOG DE INICIALIZAÇÃO PYTHON (${new Date().toISOString()}) ---\n`);
} catch (e) {
    console.error(`[NodeJS Wrapper] Não foi possível criar o arquivo de log em ${logPath}: ${e.message}`);
}

// Helper para logs com timestamp
function log(msg) {
    console.log(`[NodeJS Wrapper] [${new Date().toISOString()}] ${msg}`);
}

let pythonProcess = null;
let isStopping = false;

function startPython() {
    if (isStopping) return;
    
    log(`Iniciando servidor Flask no endereço ${TARGET}...`);
    log(`Arquivo de logs de erro do Python configurado em: ${logPath}`);
    
    const appPath = path.join(__dirname, 'app.py');
    const env = { ...process.env, FLASK_PORT: FLASK_PORT.toString() };

    let pythonCmd = 'python3';
    pythonProcess = spawn(pythonCmd, [appPath], { env, cwd: __dirname });

    pythonProcess.stdout.on('data', (data) => {
        console.log(`[Python/Flask STDOUT] ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        const errorMsg = data.toString();
        console.error(`[Python/Flask STDERR] ${errorMsg.trim()}`);
        try {
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] [STDERR] ${errorMsg}`);
        } catch (e) {}
    });

    pythonProcess.on('error', (err) => {
        const errStr = `Erro ao tentar executar como '${pythonCmd}': ${err.message}\n`;
        log(errStr.trim());
        try {
            fs.appendFileSync(logPath, `[${new Date().toISOString()}] [ERROR] ${errStr}`);
        } catch (e) {}
        
        if (pythonCmd === 'python3') {
            log("Tentando fallback com o comando 'python'...");
            pythonCmd = 'python';
            pythonProcess = spawn(pythonCmd, [appPath], { env, cwd: __dirname });
            
            pythonProcess.stdout.on('data', (data) => console.log(`[Python/Flask STDOUT] ${data.toString().trim()}`));
            pythonProcess.stderr.on('data', (data) => {
                const errorMsg2 = data.toString();
                console.error(`[Python/Flask STDERR] ${errorMsg2.trim()}`);
                try {
                    fs.appendFileSync(logPath, `[${new Date().toISOString()}] [STDERR] ${errorMsg2}`);
                } catch (e) {}
            });
            pythonProcess.on('error', (err2) => {
                const errStr2 = `Falha crítica: Não foi possível executar o Python (${err2.message}). Certifique-se de que o Python está instalado no servidor Hostinger.\n`;
                log(errStr2.trim());
                try {
                    fs.appendFileSync(logPath, `[${new Date().toISOString()}] [FATAL] ${errStr2}`);
                } catch (e) {}
            });
        }
    });

    pythonProcess.on('close', (code) => {
        if (!isStopping) {
            log(`Servidor Flask encerrou com código ${code}. Reiniciando em 5 segundos...`);
            setTimeout(startPython, 5000);
        }
    });
}

// ── AUTO-INSTALADOR DE DEPENDÊNCIAS PYTHON ──
// Instala com --user para ~/.local/lib/pythonX.X/site-packages
// Isso persiste entre TODOS os restarts e nunca é afetado por git pull.
// O app.py já adiciona esse caminho ao sys.path automaticamente.

const PYTHON_CANDIDATES = [
    '/bin/python3',
    '/usr/bin/python3',
    '/usr/local/bin/python3',
    '/bin/python',
    '/usr/bin/python',
];

function findPython() {
    for (const candidate of PYTHON_CANDIDATES) {
        if (fs.existsSync(candidate)) {
            log(`Python encontrado em: ${candidate}`);
            return candidate;
        }
    }
    return null;
}

// Verifica se o Flask já está instalado no diretório do usuário (~/.local)
// O app.py já adiciona esse caminho ao sys.path automaticamente.
function isFlaskInstalled() {
    // 1. Verifica ~/.local/lib/pythonX.X/site-packages/flask (instalação --user)
    const homeDir = os.homedir();
    const pyVersions = ['3.6', '3.7', '3.8', '3.9', '3.10', '3.11', '3.12'];
    for (const ver of pyVersions) {
        const flaskPath = path.join(homeDir, '.local', 'lib', `python${ver}`, 'site-packages', 'flask');
        if (fs.existsSync(flaskPath)) {
            log(`Flask encontrado (usuário) em: ${flaskPath}`);
            return true;
        }
    }
    // 2. Verifica local site-packages (instalação manual antiga)
    const localFlask = path.join(__dirname, 'site-packages', 'flask');
    if (fs.existsSync(localFlask)) {
        log(`Flask encontrado (local) em: ${localFlask}`);
        return true;
    }
    return false;
}

// Lock file para evitar que múltiplos processos simultâneos do Hostinger instalem ao mesmo tempo
const PIP_LOCK_FILE = path.join(os.tmpdir(), 'jjrpg_pip_install.lock');

function runInstallAndStart() {
    if (isFlaskInstalled()) {
        log('Flask já instalado. Iniciando servidor...');
        startPython();
        return;
    }

    // Verifica se outro processo já está instalando (race condition do Hostinger)
    if (fs.existsSync(PIP_LOCK_FILE)) {
        const lockAge = Date.now() - fs.statSync(PIP_LOCK_FILE).mtimeMs;
        if (lockAge < 300000) { // 5 minutos
            log('Outro processo já está instalando as dependências. Aguardando 15s e iniciando Flask...');
            setTimeout(startPython, 15000);
            return;
        }
        // Lock file antigo demais — remove e prossegue
        try { fs.unlinkSync(PIP_LOCK_FILE); } catch(e) {}
    }

    // Cria lock file
    try { fs.writeFileSync(PIP_LOCK_FILE, `${process.pid}\n`); } catch(e) {}

    const pythonExe = findPython();
    if (!pythonExe) {
        log('ERRO FATAL: Python não encontrado. Iniciando Flask de qualquer forma...');
        try { fs.unlinkSync(PIP_LOCK_FILE); } catch(e) {}
        startPython();
        return;
    }

    // Instala com --user (persiste em ~/.local, nunca é apagado por git ou restarts)
    log(`Instalando dependências persistentes com: ${pythonExe} -m pip install -r requirements.txt --user --no-cache-dir`);
    const pipArgs = ['-m', 'pip', 'install', '-r', 'requirements.txt', '--user', '--no-cache-dir'];
    const pipProc = spawn(pythonExe, pipArgs, { cwd: __dirname, stdio: ['ignore', 'pipe', 'pipe'] });

    let pipOut = '';
    let pipErr = '';

    pipProc.stdout.on('data', (d) => {
        pipOut += d.toString();
        process.stdout.write(`[pip] ${d.toString()}`);
    });

    pipProc.stderr.on('data', (d) => {
        pipErr += d.toString();
        process.stderr.write(`[pip ERRO] ${d.toString()}`);
    });

    pipProc.on('close', (code) => {
        try { fs.unlinkSync(PIP_LOCK_FILE); } catch(e) {}
        if (code === 0) {
            log('Instalação --user concluída com sucesso! Pacotes persistirão entre restarts.');
        } else {
            log(`Pip --user encerrou com código ${code}. Tentando --target=site-packages como fallback...`);
            // Fallback: tenta instalar no site-packages local
            const pipFallback = spawn(pythonExe, [
                '-m', 'pip', 'install', '-r', 'requirements.txt',
                `--target=${path.join(__dirname, 'site-packages')}`, '--no-cache-dir'
            ], { cwd: __dirname, stdio: ['ignore', 'pipe', 'pipe'] });

            pipFallback.stdout.on('data', (d) => process.stdout.write(`[pip-fallback] ${d.toString()}`));
            pipFallback.stderr.on('data', (d) => process.stderr.write(`[pip-fallback ERRO] ${d.toString()}`));
            pipFallback.on('close', (code2) => {
                if (code2 === 0) {
                    log('Fallback --target concluído com sucesso!');
                } else {
                    log(`Fallback também falhou (código ${code2}). Stderr: ${pipErr.trim()}`);
                }
                startPython();
            });
            pipFallback.on('error', (e) => {
                log(`Erro no fallback: ${e.message}`);
                startPython();
            });
            return; // não chama startPython aqui, o fallback vai chamar
        }
        startPython();
    });

    pipProc.on('error', (err) => {
        try { fs.unlinkSync(PIP_LOCK_FILE); } catch(e) {}
        log(`Erro ao executar pip: ${err.message}. Iniciando Flask de qualquer forma...`);
        startPython();
    });
}

// Inicia o fluxo de verificação e depois o Flask
runInstallAndStart();


// Cria o servidor HTTP do Proxy Reverso
const server = http.createServer((req, res) => {
    // Configuração do destino do proxy (nosso backend Flask local)
    const options = {
        hostname: '127.0.0.1',
        port: FLASK_PORT,
        path: req.url,
        method: req.method,
        headers: req.headers
    };

    // Encaminha a requisição para o Flask
    const proxyReq = http.request(options, (proxyRes) => {
        // Encaminha os cabeçalhos e status code de volta
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        // Encaminha o corpo da resposta em tempo de execução
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
        log(`Erro de Proxy ao encaminhar requisição (${req.method} ${req.url}): ${err.message}`);
        res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('O sistema de RPG Jujutsu está inicializando na nuvem Hostinger. Por favor, aguarde alguns instantes e recarregue a página.');
    });

    // Encaminha o corpo da requisição de entrada (se houver, e.g. upload de planilha, forms)
    req.pipe(proxyReq, { end: true });
});

server.listen(PORT, () => {
    log(`Servidor Proxy Node.js ativo e escutando na porta/socket: ${PORT}`);
});

// Limpeza de processos filhos ao sair
const cleanup = () => {
    isStopping = true;
    if (pythonProcess) {
        log('Encerrando processo Python/Flask...');
        pythonProcess.kill();
    }
    process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
