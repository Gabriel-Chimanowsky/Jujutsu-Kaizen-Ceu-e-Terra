import openpyxl

wb = openpyxl.load_workbook("exemplo/Modelo de Ficha - Feiticeiros & Maldições 2.5.xlsx", data_only=False)
sheet = wb['Treinamentos']

print("--- MERGED CELL RANGES IN TREINAMENTOS ---")
for r in sorted(list(sheet.merged_cells.ranges), key=lambda x: (x.min_row, x.min_col)):
    print(f"Range: {r.coord}")
