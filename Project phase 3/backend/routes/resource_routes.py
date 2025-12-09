# Jacob Craig
import os
from flask import Blueprint, request, jsonify, session, current_app
from db import get_db_connection
from werkzeug.utils import secure_filename

bp = Blueprint("resources", __name__)

# basic whitelist for uploads 
ALLOWED_RESOURCE_EXTENSIONS = {
    "pdf",
    "mp4",
    "mov",
    "mkv",
}

def _allowed_resource_file(filename: str) -> bool:
    if "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in ALLOWED_RESOURCE_EXTENSIONS


@bp.route("/resources", methods=["GET"])
def list_resources():
    """
    show resources for the main resources page
    """
    limit = request.args.get("limit", type=int)  # None if not provided

    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    try:
        if not limit or limit <= 0:
            cur.execute(
                """
                SELECT resource_id,
                       title,
                       description,
                       filetype,
                       source,
                       upload_date
                FROM Resource
                ORDER BY resource_id ASC
                """
            )
            rows = cur.fetchall()
        else:
            cur.callproc("GetLatestResources", [limit])
            rows = []
            for result in cur.stored_results():
                rows.extend(result.fetchall())

        return jsonify(rows), 200

    except Exception as e:
        print("Error in /resources GET:", e)
        return jsonify({"error": "Failed to fetch resources"}), 500
    finally:
        cur.close()
        conn.close()


@bp.route("/resources", methods=["POST"])
def create_resource():
    """
    create a new resource that points at a URL (link / video on another site)
    """
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    user_id = user["user_id"]

    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    url = (data.get("url") or "").strip()
    filetype = (data.get("filetype") or "").strip().upper()  # LINK / VIDEO / etc.

    if not title or not url or not filetype:
        return jsonify({"error": "title, url, and filetype are required"}), 400

    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    try:
        cur.execute(
            """
            INSERT INTO Resource (uploader_id, title, description, filetype, source, upload_date)
            VALUES (%s, %s, %s, %s, %s, NOW())
            """,
            (user_id, title, description, filetype, url),
        )
        resource_id = cur.lastrowid

        cur.execute(
            """
            SELECT resource_id,
                   title,
                   description,
                   filetype,
                   source,
                   upload_date
            FROM Resource
            WHERE resource_id = %s
            """,
            (resource_id,),
        )
        row = cur.fetchone()

        conn.commit()
        return jsonify(row), 201

    except Exception as e:
        print("Error in /resources POST:", e)
        conn.rollback()
        return jsonify({"error": "Failed to create resource"}), 500
    finally:
        cur.close()
        conn.close()


@bp.route("/resources/upload-file", methods=["POST"])
def upload_resource_file():
    """
    upload a file (pdf / video / other) and create a Resource row that points
    at /uploads/resources/<file>
    """
    user = session.get("user")
    if not user:
        return jsonify({"error": "Not logged in"}), 401

    user_id = user["user_id"]

    title = (request.form.get("title") or "").strip()
    description = (request.form.get("description") or "").strip()
    filetype = (request.form.get("filetype") or "").strip().upper()  # PDF / VIDEO / OTHER

    if not title or not filetype:
        return jsonify({"error": "title and filetype are required"}), 400

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    if not _allowed_resource_file(file.filename):
        return jsonify({"error": "Unsupported file type"}), 400

    filename = secure_filename(file.filename)

    # uploads/resources/<filename>
    base_upload = current_app.config["UPLOAD_FOLDER"]
    resources_dir = os.path.join(base_upload, "resources")
    os.makedirs(resources_dir, exist_ok=True)

    full_path = os.path.join(resources_dir, filename)
    file.save(full_path)

    relative_path = f"resources/{filename}"
    url = f"/uploads/{relative_path}"

    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    try:
        cur.execute(
            """
            INSERT INTO Resource (uploader_id, title, description, filetype, source, upload_date)
            VALUES (%s, %s, %s, %s, %s, NOW())
            """,
            (user_id, title, description, filetype, url),
        )
        resource_id = cur.lastrowid

        cur.execute(
            """
            SELECT resource_id,
                   title,
                   description,
                   filetype,
                   source,
                   upload_date
            FROM Resource
            WHERE resource_id = %s
            """,
            (resource_id,),
        )
        row = cur.fetchone()

        conn.commit()
        return jsonify(row), 201

    except Exception as e:
        print("Error in /resources/upload-file POST:", e)
        conn.rollback()
        return jsonify({"error": "Failed to upload resource"}), 500
    finally:
        cur.close()
        conn.close()
