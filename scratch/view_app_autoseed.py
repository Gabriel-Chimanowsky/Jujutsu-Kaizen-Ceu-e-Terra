with open("app.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

for r in range(195, 230):
    if r < len(lines):
        print(f"Line {r+1}: {lines[r].strip()}")
