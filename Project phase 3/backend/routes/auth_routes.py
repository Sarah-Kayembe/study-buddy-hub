# By Rise Akizaki

import traceback
from flask import Blueprint, request, jsonify, session
import bcrypt
from db import get_db_connection

auth_bp = Blueprint('auth', __name__, url_prefix="/auth")

# For User Registration
##############################

# Route for user registration
@auth_bp.route("/register", methods=["POST"])
def register_user():
    # Get form data
    data = request.get_json()
    first_name = data.get("first_name")
    last_name = data.get("last_name")
    email = data.get("email")
    password = data.get("password")

    # validate required fields
    if not first_name or not last_name or not email or not password:
        return jsonify({"error": "Missing required fields"}), 400

    # hash password
    hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # check for duplicate email
        duplicateEmailQuery = """
            SELECT 
                *
            FROM 
                Users
            WHERE
                email = %s
        """

        # Advanced DB Feature: Parametrized SQL Query prevents SQL Injection attacks by not concatenating the input directly onto the query
        cursor.execute(duplicateEmailQuery, (email,)) 
        if cursor.fetchone():
            return jsonify({"error": "Email already registered"}), 400

        # insert user into db
        userInsertionQuery = """
            INSERT INTO
                Users (email, password_hash, first_name, last_name, college_level, college_id, major_id)
            VALUES 
                (%s, %s, %s, %s, %s, %s, %s)
        """ 

        cursor.execute(userInsertionQuery, (email, hashed_password, first_name, last_name, None, None, None))

        connection.commit()
        cursor.close()

        return jsonify({"message": "Registration successful! You should be redirected shortly"}), 200

    except Exception as exception:
        traceback.print_exc()
        return jsonify({"error": str(exception)}), 500
    finally:
        connection.close()



# For user login
##############################

# Route for user login
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
        emailQuery = """
            SELECT
                user_id, password_hash
            FROM 
                Users
            WHERE
                email = %s
        """

        # Advanced DB Feature: Parametrized SQL Query prevents SQL Injection attacks by not concatenating the input directly onto the query
        cursor.execute(emailQuery, (email,))
        userToLogin = cursor.fetchone()

        if userToLogin is None:
            return jsonify({"error": "Account with given email doesn't exist"}), 400
        
        user_id, hashed_password = userToLogin

        # verify password
        if not bcrypt.checkpw(password.encode(), hashed_password.encode()):
            return jsonify({"error": "Incorrect password"}), 400

        # creates a user session when they login
        session["user"] = {
            "user_id": user_id,
            "email": email,
        }
            
        return jsonify({
            "message": "Login successful! You should be redirected shortly",
            "user": session["user"]
        }), 200
    
    except Exception as exception:
        traceback.print_exc()
        return jsonify({"error": str(exception)}), 500
    finally:
        connection.close()

@auth_bp.route("/logout", methods=["POST"])
def logout_user():
    try:
        session.pop("user")
        return jsonify({
            "message": "Login out successful! You should be redirected shortly",
        }), 200
    
    except Exception as exception:
        traceback.print_exc()
        return jsonify({"error": str(exception)}), 500


# Data retrival methods
#######################

# gets all colleges from DB
@auth_bp.route("/colleges", methods=["GET"])
def get_colleges():
    connection = get_db_connection()
    try:
        cursor = connection.cursor(dictionary=True) # Asked ChatGPT for the syntax of this cursor
        cursor.execute("SELECT college_id, college_name FROM Colleges")
        colleges = cursor.fetchall()

        return jsonify(colleges)
    except Exception as exception:
        traceback.print_exc()
        return jsonify({"error": str(exception)}), 500
    finally:
        cursor.close()
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
    except Exception as exception:
        traceback.print_exc()
        return jsonify({"error": str(exception)}), 500
    finally:
        cursor.close()
        connection.close()



