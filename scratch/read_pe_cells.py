import openpyxl

wb_formula = openpyxl.load_workbook("exemplo/Modelo de Ficha - Feiticeiros & Maldições 2.5.xlsx", data_only=False)
wb_value = openpyxl.load_workbook("exemplo/Modelo de Ficha - Feiticeiros & Maldições 2.5.xlsx", data_only=True)

ws_f = wb_formula['Ficha Pessoal']
ws_v = wb_value['Ficha Pessoal']

cells = ['AC8', 'AF8', 'AI8']
print("=== PE Cells in Ficha Pessoal ===")
for cell in cells:
    val_f = ws_f[cell].value
    val_v = ws_v[cell].value
    print(f"Cell {cell}: Formula='{val_f}' | Value='{val_v}'")
