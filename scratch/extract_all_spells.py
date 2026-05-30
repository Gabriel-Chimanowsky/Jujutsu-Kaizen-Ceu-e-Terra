import re

with open("scratch/vidente_clean.txt", "r", encoding="utf-8") as f:
    text = f.read()

# Let's extract lines from === PAGE 10 === up to === PAGE 20 ===
pages = re.split(r'=== PAGE \d+ ===', text)

extracted = []
for idx, page_content in enumerate(pages):
    # page numbers in split are 1-based (idx 0 is before page 1, idx 1 is page 1, etc.)
    page_num = idx
    if 10 <= page_num <= 19:
        extracted.append(f"=== PAGE {page_num} ===\n" + page_content.strip() + "\n\n")

with open("scratch/vidente_spells_extracted.txt", "w", encoding="utf-8") as out:
    out.writelines(extracted)

print("Extracted pages 10 to 19 successfully.")
