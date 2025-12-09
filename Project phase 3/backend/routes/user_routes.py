# By Rise Akizaki

from flask import Blueprint, session, jsonify, request
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
            m.major_name,
            u.bio
        FROM 
            Users u
        LEFT JOIN 
            Colleges c ON u.college_id = c.college_id
        LEFT JOIN 
            Majors m ON u.major_id = m.major_id
        WHERE 
            u.user_id = %s
    """
    # Left join needed for null fields (Edited with ChatGPT)

    # Advanced DB Feature: Parametrized SQL Query prevents SQL Injection attacks by not concatenating the input directly onto the query
    cursor.execute(query, (user["user_id"],))
    data = cursor.fetchone()

    cursor.close()
    connection.close()

    return jsonify(data), 200

# route to edit the account itself. Updating the account is a different route
# Request method OPTIONS added in by ChatGPT
@user_bp.route("/account", methods=["OPTIONS", "PUT"])
def update_account():
    if request.method == "OPTIONS":
        return "", 200 

    user = session.get("user")
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json()

    connection = get_db_connection()
    connection.start_transaction()
    cursor = connection.cursor()

    try: 
        updateQuery = """
            UPDATE 
                Users
            SET first_name = %s,
                last_name = %s,
                email = %s,
                college_level = %s,
                college_id = %s,
                major_id = %s,
                bio = %s
            WHERE 
                user_id = %s
        """

        # Advanced DB Feature: Parametrized SQL Query prevents SQL Injection attacks by not concatenating the input directly onto the query
        cursor.execute(updateQuery, (data.get("first_name"),
                                    data.get("last_name"),
                                    data.get("email"),
                                    data.get("college_level") or None,
                                    data.get("college_id") or None,
                                    data.get("major_id") or None,
                                    data.get("bio") or None,
                                    user["user_id"]))


        # commit before closing
        connection.commit()
        return jsonify({"success": True}), 200

    except Exception as exception:
        connection.rollback()
        return jsonify({"error": str(exception)}), 500

    finally:
        cursor.close()
        connection.close()