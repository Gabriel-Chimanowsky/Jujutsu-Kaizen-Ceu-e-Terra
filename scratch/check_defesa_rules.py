import pypdf

pdf_path = "exemplo/Feiticeiros & Maldições - Livro de Regras v2.5.2 (1).pdf"
reader = pypdf.PdfReader(pdf_path)

pages = [20, 21]
for p in pages:
    print(f"=== Page {p} ===")
    text = reader.pages[p - 1].extract_text()
    if text:
        lines = text.split("\n")
        for line in lines:
            if "defesa" in line.lower():
                print(line)
