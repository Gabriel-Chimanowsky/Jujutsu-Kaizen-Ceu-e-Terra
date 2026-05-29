import pypdf

pdf_path = "exemplo/Feiticeiros & Maldições - Livro de Regras v2.5.2 (1).pdf"
reader = pypdf.PdfReader(pdf_path)

print("=== Page 44 Text ===")
text = reader.pages[43].extract_text()
if text:
    print(text)
else:
    print("Page 44 is empty")
