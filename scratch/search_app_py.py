with open("app.py", "r", encoding="utf-8") as f:
    code = f.read()

# Let's find occurrences of invocacoes or invocacao or summons
import re
matches = [m.start() for m in re.finditer(r'(invocacoes|invocacao|summon)', code, re.IGNORECASE)]
print(f"Found {len(matches)} occurrences.")
for m in matches[:10]:
    start = max(0, m - 50)
    end = min(len(code), m + 100)
    print(f"Context: {code[start:end].replace('\n', ' ')}")
