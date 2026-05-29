import openpyxl

wb = openpyxl.load_workbook("exemplo/Modelo de Ficha - Feiticeiros & Maldições 2.5.xlsx", data_only=False)
sheet = wb['Ficha Pessoal']

print("--- MERGED CELL RANGES IN FICHA PESSOAL (ROWS 1 to 5) ---")
ranges = sorted(list(sheet.merged_cells.ranges), key=lambda x: (x.min_row, x.min_col))
for r in ranges:
    if r.min_row <= 5:
        print(f"Range: {r.coord} | MinRow: {r.min_row}, MaxRow: {r.max_row}, MinCol: {r.min_col}, MaxCol: {r.max_col}")
