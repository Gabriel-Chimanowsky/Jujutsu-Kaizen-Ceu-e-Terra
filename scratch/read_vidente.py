import pypdf
import os

pdf_path = "exemplo/Caminho do Vidente-LordOfTheMysterys 2.5.2.pdf"
output_path = "scratch/vidente_text.txt"

os.makedirs("scratch", exist_ok=True)

reader = pypdf.PdfReader(pdf_path)
with open(output_path, "w", encoding="utf-8") as out:
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        out.write(f"=== PAGE {i+1} ===\n")
        out.write(text)
        out.write("\n\n")

print(f"Successfully extracted {len(reader.pages)} pages to {output_path}")
