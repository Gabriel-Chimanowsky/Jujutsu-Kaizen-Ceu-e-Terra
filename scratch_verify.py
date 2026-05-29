import urllib.request
import urllib.error
import json
import uuid
import os

def build_multipart_formdata(fields, files):
    boundary = uuid.uuid4().hex
    lines = []
    
    for name, value in fields.items():
        lines.append(f'--{boundary}')
        lines.append(f'Content-Disposition: form-data; name="{name}"')
        lines.append('')
        lines.append(str(value))
        
    for name, filepath in files.items():
        filename = os.path.basename(filepath)
        lines.append(f'--{boundary}')
        lines.append(f'Content-Disposition: form-data; name="{name}"; filename="{filename}"')
        lines.append('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        lines.append('')
        with open(filepath, 'rb') as f:
            lines.append(f.read())
            
    lines.append(f'--{boundary}--')
    lines.append('')
    
    body = b''
    for line in lines:
        if isinstance(line, bytes):
            body += line + b'\r\n'
        else:
            body += line.encode('utf-8') + b'\r\n'
            
    headers = {
        'Content-Type': f'multipart/form-data; boundary={boundary}',
        'Content-Length': str(len(body))
    }
    return body, headers

def run_tests():
    base_url = 'http://127.0.0.1:5000'
    report = []
    
    def log(msg):
        print(msg.encode('ascii', 'replace').decode('ascii'))
        report.append(msg)

    # We will use urllib's HTTPCookieProcessor to handle sessions/cookies
    cookie_jar = urllib.request.HTTPCookieProcessor()
    opener = urllib.request.build_opener(cookie_jar)
    urllib.request.install_opener(opener)

    log("[*] Testing Login...")
    login_payload = {
        'username': 'mestre',
        'password': 'mestre123'
    }
    
    # 1. Login
    try:
        req = urllib.request.Request(
            f"{base_url}/login",
            data=json.dumps(login_payload).encode('utf-8'),
            headers={'Content-Type': 'application/json', 'Accept': 'application/json'}
        )
        with urllib.request.urlopen(req) as r:
            res_text = r.read().decode('utf-8')
            log(f"[OK] Login Response: {r.status} - {res_text}")
    except Exception as e:
        log(f"[ERROR] Login failed: {e}")
        return

    # 2. Check Auth Status
    try:
        req = urllib.request.Request(f"{base_url}/api/auth/status")
        with urllib.request.urlopen(req) as r:
            res_data = json.loads(r.read().decode('utf-8'))
            log(f"[OK] Auth Status: {res_data}")
    except Exception as e:
        log(f"[ERROR] Auth status failed: {e}")
        return

    # 3. Create Character from Excel
    log("\n[*] Testing creation of character from Excel sheet...")
    excel_path = r"c:\xampp\htdocs\Jujutsu2 - Copia\exemplo\Modelo de Ficha - Feiticeiros & Maldições 2.5.xlsx"
    
    try:
        body, headers = build_multipart_formdata({}, {'file': excel_path})
        req = urllib.request.Request(
            f"{base_url}/api/create_character_from_excel",
            data=body,
            headers=headers
        )
        with urllib.request.urlopen(req) as r:
            res = json.loads(r.read().decode('utf-8'))
            
        log("[SUCCESS] Character created successfully from Excel!")
        log(f"Message: {res.get('message')}")
        log("Import Summary:")
        for k, v in res.get('import_summary', {}).items():
            log(f"  - {k}: {v}")
            
        char_data = res.get('character', {})
        char_id = char_data.get('id')
        log(f"\nCreated Character ID: {char_id}")
        log(f"Nome: {char_data.get('nome')}")
        log(f"Grau: {char_data.get('grau')}")
        log(f"Nivel: {char_data.get('nivel')}")
        log(f"Origem: {char_data.get('origem')}")
        log(f"Especializacao: {char_data.get('especializacao')}")
        log(f"Atributos: {char_data.get('attributes')}")
        
        # Parse and show some of the imported arrays (now returned directly as parsed types)
        pericias = char_data.get('pericias', {})
        trained_pericias = [k for k, v in pericias.items() if isinstance(v, dict) and v.get('treinada')]
        log(f"Pericias Treinadas ({len(trained_pericias)}): {trained_pericias}")
        
        # Check trainings (under '_treinamentos')
        trainings = pericias.get('_treinamentos', {})
        log(f"Treinamentos importados: {trainings}")

        rds = char_data.get('rds', {})
        active_rds = {k: v for k, v in rds.items() if v > 0}
        log(f"RDs Ativas ({len(active_rds)}): {active_rds}")

        spells = char_data.get('feiticos', [])
        log(f"Feiticos importados ({len(spells)}): {[s.get('nome') for s in spells]}")

        summons = char_data.get('invocacoes', [])
        log(f"Invocacoes/Shikigamis importados ({len(summons)}): {[s.get('nome') for s in summons]}")

        attacks = char_data.get('ataques', [])
        log(f"Ataques importados ({len(attacks)}): {[a.get('nome') for a in attacks]}")

        inventory = char_data.get('inventario', [])
        log(f"Itens Inventario ({len(inventory)}): {[i.get('nome') for i in inventory]}")

    except Exception as e:
        log(f"[ERROR] Character creation failed: {e}")
        if isinstance(e, urllib.error.HTTPError):
            log(f"HTTP Error: {e.code} - {e.read().decode('utf-8')}")
        return

    # 4. Synchronize existing character from Excel
    log(f"\n[*] Testing synchronization of existing character (ID: {char_id}) from Excel sheet...")
    try:
        body, headers = build_multipart_formdata({}, {'file': excel_path})
        req = urllib.request.Request(
            f"{base_url}/api/import_excel/{char_id}",
            data=body,
            headers=headers
        )
        with urllib.request.urlopen(req) as r:
            res_sync = json.loads(r.read().decode('utf-8'))
            
        log("[SUCCESS] Character synchronized successfully!")
        log(f"Message: {res_sync.get('message')}")
        log("Sync Summary:")
        for k, v in res_sync.get('import_summary', {}).items():
            log(f"  - {k}: {v}")
    except Exception as e:
        log(f"[ERROR] Character sync failed: {e}")
        if isinstance(e, urllib.error.HTTPError):
            log(f"HTTP Error: {e.code} - {e.read().decode('utf-8')}")
        return

    # Write report to file in UTF-8
    with open("scratch_verify_report.txt", "w", encoding="utf-8") as rf:
        rf.write("\n".join(report))
    print(f"\n[OK] Diagnostic report written successfully to 'scratch_verify_report.txt' in UTF-8.")

if __name__ == '__main__':
    run_tests()
