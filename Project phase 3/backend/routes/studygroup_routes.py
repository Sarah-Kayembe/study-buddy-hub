#Jacob Craig

from flask import Blueprint, request, jsonify
from mysql.connector import Error as MySQLError
from db import get_db_connection 

studygroup_bp = Blueprint("studygroup", __name__, url_prefix="/groups")


@studygroup_bp.route("", methods=["POST"])
def create_group():
    data = request.get_json()

    group_name = data.get("group_name")
    max_members = data.get("max_members")
    course_id = data.get("course_id")
    is_private = data.get("is_private", False)

    if not group_name or not max_members or not course_id:
        return jsonify({"error": "Missing fields"}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO Study_Group (group_name, max_members, is_private, course_id)
            VALUES (%s, %s, %s, %s)
            """,
            (group_name, max_members, is_private, course_id),
        )

        conn.commit()
        return jsonify({"group_id": cursor.lastrowid}), 201

    except MySQLError as e:
        if conn is not None:
            conn.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()



@studygroup_bp.route("/<int:group_id>/join", methods=["POST"])
def join_group(group_id):
    data = request.get_json()
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "user_id required"}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.callproc("JoinGroupWithLock", (group_id, user_id))
        conn.commit()

        return jsonify({"status": "joined"}), 200

    except MySQLError as e:
        if conn is not None:
            conn.rollback()
        msg = str(e)

        if "ALREADY_MEMBER" in msg:
            return jsonify({"error": "User already a member"}), 409
        if "GROUP_FULL" in msg:
            return jsonify({"error": "Group is full"}), 409
        if "GROUP_NOT_FOUND" in msg:
            return jsonify({"error": "Group not found"}), 404

        return jsonify({"error": msg}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()


