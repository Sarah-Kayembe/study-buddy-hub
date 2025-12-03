# from flask import Blueprint

# auth_bp = Blueprint('auth', __name__, url_prefix="/auth")

# @auth_bp.route("/auth-test")
# def auth_test():
#     return {"status": "auth routes loaded"}

# @auth_bp.route("/register")
# def register_user():
#     return "Register account here"

from flask import Blueprint, request, render_template_string

auth_bp = Blueprint('auth', __name__, url_prefix="/auth")

@auth_bp.route("/auth-test")
def auth_test():
    return {"status": "auth routes loaded"}

# GET - Show register page
@auth_bp.route("/register", methods=["GET"])
def register_page():
    return render_template_string("""
        <h1>Register</h1>
        <form action="/auth/register" method="POST">
            <input name="username" placeholder="Username" required>
            <br><br>
            <input name="password" type="password" placeholder="Password" required>
            <br><br>
            <button type="submit">Register</button>
        </form>
    """)

# POST - Handle submission
@auth_bp.route("/register", methods=["POST"])
def register_user():
    username = request.form.get("username")
    password = request.form.get("password")

    if not username or not password:
        return "Missing fields", 400

    return f"User {username} registered!"
