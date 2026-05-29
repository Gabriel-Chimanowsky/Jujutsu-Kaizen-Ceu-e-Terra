import re
import os

emoji_pattern = re.compile(r'[\U00010000-\U0010ffff\u2600-\u27bf]', flags=re.UNICODE)

def check_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        matches = []
        for i, line in enumerate(content.splitlines(), 1):
            found = emoji_pattern.findall(line)
            # ignore lines that are just comments or separators
            if found and not any(x in line for x in ['═', '──', '───', '═']):
                matches.append((i, found, line.strip()))
        return matches
    except Exception as e:
        return []

views_dir = 'frontend/src/views'
components_dir = 'frontend/src/components'

files_to_check = [
    'app.py',
    'models.py'
]

if os.path.exists(views_dir):
    for f in os.listdir(views_dir):
        if f.endswith('.jsx') or f.endswith('.js'):
            files_to_check.append(os.path.join(views_dir, f))

if os.path.exists(components_dir):
    for f in os.listdir(components_dir):
        if f.endswith('.jsx') or f.endswith('.js'):
            files_to_check.append(os.path.join(components_dir, f))

total_found = 0
for filepath in files_to_check:
    res = check_file(filepath)
    if res:
        print(f"\nFile: {filepath}")
        for line_num, em, content in res:
            print(f"  Line {line_num}: {em} | {content}")
            total_found += 1

print(f"\nTotal Emojis Found: {total_found}")
