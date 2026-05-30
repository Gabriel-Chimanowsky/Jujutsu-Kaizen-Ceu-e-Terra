with open("templates/ficha.html", "r", encoding="utf-8") as f:
    code = f.read()

import re
matches = [m.start() for m in re.finditer(r'origem', code, re.IGNORECASE)]
print(f"Found {len(matches)} occurrences of 'origem' in templates/ficha.html.")
for m in matches[:10]:
    start = max(0, m - 50)
    end = min(len(code), m + 150)
    print(f"Context: {code[start:end].replace('\n', ' ')}")
