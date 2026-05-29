import openpyxl

wb = openpyxl.load_workbook("exemplo/Modelo de Ficha - Feiticeiros & Maldições 2.5.xlsx")

print("--- Defined Names ---")
for name, dn in wb.defined_names.items():
    # dn is a DefinedName object, dn.value is the formula / range
    print(f"Name: {name}")
    print(f"  Value (Range): {dn.value}")
    # Show destinations
    try:
        for dest in dn.destinations:
            print(f"  Destination: Sheet={dest[0]}, Cells={dest[1]}")
    except Exception as e:
        print(f"  Could not get destinations: {e}")
