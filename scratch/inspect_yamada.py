import sqlite3
import json

conn = sqlite3.connect("database.db")
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

yamada = cursor.execute("SELECT * FROM characters WHERE id = 1").fetchone()
if yamada:
    y_dict = dict(yamada)
    print("=== Yamada Isamu JSON fields ===")
    for k in ['inventario', 'ataques', 'pericias', 'feiticos', 'invocacoes', 'resistencias', 'rds', 'habilidades_talentos', 'dados_vida', 'caracteristicas', 'configuracoes', 'dominio']:
        print(f"\n--- {k} ---")
        try:
            val = json.loads(y_dict[k])
            print(json.dumps(val, indent=2, ensure_ascii=False))
        except Exception as e:
            print(f"Error parsing: {y_dict[k]} | Error: {e}")
else:
    print("Yamada Isamu not found.")
