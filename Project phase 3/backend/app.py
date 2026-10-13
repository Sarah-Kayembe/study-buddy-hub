from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os
import secrets
import bcrypt
import mysql.connector
from dotenv import load_dotenv

from routes.studygroup_routes import bp as studygroup_bp
from routes.chat_routes import bp as chat_bp
from routes.course_routes import bp as courses_bp
from routes.match_routes import bp as match_bp
from routes.direct_message_routes import bp as dm_bp

from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.quiz_routes import quiz_bp
from routes.flashcard_routes import flashcard_bp

from routes.resource_routes import bp as resources_bp
from db import get_db_connection as get_db, transaction

# Load environment variables
load_dotenv()


def seed_admin_user():
    """Auto-create admin user on first run if it doesn't exist."""
    admin_username = os.getenv("ADMIN_USERNAME", "admin")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin")
    
    conn = get_db()
    if not conn:
        print("[SEED] Database connection failed; skipping admin user seed.")
        return
    
    cursor = conn.cursor(dictionary=True)
    try:
        # Check if admin user exists
        cursor.execute("SELECT user_id FROM Users WHERE email = %s", (admin_username,))
        existing = cursor.fetchone()
        
        if not existing:
            # Store a bcrypt hash, the same format the login route checks against
            password_hash = bcrypt.hashpw(admin_password.encode(), bcrypt.gensalt()).decode()
            cursor.execute(
                """
                INSERT INTO Users (first_name, last_name, email, password_hash, bio)
                VALUES (%s, %s, %s, %s, %s)
                """,
                ("Admin", "User", admin_username, password_hash, "Default admin account")
            )
            conn.commit()
            print(f"[SEED] Admin user created: {admin_username}")
        else:
            print(f"[SEED] Admin user already exists: {admin_username}")
    except Exception as e:
        print(f"[SEED] Error seeding admin user: {e}")
    finally:
        cursor.close()
        conn.close()
                  

def create_app():
    app = Flask(__name__)
    # Sessions are signed with this key. Set SECRET_KEY in .env so sessions
    # survive restarts; a random key is generated for local runs otherwise.
    app.secret_key = os.getenv("SECRET_KEY") or secrets.token_hex(32)

    # Where we store uploaded profile images
    base_dir = os.path.dirname(os.path.abspath(__file__))
    upload_folder = os.path.join(base_dir, "uploads")
    os.makedirs(upload_folder, exist_ok=True)
    app.config["UPLOAD_FOLDER"] = upload_folder

    # Allow vite dev server to talk to the backend
    CORS(
        app,
        resources={
            r"/*": {
                "origins": [
                    "http://localhost:5173",
                    "http://127.0.0.1:5173",
                    "http://localhost:5176",
                    "http://127.0.0.1:5176"
                ],
            }
        },
        supports_credentials=True
    )

    @app.route("/")
    def index():
        return jsonify({"status": "backend running"})

    @app.route("/health")
    def health():
        """Liveness check for hosting platforms and uptime monitors.

        Returns 200 when the app can reach the database and 503 when it
        can't, so a monitor can tell "running" apart from "working".
        """
        try:
            with transaction() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except Exception:
            app.logger.exception("Health check failed: database unreachable")
            return jsonify({"status": "unhealthy", "database": "unreachable"}), 503
        return jsonify({"status": "ok", "database": "ok"})

    # serve uploaded files (profile pics, resources, etc.)
    @app.route("/uploads/<path:filename>")
    def uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    # Study group & chat blueprints (these already have url_prefix="/groups" inside)
    app.register_blueprint(studygroup_bp)
    app.register_blueprint(chat_bp)

    # Courses + StudyBuddy Match + DMs
    app.register_blueprint(courses_bp)
    app.register_blueprint(match_bp)
    app.register_blueprint(dm_bp)

    # Auth & user profile
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(user_bp, url_prefix="/user")

    # Quizzes & flashcards
    app.register_blueprint(quiz_bp)
    app.register_blueprint(flashcard_bp)

    #Resources
    app.register_blueprint(resources_bp)

    @app.errorhandler(mysql.connector.Error)
    def database_error(error):
        # Any database failure that a route doesn't handle itself ends up
        # here, so the client always gets JSON instead of an HTML error page.
        app.logger.error("Database error: %s", error)
        return jsonify({"error": "Database error"}), 500

    return app

if __name__ == "__main__":
    # Seed admin user on startup
    seed_admin_user()
    
    app = create_app()
    app.run(host="127.0.0.1", port=8001, debug=True)
