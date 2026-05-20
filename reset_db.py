"""
reset_db.py — Limpa todos os usuarios e personagens do banco.

ATENÇÃO: Isso APAGA TODOS os dados. Faça backup antes!

Uso:
    python reset_db.py                   # limpa tudo
    python reset_db.py --criar-mestre    # limpa e cria usuario mestre padrao
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app import app
from models import db, User, Character, Status, Attributes, Lobby

def reset_database(criar_mestre=False, mestre_user='mestre', mestre_pass='mestre123'):
    with app.app_context():
        print("[!] Apagando todos os dados...")
        # Ordem importa por causa das FK
        Attributes.query.delete()
        Status.query.delete()
        Character.query.delete()
        Lobby.query.delete()
        User.query.delete()
        db.session.commit()

        print("[OK] Banco limpo com sucesso.")

        if criar_mestre:
            mestre = User(username=mestre_user, role='Mestre')
            mestre.set_password(mestre_pass)
            db.session.add(mestre)
            db.session.commit()
            print(f"[OK] Usuario mestre criado: '{mestre_user}' / senha: '{mestre_pass}'")
            print("   [!] Troque a senha apos o primeiro login!")


if __name__ == '__main__':
    criar = '--criar-mestre' in sys.argv
    
    if not criar:
        confirm = input("Isso vai apagar TUDO. Digite 'CONFIRMAR' para continuar: ")
        if confirm.strip() != 'CONFIRMAR':
            print("Cancelado.")
            sys.exit(0)
    
    reset_database(criar_mestre=criar)
    print("🏁 Pronto.")
