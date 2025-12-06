import os
import mysql.connector
from mysql.connector import errorcode

def main():
    host = os.environ.get('SB_DB_HOST', 'localhost')
    user = os.environ.get('SB_DB_USER', 'root')
    password = os.environ.get('SB_DB_PASSWORD', '')
    database = os.environ.get('SB_DB_NAME', 'StudyBuddy')

    print(f"Connecting to MySQL at {host} as {user} (db: {database})")
    try:
        conn = mysql.connector.connect(host=host, user=user, password=password, database=database)
    except mysql.connector.Error as err:
        if err.errno == errorcode.ER_ACCESS_DENIED_ERROR:
            print("Access denied: check user/password")
        elif err.errno == errorcode.ER_BAD_DB_ERROR:
            print(f"Database '{database}' does not exist.")
        else:
            print(err)
        return

    cursor = conn.cursor()

    schema_path = os.path.join(os.path.dirname(__file__), '..', 'schema.sql')
    schema_path = os.path.abspath(schema_path)
    print(f"Loading schema from {schema_path}")

    with open(schema_path, 'r', encoding='utf-8') as f:
        sql = f.read()

    try:
        # Remove full-line SQL comments (lines starting with --) so we don't
        # accidentally split a comment that contains semicolons. Then split
        # on semicolons to execute statements.
        lines = sql.splitlines()
        filtered = []
        for ln in lines:
            if ln.strip().startswith('--'):
                continue
            filtered.append(ln)
        cleaned = '\n'.join(filtered)

        statements = [s.strip() for s in cleaned.split(';') if s.strip()]
        try:
            cursor.execute('SET FOREIGN_KEY_CHECKS=0')
        except Exception:
            pass

        for stmt in statements:
            cursor.execute(stmt)

        try:
            cursor.execute('SET FOREIGN_KEY_CHECKS=1')
        except Exception:
            pass

        conn.commit()
        print("Schema applied successfully.")
    except mysql.connector.Error as err:
        print(f"Failed executing statement: {err}")
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    main()
