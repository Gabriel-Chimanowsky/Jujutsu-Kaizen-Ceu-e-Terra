with open("app.py", "r", encoding="utf-8") as f:
    code = f.read()

import re
matches = [m.start() for m in re.finditer(r'db_url\s*=', code)]
for m in matches:
    start = max(0, m - 50)
    end = min(len(code), m + 150)
    print(f"Context: {code[start:end].replace('\n', ' ')}")
