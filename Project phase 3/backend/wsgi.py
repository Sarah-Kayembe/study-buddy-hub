"""Entry point for the production server.

    gunicorn wsgi:app

Unlike `python app.py`, this does not seed the default admin account
and never runs in debug mode.
"""
from app import create_app

app = create_app()
