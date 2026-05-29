import re

def search_in_file(filepath, pattern):
    print(f"--- Searching in {filepath} for '{pattern}' ---")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for idx, line in enumerate(f, 1):
                if re.search(pattern, line, re.IGNORECASE):
                    print(f"{idx}: {line.strip()}")
    except Exception as e:
        print(f"Error: {e}")

search_in_file('frontend/src/views/FichaView.jsx', r'REGULAMENTO J.K.')
search_in_file('frontend/src/views/FichaView.jsx', r'Guia Prático')
search_in_file('frontend/src/views/FichaView.jsx', r'Feiticeiros & Maldições')
