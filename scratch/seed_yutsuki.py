import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from models import db, User, Character, Status, Attributes

def seed_yutsuki():
    with app.app_context():
        print("=== Seeding Yutsuki Otokanutti ===")
        
        # 1. Ensure user 'Yutsuki Otokanutti' exists with id=2
        user = User.query.get(2)
        if not user:
            user = User.query.filter_by(username="Yutsuki Otokanutti").first()
        
        if not user:
            print("User id=2 or Yutsuki Otokanutti not found. Creating user...")
            user = User(id=2, username="Yutsuki Otokanutti", role="Jogador", lobby_id=2)
            user.set_password("yutsuki123")
            db.session.add(user)
            db.session.commit()
            print(f"Created User: {user.username} with ID {user.id}")
        else:
            print(f"Found User: {user.username} with ID {user.id}")
            # Ensure it is a Jogador
            user.role = "Jogador"
            user.lobby_id = 2
            db.session.commit()

        # 2. Check if a character named 'Yutsuki Otokanutti' already exists and delete it
        old_chars = Character.query.filter_by(nome="Yutsuki Otokanutti").all()
        for oc in old_chars:
            print(f"Deleting existing character ID {oc.id}...")
            # Related records will delete on cascade
            db.session.delete(oc)
        db.session.commit()

        # 3. Create the Character
        char = Character(
            user_id=user.id,
            nome="Yutsuki Otokanutti",
            origem="Derivado",
            especializacao="Controlador",
            grau="Grau 2",
            nivel=6,
            xp=15000,
            cor_energia="#4b0082", # Indigo / Deep Purple
            peso="68kg",
            altura="1.78m",
            afiliacao="Colégio Técnico de Jujutsu (Caminho do Vidente)",
            votos_ativos="Restrição Congênita Universal: Beyonder"
        )
        
        # 4. Create standard lists & JSONs
        # Pericias
        pericias_dict = {
            'Acrobacia': {'attr': 'destreza', 'treinada': True, 'bonus': 0},
            'Atletismo': {'attr': 'forca', 'treinada': False, 'bonus': 0},
            'Atualidades': {'attr': 'inteligencia', 'treinada': False, 'bonus': 0},
            'Ciências': {'attr': 'inteligencia', 'treinada': False, 'bonus': 0},
            'Crime': {'attr': 'destreza', 'treinada': False, 'bonus': 0},
            'Diplomacia': {'attr': 'presenca', 'treinada': False, 'bonus': 0},
            'Enganação': {'attr': 'presenca', 'treinada': True, 'bonus': 0},
            'Feitiçaria': {'attr': 'inteligencia', 'treinada': True, 'bonus': 0},
            'Furtividade': {'attr': 'destreza', 'treinada': True, 'bonus': 0},
            'Iniciativa': {'attr': 'destreza', 'treinada': True, 'bonus': 0},
            'Intimidação': {'attr': 'presenca', 'treinada': False, 'bonus': 0},
            'Intuição': {'attr': 'sabedoria', 'treinada': True, 'bonus': 0},
            'Investigação': {'attr': 'inteligencia', 'treinada': True, 'bonus': 0},
            'Luta': {'attr': 'forca', 'treinada': False, 'bonus': 0},
            'Medicina': {'attr': 'sabedoria', 'treinada': False, 'bonus': 0},
            'Ocultismo': {'attr': 'sabedoria', 'treinada': True, 'bonus': 0},
            'Percepção': {'attr': 'sabedoria', 'treinada': True, 'bonus': 0},
            'Pontaria': {'attr': 'destreza', 'treinada': True, 'bonus': 0},
            'Profissão': {'attr': 'inteligencia', 'treinada': False, 'bonus': 0},
            'Reflexos': {'attr': 'destreza', 'treinada': True, 'bonus': 0},
            'Religião': {'attr': 'sabedoria', 'treinada': False, 'bonus': 0},
            'Sobrevivência': {'attr': 'sabedoria', 'treinada': False, 'bonus': 0},
            'Tática': {'attr': 'inteligencia', 'treinada': False, 'bonus': 0},
            'Tecnologia': {'attr': 'inteligencia', 'treinada': False, 'bonus': 0},
            'Vontade': {'attr': 'presenca', 'treinada': True, 'bonus': 0},
            '_treinamentos': {'reforco_corp': 0, 'tecnica_ref': 0, 'dom_simples': 0, 'resistencia': 0}
        }
        char.pericias = json.dumps(pericias_dict, ensure_ascii=False)

        # Resistências
        resistencias_dict = {
            'Astúcia': {'treinada': True, 'mestre': False, 'bonus': 0, 'attr': 'inteligencia'},
            'Fortitude': {'treinada': False, 'mestre': False, 'bonus': 0, 'attr': 'constituicao'},
            'Integridade': {'treinada': False, 'mestre': False, 'bonus': 0, 'attr': 'constituicao'},
            'Reflexos': {'treinada': True, 'mestre': False, 'bonus': 0, 'attr': 'destreza'},
            'Vontade': {'treinada': True, 'mestre': False, 'bonus': 0, 'attr': 'presenca'}
        }
        char.resistencias = json.dumps(resistencias_dict, ensure_ascii=False)

        # RDs
        rds_dict = {
            'COR': 0, 'IMP': 0, 'PER': 0, 'CON': 0, 'QUE': 0, 'CHO': 0,
            'SON': 0, 'ENE': 0, 'PSI': 0, 'RAD': 0, 'NEC': 0, 'VEN': 0
        }
        char.rds = json.dumps(rds_dict, ensure_ascii=False)

        # Configurações
        configuracoes_dict = {
            'defesa_equip': 0,
            'defesa_outros': 0,
            'iniciativa_outros': 0,
            'iniciativa_treinada': True,
            'atencao_outros': 0,
            'cd_especializacao_attr': 'sabedoria',
            'cd_especializacao_outros': 0,
            'deslocamento': '9m',
            'pv_outros': -3, # -1 PV for every odd level (levels 1, 3, 5)
            'pe_outros': 24, # 7 from level 6 + 17 from passive PE reduction compensation
            'ataque_corpo_corpo': {
                'treinada': False,
                'outros': 0,
                'atributo': 'destreza'
            },
            'ataque_a_distancia': {
                'treinada': True,
                'outros': 2, # +2 from Disparo de cartas or items
                'atributo': 'destreza'
            },
            'ataque_amaldicoado': {
                'treinada': True,
                'outros': 0,
                'atributo': 'sabedoria'
            },
            'pv_kamo': False,
            'pv_robustez': False,
            'pv_deslocamento': False,
            'pv_vigor_infinito': False
        }
        char.configuracoes = json.dumps(configuracoes_dict, ensure_ascii=False)

        # Domínio
        dominio_dict = {
            'nome': "Expansão de Domínio Incompleta (Castelo de Safirah)",
            'tipo': "Incompleta",
            'custo': 15,
            'descricao': "Projeta a névoa histórica do Castelo de Safirah sobre a realidade, garantindo bônus e permitindo manifestar a dimensão mística temporariamente."
        }
        char.dominio = json.dumps(dominio_dict, ensure_ascii=False)

        # Inventário
        inventario_list = [
            {"id": 1, "nome": "Deck de Cartas de Tarot", "peso": "0.1kg", "espaco": "1", "quantidade": 1, "desc": "Usado para adivinhação e para o feitiço Disparo de Cartas."},
            {"id": 2, "nome": "Estatuetas de Papel", "peso": "0.1kg", "espaco": "1", "quantidade": 10, "desc": "Usadas para o feitiço Substituição de Figuras de Papel."},
            {"id": 3, "nome": "Moeda da Sorte", "peso": "0.0kg", "espaco": "0", "quantidade": 1, "desc": "Moeda de prata usada para a Técnica da Moeda."}
        ]
        char.inventario = json.dumps(inventario_list, ensure_ascii=False)

        # Invocações (Shikigamis)
        invocacoes_list = [
            {
                'id': 1,
                'nome': "Mensageiro do Vidente",
                'hp_atual': 22, # 16 + level 6 = 22
                'hp_max': 22,
                'pe_atual': 5,
                'pe_max': 5,
                'ataque': "1d6+2",
                'defesa': 13, # 10 + BT 3 = 13
                'desc': "Shikigami de 4° Grau. Custo de Invocação: 1 PE.\nAtributos: 8 FOR / 8 DES / 10 CON / 12 SAB / 14 INT / 12 PRE\nPerícias: Feitiçaria, Ocultismo, História, Vontade.\nInvisibilidade [Ação Complexa]: Gasta 2 PE e 1 PE Sustentado para manter o Shikigami sob a condição Invisível.\nMensageiro de Beyonder-Teletransportador: Teletransporta-se para espaços adjacentes a indivíduos identificados, transportando objetos de até 500g e compartilhando sua memória e compreensão de idiomas."
            }
        ]
        char.invocacoes = json.dumps(invocacoes_list, ensure_ascii=False)

        # Ataques
        ataques_list = [
            {
                'id': 1,
                'nome': "Disparo de Cartas",
                'pericia': "Pontaria",
                'dano_dados': "2d8",
                'dano_attr': "destreza",
                'bonus_acerto': 2, # +2 from the spell description
                'bonus_dano': 0,
                'critico': "20 / x2",
                'alcance': "12m",
                'tipo': "Perfurante"
            },
            {
                'id': 2,
                'nome': "Disparo de Balas de Ar",
                'pericia': "Feitiçaria",
                'dano_dados': "4d8",
                'dano_attr': "sabedoria",
                'bonus_acerto': 0,
                'bonus_dano': 10, # +10 from Tiros de Ar Fatais passive
                'critico': "19 / x3",
                'alcance': "18m",
                'tipo': "Perfurante"
            },
            {
                'id': 3,
                'nome': "Controle de Chamas (Labareda)",
                'pericia': "Feitiçaria",
                'dano_dados': "4d8",
                'dano_attr': "sabedoria",
                'bonus_acerto': 0,
                'bonus_dano': 10, # +10 from Tiros de Ar Fatais passive
                'critico': "20 / x2",
                'alcance': "24m",
                'tipo': "Queimante"
            }
        ]
        char.ataques = json.dumps(ataques_list, ensure_ascii=False)

        # Talentos
        talentos_list = [
            {
                "id": 1,
                "nome": "Beyonder (Universal)",
                "tipo": "Origem",
                "custo": 0,
                "execucao": "Passiva",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "descricao": "Você consumiu uma Característica Amaldiçoada. Benefícios:\n- O custo de PE de feitiços ativos e permanente de feitiços passivos é reduzido em 3 (mínimo 1 PE).\n- Pode equipar até 3 efeitos de Expansão de Domínio e usufruir integralmente do nível 5 de DOM.\n- Ganha 1 PE adicional a cada nível e nos níveis 5, 10, 15, 20.\nMalefícios:\n- Perde 1 PV permanentemente a cada nível ímpar.\n- Não pode aumentar a Constituição.\n- Não pode criar votos próprios ou feitiços fora do caminho.\n- Não pode obter Reversão de Técnica ou usar Energia Reversa (sofre dano e vulnerabilidade a ela)."
            },
            {
                "id": 2,
                "nome": "Herdeiro do Castelo de Safirah",
                "tipo": "Técnica",
                "custo": 0,
                "execucao": "Ritual Estendido",
                "alcance": "Mundial",
                "duracao": "Especial",
                "descricao": "Nexo místico de Névoa Cinzenta. Permite convocar almas (Clube do Tarô), purificar itens, amplificar adivinhações, transferir itens por rituais de sacrifício, projetar a névoa para Expansão de Domínio Incompleta, e garantir ressurreição.\nMalefício (Voto Herdeiro): Toda vez que acessar o Castelo ou usar seus benefícios, role um TR de Vontade (CD 10 + 1 por sucesso acumulado) para evitar que o Feiticeiro Ancestral apague sua mente. Cada falha custa 2% da personalidade. Escapar da morte custa 20% da personalidade."
            },
            {
                "id": 3,
                "nome": "Restrição Congênita: Vidente",
                "tipo": "Classe",
                "custo": 0,
                "execucao": "Passiva",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "descricao": "Acreditar que as revelações do Mundo Espiritual são comandos diretos ou verdades absolutas sobre si mesmo faz o portador enlouquecer e virar uma maldição."
            },
            {
                "id": 4,
                "nome": "Restrição Congênita: Palhaço",
                "tipo": "Classe",
                "custo": 0,
                "execucao": "Passiva",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "descricao": "Internalizar a máscara de alegria a ponto de suprimir a capacidade de sentir emoções reais (esquece como expressar dor, tristeza, raiva) faz o portador virar uma maldição."
            },
            {
                "id": 5,
                "nome": "Restrição Congênita: Mago",
                "tipo": "Classe",
                "custo": 0,
                "execucao": "Passiva",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "descricao": "Confundir o power real com um truque de palco e tornar-se viciado na adoração do público (agir imprudentemente pelo espetáculo) faz o portador virar uma maldição."
            },
            {
                "id": 6,
                "nome": "Restrição Congênita: Sem-Rosto",
                "tipo": "Classe",
                "custo": 0,
                "execucao": "Passiva",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "descricao": "Manter-se transformado por muito tempo gera 1 Ponto de Exaustão por Cena (acumular 6 pontos o transforma em uma maldição), e passar tempo excessivo em uma identidade falsa adota os laços emocionais do alvo (dissolução de ego)."
            },
            {
                "id": 7,
                "nome": "Aura Anuladora",
                "tipo": "Origem",
                "custo": 0,
                "execucao": "Passiva",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "descricao": "Você possui uma aura especial provinda de sua energia antinatural."
            },
            {
                "id": 8,
                "nome": "Reserva Oculta de Energia",
                "tipo": "Origem",
                "custo": 0,
                "execucao": "Ação Bônus",
                "alcance": "Pessoal",
                "duracao": "Instantânea",
                "descricao": "Dentro de combate, como ação bônus, você pode recuperar uma quantidade de energia amaldiçoada igual ao dobro do seu bônus de treinamento (6 PE). Pode usar uma vez por dia."
            }
        ]
        char.habilidades_talentos = json.dumps(talentos_list, ensure_ascii=False)

        # Spells (Feitiços)
        feiticos_list = [
            # Passives
            {
                "id": 1,
                "nivel": 0,
                "nome": "Premonição",
                "custo": 0,
                "acao": "Passiva",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "dano": "",
                "descricao": "Imune à condição 'Surpreendido'. Bônus de +BT em testes de Percepção, Investigação, Intuição se gastar 3 PE. Recebe mensagens a distância por orações.",
                "tipo": "Passivo",
                "equipado": True
            },
            {
                "id": 2,
                "nivel": 0,
                "nome": "Controle Corporal Absoluto",
                "custo": 0,
                "acao": "Passiva",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "dano": "",
                "descricao": "Controle absoluto de coordenação. Imune a testes de intuição/leitura para descobrir emoções/pensamentos. Gastar 1 PE dá Vantagem em atuação. Sofre no máximo 8d6 dano queda silenciosamente.",
                "tipo": "Passivo",
                "equipado": True
            },
            {
                "id": 3,
                "nivel": 2,
                "nome": "Aprimoramento Físico: Força",
                "custo": 1,
                "acao": "Passiva",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "dano": "",
                "descricao": "Você ganha +2 no Atributo de Força.",
                "tipo": "Passivo",
                "equipado": True
            },
            {
                "id": 4,
                "nivel": 2,
                "nome": "Aprimoramento Físico: Destreza",
                "custo": 1,
                "acao": "Passiva",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "dano": "",
                "descricao": "Você ganha +2 no Atributo de Destreza.",
                "tipo": "Passivo",
                "equipado": True
            },
            {
                "id": 5,
                "nivel": 2,
                "nome": "Louvre do Palhaço",
                "custo": 1,
                "acao": "Passiva",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "dano": "",
                "descricao": "Ao atacar ou conjurar, ganha ação de movimento extra (metade do deslocamento). Se acertar corpo a corpo ou à distância adjacente, afasta-se sem provocar ataques de oportunidade.",
                "tipo": "Passivo",
                "equipado": True
            },
            {
                "id": 6,
                "nivel": 0,
                "nome": "Truques de Palco",
                "custo": 0,
                "acao": "Passiva",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "dano": "",
                "descricao": "Transmuta papel em itens simples (1 cena), simula a própria morte, filtra oxigênio/cria bolhas de ar (1 hora), amolece ossos para escapar de agarres, planar anula danos de queda.",
                "tipo": "Passivo",
                "equipado": True
            },
            {
                "id": 7,
                "nivel": 2,
                "nome": "Aprimoramento da Sequência 7",
                "custo": 1,
                "acao": "Passiva",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "dano": "",
                "descricao": "Truques de Seq 7 duram mais (bolha ar = 6h, itens = 1 dia). Invisibilidade em sombras. Teleporte de fogo ganha 1.5x alcance. Substituição de papel dura 4 rodadas. Vidência funciona sem instrumentos a 30m.",
                "tipo": "Passivo",
                "equipado": True
            },
            {
                "id": 8,
                "nivel": 3,
                "nome": "Tiros de Ar Fatais",
                "custo": 1,
                "acao": "Passiva",
                "alcance": "Pessoal",
                "duracao": "Permanente",
                "dano": "+10 Fixo",
                "descricao": "Tiros de ar se tornam fuzis de precisão. Este feitiço e todos os seus outros feitiços de dano ganham +10 de dano Fixo.",
                "tipo": "Passivo",
                "equipado": True
            },
            
            # Actives
            {
                "id": 9,
                "nivel": 1,
                "nome": "Vidência",
                "custo": 1,
                "acao": "Ação Completa",
                "alcance": "30m",
                "duracao": "Sustentado",
                "dano": "",
                "descricao": "Concede percepção mística (Radiestesia, Olhos Espirituais, Técnica do Cordão/Moeda, Clarividência, Leitura, Premonição Básica/Avançada, Previsão Básica/Avançada, Revelação de Ponto Fraco, Técnica dos Sonhos, Canalização de Espírito).",
                "tipo": "Ativo",
                "equipado": True
            },
            {
                "id": 10,
                "nivel": 1,
                "nome": "Corpo Espiritual",
                "custo": 1,
                "acao": "Ritual Estendido",
                "alcance": "Pessoal",
                "duracao": "Sustentado",
                "dano": "",
                "descricao": "Projeta um fantasma imaterial com sentidos intactos (alcance 1km por avanço). Corpo físico fica paralisado. Dano direto na alma. Sob o sol, sofre 12d12 de dano Queimante a partir da 3ª rodada.",
                "tipo": "Ativo",
                "equipado": True
            },
            {
                "id": 11,
                "nivel": 1,
                "nome": "Ritual de Invocação",
                "custo": 1,
                "acao": "Ritual Estendido",
                "alcance": "18m",
                "duracao": "Especial",
                "dano": "",
                "descricao": "Invoca entidades para realizar pedidos por coincidências limitadas. Role 1d10 - 6. Se der -1, pedido negado e punição severa.",
                "tipo": "Ativo",
                "equipado": True
            },
            {
                "id": 12,
                "nivel": 2,
                "nome": "Barreira de Espiritualidade",
                "custo": 3,
                "acao": "Ação Comum / Ritual",
                "alcance": "Pessoal",
                "duracao": "Sustentado",
                "dano": "",
                "descricao": "Isola a energia amaldiçoada. Garante +2 na CD de Técnica, imunidade à leitura de aura e ausência de rastros. Se Ritual Estendido com velas: +5 na CD de Técnica e permanente.",
                "tipo": "Ativo",
                "equipado": True
            },
            {
                "id": 13,
                "nivel": 2,
                "nome": "Disparo de Cartas",
                "custo": 3,
                "acao": "Ação Comum",
                "alcance": "12m",
                "duracao": "Imediata",
                "dano": "2d8 (ou 3d8 / 5d8)",
                "descricao": "Utiliza cartas de Tarot. Realiza até 4 ataques (+2 acerto), causando dano perfurante: 2d8 por carta, 3d8 se focar 2-3 alvos, 5d8 em alvo único. Evita Sangramento Médio (TR Fortitude). Upgrade Nível 3: 3d8 / 7d8 / 14d8.",
                "tipo": "Ativo",
                "equipado": True
            },
            {
                "id": 14,
                "nivel": 3,
                "nome": "Precognição de Curto Prazo",
                "custo": 6,
                "acao": "Reação",
                "alcance": "Pessoal",
                "duracao": "Imediata",
                "dano": "",
                "descricao": "Reação a uma ação hostil para andar metade do deslocamento sem provocar ataques de oportunidade. Se sair do alcance/cobertura, ataque erra.",
                "tipo": "Ativo",
                "equipado": True
            },
            {
                "id": 15,
                "nivel": 2,
                "nome": "Substituição de Figuras de Papel",
                "custo": 3,
                "acao": "Ação Comum",
                "alcance": "Toque",
                "duracao": "4 rodadas",
                "dano": "",
                "descricao": "Vincula existência a estatueta de papel. Imune a danos comuns (exceto Psíquico, Alma, Energia Reversa), recebe o dobro/triplo se papel for atingido. Ataques apenas amassam e empurram 4.5m, causando Ferimentos Complexos.",
                "tipo": "Ativo",
                "equipado": True
            },
            {
                "id": 16,
                "nivel": 2,
                "nome": "Controle de Chamas",
                "custo": 3,
                "acao": "Ação Bônus",
                "alcance": "24m",
                "duracao": "Imediata",
                "dano": "4d8 Queimante",
                "descricao": "Manipula chamas próximas para labareda de 4d8 em área de 4.5m (Reflexos reduz à metade) ou teletransporta-se instantaneamente entre chamas.",
                "tipo": "Ativo",
                "equipado": True
            },
            {
                "id": 17,
                "nivel": 1,
                "nome": "Criação de Ilusões",
                "custo": 1,
                "acao": "Ação Livre",
                "alcance": "18m",
                "duracao": "Cena",
                "dano": "8d8 Psíquico",
                "descricao": "Cria ilusões visuais ou sonoras simples intangíveis. Nível 2: Sustentado, 8 cubos. Nível 3: TR Vontade ou 8d8 dano psíquico.",
                "tipo": "Ativo",
                "equipado": True
            },
            {
                "id": 18,
                "nivel": 3,
                "nome": "Disparo de Balas de Ar",
                "custo": 6,
                "acao": "Ação Comum",
                "alcance": "18m",
                "duracao": "Imediata",
                "dano": "4d8 (ou 8d8 / 16d8)",
                "descricao": "Dispara ar comprimido sem barulho. Realiza 4 ataques, causando dano perfurante: 4d8 por bala, 8d8 para 2-3 alvos, 16d8 para alvo único. Upgrade Nível 4: 5d10 / 9d10 / 18d10.",
                "tipo": "Ativo",
                "equipado": True
            },
            {
                "id": 19,
                "nivel": 4,
                "nome": "Ferimentos Falsos e Cura Rápida",
                "custo": 9,
                "acao": "Ação Comum",
                "alcance": "Pessoal",
                "duracao": "Imediata",
                "dano": "",
                "descricao": "Cura 14d10 PVs Temporários a si mesmo. Remove sangramentos a custo de dados de cura.",
                "tipo": "Ativo",
                "equipado": True
            },
            {
                "id": 20,
                "nivel": 3,
                "nome": "Transferência de Dano Mímico",
                "custo": 6,
                "acao": "Ação Bônus / Comum",
                "alcance": "Toque",
                "duracao": "Permanente",
                "dano": "Especial",
                "descricao": "Transfere dano e complexidade de uma lesão de si para outra parte do próprio corpo ou para o interior de um alvo voluntário.",
                "tipo": "Ativo",
                "equipado": True
            },
            {
                "id": 21,
                "nivel": 2,
                "nome": "Adivinhação Instantânea",
                "custo": 3,
                "acao": "Ação Bônus",
                "alcance": "Pessoal",
                "duracao": "1 rodada",
                "dano": "",
                "descricao": "Permite usar Vidência como Ação Livre sem benefícios mecânicos. Garante bônus de +4 DEF e +2 em TR de Reflexos por 1 rodada.",
                "tipo": "Ativo",
                "equipado": True
            },
            {
                "id": 22,
                "nivel": 4,
                "nome": "Mimetismo Absoluto",
                "custo": 9,
                "acao": "Ação Completa / Ritual",
                "alcance": "Pessoal",
                "duracao": "Sustentado / Permanente",
                "dano": "",
                "descricao": "Metamorfose física real em qualquer pessoa vista. Garante +7 em Atuação e replica atributos físicos/anatômicos de origem biológica. Pode ser feita permanente via Ritual Estendido (2 turnos).",
                "tipo": "Ativo",
                "equipado": True
            }
        ]
        char.feiticos = json.dumps(feiticos_list, ensure_ascii=False)

        # Add to session
        db.session.add(char)
        db.session.commit()
        print(f"Created Character: {char.nome} with ID {char.id}")

        # 5. Create Status
        status = Status(
            character_id=char.id,
            pv_atual=38,
            pe_atual=41,
            integridade_atual=38,
            falhas_morte=0,
            sucessos_morte=0
        )
        db.session.add(status)

        # 6. Create Attributes
        # Base values before passives: FOR=10, DES=14, CON=12, INT=16, SAB=18, PRE=14
        # Passives (+2 Força and +2 Destreza) are handled as passive modifiers, but wait:
        # Does the sheet calculate modifiers based on the database attributes?
        # Yes! The attributes table columns are what 'mod_forca' etc read.
        # So we should put: FOR=12 and DES=16 in the attributes table directly so the sheet computes the mod properly, or keep base FOR=10 and DES=14.
        # Since the passives are permanent and active, let's put FOR=12 and DES=16 directly in the attributes table so the sheet computes the modifiers correctly (+1 FOR mod, +3 DES mod)!
        # Let's put the fully adjusted values:
        attrs = Attributes(
            character_id=char.id,
            forca=12,       # 10 + 2 from Aprimoramento Físico
            destreza=16,    # 14 + 2 from Aprimoramento Físico
            constituicao=12,
            inteligencia=16,
            sabedoria=18,
            presenca=14
        )
        db.session.add(attrs)
        db.session.commit()
        print("[OK] Seeding complete!")

if __name__ == '__main__':
    seed_yutsuki()
