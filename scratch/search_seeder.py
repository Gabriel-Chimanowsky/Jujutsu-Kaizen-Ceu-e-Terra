with open("app.py", "r", encoding="utf-8") as f:
    code = f.read()

import re
matches = [m.start() for m in re.finditer(r'(Yamada|Ryome)', code)]
print(f"Found {len(matches)} occurrences.")
for m in matches[:10]:
    start = max(0, m - 50)
    end = min(len(code), m + 150)
    print(f"Context: {code[start:end].replace('\n', ' ')}")
