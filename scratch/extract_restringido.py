import pypdf

pdf_path = "exemplo/Feiticeiros & Maldições - Livro de Regras v2.5.2 (1).pdf"
reader = pypdf.PdfReader(pdf_path)

print("=== Page 114 Text ===")
text114 = reader.pages[113].extract_text()
if text114:
    print(text114)
else:
    print("Page 114 is empty")
