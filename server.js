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

// ── AUTO-INSTALADOR DE DEPENDÊNCIAS PYTHON (robusto, com caminhos absolutos) ──
// O sandbox do Node.js na Hostinger não tem PATH completo, então usamos
// caminhos absolutos para encontrar o Python e o pip.

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

function runInstallAndStart() {
    const sitePackagesPath = path.join(__dirname, 'site-packages');
    const needsInstall = !fs.existsSync(sitePackagesPath) || fs.readdirSync(sitePackagesPath).length === 0;
    
    if (!needsInstall) {
        // Só aplica chmod preventivo e inicia
        log('Pasta site-packages já existe. Aplicando permissões preventivas...');
        try {
            const { execFileSync } = require('child_process');
            execFileSync('chmod', ['-R', '755', sitePackagesPath], { stdio: 'ignore' });
            log('Permissões de site-packages aplicadas.');
        } catch (e) {
            log(`Aviso ao ajustar permissões: ${e.message}`);
        }
        startPython();
        return;
    }
    
    // Precisa instalar: localiza o Python
    log('Pasta site-packages ausente ou vazia! Buscando interpretador Python...');
    const pythonExe = findPython();
    
    if (!pythonExe) {
        log('ERRO FATAL: Nenhum interpretador Python encontrado nos caminhos padrão do sistema. Inicie o Flask de qualquer forma...');
        startPython();
        return;
    }
    
    log(`Instalando dependências com: ${pythonExe} -m pip install -r requirements.txt --target=site-packages`);
    
    const pipArgs = ['-m', 'pip', 'install', '-r', 'requirements.txt', '--target=site-packages', '--no-cache-dir'];
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
        if (code === 0) {
            log('Instalação de dependências concluída com sucesso!');
            // Aplica permissões corretas
            try {
                const { execFileSync } = require('child_process');
                execFileSync('chmod', ['-R', '755', sitePackagesPath], { stdio: 'ignore' });
                log('Permissões de site-packages aplicadas após instalação.');
            } catch (e) {
                log(`Aviso ao ajustar permissões pós-install: ${e.message}`);
            }
        } else {
            log(`Pip encerrou com código ${code}. Detalhes:\n--- STDERR ---\n${pipErr.trim()}\n--- STDOUT ---\n${pipOut.trim()}`);
            log('Tentando iniciar o Flask de qualquer forma (caso os módulos já existam em outro caminho)...');
        }
        
        // Inicia o Flask independentemente do resultado do pip
        startPython();
    });
    
    pipProc.on('error', (err) => {
        log(`Erro ao executar pip (${pythonExe}): ${err.message}`);
        log('Iniciando Flask de qualquer forma...');
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
