import pypdf

pdf_path = "exemplo/Feiticeiros & Maldições - Livro de Regras v2.5.2 (1).pdf"
reader = pypdf.PdfReader(pdf_path)

pages_to_extract = [20, 21, 23, 44, 45, 46, 47, 49, 109]

print("--- Extracting Pages ---")
for p in pages_to_extract:
    print(f"\n================ PAGE {p} ================")
    text = reader.pages[p - 1].extract_text()
    if text:
        print(text[:4000]) # Print first 4000 chars of each page
    else:
        print("[No text found or page empty]")
