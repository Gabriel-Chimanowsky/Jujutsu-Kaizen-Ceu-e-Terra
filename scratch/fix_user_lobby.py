import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from models import db, User, Lobby

def fix_lobby():
    with app.app_context():
        u = User.query.get(2)
        if u:
            active_lobby = Lobby.query.filter_by(ativo=True).first()
            if active_lobby:
                u.lobby_id = active_lobby.id
                print(f"Set user {u.username} to active lobby {active_lobby.id} ({active_lobby.nome})")
            else:
                u.lobby_id = None
                print(f"Set user {u.username} lobby to None")
            db.session.commit()

if __name__ == '__main__':
    fix_lobby()
