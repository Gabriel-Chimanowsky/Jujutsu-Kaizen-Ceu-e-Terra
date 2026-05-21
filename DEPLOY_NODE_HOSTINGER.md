# 🚀 Guia de Deploy via Node.js na Hostinger (Recomendado)

Se você comprou ou prefere usar o plano de **Hospedagem Node.js da Hostinger**, agora você pode subir este aplicativo em Python/Flask diretamente através do nosso **Node.js Wrapper (`server.js`)**. 

Este wrapper atua como um Proxy Reverso nativo de altíssima performance: ele escuta a porta do Node.js da Hostinger, gerencia o processo em segundo plano do Python/Flask localmente e encaminha todas as requisições e uploads de planilhas perfeitamente.

---

## 🛠️ Passo a Passo para o Deploy

### Passo 1 — Criar a Aplicação Node.js no hPanel
1. Acesse o **hPanel** da Hostinger (`hpanel.hostinger.com`).
2. No menu lateral esquerdo, vá em **"Sites"** e selecione o seu domínio.
3. Busque por **"Node.js"** na barra de pesquisa ou vá em **"Avançado" -> "Node.js"**.
4. Clique em **"Criar Aplicação"**:
   * **Node.js version:** Versão `18` ou superior.
   * **Application root:** `/public_html` (ou outra pasta de sua preferência).
   * **Application URL:** Seu domínio (ex: `jujutsurpg.com`).
   * **Application startup file:** **`server.js`** *(Isso é muito importante!)*
5. Clique em **Salvar** ou **Criar**. A Hostinger inicializará a estrutura e o ambiente.

---

## 📂 Passo 2 — Enviar os Arquivos para a Hostinger

### Opção A: Usando Git (Recomendado)
No terminal SSH da Hostinger:
```bash
cd ~/public_html
git clone https://github.com/Gabriel-Chimanowsky/Jujutsu-Kaizen-Ceu-e-Terra.git .
```

### Opção B: Usando o Gerenciador de Arquivos
1. No hPanel da Hostinger, vá em **"Gerenciador de Arquivos"**.
2. Navegue até a pasta correspondente à sua aplicação (normalmente `/public_html`).
3. Envie todos os arquivos do projeto (você pode subir um `.zip` com tudo e descompactar na própria Hostinger).

---

## 🐍 Passo 3 — Instalar Dependências do Python

No terminal SSH da Hostinger, você precisa instalar os pacotes Python no ambiente do servidor.
Execute os seguintes comandos:

```bash
cd ~/public_html

# Instalar as dependências do Flask e openpyxl
pip install -r requirements.txt --user
```

> 💡 *Nota:* O parâmetro `--user` garante a instalação no escopo do seu usuário da hospedagem caso não tenha acesso de administrador global (root).

---

## ⚙️ Passo 4 — Configurar as Variáveis de Ambiente (Opcional)

No painel de configuração da sua **Node.js App** na Hostinger, você pode clicar em **"Environment Variables"** para adicionar segredos:

| Variável | Valor | Descrição |
|---|---|---|
| `SECRET_KEY` | *(escolha uma chave aleatória longa)* | Protege as sessões de login dos players. |
| `DATABASE_URL` | *(deixar em branco)* | Por padrão, usa o SQLite local em `database.db`. |

---

## 🔑 Login Padrão e Banco de Dados (Auto-Semeado)

Você não precisa rodar nenhum comando para criar tabelas ou logins. O nosso sistema faz isso automaticamente ao iniciar.

O banco de dados gerará automaticamente o seguinte login de mestre padrão no primeiro acesso:
- **Usuário:** `mestre`
- **Senha:** `mestre123`

> [!IMPORTANT]
> **Altere a senha padrão** ou crie um novo mestre e apague o antigo no primeiro login para garantir a segurança dos dados do seu RPG!

---

## 🔄 Passo 5 — Iniciar e Testar o App

1. No hPanel, vá nas configurações da sua **Node.js App**.
2. Clique no botão **"Iniciar"** (ou **"Restart"** se já estiver rodando).
3. Abra seu navegador e acesse o endereço do seu site.
4. O Node.js iniciará o backend em Python de forma transparente e encaminhará todas as conexões perfeitamente!

---

## 🔄 Como atualizar o site no futuro?

1. Salve suas alterações locais no Git e envie para o GitHub:
   ```bash
   git add .
   git commit -m "Nova atualização de fichas"
   git push origin main
   ```
2. Acesse seu terminal SSH no servidor Hostinger e puxe as alterações:
   ```bash
   cd ~/public_html
   git pull origin main
   ```
3. No hPanel, clique em **"Restart"** na sua aplicação Node.js para aplicar as novidades.
