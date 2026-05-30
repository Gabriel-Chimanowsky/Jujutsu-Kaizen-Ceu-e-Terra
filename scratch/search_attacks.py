import sqlite3
import json

conn = sqlite3.connect("database.db")
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

chars = cursor.execute("SELECT * FROM characters").fetchall()
for char in chars:
    c = dict(char)
    attacks = json.loads(c['ataques'] or '[]')
    if attacks:
        print(f"Char ID {c['id']} ({c['nome']}) attacks:")
        print(json.dumps(attacks, indent=2, ensure_ascii=False))
