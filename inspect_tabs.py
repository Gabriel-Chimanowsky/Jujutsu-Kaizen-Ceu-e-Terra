import re

with open('templates/ficha.html', 'r', encoding='utf-8') as f:
    content = f.read()

matches = re.finditer(r'id=["\']tab-([^"\']+)["\']', content)
for m in matches:
    start_pos = m.start()
    line_no = content[:start_pos].count('\n') + 1
    print(f"Line {line_no}: ID={m.group(0)} - Match={m.group(1)}")
