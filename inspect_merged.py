import openpyxl

wb = openpyxl.load_workbook("exemplo/Modelo de Ficha - Feiticeiros & Maldições 2.5.xlsx", data_only=False)
sheet = wb['Perfil Amaldiçoado']

print("--- MERGED CELL RANGES IN PERFIL AMALDIÇOADO ---")
for r in sorted(list(sheet.merged_cells.ranges), key=lambda x: (x.min_row, x.min_col)):
    # If the range is in row 8 to 28 or column > 26
    if r.min_col >= 27:
        print(f"Range: {r.coord}")
