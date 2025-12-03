from flask import Flask, jsonify
from flask_cors import CORS

from routes.studygroup_routes import bp as studygroup_bp
from routes.chat_routes import bp as chat_bp

from routes.auth_routes import auth_bp       # NEW
from routes.user_routes import user_bp       # NEW

from db import get_db_connection as get_db                     # NEW

def create_app():
    app = Flask(__name__)

    # Allow your Vite dev server to talk to the backend
    CORS(
        app,
        resources={
            r"/*": {
                "origins": [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                ]
            }
        },
    )

    @app.route("/")
    def health():
        return jsonify({"status": "backend running"})
    
    # # ---- DB Test Endpoint ----
    # @app.route("/test-db")
    # def test_db():
    #     db = get_db()
    #     cursor = db.cursor()
    #     cursor.execute("SELECT * FROM Users")
    #     rows = cursor.fetchall()
    #     cursor.close()
    #     db.close()

    #     return jsonify({"users": rows})

    # Blueprints already include url_prefix="/groups"
    app.register_blueprint(studygroup_bp)
    app.register_blueprint(chat_bp)

    # Register NEW user management blueprints
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(user_bp, url_prefix="/users")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=8001, debug=True)

