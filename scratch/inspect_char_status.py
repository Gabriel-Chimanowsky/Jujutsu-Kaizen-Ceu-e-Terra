import sqlite3

conn = sqlite3.connect("database.db")
cursor = conn.cursor()

print("--- CHARACTERS IN DATABASE ---")
cursor.execute("SELECT id, nome, origem, especializacao, nivel, xp FROM characters")
for r in cursor.fetchall():
    print(f"ID={r[0]}, Nome='{r[1]}', Origem='{r[2]}', Espec='{r[3]}', Nivel={r[4]}, XP={r[5]}")

print("\n--- STATUS IN DATABASE ---")
cursor.execute("SELECT id, character_id, pv_atual, pe_atual, integridade_atual FROM status")
for r in cursor.fetchall():
    print(f"ID={r[0]}, CharID={r[1]}, PV_Atual={r[2]}, PE_Atual={r[3]}, Integridade_Atual={r[4]}")
conn.close()
