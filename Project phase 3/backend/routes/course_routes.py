# Jacob Craig

from flask import Blueprint, request, jsonify
from mysql.connector import Error as MySQLError
from db import get_db_connection

bp = Blueprint("courses", __name__, url_prefix="/courses")


@bp.route("/search", methods=["GET"])
def search_courses():
    """
    Smart search over course_code / course_name.

    Query params:
      ?q=cos 420&limit=8

    Returns:
      [
        {
          "course_id": 123,
          "course_code": "COS 420",
          "course_name": "Database Systems",
          "college_name": "University of Southern Maine"
        },
        ...
      ]
    """
    q = (request.args.get("q") or "").strip()
    limit = request.args.get("limit", default=8, type=int)

    if len(q) < 2:
        # too short – avoid spamming DB
        return jsonify([]), 200

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # CALL SearchCoursesSmart(p_query, p_limit)
        cursor.callproc("SearchCoursesSmart", (q, limit))

        results = []
        for result in cursor.stored_results():
            rows = result.fetchall()
            for r in rows:
                results.append(
                    {
                        "course_id": r["course_id"],
                        "course_code": r["course_code"],
                        "course_name": r["course_name"],
                        "college_name": r.get("college_name"),
                    }
                )

        return jsonify(results), 200

    except MySQLError as e:
        return jsonify({"detail": str(e)}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()
