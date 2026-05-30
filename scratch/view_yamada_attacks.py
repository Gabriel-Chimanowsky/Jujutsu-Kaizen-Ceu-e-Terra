import sqlite3
import json

conn = sqlite3.connect("database.db")
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

yamada = cursor.execute("SELECT * FROM characters WHERE id = 1").fetchone()
if yamada:
    y_dict = dict(yamada)
    attacks = json.loads(y_dict['ataques'] or '[]')
    print("=== Yamada Attacks ===")
    print(json.dumps(attacks, indent=2, ensure_ascii=False))
else:
    print("Yamada not found.")
