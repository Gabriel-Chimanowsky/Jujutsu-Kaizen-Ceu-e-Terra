import pypdf

pdf_path = "exemplo/Feiticeiros & Maldições - Livro de Regras v2.5.2 (1).pdf"
reader = pypdf.PdfReader(pdf_path)

matches = []
for i, page in enumerate(reader.pages):
    text = page.extract_text() or ""
    if "defesa" in text.lower():
        matches.append(i + 1)

print("Pages containing 'defesa':", matches[:20])
