with open("app.py", "r", encoding="utf-8") as f:
    code = f.read()

import re
match = re.search(r'def add_summon.*?\n\n', code, re.DOTALL)
if match:
    print(match.group(0))
else:
    # Let's search wider
    match = re.search(r'def add_summon.*?return', code, re.DOTALL)
    if match:
        print(match.group(0))
    else:
        print("Not found.")
