import sqlite3

conn = sqlite3.connect("database.db")
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print("=== User ID 2 Characters ===")
for r in cursor.execute("SELECT * FROM characters WHERE user_id = 2").fetchall():
    print(dict(r))
