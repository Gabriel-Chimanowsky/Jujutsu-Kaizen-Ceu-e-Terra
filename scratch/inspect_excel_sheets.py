import openpyxl

wb = openpyxl.load_workbook("exemplo/Modelo de Ficha - Feiticeiros & Maldições 2.5.xlsx")
print("Sheet names:", wb.sheetnames)

# Print some defined names as well
print("\n--- Defined Names ---")
for name in wb.defined_names.definedName:
    print(f"{name.name}: {name.value}")
