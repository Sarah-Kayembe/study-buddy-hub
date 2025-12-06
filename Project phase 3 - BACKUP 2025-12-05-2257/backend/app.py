from flask import Flask, jsonify
from flask_cors import CORS

from routes.studygroup_routes import bp as studygroup_bp
from routes.chat_routes import bp as chat_bp
from routes.quiz_routes import quiz_bp
from routes.flashcard_routes import flashcard_bp

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
                    "http://localhost:5176",
                    "http://127.0.0.1:5176",
                ]
            }
        },
    )

    @app.route("/")
    def health():
        return jsonify({"status": "backend running"})

    # Blueprints already include url_prefix="/groups"
    app.register_blueprint(studygroup_bp)
    app.register_blueprint(chat_bp)
    app.register_blueprint(quiz_bp)
    app.register_blueprint(flashcard_bp)

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="127.0.0.1", port=8001, debug=True)

