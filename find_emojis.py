import os
import re
import sys

emoji_pattern = re.compile(
    r'[\U00010000-\U0010ffff]|\u2600-\u27BF',
    re.UNICODE
)

files_to_check = [
    'app.py',
    'models.py',
    'frontend/src/views/LandingView.jsx',
    'frontend/src/views/LobbyView.jsx',
    'frontend/src/views/FichaView.jsx',
    'frontend/src/views/CreateCharacterView.jsx',
    'frontend/src/views/LoginView.jsx',
    'frontend/src/views/RegisterView.jsx'
]

output_lines = []

for filename in files_to_check:
    if not os.path.exists(filename):
        output_lines.append(f"File not found: {filename}")
        continue
        
    output_lines.append(f"\n--- Checking emojis in {filename} ---")
    with open(filename, 'r', encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()
        
    found_count = 0
    for i, line in enumerate(lines):
        matches = emoji_pattern.findall(line)
        misc_emojis = [c for c in line if ord(c) > 0x2000 and ord(c) not in range(0x3000, 0x9fff) and ord(c) not in range(0xac00, 0xd7af) and ord(c) < 0xe000]
        all_emojis = list(set(matches + misc_emojis))
        
        filtered_emojis = []
        for emoji in all_emojis:
            o = ord(emoji)
            if o in [
                0x00E1, 0x00E9, 0x00ED, 0x00F3, 0x00FA,
                0x00C1, 0x00C9, 0x00CD, 0x00D3, 0x00DA,
                0x00E2, 0x00EA, 0x00F4,
                0x00C2, 0x00CA, 0x00D4,
                0x00E3, 0x00F5,
                0x00C3, 0x00D5,
                0x00E7, 0x00C7,
                0x00E0, 0x00C0,
                0x00A0, 0x00AD, 0x2013, 0x2014,
                0x2018, 0x2019, 0x201C, 0x201D,
                0x2026,
                0x20AC,
                0x2022,
                0x00BA, 0x00AA,
            ] or o in range(0x2000, 0x200B):
                continue
            filtered_emojis.append(emoji)
            
        if filtered_emojis:
            found_count += 1
            output_lines.append(f"Line {i+1}: {filtered_emojis} | Content: {line.strip()}")
            
    if found_count == 0:
        output_lines.append("No emojis found!")

with open("emojis_found.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(output_lines))

print("Scan finished. Results saved to emojis_found.txt.")
