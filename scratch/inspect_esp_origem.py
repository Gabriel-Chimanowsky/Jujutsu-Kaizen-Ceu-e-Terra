import openpyxl
wb = openpyxl.load_workbook('exemplo/Modelo de Ficha - Feiticeiros & Maldições 2.5.xlsx', data_only=True)
sheet = wb['Ficha Pessoal']
print("especializacao:", sheet['AH3'].value)
print("origem:", sheet['AH2'].value)
