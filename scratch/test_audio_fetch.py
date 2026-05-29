import urllib.request
import urllib.parse
import json

urls = {
    "ryoiki_gojo": "https://www.myinstants.com/media/sounds/ryoiki-tenkai.mp3",
    "ryoiki_sukuna": "https://www.myinstants.com/media/sounds/sukuna-domain-expansion.mp3",
    "kokusen": "https://www.myinstants.com/media/sounds/black-flash-sfx.mp3",
    "kokusen_voice": "https://www.myinstants.com/media/sounds/kokusen-voice.mp3"
}

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
}

for name, url in urls.items():
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as response:
            code = response.getcode()
            print(f"{name}: {code}")
    except Exception as e:
        print(f"{name} Failed: {str(e)}")
