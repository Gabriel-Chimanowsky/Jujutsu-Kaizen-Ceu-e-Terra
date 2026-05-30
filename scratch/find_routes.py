with open("app.py", "r", encoding="utf-8") as f:
    code = f.read()

import re
routes = re.findall(r'@app\.route\((.*?)\)', code)
print(f"Total routes: {len(routes)}")
for r in routes:
    print(r.strip())
