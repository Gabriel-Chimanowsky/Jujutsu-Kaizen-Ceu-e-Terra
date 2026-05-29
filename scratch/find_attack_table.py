import openpyxl

wb = openpyxl.load_workbook('exemplo/Modelo de Ficha - Feiticeiros & Maldições 2.5.xlsx', data_only=True)
sheet = wb['Ficha Pessoal']

# Let's search all cells in the first 40 rows for "JOGADAS DE ATAQUE" or "Corpo a Corpo"
for r in range(1, 45):
    for c in range(1, 50):
        val = sheet.cell(row=r, column=c).value
        if val and any(x in str(val).lower() for x in ["jogadas de", "corpo a", "amaldiçoado"]):
            print(f"Cell ({r},{c}) = {val}")
