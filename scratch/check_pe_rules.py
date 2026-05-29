import pypdf

pdf_path = "exemplo/Feiticeiros & Maldições - Livro de Regras v2.5.2 (1).pdf"
reader = pypdf.PdfReader(pdf_path)

# Let's search pages 20, 21, 33, 44, 49
pages_to_check = [20, 21, 33, 44, 49]
for p in pages_to_check:
    print(f"=== Page {p} ===")
    text = reader.pages[p - 1].extract_text()
    if text:
        lines = text.split("\n")
        for line in lines:
            if "energia" in line.lower() or "pe" in line.lower() or "estamina" in line.lower():
                print(line)
