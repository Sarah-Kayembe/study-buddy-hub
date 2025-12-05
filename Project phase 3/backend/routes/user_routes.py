from flask import Blueprint, session, jsonify
from db import get_db_connection

user_bp = Blueprint("user", __name__, url_prefix="/user")

@user_bp.route("/account", methods=["GET"])
def account():
    user = session.get("user")

    if not user:
        return jsonify({"error": "Not logged in"}), 401

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    query = """
        SELECT 
            u.user_id,
            u.first_name,
            u.last_name,
            u.email,
            u.college_level,
            c.college_name,
            m.major_name
        FROM 
            Users u
        LEFT JOIN 
            Colleges c ON u.college_id = c.college_id
        LEFT JOIN 
            Majors m ON u.major_id = m.major_id
        WHERE 
            u.user_id = %s
    """
    # Left join needed for null fields

    cursor.execute(query, (user["user_id"],))
    data = cursor.fetchone()

    cursor.close()
    connection.close()

    return jsonify(data), 200