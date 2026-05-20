from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
import math
import json

db = SQLAlchemy()

# ── XP → NÍVEL (thresholds do sistema JJK 2.5.2) ──────────────────────────
XP_LEVELS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000,
             48000, 64000, 85000, 100000, 120000, 140000, 165000,
             195000, 225000, 265000, 305000, 355000]

def xp_to_level(xp: int) -> int:
    """Retorna o nível correspondente ao total de XP."""
    xp = max(0, int(xp))
    level = 1
    for i, threshold in enumerate(XP_LEVELS):
        if xp >= threshold:
            level = i + 1
        else:
            break
    return min(level, 20)

def xp_next_threshold(xp: int) -> int | None:
    """Retorna o XP necessário para o próximo nível, ou None se já é nível 20."""
    level = xp_to_level(xp)
    if level >= 20:
        return None
    return XP_LEVELS[level]  # XP_LEVELS[level] = threshold do nível level+1


class Lobby(db.Model):
    """Representa uma sessão de RPG criada pelo Mestre."""
    __tablename__ = 'lobbies'

    id        = db.Column(db.Integer, primary_key=True)
    nome      = db.Column(db.String(100), nullable=False, default='Domínio do Mestre')
    codigo    = db.Column(db.String(8), unique=True, nullable=False)  # e.g. "KUROI1"
    master_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    criado_em = db.Column(db.DateTime, default=db.func.now())
    ativo     = db.Column(db.Boolean, default=True)

    # Relationships
    master  = db.relationship('User', foreign_keys=[master_id], backref='lobbies_criados')
    membros = db.relationship('User', foreign_keys='User.lobby_id', backref='lobby', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'codigo': self.codigo,
            'master_id': self.master_id,
            'master_nome': self.master.username if self.master else '?',
            'num_membros': self.membros.count()
        }


class User(UserMixin, db.Model):
    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)

    __tablename__ = 'users'

    id            = db.Column(db.Integer, primary_key=True)
    username      = db.Column(db.String(64), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role          = db.Column(db.String(20), nullable=False, default='Jogador')  # 'Mestre' ou 'Jogador'

    # Lobby membership
    lobby_id   = db.Column(db.Integer, db.ForeignKey('lobbies.id'), nullable=True)

    characters = db.relationship('Character', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    @property
    def in_lobby(self):
        return self.lobby_id is not None

    @property
    def is_lobby_master(self):
        if not self.lobby_id:
            return False
        lobby = Lobby.query.get(self.lobby_id)
        return lobby and lobby.master_id == self.id


class Character(db.Model):
    def __init__(self, **kwargs):
        super(Character, self).__init__(**kwargs)
        if not self.pericias or self.pericias == '{}' or self.pericias == '[]':
            default_pericias = {
                'Acrobacia': {'attr': 'destreza', 'treinada': False, 'bonus': 0},
                'Atletismo': {'attr': 'forca', 'treinada': False, 'bonus': 0},
                'Atualidades': {'attr': 'inteligencia', 'treinada': False, 'bonus': 0},
                'Ciências': {'attr': 'inteligencia', 'treinada': False, 'bonus': 0},
                'Crime': {'attr': 'destreza', 'treinada': False, 'bonus': 0},
                'Diplomacia': {'attr': 'presenca', 'treinada': False, 'bonus': 0},
                'Enganação': {'attr': 'presenca', 'treinada': False, 'bonus': 0},
                'Feitiçaria': {'attr': 'inteligencia', 'treinada': False, 'bonus': 0},
                'Furtividade': {'attr': 'destreza', 'treinada': False, 'bonus': 0},
                'Iniciativa': {'attr': 'destreza', 'treinada': False, 'bonus': 0},
                'Intimidação': {'attr': 'presenca', 'treinada': False, 'bonus': 0},
                'Intuição': {'attr': 'sabedoria', 'treinada': False, 'bonus': 0},
                'Investigação': {'attr': 'inteligencia', 'treinada': False, 'bonus': 0},
                'Luta': {'attr': 'forca', 'treinada': False, 'bonus': 0},
                'Medicina': {'attr': 'sabedoria', 'treinada': False, 'bonus': 0},
                'Ocultismo': {'attr': 'sabedoria', 'treinada': False, 'bonus': 0},
                'Percepção': {'attr': 'sabedoria', 'treinada': False, 'bonus': 0},
                'Pontaria': {'attr': 'destreza', 'treinada': False, 'bonus': 0},
                'Profissão': {'attr': 'inteligencia', 'treinada': False, 'bonus': 0},
                'Reflexos': {'attr': 'destreza', 'treinada': False, 'bonus': 0},
                'Religião': {'attr': 'sabedoria', 'treinada': False, 'bonus': 0},
                'Sobrevivência': {'attr': 'sabedoria', 'treinada': False, 'bonus': 0},
                'Tática': {'attr': 'inteligencia', 'treinada': False, 'bonus': 0},
                'Tecnologia': {'attr': 'inteligencia', 'treinada': False, 'bonus': 0},
                'Vontade': {'attr': 'presenca', 'treinada': False, 'bonus': 0}
            }
            self.pericias = json.dumps(default_pericias)

        if not self.resistencias or self.resistencias == '{}':
            default_res = {
                'Astúcia': {'treinada': False, 'mestre': False, 'bonus': 0, 'attr': 'inteligencia'},
                'Fortitude': {'treinada': False, 'mestre': False, 'bonus': 0, 'attr': 'constituicao'},
                'Integridade': {'treinada': False, 'mestre': False, 'bonus': 0, 'attr': 'constituicao'},
                'Reflexos': {'treinada': False, 'mestre': False, 'bonus': 0, 'attr': 'destreza'},
                'Vontade': {'treinada': False, 'mestre': False, 'bonus': 0, 'attr': 'presenca'}
            }
            self.resistencias = json.dumps(default_res)

        if not self.rds or self.rds == '{}':
            default_rds = {
                'COR': 0, 'IMP': 0, 'PER': 0, 'CON': 0, 'QUE': 0, 'CHO': 0,
                'SON': 0, 'ENE': 0, 'PSI': 0, 'RAD': 0, 'NEC': 0, 'VEN': 0
            }
            self.rds = json.dumps(default_rds)

        if not self.dados_vida or self.dados_vida == '{}':
            default_dv = {
                'd8': {'gastos': 0, 'max': 0},
                'd10': {'gastos': 0, 'max': 0},
                'd12': {'gastos': 0, 'max': 0}
            }
            self.dados_vida = json.dumps(default_dv)

        if not self.configuracoes or self.configuracoes == '{}':
            default_config = {
                'defesa_equip': 0,
                'defesa_outros': 0,
                'iniciativa_outros': 0,
                'iniciativa_treinada': False,
                'atencao_outros': 0,
                'cd_especializacao_attr': 'inteligencia',
                'cd_especializacao_outros': 0,
                'deslocamento': '9m',
                'pv_outros': 0,
                'pe_outros': 0
            }
            self.configuracoes = json.dumps(default_config)

        if not self.dominio or self.dominio == '{}':
            default_dominio = {
                'nome': 'Expansão de Domínio',
                'tipo': 'Letal',
                'custo': 20,
                'descricao': 'A técnica cria um espaço separado fechado por uma barreira e imbuído da técnica inata do usuário. Os ataques dentro de um domínio possuem acerto garantido.'
            }
            self.dominio = json.dumps(default_dominio)

        if not self.recent_logs or self.recent_logs == '[]':
            self.recent_logs = '[]'

    __tablename__ = 'characters'

    id      = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    nome           = db.Column(db.String(100), nullable=False)
    origem         = db.Column(db.String(100), default='Sem Técnica')
    especializacao = db.Column(db.String(100), default='Lutador')
    grau           = db.Column(db.String(50), default='Grau 4')
    nivel          = db.Column(db.Integer, default=1)
    xp             = db.Column(db.Integer, default=0)
    imagem_url     = db.Column(db.String(255))
    cor_energia    = db.Column(db.String(7), default='#8a2be2')

    inventario          = db.Column(db.Text, default='[]')
    ataques             = db.Column(db.Text, default='[]')
    pericias            = db.Column(db.Text, default='{}')
    feiticos            = db.Column(db.Text, default='[]')
    invocacoes          = db.Column(db.Text, default='[]')
    resistencias        = db.Column(db.Text, default='{}')
    rds                 = db.Column(db.Text, default='{}')
    habilidades_talentos = db.Column(db.Text, default='[]')
    dados_vida          = db.Column(db.Text, default='{}')
    anotacoes           = db.Column(db.Text, default='')
    caracteristicas     = db.Column(db.Text, default='[]')
    configuracoes       = db.Column(db.Text, default='{}')
    dominio             = db.Column(db.Text, default='{}')
    recent_logs         = db.Column(db.Text, default='[]')

    status     = db.relationship('Status', backref='character', uselist=False, cascade='all, delete-orphan')
    attributes = db.relationship('Attributes', backref='character', uselist=False, cascade='all, delete-orphan')

    # ── Propriedades calculadas ────────────────────────────────────────────
    @property
    def training_bonus(self):
        lvl = self.nivel or 1
        return math.floor((lvl - 1) / 4) + 2

    @property
    def half_level(self):
        lvl = self.nivel or 1
        return math.floor(lvl / 2)

    @property
    def mod_forca(self):        return math.floor((self.attributes.forca - 10) / 2) if self.attributes else 0
    @property
    def mod_destreza(self):     return math.floor((self.attributes.destreza - 10) / 2) if self.attributes else 0
    @property
    def mod_constituicao(self): return math.floor((self.attributes.constituicao - 10) / 2) if self.attributes else 0
    @property
    def mod_inteligencia(self): return math.floor((self.attributes.inteligencia - 10) / 2) if self.attributes else 0
    @property
    def mod_sabedoria(self):    return math.floor((self.attributes.sabedoria - 10) / 2) if self.attributes else 0
    @property
    def mod_presenca(self):     return math.floor((self.attributes.presenca - 10) / 2) if self.attributes else 0

    @property
    def iniciativa(self):
        try:
            config = json.loads(self.configuracoes or '{}')
        except:
            config = {}
        outros = config.get('iniciativa_outros', 0)
        is_trained = config.get('iniciativa_treinada', False)
        trained_bonus = self.training_bonus if is_trained else 0
        return self.mod_destreza + self.half_level + outros + trained_bonus

    @property
    def atencao_passiva(self):
        try:
            config = json.loads(self.configuracoes or '{}')
        except:
            config = {}
        outros_atencao = config.get('atencao_outros', 0)
        percep_total = 0
        try:
            pericias = json.loads(self.pericias or '{}')
            p = pericias.get('Percepção', {})
            p_bonus = p.get('bonus', 0)
            p_trained = p.get('treinada', False)
            percep_total = self.mod_sabedoria + self.half_level + p_bonus
            if p_trained:
                percep_total += self.training_bonus
        except:
            percep_total = self.mod_sabedoria + self.half_level
        return 10 + percep_total + outros_atencao

    @property
    def cd_especializacao(self):
        try:
            config = json.loads(self.configuracoes or '{}')
        except:
            config = {}
        attr_name = config.get('cd_especializacao_attr', 'inteligencia')
        outros = int(config.get('cd_especializacao_outros', 0))
        attr_mod = 0
        if attr_name == 'forca':          attr_mod = self.mod_forca
        elif attr_name == 'destreza':     attr_mod = self.mod_destreza
        elif attr_name == 'constituicao': attr_mod = self.mod_constituicao
        elif attr_name == 'inteligencia': attr_mod = self.mod_inteligencia
        elif attr_name == 'sabedoria':    attr_mod = self.mod_sabedoria
        elif attr_name == 'presenca':     attr_mod = self.mod_presenca
        return 10 + attr_mod + self.training_bonus + self.half_level + outros


class Status(db.Model):
    def __init__(self, **kwargs):
        super(Status, self).__init__(**kwargs)

    __tablename__ = 'status'

    id           = db.Column(db.Integer, primary_key=True)
    character_id = db.Column(db.Integer, db.ForeignKey('characters.id'), nullable=False, unique=True)

    pv_atual          = db.Column(db.Integer, default=10)
    pe_atual          = db.Column(db.Integer, default=5)
    integridade_atual = db.Column(db.Integer, default=10)
    falhas_morte      = db.Column(db.Integer, default=0)
    sucessos_morte    = db.Column(db.Integer, default=0)

    @property
    def estado_alma(self):
        if self.integridade_max == 0: return 'Desconhecido'
        pct = (self.integridade_atual / self.integridade_max) * 100
        if pct <= 0:  return 'Morto'
        if pct < 25:  return 'Crítico'
        if pct < 50:  return 'Instável'
        if pct < 75:  return 'Danificado'
        return 'Estável'

    @property
    def pv_base(self):
        char = self.character
        if not char: return 10
        bases = {
            'Lutador': (12, 6),
            'Especialista em Combate': (12, 6),
            'Especialista em Técnica': (10, 5),
            'Controlador': (10, 5),
            'Suporte': (10, 5),
            'Restringido': (16, 7)
        }
        b_init, b_lvl = bases.get(char.especializacao, (10, 5))
        lvl = char.nivel or 1
        return b_init + b_lvl * (lvl - 1)

    @property
    def pv_adicionado(self):
        char = self.character
        if not char or not char.attributes: return 0
        return char.mod_constituicao * (char.nivel or 1)

    @property
    def pv_bonus(self):
        char = self.character
        if not char: return 0
        bonus = 0
        if char.origem == 'Kamo':
            bonus += char.nivel
            if char.nivel >= 10:
                bonus += char.mod_constituicao
        try:
            pericias = json.loads(char.pericias or '{}')
            tr = pericias.get('_treinamentos', {})
            bonus += int(tr.get('reforco_corp', 0)) * 2
        except:
            pass
        try:
            config = json.loads(char.configuracoes or '{}')
            bonus += int(config.get('pv_outros', 0))
        except:
            pass
        return bonus

    @property
    def pv_max(self):
        return max(1, self.pv_base + self.pv_adicionado + self.pv_bonus)

    @property
    def pe_base(self):
        char = self.character
        if not char: return 0
        if char.origem == 'Restringido' or char.especializacao == 'Restringido': return 0
        bases = {
            'Lutador': 4,
            'Especialista em Combate': 4,
            'Especialista em Técnica': 6,
            'Controlador': 5,
            'Suporte': 5
        }
        return bases.get(char.especializacao, 0) * (char.nivel or 1)

    @property
    def pe_adicionado(self):
        char = self.character
        if not char or not char.attributes: return 0
        if char.origem == 'Restringido' or char.especializacao == 'Restringido': return 0
        if char.especializacao == 'Especialista em Técnica':
            return max(char.mod_inteligencia, char.mod_sabedoria)
        elif char.especializacao in ['Controlador', 'Suporte']:
            return max(char.mod_presenca, char.mod_sabedoria)
        return 0

    @property
    def pe_bonus(self):
        char = self.character
        if not char: return 0
        if char.origem == 'Restringido' or char.especializacao == 'Restringido': return 0
        bonus = 0
        if char.origem == 'Gojo':
            bonus += math.floor(char.nivel / 2)
        try:
            pericias = json.loads(char.pericias or '{}')
            tr = pericias.get('_treinamentos', {})
            bonus += int(tr.get('tecnica_ref', 0))
        except:
            pass
        try:
            config = json.loads(char.configuracoes or '{}')
            bonus += int(config.get('pe_outros', 0))
        except:
            pass
        return bonus

    @property
    def pe_max(self):
        return max(0, self.pe_base + self.pe_adicionado + self.pe_bonus)

    @property
    def integridade_max(self):
        return self.pv_max

    @property
    def defesa_base(self):
        return 10

    @property
    def defesa_adicionado(self):
        char = self.character
        if not char or not char.attributes: return 0
        return char.mod_destreza + math.floor((char.nivel or 1) / 2)

    @property
    def defesa_bonus(self):
        char = self.character
        if not char: return 0
        bonus = 0
        try:
            pericias = json.loads(char.pericias or '{}')
            tr = pericias.get('_treinamentos', {})
            bonus += int(tr.get('dom_simples', 0))
        except:
            pass
        return bonus

    @property
    def defesa(self):
        char = self.character
        if not char: return 10
        try:
            config = json.loads(char.configuracoes or '{}')
        except:
            config = {}
        return (self.defesa_base + self.defesa_adicionado + self.defesa_bonus
                + int(config.get('defesa_equip', 0))
                + int(config.get('defesa_outros', 0)))


class Attributes(db.Model):
    def __init__(self, **kwargs):
        super(Attributes, self).__init__(**kwargs)

    __tablename__ = 'attributes'

    id           = db.Column(db.Integer, primary_key=True)
    character_id = db.Column(db.Integer, db.ForeignKey('characters.id'), nullable=False, unique=True)

    forca        = db.Column(db.Integer, default=10)
    destreza     = db.Column(db.Integer, default=10)
    constituicao = db.Column(db.Integer, default=10)
    inteligencia = db.Column(db.Integer, default=10)
    sabedoria    = db.Column(db.Integer, default=10)
    presenca     = db.Column(db.Integer, default=10)
