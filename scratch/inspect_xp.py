import pypdf
import re

pdf_path = "exemplo/Feiticeiros & Maldições - Livro de Regras v2.5.2 (1).pdf"
reader = pypdf.PdfReader(pdf_path)

print("--- Inspecting pages 30 to 35 for XP Table ---")
for p in range(30, 36):
    print(f"\n================ PAGE {p} ================")
    text = reader.pages[p - 1].extract_text()
    if text:
        # Look for numbers like 1000, 3000, 6000, 10000, 15000
        print(text[:2000])
