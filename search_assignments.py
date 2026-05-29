with open('app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if '.grau' in line or '.origem' in line or '.especializacao' in line:
        print(f"Line {idx+1}: {line.strip()}")
