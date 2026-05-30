import sys
sys.stdout.reconfigure(encoding='utf-8')

with open("scratch/vidente_clean.txt", "r", encoding="utf-8") as f:
    lines = f.readlines()

def search_keywords(keywords):
    print(f"=== Searching for keywords: {keywords} ===")
    for idx, line in enumerate(lines):
        if any(kw.lower() in line.lower() for kw in keywords):
            print(f"Line {idx+1}: {line.strip()}")

search_keywords(["nível", "nivel", "sequência", "sequencia"])
