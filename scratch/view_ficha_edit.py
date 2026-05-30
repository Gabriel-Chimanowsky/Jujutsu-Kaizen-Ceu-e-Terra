with open("templates/ficha.html", "r", encoding="utf-8") as f:
    code = f.read()

import re
matches = [m.start() for m in re.finditer(r'(name=["\']origem["\']|name=["\']especializacao["\'])', code)]
print(f"Found {len(matches)} edit occurrences in templates/ficha.html.")
for m in matches:
    start = max(0, m - 100)
    end = min(len(code), m + 200)
    print(f"Context:\n{code[start:end]}\n---")
