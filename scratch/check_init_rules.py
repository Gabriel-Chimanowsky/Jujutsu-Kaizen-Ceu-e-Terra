import pypdf

pdf_path = "exemplo/Feiticeiros & Maldições - Livro de Regras v2.5.2 (1).pdf"
reader = pypdf.PdfReader(pdf_path)

# Let's search pages around page 20
pages = [20, 21, 22]
for p in pages:
    print(f"=== Page {p} ===")
    text = reader.pages[p - 1].extract_text()
    if text:
        lines = text.split("\n")
        for line in lines:
            if "iniciativa" in line.lower():
                print(line)
