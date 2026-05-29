import pypdf
import os
import re

pdf_path = "exemplo/Feiticeiros & Maldições - Livro de Regras v2.5.2 (1).pdf"

if not os.path.exists(pdf_path):
    print("PDF not found at:", pdf_path)
    exit(1)

reader = pypdf.PdfReader(pdf_path)
print("Total pages in PDF:", len(reader.pages))

# Search for some terms
terms = [
    "Pontos de Vida",
    "Pontos de Energia",
    "Especialista em Combate",
    "Especialista em Técnica",
    "Restringido",
    "Lutador",
    "Técnico",
    "Controlador",
    "Suporte",
    "XP",
    "Defesa",
    "Iniciativa",
    "Níveis",
    "Tabela",
    "Físico Controlado"
]

matches = {}
for term in terms:
    matches[term] = []

print("Searching pages for terms...")
# We will search a subset of pages or scan quickly
# Let's search all pages but limit printed matches to avoid huge output
for page_num in range(len(reader.pages)):
    text = reader.pages[page_num].extract_text()
    if not text:
        continue
    for term in terms:
        # Search case-insensitively
        if re.search(r'\b' + re.escape(term) + r'\b', text, re.IGNORECASE):
            matches[term].append(page_num + 1)

print("\n--- Search Results ---")
for term, pages in matches.items():
    print(f"'{term}': found on {len(pages)} pages (first few: {pages[:10]})")

# Let's write out some page contents where class descriptions, PE or PV formulas are likely to reside.
# For example, pages containing both "Pontos de Vida" and "Lutador" or "Controlador"
print("\nScanning for pages containing both 'Pontos de Vida' and 'Pontos de Energia' and a class:")
interesting_pages = []
for page_num in range(len(reader.pages)):
    text = reader.pages[page_num].extract_text() or ""
    if "pontos de vida" in text.lower() and "pontos de energia" in text.lower():
        interesting_pages.append(page_num + 1)
print("Interesting pages:", interesting_pages)
