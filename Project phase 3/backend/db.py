import mysql.connector
from mysql.connector import pooling
import os
from contextlib import contextmanager
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

def _settings():
    return {
        "host": os.getenv("MYSQL_HOST", "localhost"),
        "port": int(os.getenv("MYSQL_PORT", 3306)),
        "user": os.getenv("MYSQL_USER", "root"),
        "password": os.getenv("MYSQL_PASSWORD", ""),
        "database": os.getenv("MYSQL_DB", "StudyBuddy"),
        "autocommit": True,  # need this because saving profile changes kept getting locked
    }


_pool = None
_pool_settings = None


def _get_pool(settings):
    """One pool per process, rebuilt only if the connection settings change."""
    global _pool, _pool_settings
    if _pool is None or settings != _pool_settings:
        _pool = pooling.MySQLConnectionPool(
            pool_name="studybuddy",
            pool_size=int(os.getenv("MYSQL_POOL_SIZE", 5)),
            pool_reset_session=True,
            **settings,
        )
        _pool_settings = settings
    return _pool


def get_db_connection():
    """Return a database connection, reused from a pool when one is free.

    Opening a new connection to a hosted database means a network round
    trip plus a TLS handshake, which adds noticeable time to every
    request. Pooled connections skip that. Calling close() on a pooled
    connection hands it back to the pool instead of closing it.

    If every pooled connection is busy, a one-off connection is opened
    instead of failing the request.
    """
    settings = _settings()
    try:
        conn = _get_pool(settings).get_connection()
    except mysql.connector.errors.PoolError:
        return mysql.connector.connect(**settings)
    # The database may have dropped a connection that sat idle in the
    # pool; reconnect it before use.
    conn.ping(reconnect=True, attempts=2, delay=0)
    return conn


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
