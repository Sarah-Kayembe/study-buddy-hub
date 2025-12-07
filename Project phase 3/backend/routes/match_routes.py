#Jacob Craig

from flask import Blueprint, request, jsonify, current_app
from mysql.connector import Error as MySQLError
from db import get_db_connection
from werkzeug.utils import secure_filename
import os
import uuid

bp = Blueprint("match", __name__)


@bp.route("/match/profile", methods=["GET"])
def get_match_profile():
    """
    Fetch existing StudyBuddy Match profile + courses for a user.
    """
    user_id = request.args.get("user_id", type=int)
    if not user_id:
        return jsonify({"detail": "user_id is required"}), 400

    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        # main profile
        cur.execute(
            """
            SELECT
              user_id,
              study_style,
              meeting_pref,
              study_goal,
              focus_time_pref,
              noise_pref,
              age,
              preferred_min_age,
              preferred_max_age,
              bio,
              profile_image_url
            FROM Match_Profile
            WHERE user_id = %s
            """,
            (user_id,),
        )
        profile = cur.fetchone()

        if not profile:
            # first-time user
            return jsonify({"exists": False, "profile": None, "courses": []}), 200

        # selected courses
        cur.execute(
            """
            SELECT
              mpc.course_id,
              c.course_code,
              c.course_name,
              col.college_name
            FROM Match_Profile_Course AS mpc
            JOIN Courses AS c
              ON c.course_id = mpc.course_id
            LEFT JOIN Colleges AS col
              ON col.college_id = c.college_id
            WHERE mpc.user_id = %s
            ORDER BY c.course_code, c.course_name
            """,
            (user_id,),
        )
        courses = cur.fetchall() or []

        return jsonify(
            {
                "exists": True,
                "profile": profile,
                "courses": courses,
            }
        ), 200

    except MySQLError as e:
        return jsonify({"detail": str(e)}), 500

    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()


@bp.route("/match/profile", methods=["POST"])
def upsert_match_profile():
    """
    Creates/Updates a user's StudyBuddy match profile.
    """
    data = request.get_json(silent=True) or {}

    user_id = data.get("user_id")
    study_style = data.get("study_style")
    meeting_pref = data.get("meeting_pref")
    bio = data.get("bio")
    profile_image_url = data.get("profile_image_url")
    study_goal = data.get("study_goal")
    focus_time_pref = data.get("focus_time_pref")
    noise_pref = data.get("noise_pref")
    age = data.get("age")
    preferred_min_age = data.get("preferred_min_age")
    preferred_max_age = data.get("preferred_max_age")
    course_ids = data.get("course_ids") or []

    if not user_id:
        return jsonify({"detail": "user_id is required"}), 400

    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        cur.execute(
            "CALL UpsertMatchProfile(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (
                user_id,
                study_style,
                meeting_pref,
                bio,
                profile_image_url,
                study_goal,
                focus_time_pref,
                noise_pref,
                age,
                preferred_min_age,
                preferred_max_age,
            ),
        )

        while cur.nextset():
            pass

        # reset course list
        cur.execute(
            "DELETE FROM Match_Profile_Course WHERE user_id = %s", (user_id,)
        )

        # max 5 courses
        course_ids = list(dict.fromkeys(course_ids))[:5]

        if course_ids:
            values = [(user_id, cid) for cid in course_ids]
            cur.executemany(
                "INSERT INTO Match_Profile_Course (user_id, course_id) VALUES (%s, %s)",
                values,
            )

        conn.commit()

        return jsonify({"status": "ok"}), 200

    except MySQLError as e:
        if conn:
            conn.rollback()
        return jsonify({"detail": str(e)}), 500

    finally:
        try:
            if cur is not None:
                cur.close()
            if conn is not None:
                conn.close()
        except Exception:
            pass


@bp.route("/match/suggestions", methods=["GET"])
def get_study_buddy_matches():
    """
    Get match suggestions for a user on StudyBuddy Match
    """
    user_id = request.args.get("user_id", type=int)
    limit = request.args.get("limit", default=20, type=int)

    if not user_id:
        return jsonify({"detail": "user_id is required"}), 400

    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        cur.execute("CALL GetStudyBuddyMatches(%s, %s)", (user_id, limit))

        rows = cur.fetchall() or []

        while cur.nextset():
            pass

        formatted = []
        for r in rows:
            r["shared_courses"] = int(r.get("shared_courses", 0) or 0)
            r["match_score"] = int(r.get("match_score", 0) or 0)
            formatted.append(r)

        return jsonify(formatted), 200

    except MySQLError as e:
        return jsonify({"detail": str(e)}), 500

    finally:
        try:
            if cur is not None:
                cur.close()
            if conn is not None:
                conn.close()
        except Exception:
            pass


@bp.route("/match/profile/image", methods=["POST"])
def upload_profile_image():
    """
    Upload a profile image and return a URL that can be stored in Match_Profile.
    """
    if "file" not in request.files:
        return jsonify({"detail": "No file uploaded"}), 400

    file = request.files["file"]
    if not file or file.filename == "":
        return jsonify({"detail": "Empty filename"}), 400

    filename = secure_filename(file.filename)
    _, ext = os.path.splitext(filename)
    if ext.lower() not in [".png", ".jpg", ".jpeg", ".gif", ".webp"]:
        return jsonify({"detail": "Unsupported file type"}), 400

    upload_folder = current_app.config.get("UPLOAD_FOLDER")
    if not upload_folder:
        return jsonify({"detail": "Upload folder not configured"}), 500

    new_name = f"{uuid.uuid4().hex}{ext.lower()}"
    save_path = os.path.join(upload_folder, new_name)
    file.save(save_path)

    # absolute URL back to frontend
    base = request.url_root.rstrip("/")
    file_url = f"{base}/uploads/{new_name}"

    return jsonify({"url": file_url}), 201
