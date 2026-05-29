import openpyxl

wb_formula = openpyxl.load_workbook("exemplo/Modelo de Ficha - Feiticeiros & Maldições 2.5.xlsx", data_only=False)
ws_f = wb_formula['Ficha Pessoal']
print("AI8 formula:", ws_f['AI8'].value)
