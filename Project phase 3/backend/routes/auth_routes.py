import logging
import traceback
from flask import Blueprint, flash, request, render_template_string, redirect, url_for, jsonify
import bcrypt
from db import get_db_connection

auth_bp = Blueprint('auth', __name__, url_prefix="/auth")

# For User Registration
##############################

# POST - Handle registration form submission
@auth_bp.route("/api/register", methods=["POST"])
def register_user():
    # Get form data
    data = request.get_json()
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    password = data.get("password")

    # don't need these currently, save em for the profile page
    # college_id = data.get("college_id") or None
    # major_id = data.get("major_id") or None

    # validate required fields
    if not first_name or not last_name or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    # hash password
    hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # check duplicate email
        cursor.execute("SELECT * FROM Users WHERE email = %s", (email,))
        if cursor.fetchone():
            return jsonify({"error": "Email already registered"}), 400

        # insert user
        cursor.execute("""
            INSERT INTO Users (email, password_hash, first_name, last_name, college_id, major_id)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (email, hashed_password, first_name, last_name, None, None))

        connection.commit()
        cursor.close()

        return jsonify({"message": "Registration successful! You should be redirected shortly"}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    finally:
        if connection:
            connection.close()



# For user login
##############################

# POST - Handle login form submission
@auth_bp.route("/login", methods=["POST"])
def login_user():
    # Get form data
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    # Validate required fields
    if not email or not password:
         return jsonify({"error": "Missing required fields"}), 400

    # now we need to verify that email/password matches
    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # fetch user by email
        cursor.execute("SELECT first_name, last_name, password_hash FROM Users WHERE email= %s", (email,))
        userToLogin = cursor.fetchone()

        if userToLogin is None:
            return jsonify({"error": "Account with given email doesn't exist"}), 400
        
        first_name, last_name, hashed_password = userToLogin

        # Verify password
        if not bcrypt.checkpw(password.encode(), hashed_password.encode()):
            return jsonify({"error": "Incorrect password"}), 400

        return jsonify({
            "message": "Login successful! You should be redirected shortly",
            "user": {
                "first_name": first_name,
                "last_name": last_name,
                "email": email
            }
        }), 200
    
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

    finally:
        if connection:
            connection.close()

# Data retrival methods
#######################

# gets all colleges from DB
@auth_bp.route("/colleges", methods=["GET"])
def get_colleges():
    connection = get_db_connection()
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT college_id, college_name FROM Colleges")
        colleges = cursor.fetchall()
        return jsonify(colleges)
    finally:
        connection.close()

# gets all majors from DB
@auth_bp.route("/majors", methods=["GET"])
def get_majors():
    connection = get_db_connection()
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT major_id, major_name FROM Majors")
        majors = cursor.fetchall()
        return jsonify(majors)
    finally:
        connection.close()



