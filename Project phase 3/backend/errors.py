"""Turn every error into a JSON response.

The frontend always expects JSON with an "error" key. Without these
handlers, Flask answers unknown routes and crashes with HTML pages.
"""
import mysql.connector
from flask import jsonify
from werkzeug.exceptions import HTTPException


def register_error_handlers(app):
    @app.errorhandler(HTTPException)
    def http_error(error):
        # 404 Not Found, 405 Method Not Allowed, 400 Bad Request, ...
        return jsonify({"error": error.description}), error.code

    @app.errorhandler(mysql.connector.Error)
    def database_error(error):
        app.logger.error("Database error: %s", error)
        return jsonify({"error": "Database error"}), 500

    @app.errorhandler(Exception)
    def unexpected_error(error):
        # Log the full traceback for us; never send internals to the client.
        app.logger.exception("Unhandled error")
        return jsonify({"error": "Something went wrong on our side"}), 500
