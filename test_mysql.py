import os
import sys

# Garanta que o sys.path inclua o site-packages do usuário
user_home = os.path.expanduser('~')
for py_ver in ['3.6', '3.7', '3.8', '3.9', '3.10', '3.11']:
    site_path = os.path.join(user_home, '.local', 'lib', f'python{py_ver}', 'site-packages')
    if os.path.exists(site_path) and site_path not in sys.path:
        sys.path.insert(0, site_path)

try:
    import pymysql
    pymysql.install_as_MySQLdb()
    print("[DEBUG] PyMySQL importado com sucesso!")
except ImportError:
    print("[ERRO] PyMySQL não pôde ser importado. Certifique-se de que as dependências foram instaladas.")
    sys.exit(1)

# Pega a URL do banco
db_url = os.environ.get('DATABASE_URL')
if not db_url:
    print("[AVISO] A variável de ambiente DATABASE_URL não está definida!")
    print("Tentando ler de um arquivo .env se existir...")
    # Tenta ler do .env simples
    if os.path.exists('.env'):
        with open('.env') as f:
            for line in f:
                if line.startswith('DATABASE_URL='):
                    db_url = line.strip().split('=', 1)[1]
                    print(f"[DEBUG] DATABASE_URL encontrada no .env")

if not db_url:
    print("[ERRO] DATABASE_URL não encontrada. Defina a variável de ambiente ou crie um arquivo .env")
    sys.exit(1)

print(f"[DEBUG] Analisando a URL de conexão...")

# Converte URL
clean_url = db_url
if clean_url.startswith('mysql://'):
    clean_url = clean_url.replace('mysql://', 'mysql+pymysql://', 1)

# Tenta extrair credenciais
try:
    # mysql+pymysql://user:password@host/dbname
    parts = clean_url.split('://')[1]
    user_pass, host_db = parts.split('@')
    user, password = user_pass.split(':', 1)
    host, dbname = host_db.split('/')
    if '?' in dbname:
        dbname = dbname.split('?')[0]
    
    print(f"  -> Usuário: {user}")
    print(f"  -> Banco de Dados: {dbname}")
    print(f"  -> Host: {host}")
    print(f"  -> Senha: {'*' * len(password)} (tamanho: {len(password)})")
except Exception as e:
    print(f"[ERRO] Não foi possível parsear a DATABASE_URL: {e}")
    sys.exit(1)

# Tenta conectar via Unix Socket
print("\n--- TESTANDO CONEXÃO VIA UNIX SOCKET ---")
possible_sockets = [
    '/var/lib/mysql/mysql.sock',
    '/var/run/mysqld/mysqld.sock',
    '/tmp/mysql.sock'
]
socket_found = None
for s in possible_sockets:
    if os.path.exists(s):
        socket_found = s
        print(f"[INFO] Socket encontrado em: {s}")
        break

if socket_found:
    try:
        conn = pymysql.connect(
            user=user,
            password=password,
            database=dbname,
            unix_socket=socket_found
        )
        print("✅ SUCESSO! Conectado com sucesso via Unix Socket!")
        conn.close()
        sys.exit(0)
    except Exception as e:
        print(f"❌ FALHA via Unix Socket: {e}")
else:
    print("[AVISO] Nenhum Unix Socket padrão foi encontrado no disco local.")

# Tenta conectar via TCP/IP
print("\n--- TESTANDO CONEXÃO VIA TCP/IP ---")
try:
    conn = pymysql.connect(
        host=host,
        user=user,
        password=password,
        database=dbname,
        port=3306
    )
    print("✅ SUCESSO! Conectado com sucesso via TCP/IP!")
    conn.close()
except Exception as e:
    print(f"❌ FALHA via TCP/IP: {e}")
