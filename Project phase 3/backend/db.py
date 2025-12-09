import mysql.connector
import os
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST", "localhost"),
        port=int(os.getenv("MYSQL_PORT", 3306)),
        user=os.getenv("MYSQL_USER", "root"),
        # Use env var when present; fallback matches the password you provided
        password=os.getenv("MYSQL_PASSWORD", "REMOVED"),
        database=os.getenv("MYSQL_DB", "StudyBuddy"),
        autocommit=True # need this because saving profile changes kept getting locked
    )


#feel free to change this -- putting this here for my routes as of right now. Also feel free to delete this comment!
