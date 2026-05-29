import pypdf

pdf_path = "exemplo/Feiticeiros & Maldições - Livro de Regras v2.5.2 (1).pdf"
reader = pypdf.PdfReader(pdf_path)

print("=== Page 20 Text ===")
text20 = reader.pages[19].extract_text()
if text20:
    print(text20)

print("\n=== Page 21 Text ===")
text21 = reader.pages[20].extract_text()
if text21:
    print(text21)
