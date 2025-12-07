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

from flask import request

# route to edit the account itself. Updating the account is a different route
# Request method OPTIONS added in by ChatGPT
@user_bp.route("/account/edit", methods=["OPTIONS", "POST"])
def edit_account():
    if request.method == "OPTIONS":
        return "", 200 

    user = session.get("user")

    if not user:
        return jsonify({"error": "Not logged in"}), 401

    data = request.get_json()

    # get user info 
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    college_level = data.get("college_level")
    college_id = data.get("college_id")
    major_id = data.get("major_id")
    bio = data.get("bio")

    if not first_name or not last_name or not email:
        return jsonify({"error": "Missing required fields"}), 400

    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    updateQuery = """
        UPDATE Users
        SET first_name = %s,
            last_name = %s,
            email = %s,
            college_level = %s,
            college_id = %s,
            major_id = %s,
            bio = %s
        WHERE user_id = %s
    """

    # Advanced DB Feature: Parametrized SQL Query prevents SQL Injection attacks by not concatenating the input directly onto the query
    cursor.execute(updateQuery, (first_name, 
                                  last_name, 
                                  email, 
                                  college_level, 
                                  college_id if college_id else None, 
                                  major_id if major_id else None, 
                                  bio if bio else None,
                                  user["user_id"]))

    # commit before closing
    connection.commit()
    cursor.close()
    connection.close()

    return jsonify({"success": True}), 200

# Route which updates the account information
@user_bp.route("/account", methods=["PUT"])
def update_account():
    from flask import request

    user = session.get("user")
    if not user:
        return jsonify({"error": "Not logged in"}), 401 # make sure user is logged in

    data = request.get_json()

    college_id = data.get("college_id") or None
    major_id = data.get("major_id") or None

    connection = get_db_connection()
    connection.start_transaction()
    cursor = connection.cursor()

    try:
        query = """
            UPDATE 
                Users
            SET 
                first_name = %s,
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
        cursor.execute(query, (data.get("first_name"),
                               data.get("last_name"),
                               data.get("email"),
                               data.get("college_level"),
                               college_id,
                               major_id,
                               data.get("bio"),
                               user["user_id"]))

        connection.commit() 
        return jsonify({"success": True}), 200

    except Exception as e:
        connection.rollback()
        print("UPDATE ERROR:", e)
        return jsonify({"error": str(e)}), 500 # Exception generated with ChatGPT

    finally:
        cursor.close()
        connection.close()
