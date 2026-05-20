import openpyxl

wb = openpyxl.load_workbook("exemplo/Modelo de Ficha - Feiticeiros & Maldições 2.5.xlsx", data_only=False)
sheet = wb[wb.sheetnames[4]]

print("--- MERGED CELL RANGES IN INVOCAÇÕES (index 4) ---")
for r in sorted(list(sheet.merged_cells.ranges), key=lambda x: (x.min_row, x.min_col)):
    if r.min_col <= 16 and r.min_row <= 35:
        print(f"Range: {r.coord}")
