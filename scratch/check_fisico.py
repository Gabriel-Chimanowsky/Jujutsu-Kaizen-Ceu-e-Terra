import pypdf
import re

pdf_path = "exemplo/Feiticeiros & Maldições - Livro de Regras v2.5.2 (1).pdf"
reader = pypdf.PdfReader(pdf_path)

found = False
for i, page in enumerate(reader.pages):
    text = page.extract_text()
    if text and "físico controlado" in text.lower():
        print(f"--- Page {i + 1} ---")
        lines = text.split("\n")
        for line in lines:
            if "físico" in line.lower() or "controlado" in line.lower() or "presença" in line.lower() or "sabedoria" in line.lower():
                print(line)
        found = True

if not found:
    print("Not found in PDF.")
