import sqlite3
import json

conn = sqlite3.connect("database.db")
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

yamada = cursor.execute("SELECT * FROM characters WHERE id = 1").fetchone()
if yamada:
    y_dict = dict(yamada)
    per = json.loads(y_dict['pericias'] or '{}')
    print("=== Yamada PericiasKeys ===")
    for k, v in per.items():
        if k.startswith('_') or 'treinamento' in k.lower():
            print(f"{k}: {v}")
else:
    print("Yamada not found.")
