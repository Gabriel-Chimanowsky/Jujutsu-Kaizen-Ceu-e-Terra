import sqlite3

conn = sqlite3.connect("database.db")
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

print("=== Lobbies ===")
for r in cursor.execute("SELECT * FROM lobbies").fetchall():
    print(dict(r))

print("\n=== Users ===")
for r in cursor.execute("SELECT * FROM users").fetchall():
    print(dict(r))

print("\n=== Characters ===")
chars = cursor.execute("SELECT * FROM characters").fetchall()
for char in chars:
    c_dict = dict(char)
    # Fetch status and attributes
    status = cursor.execute("SELECT * FROM status WHERE character_id = ?", (c_dict['id'],)).fetchone()
    attrs = cursor.execute("SELECT * FROM attributes WHERE character_id = ?", (c_dict['id'],)).fetchone()
    print(f"\nCharacter ID: {c_dict['id']} | Nome: {c_dict['nome']} | Especializacao: {c_dict['especializacao']} | Nivel: {c_dict['nivel']}")
    print(f"  Origem: {c_dict['origem']} | Grau: {c_dict['grau']} | XP: {c_dict['xp']}")
    if status:
        s_dict = dict(status)
        print(f"  Status: PV={s_dict['pv_atual']}, PE={s_dict['pe_atual']}, Integridade={s_dict['integridade_atual']}")
    if attrs:
        print(f"  Attributes: FOR={attrs['forca']}, DES={attrs['destreza']}, CON={attrs['constituicao']}, INT={attrs['inteligencia']}, SAB={attrs['sabedoria']}, PRE={attrs['presenca']}")
