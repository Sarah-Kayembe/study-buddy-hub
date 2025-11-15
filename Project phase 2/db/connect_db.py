# db/connect_db.py

import mysql.connector

def get_connection():
    """Establish and return a MySQL connection."""
    connection = mysql.connector.connect(
        host="localhost",
        user="root",
        password="REMOVED",
        database="StudyBuddy"
    )
    return connection
print("MySQL connector is working!")