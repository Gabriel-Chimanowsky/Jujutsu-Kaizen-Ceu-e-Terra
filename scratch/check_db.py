import sqlite3

conn = sqlite3.connect('database.db')
c = conn.cursor()

print("=== LOBBIES ===")
for r in c.execute("SELECT * FROM lobbies").fetchall():
    print(r)

print("\n=== COLUNAS de characters ===")
char_cols = [r[1] for r in c.execute("PRAGMA table_info(characters)").fetchall()]
print(char_cols[:10])  # primeiras 10 colunas

print("\n=== CHARACTERS (id, user_id, col3) ===")
for r in c.execute("SELECT id, user_id FROM characters").fetchall():
    print(r)

print("\n=== USERS ===")
for r in c.execute("SELECT id, username, role, lobby_id FROM users").fetchall():
    print(r)

conn.close()
