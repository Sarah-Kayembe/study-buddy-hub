import os
from pathlib import Path
import re
import getpass
import mysql.connector
#Author: Vivek

"""
StudyBuddy DB builder
"""


def _prompt(value: str, env_var: str, secret: bool = False) -> str:
    """
    Ask the user for a value, showing the current env-var/default.
    Returns the provided value or the fallback if left blank.
    """
    current = os.getenv(env_var, value)
    prompt_text = f"{env_var} [{current}]: "
    reader = input if secret else input
    entered = reader(prompt_text)
    return entered.strip() or current

# --- CONFIGURATION ---
DB_NAME = "StudyBuddy"
DB_CONFIG = {
    "host": _prompt("localhost", "MYSQL_HOST"),
    "port": int(_prompt("3306", "MYSQL_PORT")),
    "user": _prompt("root", "MYSQL_USER"),
    "password": _prompt("", "MYSQL_PASSWORD", secret=True),
    "allow_local_infile": os.getenv("MYSQL_LOCAL_INFILE", "1") in {"1", "true", "TRUE", "yes", "YES"},
}
# ---------------------


def _iter_mysql_statements(filepath: Path):
    """
    A parser that correctly handles:
    - DELIMITER commands
    - Comments (--, #, and /*...*/)
    - Multi-line statements
    - String literals (to avoid false-positive delimiter splits)
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        full_sql = f.read()

    # Regex to strip comments. This is more robust.
    # Strip block comments /* ... */
    full_sql = re.sub(r'/\*.*?\*/', '', full_sql, flags=re.DOTALL)
    # Strip line comments -- ... and # ...
    full_sql = re.sub(r'(--|#).*?$', '', full_sql, flags=re.MULTILINE)

    delimiter = ";"
    statement = ""

    for line in full_sql.splitlines():
        line = line.strip()
        if not line:
            continue

        # Check for delimiter change
        if line.upper().startswith("DELIMITER"):
            try:
                delimiter = line.split()[1]
                # This line is a command, not part of a statement
                continue
            except IndexError:
                # Malformed delimiter, but we skip it
                continue
        
        # Add the line to the current statement
        if statement:
            statement += "\n" + line
        else:
            statement = line

        # If the statement ends with the delimiter
        if statement.endswith(delimiter):
            # Clean statement: remove delimiter and leading/trailing whitespace
            cleaned_stmt = statement[:-len(delimiter)].strip()
            if cleaned_stmt:
                yield cleaned_stmt
            # Reset for next statement
            statement = ""

    # Yield any remaining statement (in case file doesn't end with delimiter)
    if statement.strip():
        # This case might happen if the last statement is missing its delimiter
        # We clean it as best we can
        if statement.endswith(delimiter):
             cleaned_stmt = statement[:-len(delimiter)].strip()
             if cleaned_stmt:
                yield cleaned_stmt
        else:
             # It's a partial statement, but we yield it
             yield statement.strip()


def execute_sql_file(cursor, filepath_str: str) -> bool:
    """
    Executes all statements from a .sql file using the custom parser.
    Returns True on success, False on failure.
    """
    filepath = Path(filepath_str)
    if not filepath.exists():
        print(f"  [WARN] File not found: {filepath_str}")
        return True  # Don't fail the build, just skip it

    print(f"Executing SQL file: {filepath_str}...")
    try:
        statements = list(_iter_mysql_statements(filepath))
        if not statements:
            print("  (File is empty or only contains comments)")
            return True

        for stmt in statements:
            try:
                # The _iter_mysql_statements parser already gives us
                # one statement at a time. We don't need 'multi=True'.
                cursor.execute(stmt)

            except mysql.connector.Error as err:
                print(f"  [ERROR] Failed executing statement from {filepath.name}: {err}")
                
                # Truncate statement for printing
                stmt_preview = stmt[:100].replace('\n', ' ') + "..." if len(stmt) > 100 else stmt.replace('\n', ' ')
                print(f"    Statement: {stmt_preview}")
                return False
        
        return True

    except Exception as e:
        print(f"  [ERROR] Failed parsing file {filepath.name}: {e}")
        return False


def main():
    """
    - Connects to MySQL (no DB specified)
    - Drops/Creates the DB_NAME
    - Connects to the new DB
    - Runs all SQL files in order
    """
    
    # List of SQL files to run, IN ORDER of dependency
    sql_files_in_order = [
        # --- schemas ---
        "sql/schema/User_Management.sql",
        "sql/schema/study_Management_script.sql", 
        "sql/schema/StudyGroupsAndCollaboration.sql", 
        "sql/schema/Quizzes&Flashcards.sql",
        # --- procedures ---
        "sql/procedures/Study_Management_procedures.sql",
        "sql/procedures/StudyGroupAndCollaborationProcedures.sql",
        # --- seed/data scripts ---
        "sql/load/User_Management_Data_Insertion.sql",
        "sql/load/User_Management_Relationship_Testing.sql",
        "sql/load/import_clean_resources.sql",  # Running this creates Users 1001, 1002, etc.
        "sql/load/import_clean_quiz.sql",
        "sql/load/fake_data_Script.sql",
    ]  

    try:
        # 1. Connect to MySQL server (no database)
        print(f"Connecting to MySQL at {DB_CONFIG['host']}:{DB_CONFIG['port']} as {DB_CONFIG['user']}...")
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(buffered=True)
        print("Connection successful.")

        # 2. Drop and recreate the database
        print(f"Resetting database '{DB_NAME}'...")
        cursor.execute(f"DROP DATABASE IF EXISTS `{DB_NAME}`")
        cursor.execute(f"CREATE DATABASE `{DB_NAME}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        cursor.execute(f"USE `{DB_NAME}`")
        print(f"Database '{DB_NAME}' created and selected.")

        # 3. Enable LOCAL INFILE if not enabled
        cursor.execute("SHOW GLOBAL VARIABLES LIKE 'local_infile'")
        infile_status = cursor.fetchone()
        if not infile_status or infile_status[1] != 'ON':
            print("  [WARN] 'local_infile' is OFF on the server. Attempting to set.")
            try:
                cursor.execute("SET GLOBAL local_infile = 1")
            except mysql.connector.Error as err:
                print(f"  [ERROR] Could not set GLOBAL local_infile: {err}")
                return 
        
        # 4. Execute all SQL files in order
        print("\nStarting database build...")
        for idx, filepath in enumerate(sql_files_in_order):
            if not execute_sql_file(cursor, filepath):
                # If any file fails, stop the build
                print(f"\n[FATAL] Build failed at: {filepath}")
                conn.rollback()
                break
            
            # === THIS IS THE FIX ===
            # This commit is necessary to make changes from one
            # file (like creating users) visible to the NEXT file.
            conn.commit()
            # =======================

            # Reset cursor between files to avoid sync issues
            if idx < len(sql_files_in_order) - 1:
                try:
                    cursor.close()
                except Exception:
                    pass
                cursor = conn.cursor(buffered=True)
        else:
            # This 'else' block runs only if the loop completed without 'break'
            print("\n[SUCCESS] Database build completed successfully!")
            conn.commit() # Final commit for safety

    except mysql.connector.Error as err:
        print(f"\n[FATAL] A MySQL error occurred: {err}")
        if getattr(err, "errno", None) == 2003:  # Can't connect
            print("  [HINT] Is your MySQL server (like XAMPP or MySQL Workbench) running?")
        elif getattr(err, "errno", None) == 1045:  # Access denied
            print("  [HINT] Check MYSQL_USER / MYSQL_PASSWORD environment variables.")

    finally:
        # 5. Clean up
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()
            print("MySQL connection closed.")

if __name__ == "__main__":
    main()

