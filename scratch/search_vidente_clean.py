import pypdf
import os
import re

pdf_path = "exemplo/Caminho do Vidente-LordOfTheMysterys 2.5.2.pdf"
output_path = "scratch/vidente_clean.txt"

os.makedirs("scratch", exist_ok=True)

reader = pypdf.PdfReader(pdf_path)
with open(output_path, "w", encoding="utf-8") as out:
    for i, page in enumerate(reader.pages):
        text = page.extract_text()
        # Let's clean up the text. Sometimes words are separated by newlines.
        # We can join lines that look like single words or parts of words.
        # A simple heuristic: if a line is just a single word or short text, join it with the next.
        lines = text.split("\n")
        cleaned_lines = []
        current_paragraph = []
        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
            # If the line ends with a hyphen or is short, or if the next line is a continuation
            # Let's just join words. Actually, let's see if we can reconstruct sentences.
            current_paragraph.append(line_str)
            if len(line_str) > 0 and (line_str[-1] in ['.', '!', '?', ':', ';'] or line_str.endswith('●') or line_str.endswith('○')):
                cleaned_lines.append(" ".join(current_paragraph))
                current_paragraph = []
        if current_paragraph:
            cleaned_lines.append(" ".join(current_paragraph))
            
        out.write(f"=== PAGE {i+1} ===\n")
        for cl in cleaned_lines:
            out.write(cl + "\n")
        out.write("\n")

print(f"Successfully cleaned extraction of {len(reader.pages)} pages to {output_path}")
