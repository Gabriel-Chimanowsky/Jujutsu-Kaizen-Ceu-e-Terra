from app import app
from models import Character, Status, Attributes, db

with app.app_context():
    chars = Character.query.all()
    print("=== Model Property Evaluations ===")
    for char in chars:
        print(f"\nCharacter: {char.nome} (ID: {char.id})")
        print(f"  Especializacao: {char.especializacao} | Origem: {char.origem} | Nivel: {char.nivel}")
        
        # Test PV properties
        print(f"  PV: base={char.status.pv_base if char.status else '?'}, adicionado={char.status.pv_adicionado if char.status else '?'}, bonus={char.status.pv_bonus if char.status else '?'}, max={char.status.pv_max if char.status else '?'}, atual={char.status.pv_atual if char.status else '?'}")
        
        # Test PE properties
        print(f"  PE: base={char.status.pe_base if char.status else '?'}, adicionado={char.status.pe_adicionado if char.status else '?'}, bonus={char.status.pe_bonus if char.status else '?'}, max={char.status.pe_max if char.status else '?'}, atual={char.status.pe_atual if char.status else '?'}")
        
        # Test other properties
        print(f"  Defesa: base={char.status.defesa_base if char.status else '?'}, adicionado={char.status.defesa_adicionado if char.status else '?'}, bonus={char.status.defesa_bonus if char.status else '?'}, total={char.status.defesa if char.status else '?'}")
        print(f"  Iniciativa: {char.iniciativa}")
        print(f"  Atencao Passiva: {char.atencao_passiva}")
        print(f"  CD Especializacao: {char.cd_especializacao}")
        print(f"  Estado da Alma: {char.status.estado_alma if char.status else '?'}")
