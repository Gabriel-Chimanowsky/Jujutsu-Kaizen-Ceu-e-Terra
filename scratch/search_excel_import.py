with open("app.py", "r", encoding="utf-8") as f:
    code = f.read()

import re
matches = [m.start() for m in re.finditer(r'@app\.route\(.*?upload_ficha.*?\)', code, re.IGNORECASE)]
print(f"Found {len(matches)} route occurrences.")
for m in matches:
    start = max(0, m - 10)
    end = min(len(code), m + 800)
    print(f"Context:\n{code[start:end]}\n---")
