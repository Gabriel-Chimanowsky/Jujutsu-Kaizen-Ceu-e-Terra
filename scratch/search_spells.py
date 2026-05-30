import sys
sys.stdout.reconfigure(encoding='utf-8')

with open("scratch/vidente_clean.txt", "r", encoding="utf-8") as f:
    text = f.read()

spell_names = [
    "Vidência", "Corpo Espiritual", "Ritual de Invocação", "Barreira de Espiritualidade",
    "Disparo de Cartas", "Precognição", "Substituição de Figuras de Papel", "Controle de Chamas",
    "Criação de Ilusões", "Disparo de Balas de Ar", "Ferimentos Falsos", "Transferência",
    "Adivinhação Instantânea", "Mimetismo"
]

for name in spell_names:
    print(f"=== {name} ===")
    # Let's find matches in the clean text (paragraphs are separated by newlines)
    for line in text.split("\n"):
        if name.lower() in line.lower():
            print(line.strip())
