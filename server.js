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

// Inicia o backend em Flask
startPython();

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
