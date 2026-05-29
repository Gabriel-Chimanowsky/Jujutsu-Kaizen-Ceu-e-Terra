import requests

url = "https://docs.google.com/spreadsheets/d/1RSiPnLXYmjWQLGskLjlcpf9C96q4ohY12cOLqPoFGNc/export?format=xlsx"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
}

try:
    r = requests.get(url, headers=headers, timeout=15)
    print("Status:", r.status_code)
    print("Content-Type:", r.headers.get('Content-Type'))
    print("Content Length:", len(r.content))
    if r.status_code != 200:
        print("Body preview:", r.text[:200])
except Exception as e:
    print("Error:", str(e))
