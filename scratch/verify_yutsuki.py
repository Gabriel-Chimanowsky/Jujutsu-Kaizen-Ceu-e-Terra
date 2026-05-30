import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from models import db, Character

def verify_yutsuki():
    with app.app_context():
        char = Character.query.filter_by(nome="Yutsuki Otokanutti").first()
        if not char:
            print("Error: Yutsuki Otokanutti not found in DB!")
            return
            
        print(f"=== Verification for {char.nome} ===")
        print(f"Level: {char.nivel} | Especializacao: {char.especializacao} | Origem: {char.origem}")
        
        # Base attributes
        attrs = char.attributes
        print(f"Attributes: FOR={attrs.forca}, DES={attrs.destreza}, CON={attrs.constituicao}, INT={attrs.inteligencia}, SAB={attrs.sabedoria}, PRE={attrs.presenca}")
        print(f"Modifiers: FOR={char.mod_forca}, DES={char.mod_destreza}, CON={char.mod_constituicao}, INT={char.mod_inteligencia}, SAB={char.mod_sabedoria}, PRE={char.mod_presenca}")
        
        # Computed PV
        status = char.status
        print(f"PV base: {status.pv_base}")
        print(f"PV adicionado: {status.pv_adicionado}")
        print(f"PV bonus: {status.pv_bonus}")
        print(f"PV max: {status.pv_max} (Expected: 38)")
        
        # Computed PE
        print(f"PE base: {status.pe_base}")
        print(f"PE adicionado: {status.pe_adicionado}")
        print(f"PE bonus: {status.pe_bonus}")
        
        # Passive reductions in the system
        feiticos_list = db.session.query(Character).get(char.id).feiticos
        import json
        fs = json.loads(feiticos_list)
        pe_reduction = 0
        for f in fs:
            if f.get('equipado') and f.get('tipo') == 'Passivo':
                lvl = int(f.get('nivel', 1))
                reduction_map = {0: 0, 1: 2, 2: 4, 3: 6, 4: 8, 5: 10}
                pe_reduction += reduction_map.get(lvl, lvl * 2)
        print(f"PE reduction from passives: {pe_reduction}")
        print(f"PE max: {status.pe_max} (Expected: 41)")
        
        # Computed Defesa
        print(f"Defesa base: {status.defesa_base}")
        print(f"Defesa adicionada: {status.defesa_adicionado}")
        print(f"Defesa bonus: {status.defesa_bonus}")
        print(f"Defesa total: {status.defesa} (Expected: 10 + 3 [half level] + 3 [destreza mod] = 16)")

if __name__ == '__main__':
    verify_yutsuki()
