# 🚀 Guia de Deploy no Railway (Recomendado)

O **Railway.app** é a plataforma mais simples e robusta para hospedar este aplicativo em Python/Flask. Ele se conecta diretamente ao seu repositório do GitHub, reconstrói o app a cada commit e oferece suporte a bancos de dados PostgreSQL persistentes com configuração zero.

---

## 🛠️ Passo a Passo para o Deploy

### Passo 1: Criar Conta no Railway
1. Acesse [railway.app](https://railway.app) e crie uma conta usando seu login do GitHub.

### Passo 2: Importar o Repositório do GitHub
1. No painel do Railway, clique no botão **"New Project"** (ou **"+ New"**).
2. Selecione **"Deploy from GitHub repo"**.
3. Escolha o seu repositório: `Jujutsu-Kaizen-Ceu-e-Terra`.
4. Clique em **"Deploy Now"**.

---

## 💾 Passo 3: Configurar Banco de Dados Persistente (Altamente Recomendado)

> [!WARNING]
> O Railway utiliza um sistema de arquivos efêmero por padrão. Se você usar o banco de dados SQLite (`database.db`), todos os seus dados serão apagados toda vez que a aplicação reiniciar ou for atualizada.
> **Para evitar perda de dados, configure o PostgreSQL seguindo os passos abaixo:**

1. No painel do seu projeto no Railway, clique em **"+ New"** (canto superior direito).
2. Selecione **"Database"** -> **"Add PostgreSQL"**.
3. O Railway criará uma instância do PostgreSQL em segundos.
4. **Pronto!** O Railway injetará automaticamente a variável de ambiente `DATABASE_URL` no seu serviço Flask. Nossa aplicação já foi atualizada para reconhecer e configurar o PostgreSQL automaticamente se a variável estiver presente.

---

## ⚙️ Passo 4: Configurar Variáveis de Ambiente no Flask

1. No painel do Railway, clique no bloco correspondente à sua aplicação Flask.
2. Vá até a aba **"Variables"**.
3. Adicione a seguinte variável:
   - **`SECRET_KEY`**: Escolha uma string longa e aleatória (ex: `jjk-rpg-super-secret-key-123456`).
4. Se você adicionou o PostgreSQL no Passo 3, verá que a variável `DATABASE_URL` já está listada e preenchida automaticamente pelo Railway.

---

## 🔑 Acesso Padrão ao Sistema (Auto-Semeado)

Você não precisa rodar nenhum script para criar tabelas ou criar a conta de administrador no servidor! O nosso sistema faz isso automaticamente ao iniciar.

O banco de dados será inicializado limpo e criará o seguinte login padrão de mestre:
- **Usuário:** `mestre`
- **Senha:** `mestre123`

> [!IMPORTANT]
> **Altere a senha padrão** ou crie um novo mestre e apague o padrão no primeiro acesso para garantir a segurança da sua ficha e do seu lobby!

---

## 🔗 Passo 5: Gerar a URL Pública

1. No bloco do seu serviço Flask no Railway, vá para a aba **"Settings"**.
2. Sob a seção **"Environment"** -> **"Domains"**, clique em **"Generate Domain"** (ou configure um domínio personalizado próprio).
3. O Railway gerará uma URL pública segura (com `https://...`) do tipo `seu-app.up.railway.app`.
4. Clique na URL gerada para abrir o seu Jujutsu RPG e começar a jogar!

---

## 🔄 Como atualizar o site no futuro?

Sempre que você quiser fazer melhorias ou correções:
1. Faça as alterações no seu computador local.
2. Envie os commits para o GitHub:
   ```bash
   git add .
   git commit -m "Minhas melhorias e correções"
   git push origin main
   ```
3. **O Railway detectará o push automaticamente**, começará uma nova build e atualizará o site em produção em menos de um minuto, sem nenhuma interrupção!
