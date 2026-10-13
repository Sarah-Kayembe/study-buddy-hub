import mysql.connector
import os
from contextlib import contextmanager
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST", "localhost"),
        port=int(os.getenv("MYSQL_PORT", 3306)),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        database=os.getenv("MYSQL_DB", "StudyBuddy"),
        autocommit=True # need this because saving profile changes kept getting locked
    )



@contextmanager
def transaction(dictionary=False):
    """Run a block of queries as one transaction.

    Commits when the block finishes, rolls back if anything inside it
    raises, and always closes the cursor and connection.

        with transaction() as cursor:
            cursor.execute(...)
    """
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=dictionary)
    try:
        conn.start_transaction()
        yield cursor
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()
