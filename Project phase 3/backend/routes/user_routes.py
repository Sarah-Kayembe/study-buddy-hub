from flask import Blueprint

user_bp = Blueprint('users', __name__, url_prefix="/users")

@user_bp.route("/user-test")
def user_test():
    return {"status": "user routes loaded"}
