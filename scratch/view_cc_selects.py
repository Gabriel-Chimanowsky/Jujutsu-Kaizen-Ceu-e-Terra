with open("templates/create_character.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx in range(29, 65):
    if idx < len(lines):
        print(f"Line {idx+1}: {lines[idx].strip()}")
