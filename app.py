import os
import sys
import time
import random
import string

# Força inclusão dos diretórios de pacotes locais no Hostinger
base_dir = os.path.dirname(os.path.abspath(__file__))
local_site = os.path.join(base_dir, 'site-packages')

# Sempre inclui no path para garantir, mesmo se os.path.exists falhar por questões de permissão
if local_site not in sys.path:
    sys.path.insert(0, local_site)

# Coleta diagnósticos detalhados do site-packages para ajudar no troubleshooting do Hostinger
exists = os.path.exists(local_site)
is_dir = os.path.isdir(local_site) if exists else False
readable = os.access(local_site, os.R_OK) if exists else False
executable = os.access(local_site, os.X_OK) if exists else False
try:
    stat_val = oct(os.stat(local_site).st_mode & 0o777) if exists else "N/A"
except Exception as e:
    stat_val = f"Error: {str(e)}"

sys.stderr.write(f"[PYTHON DEBUG] Version: {sys.version}\n")
sys.stderr.write(f"[PYTHON DEBUG] Executable: {sys.executable}\n")
sys.stderr.write(f"[PYTHON DEBUG] local_site: {local_site} (Exists: {exists}, IsDir: {is_dir}, Read: {readable}, Exec/Traverse: {executable}, Perms: {stat_val})\n")

user_home = os.path.expanduser('~')
if not user_home or user_home == '/':
    user_home = '/home/u325294696'
for py_ver in ['3.6', '3.7', '3.8', '3.9', '3.10', '3.11']:
    site_path = os.path.join(user_home, '.local', 'lib', f'python{py_ver}', 'site-packages')
    if os.path.exists(site_path) and site_path not in sys.path:
        sys.path.insert(0, site_path)

sys.stderr.write(f"[PYTHON DEBUG] Path: {sys.path}\n")
sys.stderr.flush()

# Habilita suporte a MySQL nativo via PyMySQL
try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

from flask import Flask, request, jsonify, render_template, redirect, url_for, flash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.utils import secure_filename
from models import db, User, Character, Status, Attributes, Lobby, xp_to_level, XP_LEVELS
import json

app = Flask(__name__)
# Use environment variable for production, fallback for dev
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'chave_secreta_jujutsu_rpg_super_segura_dev')
base_dir = os.path.abspath(os.path.dirname(__file__))
_default_db = 'sqlite:///' + os.path.join(base_dir, 'database.db')
db_url = os.environ.get('DATABASE_URL', _default_db)
if db_url.startswith('postgres://'):
    db_url = db_url.replace('postgres://', 'postgresql://', 1)
elif db_url.startswith('mysql://'):
    db_url = db_url.replace('mysql://', 'mysql+pymysql://', 1)

if db_url.startswith('mysql+pymysql://'):
    if ('localhost' in db_url or '127.0.0.1' in db_url) and 'unix_socket' not in db_url:
        possible_sockets = [
            '/var/lib/mysql/mysql.sock',
            '/var/run/mysqld/mysqld.sock',
            '/tmp/mysql.sock'
        ]
        for socket_path in possible_sockets:
            if os.path.exists(socket_path):
                separator = '&' if '?' in db_url else '?'
                db_url += f"{separator}unix_socket={socket_path}"
                sys.stderr.write(f"[PYTHON DEBUG] Unix Socket MySQL detectado e ativado: {socket_path}\n")
                sys.stderr.flush()
                break

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(base_dir, 'static', 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

def _gen_lobby_code(length=6):
    """Gera um código único de lobby (e.g. 'KUROI1')."""
    chars = string.ascii_uppercase + string.digits
    while True:
        code = ''.join(random.choices(chars, k=length))
        if not Lobby.query.filter_by(codigo=code).first():
            return code

db.init_app(app)

login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Create tables + run migrations before first request
with app.app_context():
    db.create_all()
    
    # Auto-seed: se nao houver nenhum usuario, cria o usuario mestre padrao
    try:
        mestre = User.query.filter_by(username='mestre').first()
        if not mestre:
            mestre = User(username='mestre', role='Mestre')
            mestre.set_password('mestre123')
            db.session.add(mestre)
            db.session.commit()
            print("[INFO] Banco de dados auto-semeado: usuario 'mestre' / senha 'mestre123' criado.")
        elif mestre.password_hash.startswith('scrypt:'):
            # Se o hash for scrypt (gerado no PC local com Python 3.10+), recria usando pbkdf2:sha256 para Python 3.6
            print("[INFO] Corrigindo hash do mestre de scrypt para pbkdf2:sha256...")
            mestre.set_password('mestre123')
            db.session.commit()
            print("[INFO] Hash do mestre corrigido com sucesso.")
    except Exception as e:
        print("Erro ao semear/corrigir banco de dados:", e)

    # Migrações automáticas genéricas (compatível com SQLite, MySQL e outros bancos)
    try:
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        
        # ── characters table migrations ──
        if 'characters' in inspector.get_table_names():
            columns = [c['name'] for c in inspector.get_columns('characters')]
            for col, col_type in {
                'resistencias': "TEXT",
                'rds': "TEXT",
                'habilidades_talentos': "TEXT",
                'dados_vida': "TEXT",
                'anotacoes': "TEXT",
                'caracteristicas': "TEXT",
                'configuracoes': "TEXT",
                'dominio': "TEXT",
                'recent_logs': "TEXT",
                'pontos_atributos': "INTEGER",
                'peso': "TEXT",
                'altura': "TEXT",
                'afiliacao': "TEXT",
                'votos_ativos': "TEXT"
            }.items():
                if col not in columns:
                    sql_type = col_type
                    # SQLite exige valores padrão específicos para ADD COLUMN se as colunas forem NOT NULL ou por consistência
                    if db.engine.name == 'sqlite':
                        if col in ['resistencias', 'rds', 'configuracoes', 'dominio']:
                            sql_type += " DEFAULT '{}'"
                        elif col in ['habilidades_talentos', 'caracteristicas', 'recent_logs']:
                            sql_type += " DEFAULT '[]'"
                        elif col == 'anotacoes':
                            sql_type += " DEFAULT ''"
                        elif col == 'pontos_atributos':
                            sql_type += " DEFAULT 0"
                        elif col == 'peso':
                            sql_type += " DEFAULT '72kg'"
                        elif col == 'altura':
                            sql_type += " DEFAULT '1.82m'"
                        elif col == 'afiliacao':
                            sql_type += " DEFAULT 'Colégio Técnico de Jujutsu'"
                        elif col == 'votos_ativos':
                            sql_type += " DEFAULT 'Revelação da Técnica (+2 CD Feitiços)'"
                    
                    db.session.execute(f"ALTER TABLE characters ADD COLUMN {col} {sql_type}")
            db.session.commit()

        # ── users table migrations ──
        if 'users' in inspector.get_table_names():
            columns = [c['name'] for c in inspector.get_columns('users')]
            if 'lobby_id' not in columns:
                db.session.execute("ALTER TABLE users ADD COLUMN lobby_id INTEGER REFERENCES lobbies(id)")
                db.session.commit()
    except Exception as e:
        print("Erro durante a migracao automatica genérica:", e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('lobby'))
        
    if request.method == 'POST':
        # Handles both JSON and Form data for flexibility
        data = request.get_json() if request.is_json else request.form
        username = data.get('username')
        password = data.get('password')
        
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            if request.is_json:
                return jsonify({'message': 'Logged in successfully', 'redirect': url_for('lobby')})
            return redirect(url_for('lobby'))
            
        if request.is_json:
            return jsonify({'error': 'Invalid username or password'}), 401
        flash('Invalid username or password')
        
    # In case there's no template yet, return a simple JSON response or render
    try:
        return render_template('login.html')
    except:
        return jsonify({'message': 'Login Endpoint. Use POST with username and password'})

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('lobby'))
        
    if request.method == 'POST':
        data = request.get_json() if request.is_json else request.form
        username = data.get('username')
        password = data.get('password')
        role = data.get('role', 'Jogador') # 'Mestre' or 'Jogador'
        
        if User.query.filter_by(username=username).first():
            if request.is_json:
                return jsonify({'error': 'Username already exists'}), 400
            flash('Username already exists')
            return redirect(url_for('register'))
            
        new_user = User(username=username, role=role)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        
        if request.is_json:
            return jsonify({'message': 'User registered successfully'}), 201
        flash('Registration successful. Please log in.')
        return redirect(url_for('login'))
        
    try:
        return render_template('register.html')
    except:
        return jsonify({'message': 'Register Endpoint. Use POST with username, password, and role'})

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))

# ═══════════════════════════════════════════════════════════════════
# LOBBY MANAGEMENT ROUTES
# ═══════════════════════════════════════════════════════════════════

@app.route('/lobby/criar', methods=['POST'])
@login_required
def lobby_criar():
    """Mestre cria um novo lobby."""
    if current_user.role != 'Mestre':
        return jsonify({'error': 'Apenas Mestres podem criar lobbies.'}), 403
    data = request.get_json() or {}
    nome = data.get('nome', 'Domínio do Mestre').strip() or 'Domínio do Mestre'
    # Remove mestre do lobby anterior se houver
    current_user.lobby_id = None
    db.session.flush()
    codigo = _gen_lobby_code()
    lobby = Lobby(nome=nome, codigo=codigo, master_id=current_user.id)
    db.session.add(lobby)
    db.session.flush()  # get lobby.id
    current_user.lobby_id = lobby.id
    db.session.commit()
    return jsonify({'ok': True, 'lobby': lobby.to_dict(), 'codigo': codigo})


@app.route('/lobby/entrar', methods=['POST'])
@login_required
def lobby_entrar():
    """Jogador entra em lobby via código."""
    data = request.get_json() or {}
    codigo = (data.get('codigo') or '').strip().upper()
    if not codigo:
        return jsonify({'error': 'Código obrigatório.'}), 400
    lobby = Lobby.query.filter_by(codigo=codigo, ativo=True).first()
    if not lobby:
        return jsonify({'error': 'Lobby não encontrado. Verifique o código.'}), 404
    if current_user.lobby_id == lobby.id:
        return jsonify({'ok': True, 'already': True, 'lobby': lobby.to_dict()})
    if current_user.lobby_id is not None:
        return jsonify({'error': 'Você já está em outro lobby. Saia primeiro.'}), 409
    current_user.lobby_id = lobby.id
    db.session.commit()
    return jsonify({'ok': True, 'lobby': lobby.to_dict()})


@app.route('/lobby/sair', methods=['POST'])
@login_required
def lobby_sair():
    """Player sai do lobby atual."""
    if not current_user.lobby_id:
        return jsonify({'error': 'Você não está em nenhum lobby.'}), 400
    lobby = Lobby.query.get(current_user.lobby_id)
    # Se o mestre que sai e não tem mais membros, fecha o lobby
    if lobby and lobby.master_id == current_user.id:
        # Kick all members first
        for member in lobby.membros.all():
            member.lobby_id = None
        lobby.ativo = False
    current_user.lobby_id = None
    db.session.commit()
    return jsonify({'ok': True})


@app.route('/lobby/kick/<int:user_id>', methods=['POST'])
@login_required
def lobby_kick(user_id):
    """Mestre remove jogador do lobby."""
    if current_user.role != 'Mestre':
        return jsonify({'error': 'Apenas Mestres podem remover jogadores.'}), 403
    if not current_user.lobby_id:
        return jsonify({'error': 'Você não está em nenhum lobby.'}), 400
    lobby = Lobby.query.get(current_user.lobby_id)
    if not lobby or lobby.master_id != current_user.id:
        return jsonify({'error': 'Não autorizado.'}), 403
    target = User.query.get_or_404(user_id)
    if target.lobby_id != current_user.lobby_id:
        return jsonify({'error': 'Jogador não está no seu lobby.'}), 404
    if target.id == current_user.id:
        return jsonify({'error': 'Mestre não pode se remover. Use Fechar Lobby.'}), 400
    target.lobby_id = None
    db.session.commit()
    return jsonify({'ok': True, 'kicked_user': target.username})


@app.route('/lobby/add', methods=['POST'])
@login_required
def lobby_add():
    """Mestre adiciona jogador ao lobby pelo username."""
    if current_user.role != 'Mestre':
        return jsonify({'error': 'Apenas Mestres podem adicionar jogadores.'}), 403
    if not current_user.lobby_id:
        return jsonify({'error': 'Você não está em nenhum lobby.'}), 400
    lobby = Lobby.query.get(current_user.lobby_id)
    if not lobby or lobby.master_id != current_user.id:
        return jsonify({'error': 'Não autorizado.'}), 403
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    target = User.query.filter_by(username=username).first()
    if not target:
        return jsonify({'error': f'Usuário "{username}" não encontrado.'}), 404
    if target.lobby_id is not None and target.lobby_id != current_user.lobby_id:
        return jsonify({'error': f'{username} já está em outro lobby.'}), 409
    target.lobby_id = current_user.lobby_id
    db.session.commit()
    return jsonify({'ok': True, 'added_user': target.username})


@app.route('/lobby/fechar', methods=['POST'])
@login_required
def lobby_fechar():
    """Mestre fecha/exclui o lobby atual."""
    if current_user.role != 'Mestre':
        return jsonify({'error': 'Apenas Mestres podem fechar lobbies.'}), 403
    if not current_user.lobby_id:
        return jsonify({'error': 'Você não está em nenhum lobby.'}), 400
    lobby = Lobby.query.get(current_user.lobby_id)
    if not lobby or lobby.master_id != current_user.id:
        return jsonify({'error': 'Não autorizado.'}), 403
    for member in lobby.membros.all():
        member.lobby_id = None
    lobby.ativo = False
    db.session.commit()
    return jsonify({'ok': True})


@app.route('/api/lobby_status')
@login_required
def api_lobby_status():
    """Retorna o estado atual do lobby do usuário (para polling JS)."""
    if not current_user.lobby_id:
        return jsonify({'in_lobby': False})
    lobby = Lobby.query.get(current_user.lobby_id)
    if not lobby or not lobby.ativo:
        current_user.lobby_id = None
        db.session.commit()
        return jsonify({'in_lobby': False, 'reason': 'Lobby foi fechado.'})
    membros = []
    for u in lobby.membros.all():
        char = Character.query.filter_by(user_id=u.id).first()
        membros.append({
            'user_id': u.id,
            'username': u.username,
            'is_master': u.id == lobby.master_id,
            'char_id': char.id if char else None,
            'char_nome': char.nome if char else None
        })
    return jsonify({
        'in_lobby': True,
        'lobby': lobby.to_dict(),
        'is_master': current_user.id == lobby.master_id,
        'membros': membros
    })


@app.route('/api/dar_xp/<int:char_id>', methods=['POST'])
@login_required
def dar_xp(char_id):
    """Mestre dá XP a um personagem. Auto-calcula o nível."""
    if current_user.role != 'Mestre':
        return jsonify({'error': 'Apenas Mestres podem dar XP.'}), 403
    char = Character.query.get_or_404(char_id)
    data = request.get_json() or {}
    quantidade = int(data.get('quantidade', 0))
    if quantidade == 0:
        return jsonify({'error': 'Quantidade de XP inválida.'}), 400
    old_level = char.nivel or 1
    char.xp = max(0, (char.xp or 0) + quantidade)
    new_level = xp_to_level(char.xp)
    level_up = new_level > old_level
    if new_level != old_level:
        old_pv_max = char.status.pv_max if char.status else 10
        old_pe_max = char.status.pe_max if char.status else 0
        
        char.nivel = new_level
        
        if level_up:
            level_diff = new_level - old_level
            char.pontos_atributos = (char.pontos_atributos or 0) + (level_diff * 2)
            
        if char.status:
            scale_current_status_proportionally(char, old_pv_max, old_pe_max)
            
    db.session.commit()
    # Log the XP grant
    try:
        logs = json.loads(char.recent_logs or '[]')
        sign = '+' if quantidade >= 0 else ''
        msg = f'✨ {sign}{quantidade} XP recebido'
        if level_up:
            msg += f' → LEVEL UP! Nível {new_level}! 🎉'
        logs.insert(0, {
            'type': 'xp',
            'title': '⭐ XP pelo Mestre',
            'content': msg,
            'timestamp': time.strftime('%H:%M')
        })
        char.recent_logs = json.dumps(logs[:20])
        db.session.commit()
    except:
        pass
    return jsonify({
        'ok': True,
        'xp_total': char.xp,
        'nivel': char.nivel,
        'level_up': level_up,
        'old_level': old_level,
        'new_level': new_level,
        'char_nome': char.nome
    })


# ═══════════════════════════════════════════════════════════════════
# LOBBY VIEW
# ═══════════════════════════════════════════════════════════════════

@app.route('/lobby', methods=['GET'])
@login_required
def lobby():
    # If user is not in a lobby, show entry screen
    if not current_user.lobby_id:
        if request.headers.get('Accept') == 'application/json' or request.args.get('format') == 'json':
            return jsonify({'in_lobby': False})
        return render_template('lobby_entry.html')

    lobby_obj = Lobby.query.get(current_user.lobby_id)
    if not lobby_obj or not lobby_obj.ativo:
        current_user.lobby_id = None
        db.session.commit()
        return render_template('lobby_entry.html')

    # Show only characters belonging to users in this lobby
    lobby_user_ids = [u.id for u in lobby_obj.membros.all()]
    characters_objs = Character.query.filter(Character.user_id.in_(lobby_user_ids)).all()
    char_data = []
    for char in characters_objs:
        def _mod(v): return (v - 10) // 2
        attrs = char.attributes
        forca        = attrs.forca        if attrs else 10
        destreza     = attrs.destreza     if attrs else 10
        constituicao = attrs.constituicao if attrs else 10
        inteligencia = attrs.inteligencia if attrs else 10
        sabedoria    = attrs.sabedoria    if attrs else 10
        presenca     = attrs.presenca     if attrs else 10
        char_data.append({
            'id': char.id,
            'nome': char.nome,
            'imagem_url': char.imagem_url,
            'grau': char.grau,
            'nivel': char.nivel,
            'xp': char.xp or 0,
            'especializacao': char.especializacao,
            'user_id': char.user_id,
            'pv_atual':          char.status.pv_atual          if char.status else 0,
            'pv_max':            char.status.pv_max             if char.status else 0,
            'pe_atual':          char.status.pe_atual           if char.status else 0,
            'pe_max':            char.status.pe_max             if char.status else 0,
            'integridade_atual': char.status.integridade_atual  if char.status else 0,
            'integridade_max':   char.status.integridade_max    if char.status else 0,
            'estado_alma':       char.status.estado_alma        if char.status else 'Desconhecido',
            'cor_energia':       char.cor_energia,
            'ataques':           json.loads(char.ataques           or '[]'),
            'feiticos':          json.loads(char.feiticos          or '[]'),
            'habilidades_talentos': json.loads(char.habilidades_talentos or '[]'),
            'recent_logs':       json.loads(char.recent_logs       or '[]'),
            'attributes': {
                'forca': forca, 'destreza': destreza, 'constituicao': constituicao,
                'inteligencia': inteligencia, 'sabedoria': sabedoria, 'presenca': presenca
            },
            'mods': {
                'forca': _mod(forca), 'destreza': _mod(destreza), 'constituicao': _mod(constituicao),
                'inteligencia': _mod(inteligencia), 'sabedoria': _mod(sabedoria), 'presenca': _mod(presenca)
            }
        })

    if request.headers.get('Accept') == 'application/json' or request.args.get('format') == 'json':
        return jsonify(char_data)

    is_master = (current_user.id == lobby_obj.master_id)
    members_list = []
    for u in lobby_obj.membros.all():
        ch = Character.query.filter_by(user_id=u.id).first()
        members_list.append({
            'user_id':   u.id,
            'username':  u.username,
            'is_master': u.id == lobby_obj.master_id,
            'char_id':   ch.id    if ch else None,
            'char_nome': ch.nome  if ch else '—',
            'char_nivel': ch.nivel if ch else 1,
            'char_xp':   ch.xp    if ch else 0,
        })

    return render_template(
        'lobby.html',
        characters=char_data,
        lobby=lobby_obj,
        is_master=is_master,
        members=members_list,
        current_user_id=current_user.id,
        lobby_codigo=lobby_obj.codigo
    )



@app.route('/create_character', methods=['GET', 'POST'])
@login_required
def create_character():
    if request.method == 'POST':
        nome = request.form.get('nome')
        origem = request.form.get('origem')
        especializacao = request.form.get('especializacao')
        peso = request.form.get('peso', '72kg')
        altura = request.form.get('altura', '1.82m')
        afiliacao = request.form.get('afiliacao', 'Colégio Técnico de Jujutsu')
        votos_ativos = request.form.get('votos_ativos', 'Revelação da Técnica (+2 CD Feitiços)')
        
        new_char = Character(
            user_id=current_user.id,
            nome=nome,
            origem=origem,
            especializacao=especializacao,
            peso=peso,
            altura=altura,
            afiliacao=afiliacao,
            votos_ativos=votos_ativos
        )
        db.session.add(new_char)
        db.session.commit()
        
        new_status = Status(character_id=new_char.id)
        new_attr = Attributes(
            character_id=new_char.id,
            forca=int(request.form.get('forca', 10)),
            destreza=int(request.form.get('destreza', 10)),
            constituicao=int(request.form.get('constituicao', 10)),
            inteligencia=int(request.form.get('inteligencia', 10)),
            sabedoria=int(request.form.get('sabedoria', 10)),
            presenca=int(request.form.get('presenca', 10))
        )
        db.session.add(new_status)
        db.session.add(new_attr)
        db.session.commit()
        
        # Heals character to math PV/PE computed properties after attributes are set
        new_status.pv_atual = new_status.pv_max
        new_status.pe_atual = new_status.pe_max
        new_status.integridade_atual = new_status.integridade_max
        db.session.commit()
        
        return redirect(url_for('lobby'))
        
    return render_template('create_character.html')

@app.route('/ficha/<int:character_id>', methods=['GET'])
@login_required
def ficha(character_id):
    char = Character.query.get_or_404(character_id)
    
    # Jogador can only see their own character
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        if request.headers.get('Accept') == 'application/json' or request.args.get('format') == 'json':
            return jsonify({'error': 'Unauthorized'}), 403
        flash('Você não tem permissão para acessar esta ficha.')
        return redirect(url_for('lobby'))
        
    char_data = {
        'id': char.id,
        'nome': char.nome,
        'origem': char.origem,
        'especializacao': char.especializacao,
        'grau': char.grau,
        'nivel': char.nivel,
        'xp': char.xp,
        'imagem_url': char.imagem_url,
        'cor_energia': char.cor_energia,
        'resistencias': json.loads(char.resistencias or '{}'),
        'rds': json.loads(char.rds or '{}'),
        'habilidades_talentos': json.loads(char.habilidades_talentos or '[]'),
        'dados_vida': json.loads(char.dados_vida or '{}'),
        'anotacoes': char.anotacoes or '',
        'caracteristicas': json.loads(char.caracteristicas or '[]'),
        'configuracoes': json.loads(char.configuracoes or '{}'),
        'iniciativa': char.iniciativa,
        'atencao_passiva': char.atencao_passiva,
        'cd_especializacao': char.cd_especializacao,
        'training_bonus': char.training_bonus,
        'half_level': char.half_level,
        'status': {
            'pv_atual': char.status.pv_atual if char.status else 0,
            'pv_max': char.status.pv_max if char.status else 0,
            'pe_atual': char.status.pe_atual if char.status else 0,
            'pe_max': char.status.pe_max if char.status else 0,
            'integridade_atual': char.status.integridade_atual if char.status else 0,
            'integridade_max': char.status.integridade_max if char.status else 0,
            'estado_alma': char.status.estado_alma if char.status else 'Desconhecido',
            'falhas_morte': char.status.falhas_morte if char.status else 0,
            'sucessos_morte': char.status.sucessos_morte if char.status else 0,
            'defesa': char.status.defesa if char.status else 0
        },
        'attributes': {
            'forca': char.attributes.forca if char.attributes else 0,
            'destreza': char.attributes.destreza if char.attributes else 0,
            'constituicao': char.attributes.constituicao if char.attributes else 0,
            'inteligencia': char.attributes.inteligencia if char.attributes else 0,
            'sabedoria': char.attributes.sabedoria if char.attributes else 0,
            'presenca': char.attributes.presenca if char.attributes else 0
        }
    }
    
    if request.headers.get('Accept') == 'application/json' or request.args.get('format') == 'json':
        return jsonify(get_character_json(char))
        
    try:
        return render_template('ficha.html', character=char)
    except Exception as e:
        print("Erro ao renderizar ficha.html, fallback para JSON:", e)
        return jsonify(char_data)

@app.route('/api/update_status/<int:character_id>', methods=['POST'])
@login_required
def update_status(character_id):
    char = Character.query.get_or_404(character_id)
    
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    if not data or not char.status:
        return jsonify({'error': 'Invalid data or character has no status initialized'}), 400
        
    if 'pv_delta' in data:
        char.status.pv_atual = max(0, min(char.status.pv_max, char.status.pv_atual + data['pv_delta']))
    
    if 'pe_delta' in data:
        char.status.pe_atual = max(0, min(char.status.pe_max, char.status.pe_atual + data['pe_delta']))
        
    if 'integridade_delta' in data:
        char.status.integridade_atual = max(0, min(char.status.integridade_max, char.status.integridade_atual + data['integridade_delta']))
        
    if 'falhas_delta' in data:
        char.status.falhas_morte += data['falhas_delta']
        
    if 'sucessos_delta' in data:
        char.status.sucessos_morte += data['sucessos_delta']
        
    db.session.commit()
    
    return jsonify({
        'message': 'Status updated successfully',
        'character': get_character_json(char)
    })

@app.route('/api/update_energy_color/<int:character_id>', methods=['POST'])
@login_required
def update_energy_color(character_id):
    if current_user.role != 'Mestre':
        return jsonify({'error': 'Unauthorized. Only Mestre can change energy color.'}), 403
        
    char = Character.query.get_or_404(character_id)
    data = request.get_json()
    
    if not data or 'cor_energia' not in data:
        return jsonify({'error': 'Invalid data. Please provide cor_energia.'}), 400
        
    char.cor_energia = data['cor_energia']
    db.session.commit()
    
    return jsonify({
        'message': 'Energy color updated successfully',
        'cor_energia': char.cor_energia
    })

@app.route('/api/update_attributes/<int:character_id>', methods=['POST'])
@login_required
def update_attributes(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role != 'Mestre':
        return jsonify({'error': 'Apenas o Mestre pode alterar atributos livremente.'}), 403
        
    data = request.get_json()
    if not data or 'attr' not in data or 'delta' not in data:
        return jsonify({'error': 'Invalid data'}), 400
        
    attr_map = {
        'forca': 'forca',
        'destreza': 'destreza',
        'constituicao': 'constituicao',
        'inteligencia': 'inteligencia',
        'sabedoria': 'sabedoria',
        'presenca': 'presenca'
    }
    
    attr = data['attr']
    if attr in attr_map:
        field = attr_map[attr]
        
        old_pv_max = char.status.pv_max if char.status else 10
        old_pe_max = char.status.pe_max if char.status else 0
        
        current_val = getattr(char.attributes, field)
        setattr(char.attributes, field, max(1, current_val + data['delta']))
        
        if char.status:
            scale_current_status_proportionally(char, old_pv_max, old_pe_max)
            
        db.session.commit()
        return jsonify({
            'message': 'Attribute updated', 
            'new_val': getattr(char.attributes, field), 
            'attr': attr,
            'character': get_character_json(char)
        })
        
    return jsonify({'error': 'Invalid attribute'}), 400

@app.route('/api/confirm_attributes/<int:character_id>', methods=['POST'])
@login_required
def confirm_attributes(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Você não tem permissão para editar este personagem.'}), 403
        
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Dados inválidos'}), 400
        
    attrs_keys = ['forca', 'destreza', 'constituicao', 'inteligencia', 'sabedoria', 'presenca']
    proposed = {}
    for key in attrs_keys:
        if key not in data:
            return jsonify({'error': f'Atributo "{key}" ausente nos dados de envio.'}), 400
        try:
            proposed[key] = int(data[key])
        except (ValueError, TypeError):
            return jsonify({'error': f'Valor inválido para o atributo "{key}".'}), 400
            
    total_cost = 0
    for key in attrs_keys:
        db_val = getattr(char.attributes, key)
        new_val = proposed[key]
        if new_val < db_val:
            return jsonify({'error': f'Não é permitido diminuir atributos após confirmar (Atributo {key}: banco={db_val}, enviado={new_val}).'}), 400
        total_cost += (new_val - db_val)
        
    if total_cost == 0:
        return jsonify({'error': 'Nenhum ponto foi distribuído.'}), 400
        
    if total_cost > (char.pontos_atributos or 0):
        return jsonify({'error': f'Você está tentando gastar {total_cost} pontos, mas só possui {char.pontos_atributos or 0} disponíveis.'}), 400
        
    old_pv_max = char.status.pv_max if char.status else 10
    old_pe_max = char.status.pe_max if char.status else 0
    
    for key in attrs_keys:
        setattr(char.attributes, key, proposed[key])
        
    char.pontos_atributos = max(0, (char.pontos_atributos or 0) - total_cost)
    
    if char.status:
        scale_current_status_proportionally(char, old_pv_max, old_pe_max)
        
    try:
        logs = json.loads(char.recent_logs or '[]')
        msg = f'💪 Evolução confirmada: +{total_cost} pontos distribuídos!'
        logs.insert(0, {
            'type': 'evolution',
            'title': '⚡ Evolução de Atributos',
            'content': msg,
            'timestamp': time.strftime('%H:%M')
        })
        char.recent_logs = json.dumps(logs[:20])
    except Exception as e:
        print("Erro ao adicionar log de evolução:", e)
        
    db.session.commit()
    
    return jsonify({
        'message': 'Evolução realizada com sucesso!',
        'character': get_character_json(char)
    })

@app.route('/api/get_inventory/<int:character_id>')
@login_required
def get_inventory(character_id):
    char = Character.query.get_or_404(character_id)
    return jsonify(json.loads(char.inventario or '[]'))

@app.route('/api/add_item/<int:character_id>', methods=['POST'])
@login_required
def add_item(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    inventory = json.loads(char.inventario or '[]')
    
    new_item = {
        'id': len(inventory) + 1,
        'nome': data.get('nome', 'Item Sem Nome'),
        'qtd': int(data.get('qtd', 1)),
        'peso': float(data.get('peso', 0.0))
    }
    
    inventory.append(new_item)
    char.inventario = json.dumps(inventory)
    db.session.commit()
    
    return jsonify(inventory)

@app.route('/api/delete_item/<int:character_id>/<int:item_id>', methods=['DELETE'])
@login_required
def delete_item(character_id, item_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    inventory = json.loads(char.inventario or '[]')
    inventory = [item for item in inventory if item['id'] != item_id]
    
    char.inventario = json.dumps(inventory)
    db.session.commit()
    
    return jsonify(inventory)

@app.route('/api/update_item/<int:character_id>/<int:item_id>', methods=['POST'])
@login_required
def update_item(character_id, item_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    inventory = json.loads(char.inventario or '[]')
    
    for item in inventory:
        if item['id'] == item_id:
            if 'nome' in data: item['nome'] = data['nome']
            if 'qtd' in data: item['qtd'] = int(data['qtd'])
            if 'peso' in data: item['peso'] = float(data['peso'])
            break
            
    char.inventario = json.dumps(inventory)
    db.session.commit()
    return jsonify(inventory)

@app.route('/api/update_character_basics/<int:character_id>', methods=['POST'])
@login_required
def update_character_basics(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid data'}), 400
        
    recalc_hp_pe = False
    if 'nome' in data:
        char.nome = data['nome']
    if 'nivel' in data and int(data['nivel']) != char.nivel:
        char.nivel = int(data['nivel'])
        recalc_hp_pe = True
    if 'xp' in data:
        char.xp = int(data['xp'])
    if 'grau' in data:
        char.grau = data['grau']
    if 'origem' in data and data['origem'] != char.origem:
        char.origem = data['origem']
        recalc_hp_pe = True
    if 'especializacao' in data and data['especializacao'] != char.especializacao:
        char.especializacao = data['especializacao']
        recalc_hp_pe = True
    if 'cor_energia' in data:
        char.cor_energia = data['cor_energia']
    if 'imagem_url' in data:
        char.imagem_url = data['imagem_url']

    # Campos de Registro Físico
    if 'peso' in data:
        char.peso = data['peso']
    if 'altura' in data:
        char.altura = data['altura']
    if 'afiliacao' in data:
        char.afiliacao = data['afiliacao']
    if 'votos_ativos' in data:
        char.votos_ativos = data['votos_ativos']
        
    # Recalculates HP and PE only if basic stats affecting properties were changed
    if recalc_hp_pe and char.status:
        char.status.pv_atual = char.status.pv_max
        char.status.pe_atual = char.status.pe_max
        char.status.integridade_atual = char.status.integridade_max
        
    db.session.commit()
    
    return jsonify({
        'message': 'Basics updated successfully',
        'character': get_character_json(char)
    })

@app.route('/api/get_pericias/<int:character_id>')
@login_required
def get_pericias(character_id):
    char = Character.query.get_or_404(character_id)
    if not char.pericias or char.pericias in ['{}', '[]']:
        # This will initialize default pericias for this char
        char.__init__(nome=char.nome, user_id=char.user_id)
        db.session.commit()
    return jsonify(json.loads(char.pericias))

@app.route('/api/update_pericias/<int:character_id>', methods=['POST'])
@login_required
def update_pericias(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    if not data or 'nome' not in data:
        return jsonify({'error': 'Invalid data'}), 400
        
    pericias = json.loads(char.pericias or '{}')
    p_name = data['nome']
    
    if p_name in pericias:
        if 'treinada' in data:
            pericias[p_name]['treinada'] = bool(data['treinada'])
        if 'mestre' in data:
            pericias[p_name]['mestre'] = bool(data['mestre'])
        if 'bonus' in data:
            pericias[p_name]['bonus'] = int(data['bonus'])
            
        char.pericias = json.dumps(pericias)
        db.session.commit()
        return jsonify({
            'pericias': pericias,
            'character': get_character_json(char)
        })
        
    return jsonify({'error': 'Skill not found'}), 404

@app.route('/api/get_attacks/<int:character_id>')
@login_required
def get_attacks(character_id):
    char = Character.query.get_or_404(character_id)
    return jsonify(json.loads(char.ataques or '[]'))

@app.route('/api/add_attack/<int:character_id>', methods=['POST'])
@login_required
def add_attack(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    attacks = json.loads(char.ataques or '[]')
    
    new_attack = {
        'id': len(attacks) + 1,
        'nome': data.get('nome', 'Golpe Sem Nome'),
        'pericia': data.get('pericia', 'Luta'), # e.g. Luta, Pontaria, Feitiçaria, or Atributo Puro
        'dano_dados': data.get('dano_dados', '1d6'),
        'dano_attr': data.get('dano_attr', 'forca'), # forca, destreza, none
        'bonus_acerto': int(data.get('bonus_acerto', 0)),
        'bonus_dano': int(data.get('bonus_dano', 0)),
        'critico': data.get('critico', '20 / x2'),
        'alcance': data.get('alcance', 'Corpo a Corpo'),
        'tipo': data.get('tipo', 'Impacto')
    }
    
    attacks.append(new_attack)
    char.ataques = json.dumps(attacks)
    db.session.commit()
    
    return jsonify(attacks)

@app.route('/api/delete_attack/<int:character_id>/<int:attack_id>', methods=['DELETE'])
@login_required
def delete_attack(character_id, attack_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    attacks = json.loads(char.ataques or '[]')
    attacks = [a for a in attacks if a['id'] != attack_id]
    
    char.ataques = json.dumps(attacks)
    db.session.commit()
    
    return jsonify(attacks)

@app.route('/api/get_spells/<int:character_id>')
@login_required
def get_spells(character_id):
    char = Character.query.get_or_404(character_id)
    return jsonify(json.loads(char.feiticos or '[]'))

@app.route('/api/add_spell/<int:character_id>', methods=['POST'])
@login_required
def add_spell(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    spells = json.loads(char.feiticos or '[]')
    
    new_spell = {
        'id': len(spells) + 1,
        'nivel': int(data.get('nivel', 1)),
        'nome': data.get('nome', 'Feitiço Sem Nome'),
        'custo': int(data.get('custo', 2)),
        'acao': data.get('acao', 'Padrão'),
        'alcance': data.get('alcance', 'Pessoal'),
        'duracao': data.get('duracao', 'Instantânea'),
        'dano': data.get('dano', '3d8'),
        'descricao': data.get('descricao', '')
    }
    
    spells.append(new_spell)
    char.feiticos = json.dumps(spells)
    db.session.commit()
    
    return jsonify(spells)

@app.route('/api/delete_spell/<int:character_id>/<int:spell_id>', methods=['DELETE'])
@login_required
def delete_spell(character_id, spell_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    spells = json.loads(char.feiticos or '[]')
    spells = [s for s in spells if s['id'] != spell_id]
    
    char.feiticos = json.dumps(spells)
    db.session.commit()
    
    return jsonify(spells)

@app.route('/api/get_summons/<int:character_id>')
@login_required
def get_summons(character_id):
    char = Character.query.get_or_404(character_id)
    return jsonify(json.loads(char.invocacoes or '[]'))

@app.route('/api/add_summon/<int:character_id>', methods=['POST'])
@login_required
def add_summon(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    summons = json.loads(char.invocacoes or '[]')
    
    new_summon = {
        'id': len(summons) + 1,
        'nome': data.get('nome', 'Novo Shikigami'),
        'hp_atual': int(data.get('hp_max', 10)),
        'hp_max': int(data.get('hp_max', 10)),
        'pe_atual': int(data.get('pe_max', 5)),
        'pe_max': int(data.get('pe_max', 5)),
        'ataque': data.get('ataque', '1d6+2'),
        'defesa': int(data.get('defesa', 12)),
        'desc': data.get('desc', '')
    }
    
    summons.append(new_summon)
    char.invocacoes = json.dumps(summons)
    db.session.commit()
    
    return jsonify(summons)

@app.route('/api/update_summon/<int:character_id>/<int:summon_id>', methods=['POST'])
@login_required
def update_summon(character_id, summon_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    summons = json.loads(char.invocacoes or '[]')
    
    for s in summons:
        if s['id'] == summon_id:
            if 'nome' in data: s['nome'] = data['nome']
            if 'hp_atual' in data: s['hp_atual'] = int(data['hp_atual'])
            if 'hp_max' in data: s['hp_max'] = int(data['hp_max'])
            if 'pe_atual' in data: s['pe_atual'] = int(data['pe_atual'])
            if 'pe_max' in data: s['pe_max'] = int(data['pe_max'])
            if 'ataque' in data: s['ataque'] = data['ataque']
            if 'defesa' in data: s['defesa'] = int(data['defesa'])
            if 'desc' in data: s['desc'] = data['desc']
            break
            
    char.invocacoes = json.dumps(summons)
    db.session.commit()
    return jsonify(summons)

@app.route('/api/delete_summon/<int:character_id>/<int:summon_id>', methods=['DELETE'])
@login_required
def delete_summon(character_id, summon_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    summons = json.loads(char.invocacoes or '[]')
    summons = [s for s in summons if s['id'] != summon_id]
    
    char.invocacoes = json.dumps(summons)
    db.session.commit()
    
    return jsonify(summons)

def scale_current_status_proportionally(char, old_pv_max, old_pe_max):
    """
    Recalculates char.status.pv_atual, pe_atual, and integridade_atual
    proportionally based on their new maximums, compared to the old maximums.
    """
    if not char.status:
        return
        
    old_pv_pct = char.status.pv_atual / old_pv_max if old_pv_max > 0 else 1.0
    old_pe_pct = char.status.pe_atual / old_pe_max if old_pe_max > 0 else 1.0
    
    db.session.flush()
    
    new_pv_max = char.status.pv_max
    new_pe_max = char.status.pe_max
    
    char.status.pv_atual = max(0, min(new_pv_max, int(round(old_pv_pct * new_pv_max))))
    char.status.pe_atual = max(0, min(new_pe_max, int(round(old_pe_pct * new_pe_max))))
    char.status.integridade_atual = max(0, min(new_pv_max, int(round(old_pv_pct * new_pv_max))))

def get_character_json(char):
    return {
        'id': char.id,
        'nome': char.nome,
        'origem': char.origem,
        'especializacao': char.especializacao,
        'grau': char.grau,
        'nivel': char.nivel,
        'xp': char.xp,
        'imagem_url': char.imagem_url,
        'cor_energia': char.cor_energia,
        'pontos_atributos': char.pontos_atributos or 0,
        'peso': char.peso or '72kg',
        'altura': char.altura or '1.82m',
        'afiliacao': char.afiliacao or 'Colégio Técnico de Jujutsu',
        'votos_ativos': char.votos_ativos or 'Revelação da Técnica (+2 CD Feitiços)',
        'pericias': json.loads(char.pericias or '{}'),
        'ataques': json.loads(char.ataques or '[]'),
        'resistencias': json.loads(char.resistencias or '{}'),
        'rds': json.loads(char.rds or '{}'),
        'habilidades_talentos': json.loads(char.habilidades_talentos or '[]'),
        'dados_vida': json.loads(char.dados_vida or '{}'),
        'anotacoes': char.anotacoes or '',
        'caracteristicas': json.loads(char.caracteristicas or '[]'),
        'configuracoes': json.loads(char.configuracoes or '{}'),
        'dominio': json.loads(char.dominio or '{}'),
        'iniciativa': char.iniciativa,
        'atencao_passiva': char.atencao_passiva,
        'cd_especializacao': char.cd_especializacao,
        'training_bonus': char.training_bonus,
        'half_level': char.half_level,
        'status': {
            'pv_atual': char.status.pv_atual if char.status else 0,
            'pv_max': char.status.pv_max if char.status else 0,
            'pe_atual': char.status.pe_atual if char.status else 0,
            'pe_max': char.status.pe_max if char.status else 0,
            'integridade_atual': char.status.integridade_atual if char.status else 0,
            'integridade_max': char.status.integridade_max if char.status else 0,
            'estado_alma': char.status.estado_alma if char.status else 'Desconhecido',
            'falhas_morte': char.status.falhas_morte if char.status else 0,
            'sucessos_morte': char.status.sucessos_morte if char.status else 0,
            'defesa': char.status.defesa if char.status else 0
        },
        'attributes': {
            'forca': char.attributes.forca if char.attributes else 0,
            'destreza': char.attributes.destreza if char.attributes else 0,
            'constituicao': char.attributes.constituicao if char.attributes else 0,
            'inteligencia': char.attributes.inteligencia if char.attributes else 0,
            'sabedoria': char.attributes.sabedoria if char.attributes else 0,
            'presenca': char.attributes.presenca if char.attributes else 0
        }
    }

def roll_dice(expression):
    import random
    import re
    expr = expression.strip().lower().replace(" ", "")
    match = re.match(r'^(\d*)d(\d+)([+-]\d+)?$', expr)
    if not match:
        return None, "Expressão inválida"
    
    num_dice = int(match.group(1)) if match.group(1) else 1
    faces = int(match.group(2))
    modifier = int(match.group(3)) if match.group(3) else 0
    
    rolls = [random.randint(1, faces) for _ in range(num_dice)]
    total = sum(rolls) + modifier
    
    rolls_str = " + ".join(map(str, rolls))
    if modifier > 0:
        rolls_str += f" + {modifier}"
    elif modifier < 0:
        rolls_str += f" - {abs(modifier)}"
        
    return total, f"({rolls_str}) = {total}"

@app.route('/api/update_resistencias/<int:character_id>', methods=['POST'])
@login_required
def update_resistencias(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    if not data or 'resistencias' not in data:
        return jsonify({'error': 'Invalid data'}), 400
    char.resistencias = json.dumps(data['resistencias'])
    db.session.commit()
    return jsonify({
        'message': 'Resistances updated successfully',
        'character': get_character_json(char)
    })

@app.route('/api/update_rds/<int:character_id>', methods=['POST'])
@login_required
def update_rds(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    if not data or 'rds' not in data:
        return jsonify({'error': 'Invalid data'}), 400
    char.rds = json.dumps(data['rds'])
    db.session.commit()
    return jsonify({
        'message': 'RDs updated successfully',
        'character': get_character_json(char)
    })

@app.route('/api/update_configuracoes/<int:character_id>', methods=['POST'])
@login_required
def update_configuracoes(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    if not data or 'configuracoes' not in data:
        return jsonify({'error': 'Invalid data'}), 400
    
    try:
        config = json.loads(char.configuracoes or '{}')
    except:
        config = {}
        
    config.update(data['configuracoes'])
    char.configuracoes = json.dumps(config)
    db.session.commit()
    return jsonify({
        'message': 'Configuracoes updated successfully',
        'character': get_character_json(char)
    })

@app.route('/api/update_dados_vida/<int:character_id>', methods=['POST'])
@login_required
def update_dados_vida(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    if not data or 'dados_vida' not in data:
        return jsonify({'error': 'Invalid data'}), 400
    char.dados_vida = json.dumps(data['dados_vida'])
    db.session.commit()
    return jsonify({
        'message': 'Dados de vida updated successfully',
        'character': get_character_json(char)
    })

@app.route('/api/update_anotacoes/<int:character_id>', methods=['POST'])
@login_required
def update_anotacoes(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json()
    if not data or 'anotacoes' not in data:
        return jsonify({'error': 'Invalid data'}), 400
    char.anotacoes = data['anotacoes']
    db.session.commit()
    return jsonify({
        'message': 'Anotacoes updated successfully',
        'character': get_character_json(char)
    })

@app.route('/api/add_talent/<int:character_id>', methods=['POST'])
@login_required
def add_talent(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json() or {}
    talents = json.loads(char.habilidades_talentos or '[]')
    
    new_talent = {
        'id': len(talents) + 1,
        'nome': data.get('nome', 'Novo Talento'),
        'tipo': data.get('tipo', 'Classe'),
        'custo': int(data.get('custo', 0)),
        'execucao': data.get('execucao', 'Ação Padrão'),
        'alcance': data.get('alcance', 'Pessoal'),
        'duracao': data.get('duracao', 'Instantânea'),
        'descricao': data.get('descricao', ''),
        'dado_rolagem': data.get('dado_rolagem', '')
    }
    
    talents.append(new_talent)
    char.habilidades_talentos = json.dumps(talents)
    db.session.commit()
    return jsonify(talents)

@app.route('/api/update_talent/<int:character_id>/<int:talent_id>', methods=['POST'])
@login_required
def update_talent(character_id, talent_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.get_json() or {}
    talents = json.loads(char.habilidades_talentos or '[]')
    
    for t in talents:
        if t['id'] == talent_id:
            if 'nome' in data: t['nome'] = data['nome']
            if 'tipo' in data: t['tipo'] = data['tipo']
            if 'custo' in data: t['custo'] = int(data['custo'])
            if 'execucao' in data: t['execucao'] = data['execucao']
            if 'alcance' in data: t['alcance'] = data['alcance']
            if 'duracao' in data: t['duracao'] = data['duracao']
            if 'descricao' in data: t['descricao'] = data['descricao']
            if 'dado_rolagem' in data: t['dado_rolagem'] = data['dado_rolagem']
            break
            
    char.habilidades_talentos = json.dumps(talents)
    db.session.commit()
    return jsonify(talents)

@app.route('/api/delete_talent/<int:character_id>/<int:talent_id>', methods=['DELETE'])
@login_required
def delete_talent(character_id, talent_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    talents = json.loads(char.habilidades_talentos or '[]')
    talents = [t for t in talents if t['id'] != talent_id]
    
    char.habilidades_talentos = json.dumps(talents)
    db.session.commit()
    return jsonify(talents)

@app.route('/api/use_talent/<int:character_id>/<int:talent_id>', methods=['POST'])
@login_required
def use_talent(character_id, talent_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    if not char.status:
        return jsonify({'error': 'Character status not initialized'}), 400
        
    talents = json.loads(char.habilidades_talentos or '[]')
    talent = next((t for t in talents if t['id'] == talent_id), None)
    if not talent:
        return jsonify({'error': 'Talent not found'}), 404
        
    cost = int(talent.get('custo', 0))
    if char.status.pe_atual < cost:
        return jsonify({'error': 'Pontos de Energia (PE) insuficientes!'}), 400
        
    char.status.pe_atual -= cost
    db.session.commit()
    
    roll_result = None
    roll_desc = ""
    expr = talent.get('dado_rolagem', '')
    if expr:
        try:
            val, desc = roll_dice(expr)
            if val is not None:
                roll_result = val
                roll_desc = desc
        except Exception as e:
            roll_desc = f"Erro ao rolar: {str(e)}"
            
    return jsonify({
        'message': f"Usou o talento {talent['nome']}",
        'talent_nome': talent['nome'],
        'pe_atual': char.status.pe_atual,
        'cost': cost,
        'roll_result': roll_result,
        'roll_desc': roll_desc,
        'descricao': talent.get('descricao', '')
    })

@app.route('/api/use_attack/<int:character_id>/<int:attack_id>', methods=['POST'])
@login_required
def use_attack(character_id, attack_id):
    import random
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    if not char.status:
        return jsonify({'error': 'Character status not initialized'}), 400
        
    attacks = json.loads(char.ataques or '[]')
    attack = next((a for a in attacks if a['id'] == attack_id), None)
    if not attack:
        return jsonify({'error': 'Ataque não encontrado'}), 404
        
    data = request.get_json() or {}
    target_id = data.get('target_id')
    target_char = None
    if target_id:
        target_char = Character.query.get(int(target_id))
        if not target_char or not target_char.status:
            return jsonify({'error': 'Alvo inválido ou sem status'}), 400
            
    # Roll Attack Check (Acerto)
    d20_roll = random.randint(1, 20)
    bonus_acerto = int(attack.get('bonus_acerto', 0))
    total_acerto = d20_roll + bonus_acerto
    
    is_crit = False
    crit_range = 20
    crit_str = attack.get('critico', '20 / x2')
    # Try to parse critical range from something like "19 / x2" or "19"
    try:
        parts = crit_str.split('/')
        val = int(parts[0].strip())
        if 1 <= val <= 20:
            crit_range = val
    except:
        pass
        
    if d20_roll >= crit_range:
        is_crit = True
        
    hit = True
    miss_reason = ""
    target_defesa = 10
    
    if target_char:
        target_defesa = target_char.status.defesa
        if d20_roll == 20:
            hit = True
        elif d20_roll == 1:
            hit = False
            miss_reason = "Falha Crítica (1 natural)"
        elif total_acerto >= target_defesa:
            hit = True
        else:
            hit = False
            miss_reason = f"Rolagem ({total_acerto}) menor que a Defesa do alvo ({target_defesa})"
            
    damage_roll_total = 0
    damage_roll_desc = ""
    bonus_dano = int(attack.get('bonus_dano', 0))
    attr_mod = 0
    dano_attr = attack.get('dano_attr', '')
    if dano_attr == 'forca':
        attr_mod = char.mod_forca
    elif dano_attr == 'destreza':
        attr_mod = char.mod_destreza
        
    total_bonus = bonus_dano + attr_mod
    
    final_damage = 0
    rd_applied = 0
    damage_type = attack.get('tipo', 'Impacto')
    
    rd_map = {
        'corte': 'COR', 'imp': 'IMP', 'impacto': 'IMP', 'perf': 'PER', 'perfuracao': 'PER', 'perfuração': 'PER',
        'con': 'CON', 'congelamento': 'CON', 'que': 'QUE', 'queimadura': 'QUE', 'fogo': 'QUE',
        'cho': 'CHO', 'choque': 'CHO', 'eletricidade': 'CHO', 'son': 'SON', 'sonico': 'SON', 'sônico': 'SON',
        'ene': 'ENE', 'energia': 'ENE', 'amaldiçoada': 'ENE', 'amaldicoada': 'ENE', 'psi': 'PSI', 'mental': 'PSI',
        'rad': 'RAD', 'radiacao': 'RAD', 'radiação': 'RAD', 'nec': 'NEC', 'necrotico': 'NEC', 'necrótico': 'NEC',
        'ven': 'VEN', 'veneno': 'VEN', 'acido': 'VEN', 'ácido': 'VEN'
    }
    
    if hit:
        dano_dados = attack.get('dano_dados', '1d6')
        try:
            val, desc = roll_dice(dano_dados)
            if val is not None:
                damage_roll_total = val
                damage_roll_desc = desc
            else:
                damage_roll_total = random.randint(1, 6)
                damage_roll_desc = f"(1d6 no fallback) = {damage_roll_total}"
        except Exception as e:
            damage_roll_total = random.randint(1, 6)
            damage_roll_desc = f"(1d6 no fallback devido a erro {str(e)}) = {damage_roll_total}"
            
        base_dmg = damage_roll_total
        if is_crit:
            # Double only the rolled dice as standard JJK rules or double whole roll
            base_dmg = damage_roll_total * 2
            damage_roll_desc = f"CRÍTICO! [ {damage_roll_desc} ] x2 = {base_dmg}"
            
        total_damage = base_dmg + total_bonus
        
        if target_char:
            target_rds = json.loads(target_char.rds or '{}')
            rd_abbrev = rd_map.get(damage_type.lower(), 'IMP')
            rd_applied = int(target_rds.get(rd_abbrev, 0))
            final_damage = max(0, total_damage - rd_applied)
            
            # Deduct target PV
            old_pv = target_char.status.pv_atual
            target_char.status.pv_atual = max(0, target_char.status.pv_atual - final_damage)
            pv_lost = old_pv - target_char.status.pv_atual
        else:
            final_damage = total_damage
            
    # Log generation
    time_str = time.strftime('%H:%M')
    log_title = "Ataque Realizado"
    if target_char:
        if hit:
            crit_badge = " [CRÍTICO]" if is_crit else ""
            log_content = (
                f"<b>{char.nome}</b> atacou <b>{target_char.nome}</b> com <b>{attack['nome']}</b> e <b>ACERTOU</b>!{crit_badge}<br>"
                f"🎯 Acerto: d20 ({d20_roll}) + {bonus_acerto} = {total_acerto} vs Defesa {target_defesa}<br>"
                f"💥 Dano: {damage_roll_desc} + Bônus ({total_bonus}) = {total_damage} ({damage_type})<br>"
                f"🛡️ RD Alvo ({rd_abbrev}): -{rd_applied}<br>"
                f"🩸 Dano Final sofrido por {target_char.nome}: <b>{final_damage} PV</b>"
            )
        else:
            log_content = (
                f"<b>{char.nome}</b> atacou <b>{target_char.nome}</b> com <b>{attack['nome']}</b> mas <b>ERROU</b>!<br>"
                f"🎯 Acerto: d20 ({d20_roll}) + {bonus_acerto} = {total_acerto} vs Defesa {target_defesa}<br>"
                f"❌ Motivo: {miss_reason}"
            )
    else:
        # Rolou sem alvo específico
        crit_badge = " [CRÍTICO]" if is_crit else ""
        if hit:
            log_content = (
                f"<b>{char.nome}</b> atacou com <b>{attack['nome']}</b>!{crit_badge}<br>"
                f"🎯 Acerto: d20 ({d20_roll}) + {bonus_acerto} = {total_acerto}<br>"
                f"💥 Dano: {damage_roll_desc} + Bônus ({total_bonus}) = {total_damage} ({damage_type})"
            )
            
    # Append log to caster
    try:
        caster_logs = json.loads(char.recent_logs or '[]')
        caster_logs.insert(0, {'title': log_title, 'content': log_content, 'time': time_str, 'timestamp': time.time()})
        char.recent_logs = json.dumps(caster_logs[:15])
    except:
        pass
        
    # Append log to target if exists
    if target_char:
        try:
            target_logs = json.loads(target_char.recent_logs or '[]')
            target_logs.insert(0, {'title': log_title, 'content': log_content, 'time': time_str, 'timestamp': time.time()})
            target_char.recent_logs = json.dumps(target_logs[:15])
        except:
            pass
            
    db.session.commit()
    
    return jsonify({
        'hit': hit,
        'is_crit': is_crit,
        'd20_roll': d20_roll,
        'total_acerto': total_acerto,
        'damage_roll_desc': damage_roll_desc,
        'total_damage': damage_roll_total + total_bonus,
        'rd_applied': rd_applied,
        'final_damage': final_damage,
        'caster_pe': char.status.pe_atual,
        'target_pv': target_char.status.pv_atual if target_char else None,
        'log_content': log_content
    })

@app.route('/api/use_spell/<int:character_id>/<int:spell_id>', methods=['POST'])
@login_required
def use_spell(character_id, spell_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    if not char.status:
        return jsonify({'error': 'Character status not initialized'}), 400
        
    spells = json.loads(char.feiticos or '[]')
    spell = next((s for s in spells if s['id'] == spell_id), None)
    if not spell:
        return jsonify({'error': 'Feitiço não encontrado'}), 404
        
    cost = int(spell.get('custo', 2))
    if char.status.pe_atual < cost:
        return jsonify({'error': f'Energia Amaldiçoada (PE) insuficiente! Custo: {cost} PE, Atual: {char.status.pe_atual} PE'}), 400
        
    data = request.get_json() or {}
    target_id = data.get('target_id')
    target_char = None
    if target_id:
        target_char = Character.query.get(int(target_id))
        if not target_char or not target_char.status:
            return jsonify({'error': 'Alvo inválido ou sem status'}), 400
            
    char.status.pe_atual -= cost
    
    # Roll spell damage or healing
    dano_expr = spell.get('dano', '')
    damage_roll_total = 0
    damage_roll_desc = ""
    
    is_healing = False
    name_lower = spell['nome'].lower()
    desc_lower = spell.get('descricao', '').lower()
    if 'cura' in name_lower or 'curar' in name_lower or 'recupera' in name_lower or 'cura' in desc_lower:
        is_healing = True
        
    if dano_expr:
        try:
            val, desc = roll_dice(dano_expr)
            if val is not None:
                damage_roll_total = val
                damage_roll_desc = desc
            else:
                damage_roll_total = 0
                damage_roll_desc = "N/A"
        except Exception as e:
            damage_roll_desc = f"Erro: {str(e)}"
            
    final_effect = 0
    rd_applied = 0
    rd_abbrev = "ENE"
    
    rd_map = {
        'corte': 'COR', 'imp': 'IMP', 'impacto': 'IMP', 'perf': 'PER', 'perfuracao': 'PER', 'perfuração': 'PER',
        'con': 'CON', 'congelamento': 'CON', 'que': 'QUE', 'queimadura': 'QUE', 'fogo': 'QUE',
        'cho': 'CHO', 'choque': 'CHO', 'eletricidade': 'CHO', 'son': 'SON', 'sonico': 'SON', 'sônico': 'SON',
        'ene': 'ENE', 'energia': 'ENE', 'amaldiçoada': 'ENE', 'amaldicoada': 'ENE', 'psi': 'PSI', 'mental': 'PSI',
        'rad': 'RAD', 'radiacao': 'RAD', 'radiação': 'RAD', 'nec': 'NEC', 'necrotico': 'NEC', 'necrótico': 'NEC',
        'ven': 'VEN', 'veneno': 'VEN', 'acido': 'VEN', 'ácido': 'VEN'
    }
    
    time_str = time.strftime('%H:%M')
    log_title = "Técnica Conjurada"
    
    if target_char:
        if is_healing:
            old_pv = target_char.status.pv_atual
            target_char.status.pv_atual = min(target_char.status.pv_max, target_char.status.pv_atual + damage_roll_total)
            healed = target_char.status.pv_atual - old_pv
            final_effect = healed
            log_content = (
                f"🔮 <b>{char.nome}</b> conjurou <b>{spell['nome']}</b> em <b>{target_char.nome}</b>!<br>"
                f"✨ Custo: {cost} PE (Caster agora tem {char.status.pe_atual} PE)<br>"
                f"💖 Cura: {damage_roll_desc}<br>"
                f"📈 <b>{target_char.nome}</b> recuperou <b>{healed} PV</b>!"
            )
        else:
            # Deal damage, default to Cursed Energy (ENE) or custom
            target_rds = json.loads(target_char.rds or '{}')
            # Look up if description or name matches any specific damage type
            matched_type = 'ENE'
            for t in rd_map.keys():
                if t in name_lower or t in desc_lower:
                    matched_type = rd_map[t]
                    break
            rd_abbrev = matched_type
            rd_applied = int(target_rds.get(rd_abbrev, 0))
            final_damage = max(0, damage_roll_total - rd_applied)
            final_effect = final_damage
            
            old_pv = target_char.status.pv_atual
            target_char.status.pv_atual = max(0, target_char.status.pv_atual - final_damage)
            
            log_content = (
                f"🔮 <b>{char.nome}</b> conjurou <b>{spell['nome']}</b> em <b>{target_char.nome}</b>!<br>"
                f"✨ Custo: {cost} PE (Caster agora tem {char.status.pe_atual} PE)<br>"
                f"💥 Dano Rolado: {damage_roll_desc} ({rd_abbrev})<br>"
                f"🛡️ RD Alvo ({rd_abbrev}): -{rd_applied}<br>"
                f"🩸 Dano Final sofrido por {target_char.nome}: <b>{final_damage} PV</b>"
            )
    else:
        # Casted on self / no target
        log_content = (
            f"🔮 <b>{char.nome}</b> conjurou <b>{spell['nome']}</b>!<br>"
            f"✨ Custo: {cost} PE (Caster agora tem {char.status.pe_atual} PE)<br>"
            f"📖 Descrição: <i>{spell.get('descricao', 'Sem descrição')}</i>"
        )
        if dano_expr:
            log_content += f"<br>🎲 Efeito Rolado: {damage_roll_desc}"
            
    # Append log to caster
    try:
        caster_logs = json.loads(char.recent_logs or '[]')
        caster_logs.insert(0, {'title': log_title, 'content': log_content, 'time': time_str, 'timestamp': time.time()})
        char.recent_logs = json.dumps(caster_logs[:15])
    except:
        pass
        
    # Append log to target if exists
    if target_char:
        try:
            target_logs = json.loads(target_char.recent_logs or '[]')
            target_logs.insert(0, {'title': log_title, 'content': log_content, 'time': time_str, 'timestamp': time.time()})
            target_char.recent_logs = json.dumps(target_logs[:15])
        except:
            pass
            
    db.session.commit()
    
    return jsonify({
        'pe_atual': char.status.pe_atual,
        'cost': cost,
        'damage_roll_total': damage_roll_total,
        'damage_roll_desc': damage_roll_desc,
        'final_effect': final_effect,
        'rd_applied': rd_applied,
        'target_pv': target_char.status.pv_atual if target_char else None,
        'is_healing': is_healing,
        'log_content': log_content
    })

@app.route('/api/use_lobby_talent/<int:character_id>/<int:talent_id>', methods=['POST'])
@login_required
def use_lobby_talent(character_id, talent_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    if not char.status:
        return jsonify({'error': 'Character status not initialized'}), 400
        
    talents = json.loads(char.habilidades_talentos or '[]')
    talent = next((t for t in talents if t['id'] == talent_id), None)
    if not talent:
        return jsonify({'error': 'Talento não encontrado'}), 404
        
    cost = int(talent.get('custo', 0))
    if char.status.pe_atual < cost:
        return jsonify({'error': f'Pontos de Energia (PE) insuficientes! Custo: {cost} PE, Atual: {char.status.pe_atual} PE'}), 400
        
    data = request.get_json() or {}
    target_id = data.get('target_id')
    target_char = None
    if target_id:
        target_char = Character.query.get(int(target_id))
        if not target_char or not target_char.status:
            return jsonify({'error': 'Alvo inválido ou sem status'}), 400
            
    char.status.pe_atual -= cost
    
    roll_result = None
    roll_desc = ""
    expr = talent.get('dado_rolagem', '')
    if expr:
        try:
            val, desc = roll_dice(expr)
            if val is not None:
                roll_result = val
                roll_desc = desc
        except Exception as e:
            roll_desc = f"Erro: {str(e)}"
            
    time_str = time.strftime('%H:%M')
    log_title = "Habilidade Usada"
    
    if target_char:
        log_content = (
            f"🌀 <b>{char.nome}</b> ativou <b>{talent['nome']}</b> em <b>{target_char.nome}</b>!<br>"
            f"✨ Custo: {cost} PE (Usuário agora tem {char.status.pe_atual} PE)<br>"
            f"📖 Descrição: <i>{talent.get('descricao', 'Sem descrição')}</i>"
        )
        if expr:
            log_content += f"<br>🎲 Efeito Rolado: {roll_desc}"
    else:
        log_content = (
            f"🌀 <b>{char.nome}</b> ativou <b>{talent['nome']}</b>!<br>"
            f"✨ Custo: {cost} PE (Usuário agora tem {char.status.pe_atual} PE)<br>"
            f"📖 Descrição: <i>{talent.get('descricao', 'Sem descrição')}</i>"
        )
        if expr:
            log_content += f"<br>🎲 Efeito Rolado: {roll_desc}"
            
    # Append log to caster
    try:
        caster_logs = json.loads(char.recent_logs or '[]')
        caster_logs.insert(0, {'title': log_title, 'content': log_content, 'time': time_str, 'timestamp': time.time()})
        char.recent_logs = json.dumps(caster_logs[:15])
    except:
        pass
        
    # Append log to target if exists
    if target_char:
        try:
            target_logs = json.loads(target_char.recent_logs or '[]')
            target_logs.insert(0, {'title': log_title, 'content': log_content, 'time': time_str, 'timestamp': time.time()})
            target_char.recent_logs = json.dumps(target_logs[:15])
        except:
            pass
            
    db.session.commit()
    
    return jsonify({
        'pe_atual': char.status.pe_atual,
        'cost': cost,
        'roll_result': roll_result,
        'roll_desc': roll_desc,
        'target_pv': target_char.status.pv_atual if target_char else None,
        'log_content': log_content
    })

@app.route('/api/rest_character/<int:character_id>', methods=['POST'])
@login_required
def rest_character(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    if not char.status:
        return jsonify({'error': 'Character status not initialized'}), 400
        
    data = request.get_json() or {}
    tipo = data.get('tipo', 'longo')
    
    try:
        dv = json.loads(char.dados_vida or '{}')
    except:
        dv = {}
        
    for d in ['d8', 'd10', 'd12']:
        if d not in dv:
            dv[d] = {'gastos': 0, 'max': 0}
            
    log_message = ""
    roll_desc = ""
    pv_recuperado = 0
    pe_recuperado = 0
    
    if tipo == 'curto':
        dice_type = data.get('dice_type')
        if not dice_type or dice_type not in dv:
            return jsonify({'error': 'Tipo de dado inválido'}), 400
            
        d_info = dv[dice_type]
        if d_info['max'] <= 0:
            return jsonify({'error': f'Você não possui dados de vida do tipo {dice_type}'}), 400
        if d_info['gastos'] >= d_info['max']:
            return jsonify({'error': f'Todos os dados de vida {dice_type} já foram gastos'}), 400
            
        d_info['gastos'] += 1
        char.dados_vida = json.dumps(dv)
        
        import random
        faces = int(dice_type.replace('d', ''))
        die_roll = random.randint(1, faces)
        con_mod = char.mod_constituicao
        total_heal = max(1, die_roll + con_mod)
        
        old_pv = char.status.pv_atual
        char.status.pv_atual = min(char.status.pv_max, char.status.pv_atual + total_heal)
        pv_recuperado = char.status.pv_atual - old_pv
        
        roll_desc = f"1{dice_type} ({die_roll}) + CON ({con_mod}) = {total_heal} PV"
        log_message = f"Realizou um Descanso Curto gastando 1{dice_type} e recuperando {pv_recuperado} PV!"
        
    elif tipo == 'longo':
        old_pv = char.status.pv_atual
        char.status.pv_atual = char.status.pv_max
        pv_recuperado = char.status.pv_max - old_pv
        
        old_pe = char.status.pe_atual
        char.status.pe_atual = char.status.pe_max
        pe_recuperado = char.status.pe_max - old_pe
        
        char.status.integridade_atual = char.status.integridade_max
        
        for d, d_info in dv.items():
            if d_info['max'] > 0:
                recover_amount = max(1, d_info['max'] // 2)
                d_info['gastos'] = max(0, d_info['gastos'] - recover_amount)
                
        char.dados_vida = json.dumps(dv)
        log_message = f"Realizou um Descanso Longo! Recuperou {pv_recuperado} PV, {pe_recuperado} PE, Integridade da Alma e metade dos Dados de Vida!"
        
    db.session.commit()
    return jsonify({
        'message': log_message,
        'pv_atual': char.status.pv_atual,
        'pv_max': char.status.pv_max,
        'pe_atual': char.status.pe_atual,
        'pe_max': char.status.pe_max,
        'integridade_atual': char.status.integridade_atual,
        'dados_vida': dv,
        'roll_desc': roll_desc,
        'pv_recuperado': pv_recuperado,
        'pe_recuperado': pe_recuperado,
        'character': get_character_json(char)
    })

@app.route('/api/upload_avatar/<int:character_id>', methods=['POST'])
@login_required
def upload_avatar(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file:
        filename = secure_filename(file.filename)
        ext = os.path.splitext(filename)[1]
        name = os.path.splitext(filename)[0]
        unique_filename = f"{name}_{int(time.time())}{ext}"
        
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        
        char.imagem_url = f"/static/uploads/{unique_filename}"
        db.session.commit()
        
        return jsonify({
            'message': 'Avatar uploaded successfully',
            'imagem_url': char.imagem_url,
            'character': get_character_json(char)
        })
        
    return jsonify({'error': 'Upload failed'}), 400

@app.route('/api/import_excel/<int:character_id>', methods=['POST'])
@login_required
def import_excel(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403

    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado.'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Nome de arquivo inválido.'}), 400

    try:
        import openpyxl
        wb = openpyxl.load_workbook(file, data_only=True)
    except Exception as e:
        return jsonify({'error': f'Falha ao carregar o arquivo Excel: {str(e)}'}), 400

    required_sheets = ['Ficha Pessoal', 'Registro e Inventário', 'Perfil Amaldiçoado']
    for sheet_name in required_sheets:
        if sheet_name not in wb.sheetnames:
            return jsonify({'error': f'A planilha não possui a aba obrigatória: "{sheet_name}"'}), 400

    def safe_int(val, default=0):
        if val is None: return default
        try: return int(float(val))
        except: return default

    def safe_float(val, default=0.0):
        if val is None: return default
        try: return float(val)
        except: return default

    def safe_str(val, default=""):
        if val is None: return default
        return str(val).strip()

    try:
        sheet_f = wb['Ficha Pessoal']
        nome_val = safe_str(sheet_f['O2'].value)
        if not nome_val or nome_val == "NOME":
            nome_val = char.nome
            
        char.nome = nome_val
        char.origem = safe_str(sheet_f['AC2'].value, char.origem)
        char.especializacao = safe_str(sheet_f['AC3'].value, char.especializacao)
        char.grau = safe_str(sheet_f['AP3'].value, char.grau)
        char.nivel = max(1, safe_int(sheet_f['BD3'].value, char.nivel))
        char.xp = safe_int(sheet_f['AP4'].value, char.xp)
        
        if char.attributes:
            char.attributes.forca = safe_int(sheet_f['B10'].value, 10)
            char.attributes.destreza = safe_int(sheet_f['F10'].value, 10)
            char.attributes.constituicao = safe_int(sheet_f['J10'].value, 10)
            char.attributes.inteligencia = safe_int(sheet_f['B14'].value, 10)
            char.attributes.sabedoria = safe_int(sheet_f['F14'].value, 10)
            char.attributes.presenca = safe_int(sheet_f['J14'].value, 10)
        
        pericias = json.loads(char.pericias or '{}')
        
        for r in range(25, 36):
            s_name = safe_str(sheet_f.cell(row=r, column=2).value)
            if s_name:
                clean_name = s_name.split(' (')[0].strip()
                matched_key = None
                for k in pericias.keys():
                    if k.lower() == clean_name.lower() or k.lower() == s_name.lower():
                        matched_key = k
                        break
                
                if matched_key:
                    is_trained = bool(sheet_f.cell(row=r, column=10).value)
                    is_master = bool(sheet_f.cell(row=r, column=11).value)
                    pericias[matched_key]['treinada'] = is_trained
                    pericias[matched_key]['mestre'] = is_master

        for r in range(25, 36):
            s_name = safe_str(sheet_f.cell(row=r, column=14).value)
            if s_name:
                clean_name = s_name.split(' (')[0].strip()
                matched_key = None
                for k in pericias.keys():
                    if k.lower() == clean_name.lower() or k.lower() == s_name.lower():
                        matched_key = k
                        break
                
                if matched_key:
                    # BUG FIX: Second group T/M columns are V=22 and W=23, NOT T=20 and U=21
                    is_trained = bool(sheet_f.cell(row=r, column=22).value)
                    is_master = bool(sheet_f.cell(row=r, column=23).value) if sheet_f.cell(row=r, column=23).value is not None else False
                    pericias[matched_key]['treinada'] = is_trained
                    pericias[matched_key]['mestre'] = is_master

        resistencias = json.loads(char.resistencias or '{}')
        res_mappings = {
            'Astúcia': ('Y18', 'Z18'),
            'Fortitude': ('AB18', 'AC18'),
            'Integridade': ('AE18', 'AF18'),
            'Reflexos': ('AH18', 'AI18'),
            'Vontade': ('AK18', 'AL18')
        }
        for name, (t_coord, m_coord) in res_mappings.items():
            if name in resistencias:
                resistencias[name]['treinada'] = bool(sheet_f[t_coord].value)
                resistencias[name]['mestre'] = bool(sheet_f[m_coord].value)
        char.resistencias = json.dumps(resistencias)

        rds = json.loads(char.rds or '{}')
        rd_types = ['COR', 'IMP', 'PER', 'CON', 'QUE', 'CHO', 'SON', 'ENE', 'PSI', 'RAD', 'NEC', 'VEN']
        for i, rd_type in enumerate(rd_types):
            col_idx = 27 + i
            rd_val = safe_int(sheet_f.cell(row=22, column=col_idx).value, 0)
            rds[rd_type] = rd_val
        char.rds = json.dumps(rds)

        attacks = []
        for r in range(27, 32):
            w_name = safe_str(sheet_f.cell(row=r, column=27).value)
            if w_name:
                atk_dict = {
                    'id': len(attacks) + 1,
                    'nome': w_name,
                    'pericia': 'Luta' if 'corpo' in safe_str(sheet_f.cell(row=r, column=43).value).lower() else 'Pontaria',
                    'dano_dados': safe_str(sheet_f.cell(row=r, column=34).value, '1d6'),
                    'dano_attr': 'forca' if 'corpo' in safe_str(sheet_f.cell(row=r, column=43).value).lower() else 'destreza',
                    'bonus_acerto': safe_int(sheet_f.cell(row=r, column=32).value, 0),
                    'bonus_dano': 0,
                    'critico': safe_str(sheet_f.cell(row=r, column=38).value, '20 / x2'),
                    'alcance': safe_str(sheet_f.cell(row=r, column=43).value, 'Corpo a Corpo'),
                    'tipo': safe_str(sheet_f.cell(row=r, column=40).value, 'Impacto')
                }
                attacks.append(atk_dict)
        char.ataques = json.dumps(attacks)

        talents = []
        for r in range(9, 36):
            t_name = safe_str(sheet_f.cell(row=r, column=60).value)  # BH = col 60
            if t_name and t_name not in ('Nome', 'NOME'):
                t_atual = safe_str(sheet_f.cell(row=r, column=66).value)  # BN = col 66
                t_max = safe_str(sheet_f.cell(row=r, column=68).value)   # BP = col 68
                # BUG FIX: custo is column BR=70, NOT 74
                t_cost = safe_int(sheet_f.cell(row=r, column=70).value, 0)
                
                desc_extra = ""
                if t_atual or t_max:
                    desc_extra = f" Usos: {t_atual or '0'}/{t_max or '0'}."
                
                talent_dict = {
                    'id': len(talents) + 1,
                    'nome': t_name,
                    'tipo': 'Classe',
                    'custo': t_cost,
                    'execucao': 'Ação Padrão',
                    'alcance': 'Pessoal',
                    'duracao': 'Instantânea',
                    'descricao': f"Habilidade importada da planilha Excel.{desc_extra}",
                    'dado_rolagem': ''
                }
                talents.append(talent_dict)
        char.habilidades_talentos = json.dumps(talents)

        sheet_i = wb['Registro e Inventário']
        inventory = []
        for r in range(8, 34):
            item_name_1 = safe_str(sheet_i.cell(row=r, column=25).value)
            if item_name_1:
                item_qty_1 = safe_int(sheet_i.cell(row=r, column=33).value, 1)
                item_weight_1 = safe_float(sheet_i.cell(row=r, column=35).value, 0.0)
                inventory.append({
                    'id': len(inventory) + 1,
                    'nome': item_name_1,
                    'qtd': item_qty_1,
                    'peso': item_weight_1
                })
            item_name_2 = safe_str(sheet_i.cell(row=r, column=40).value)
            if item_name_2:
                item_qty_2 = safe_int(sheet_i.cell(row=r, column=48).value, 1)
                item_weight_2 = safe_float(sheet_i.cell(row=r, column=50).value, 0.0)
                inventory.append({
                    'id': len(inventory) + 1,
                    'nome': item_name_2,
                    'qtd': item_qty_2,
                    'peso': item_weight_2
                })
        char.inventario = json.dumps(inventory)

        sheet_p = wb['Perfil Amaldiçoado']
        spells = []
        
        def parse_spell_str(text, lvl):
            import re
            text_clean = text.strip()
            cost = 2
            match = re.search(r'\((\d+)\s*PE\)', text_clean, re.IGNORECASE)
            if match:
                cost = int(match.group(1))
                text_clean = re.sub(r'\((\d+)\s*PE\)', '', text_clean).strip()
            
            return {
                'id': len(spells) + 1,
                'nivel': lvl,
                'nome': text_clean,
                'custo': cost,
                'acao': 'Padrão',
                'alcance': 'Pessoal',
                'duracao': 'Instantânea',
                'dano': '1d6',
                'descricao': 'Feitiço importado do Excel.'
            }

        spell_blocks = [
            (0, 27, 8, 17),
            (1, 36, 8, 17),
            (2, 45, 8, 17),
            (3, 27, 19, 28),
            (4, 36, 19, 28),
            (5, 45, 19, 28)
        ]
        
        for lvl, col_idx, r_start, r_end in spell_blocks:
            for r in range(r_start, r_end + 1):
                spell_val = safe_str(sheet_p.cell(row=r, column=col_idx).value)
                if spell_val:
                    spells.append(parse_spell_str(spell_val, lvl))
        char.feiticos = json.dumps(spells)

        dom_nome = safe_str(sheet_p['BB7'].value)
        if dom_nome:
            char.dominio = json.dumps({
                'nome': dom_nome,
                'tipo': safe_str(sheet_p['BB10'].value, 'Letal'),
                'custo': 20,
                'descricao': safe_str(sheet_p['BB12'].value, 'Feito sob medida em barreira.')
            })

        summons = []
        if len(wb.sheetnames) > 4:
            sheet_s = wb[wb.sheetnames[4]]
            summon_cols = [2, 17, 32]
            for col in summon_cols:
                sum_name = safe_str(sheet_s.cell(row=5, column=col).value)
                if sum_name and "Invoca" not in sum_name:
                    sum_hp_max = safe_int(sheet_s.cell(row=10, column=col + 4).value, 10)
                    sum_hp_act = safe_int(sheet_s.cell(row=10, column=col + 1).value, sum_hp_max)
                    sum_def = safe_int(sheet_s.cell(row=10, column=col + 7).value, 10)
                    
                    summons.append({
                        'id': len(summons) + 1,
                        'nome': sum_name,
                        'hp_atual': sum_hp_act,
                        'hp_max': sum_hp_max,
                        'pe_atual': 5,
                        'pe_max': 5,
                        'ataque': '1d6+2',
                        'defesa': sum_def,
                        'desc': f"Grau: {safe_str(sheet_s.cell(row=7, column=col + 1).value)}\nDeslocamento: {safe_str(sheet_s.cell(row=10, column=col + 10).value)}"
                    })
        char.invocacoes = json.dumps(summons)

        if len(wb.sheetnames) > 5:
            sheet_t = wb[wb.sheetnames[5]]
            reforco_count = 0
            # BUG FIX: Treino de Luta checkboxes are in col I=9, rows 17-20 (NOT col 36)
            for r in range(17, 21):
                if bool(sheet_t.cell(row=r, column=9).value): reforco_count += 1
                
            tecnica_count = 0
            # BUG FIX: Treino de Compreensão checkboxes are in col AA=27, rows 5-8 (NOT col 36)
            for r in range(5, 9):
                if bool(sheet_t.cell(row=r, column=27).value): tecnica_count += 1
                
            dom_count = 0
            # Treino de Domínios checkboxes are in col AS=45, rows 5-8 (CONFIRMED CORRECT)
            for r in range(5, 9):
                if bool(sheet_t.cell(row=r, column=45).value): dom_count += 1
            
            # Treino de Resistência checkboxes are in col AS=45, rows 17-20
            resistencia_count = 0
            for r in range(17, 21):
                if bool(sheet_t.cell(row=r, column=45).value): resistencia_count += 1
                
            if not pericias.get('_treinamentos'):
                pericias['_treinamentos'] = {}
                
            pericias['_treinamentos']['reforco_corp'] = min(reforco_count, 4)
            pericias['_treinamentos']['tecnica_ref'] = min(tecnica_count, 4)
            pericias['_treinamentos']['dom_simples'] = min(dom_count, 4)
            pericias['_treinamentos']['resistencia'] = min(resistencia_count, 4)
            
        char.pericias = json.dumps(pericias)
        db.session.commit()
        
        if char.status:
            char.status.pv_atual = char.status.pv_max
            char.status.pe_atual = char.status.pe_max
            char.status.integridade_atual = char.status.integridade_max
            
        db.session.commit()

        # Build a rich import summary for the front-end to display step-by-step feedback
        import_summary = {
            'atributos': '✅ 6 atributos importados',
            'pericias': f'✅ {sum(1 for p in pericias.values() if isinstance(p, dict) and p.get("treinada"))} perícias treinadas detectadas',
            'resistencias': '✅ 5 resistências importadas',
            'rds': f'✅ {sum(1 for v in rds.values() if v > 0)} RDs ativas importadas',
            'ataques': f'✅ {len(attacks)} ataque(s) importado(s)' if attacks else '⚠️ Nenhum ataque encontrado',
            'talentos': f'✅ {len(talents)} habilidade(s)/talento(s) importado(s)' if talents else '⚠️ Nenhum talento encontrado',
            'inventario': f'✅ {len(inventory)} item(ns) de inventário importado(s)' if inventory else '⚠️ Nenhum item no inventário',
            'feiticos': f'✅ {len(spells)} feitiço(s) importado(s)' if spells else '⚠️ Nenhum feitiço encontrado',
            'summons': f'✅ {len(summons)} invocação(ões) importada(s)' if summons else '⚠️ Nenhuma invocação encontrada',
        }
        
        try:
            logs = json.loads(char.recent_logs or '[]')
            summary_lines = list(import_summary.values())
            logs.insert(0, {
                'title': 'Ficha Importada!',
                'content': f"Excel '{file.filename}' importado. " + " | ".join(summary_lines[:3]),
                'time': time.strftime('%H:%M'),
                'timestamp': time.time()
            })
            char.recent_logs = json.dumps(logs[:15])
            db.session.commit()
        except:
            pass

        return jsonify({
            'message': 'Ficha do Excel importada com total sucesso!',
            'import_summary': import_summary,
            'character': get_character_json(char)
        })

    except Exception as e:
        db.session.rollback()
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Erro ao processar conteúdo da planilha: {str(e)}'}), 400

@app.route('/api/log_action/<int:character_id>', methods=['POST'])
@login_required
def log_action(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    if not data or 'title' not in data or 'content' not in data:
        return jsonify({'error': 'Invalid data'}), 400
        
    try:
        logs = json.loads(char.recent_logs or '[]')
    except:
        logs = []
        
    new_log = {
        'title': data['title'],
        'content': data['content'],
        'time': data.get('time', ''),
        'timestamp': time.time()
    }
    
    logs.insert(0, new_log)
    logs = logs[:15] # keep last 15 items
    
    char.recent_logs = json.dumps(logs)
    db.session.commit()
    
    return jsonify(logs)

@app.route('/api/update_dominio/<int:character_id>', methods=['POST'])
@login_required
def update_dominio(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid data'}), 400
        
    try:
        dominio_data = json.loads(char.dominio or '{}')
    except:
        dominio_data = {}
        
    if 'nome' in data: dominio_data['nome'] = data['nome']
    if 'tipo' in data: dominio_data['tipo'] = data['tipo']
    if 'custo' in data: dominio_data['custo'] = int(data['custo'])
    if 'descricao' in data: dominio_data['descricao'] = data['descricao']
    
    char.dominio = json.dumps(dominio_data)
    db.session.commit()
    
    return jsonify({
        'message': 'Domínio atualizado com sucesso',
        'character': get_character_json(char)
    })

@app.route('/api/manifestar_dominio/<int:character_id>', methods=['POST'])
@login_required
def manifestar_dominio(character_id):
    char = Character.query.get_or_404(character_id)
    if current_user.role == 'Jogador' and char.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    if not char.status:
        return jsonify({'error': 'Character status not initialized'}), 400
        
    try:
        dominio_data = json.loads(char.dominio or '{}')
    except:
        dominio_data = {
            'nome': 'Expansão de Domínio',
            'tipo': 'Letal',
            'custo': 20,
            'descricao': 'A técnica cria um espaço separado fechado por uma barreira e imbuído da técnica inata do usuário. Os ataques dentro de um domínio possuem acerto garantido.'
        }
        
    cost = int(dominio_data.get('custo', 20))
    if char.status.pe_atual < cost:
        return jsonify({'error': 'Pontos de Energia (PE) insuficientes!'}), 400
        
    char.status.pe_atual -= cost
    db.session.commit()
    
    val, desc = roll_dice("1d20+12")
    
    return jsonify({
        'message': f"Manifestou a Expansão de Domínio: {dominio_data['nome']}",
        'dominio': dominio_data,
        'pe_atual': char.status.pe_atual,
        'cost': cost,
        'roll_val': val,
        'roll_desc': desc,
        'character': get_character_json(char)
    })

if __name__ == '__main__':
    # Ensure templates and static folders exist
    os.makedirs(os.path.join(base_dir, 'templates'), exist_ok=True)
    os.makedirs(os.path.join(base_dir, 'static'), exist_ok=True)
    
    port = int(os.environ.get('FLASK_PORT', 5000))
    app.run(debug=False, host='127.0.0.1', port=port)
