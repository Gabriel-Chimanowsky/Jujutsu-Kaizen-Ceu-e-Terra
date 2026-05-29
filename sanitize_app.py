import re

with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Make the specific replacements
replacements = {
    "✨ {sign}{quantidade} XP recebido": "[XP] {sign}{quantidade} XP recebido",
    "→ LEVEL UP! Nível {new_level}! 🎉": " -> LEVEL UP! Nível {new_level}!",
    "'title': '⭐ XP pelo Mestre'": "'title': '[Mestre] XP Concedido'",
    "💪 Evolução confirmada: +{total_cost} pontos distribuídos!": "Evolução confirmada: +{total_cost} pontos distribuídos!",
    "'title': '⚡ Evolução de Atributos'": "'title': 'Evolução de Atributos'",
    "🎯 Acerto: d20": "[Ataque] Acerto: d20",
    "💥 Dano: ": "[Dano] Dano: ",
    "🛡️ RD Alvo": "[RD] RD Alvo",
    "🩸 Dano Final sofrido por": "[Dano Final] Dano Final sofrido por",
    "❌ Motivo:": "[Falha] Motivo:",
    "🔮 <b>{char.nome}</b> conjurou": "[Ritual] <b>{char.nome}</b> conjurou",
    "✨ Custo:": "Custo:",
    "💖 Cura:": "Cura:",
    "📈 <b>{target_char.nome}</b> recuperou": "<b>{target_char.nome}</b> recuperou",
    "💥 Dano Rolado:": "Dano Rolado:",
    "🔮 <b>{char.nome}</b> ativou": "[Talento] <b>{char.nome}</b> ativou",
    "🌀 <b>{char.nome}</b> ativou": "[Talento] <b>{char.nome}</b> ativou",
    "📖 Descrição:": "Descrição:",
    "🎲 Efeito Rolado:": "Efeito Rolado:",
    "🌀 <b>{char.nome}</b>": "[Talento] <b>{char.nome}</b>",
    "'atributos': '✅ 6 atributos importados'": "'atributos': '6 atributos importados'",
    "'pericias': f'✅ {sum": "'pericias': f'{sum",
    "'resistencias': '✅ 5 resistências importadas'": "'resistencias': '5 resistências importadas'",
    "'rds': f'✅ {sum": "'rds': f'{sum",
    "'ataques': f'✅ {len(attacks)}": "'ataques': f'{len(attacks)}",
    " else '⚠️ Nenhum ataque encontrado'": " else 'Nenhum ataque encontrado'",
    "'talentos': f'✅ {len(talents)}": "'talentos': f'{len(talents)}",
    " else '⚠️ Nenhum talento encontrado'": " else 'Nenhum talento encontrado'",
    "'inventario': f'✅ {len(inventory)}": "'inventario': f'{len(inventory)}",
    " else '⚠️ Nenhum item no inventário'": " else 'Nenhum item no inventário'",
    "'feiticos': f'✅ {len(spells)}": "'feiticos': f'{len(spells)}",
    " else '⚠️ Nenhum feitiço encontrado'": " else 'Nenhum feitiço encontrado'",
    "'summons': f'✅ {len(summons)}": "'summons': f'{len(summons)}",
    " else '⚠️ Nenhuma invocação encontrada'": " else 'Nenhuma invocação encontrada'",
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Also let's check for any stray emojis in app.py
# A regex search for other characters
all_emojis = ["✨", "🎉", "⭐", "💪", "⚡", "🎯", "💥", "🛡️", "🛡", "🩸", "❌", "🔮", "💖", "📈", "📖", "🎲", "🌀", "✅", "⚠️"]
for emoji in all_emojis:
    content = content.replace(emoji, "")

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("app.py successfully sanitized.")
