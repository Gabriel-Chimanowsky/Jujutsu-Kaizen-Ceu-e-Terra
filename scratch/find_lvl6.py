with open("scratch/vidente_text.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

with open("scratch/lvl6_matches.txt", "w", encoding="utf-8") as out:
    for i, line in enumerate(lines):
        if "nível 6" in line.lower() or "6º nível" in line.lower() or "sequência" in line.lower() or "vidente" in line.lower() or "poção" in line.lower() or "habilidade" in line.lower():
            start = max(0, i - 2)
            end = min(len(lines), i + 8)
            out.write(f"--- MATCH AT LINE {i+1} ---\n")
            out.write("".join(lines[start:end]))
            out.write("\n\n")

print("Done! Check scratch/lvl6_matches.txt")
