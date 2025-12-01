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
        password=os.getenv("MYSQL_PASSWORD", "Enter your password here"),
        database=os.getenv("MYSQL_DB", "StudyBuddy"),
    )


#feel free to change this -- putting this here for my routes as of right now. Also feel free to delete this comment!
