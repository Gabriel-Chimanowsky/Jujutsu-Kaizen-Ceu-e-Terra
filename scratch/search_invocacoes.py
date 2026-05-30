import sqlite3
import json

conn = sqlite3.connect("database.db")
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

chars = cursor.execute("SELECT * FROM characters").fetchall()
for char in chars:
    c = dict(char)
    invs = json.loads(c['invocacoes'] or '[]')
    if invs:
        print(f"Char ID {c['id']} ({c['nome']}) invocacoes:")
        print(json.dumps(invs, indent=2, ensure_ascii=False))
