with open("templates/create_character.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if "<input" in line or "<select" in line or "origem" in line.lower() or "especializacao" in line.lower() or "especialização" in line.lower():
        print(f"Line {idx+1}: {line.strip()}")
