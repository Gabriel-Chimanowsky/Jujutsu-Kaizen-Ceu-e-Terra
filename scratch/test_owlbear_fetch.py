import urllib.request
import urllib.error

url = "https://www.owlbear.rodeo/room/AN-07cqdtIU2/The%20Timid%20Snipe"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
}

try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as res:
        print("Status:", res.status)
        print("Headers:", dict(res.headers))
        content = res.read()
        print("Length:", len(content))
        print("Snippet:", content[:1000].decode('utf-8', errors='ignore'))
except Exception as e:
    print("Error:", e)
