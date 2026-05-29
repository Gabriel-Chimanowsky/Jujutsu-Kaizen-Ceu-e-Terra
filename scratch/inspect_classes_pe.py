import pypdf

pdf_path = "exemplo/Feiticeiros & Maldições - Livro de Regras v2.5.2 (1).pdf"
reader = pypdf.PdfReader(pdf_path)

print("--- Class PE and PV details in PDF ---")
for p in range(43, 49):
    print(f"\n================ PAGE {p} ================")
    text = reader.pages[p - 1].extract_text()
    if text:
        # Search for lines containing "Energia" or "Vida" or "Constitu" or similar
        lines = text.split('\n')
        for line in lines:
            if any(term in line.lower() for term in ["energia amaldiçoada", "vida", "constitu", "pelas", "subsequentes", "primeiro"]):
                print(f"  {line.strip()}")
