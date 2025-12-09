# Jacob Craig 

import secrets
from datetime import datetime, date, timedelta

from flask import Blueprint, request, jsonify
from mysql.connector import Error as MySQLError

from db import get_db_connection

bp = Blueprint("studygroups", __name__, url_prefix="/groups")


@bp.route("", methods=["POST"])
def create_group():
    """
    Create a new study group, then auto-join creator as owner via CreateStudyGroupWithOwner.

    Body JSON:
    {
      "group_name": "...",
      "max_members": 5,
      "course_id": 420,
      "is_private": false,
      "creator_user_id": 1005
    }
    """
    data = request.get_json(silent=True) or {}

    required = ["group_name", "max_members", "course_id", "creator_user_id"]
    for field in required:
        if field not in data:
            return jsonify({"detail": f"Missing field: {field}"}), 400

    group_name = data["group_name"]
    max_members = int(data["max_members"])
    course_id = int(data["course_id"])
    creator_id = int(data["creator_user_id"])
    is_private = bool(data.get("is_private", False))

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # CALL CreateStudyGroupWithOwner(p_group_name, p_max_members, p_is_private, p_course_id, p_creator_id);
        cursor.callproc(
            "CreateStudyGroupWithOwner",
            (group_name, max_members, is_private, course_id, creator_id),
        )

        group_id = None
        for result in cursor.stored_results():
            row = result.fetchone()
            if row:
                group_id = row["group_id"]
                break

        conn.commit()

        if group_id is None:
            return jsonify({"detail": "Failed to create group"}), 500

        return jsonify({"group_id": group_id}), 201

    except MySQLError as e:
        if conn is not None:
            conn.rollback()
        return jsonify({"detail": str(e)}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()


@bp.route("/<int:group_id>/join", methods=["POST"])
def request_join_group(group_id: int):
    """
    PUBLIC GROUPS: create a join request via RequestJoinPublicGroup.

    Body JSON: { "user_id": 1005 }
    """
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"detail": "Missing field: user_id"}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            cursor.callproc("RequestJoinPublicGroup", (group_id, int(user_id)))
            conn.commit()
        except MySQLError as e:
            conn.rollback()
            msg = str(e)
            if "GROUP_NOT_FOUND" in msg:
                return jsonify({"detail": "Group not found"}), 404
            if "GROUP_IS_PRIVATE" in msg:
                return jsonify({
                    "detail": "This is a private group. Use an invite code to join."
                }), 403
            if "ALREADY_MEMBER" in msg:
                return jsonify({"detail": "User already a member"}), 409
            if "REQUEST_PENDING" in msg:
                return jsonify({
                    "status": "request_pending",
                    "message": "You already have a pending join request for this group."
                }), 409
            if "REQUEST_APPROVED" in msg:
                return jsonify({
                    "status": "already_approved",
                    "message": "You have already been approved for this group."
                }), 409
            return jsonify({"detail": msg}), 500

        return jsonify({
            "status": "request_created",
            "message": "Join request sent to the group owner."
        }), 201

    except MySQLError as e:
        if conn is not None:
            conn.rollback()
        return jsonify({"detail": str(e)}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()

@bp.route("/public", methods=["GET"])
def get_public_groups():
    """
    Returns public groups for a course, ordered by last_session + member count.
    Wraps the GetPublicGroupsForCourse stored procedure.
    Query params: ?course_id=420&limit=20
    """
    course_id = request.args.get("course_id", type=int)
    limit = request.args.get("limit", default=20, type=int)

    if not course_id:
        return jsonify({"detail": "Missing course_id"}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.callproc("GetPublicGroupsForCourse", (course_id, limit))

        groups = []

        for result in cursor.stored_results():
            rows = result.fetchall()
            col_names = result.column_names
            for row in rows:
                row_dict = dict(zip(col_names, row))

                raw_members = row_dict.get("members")
                safe_members = raw_members if raw_members is not None else 0

                groups.append(
                    {
                        "group_id": row_dict["group_id"],
                        "group_name": row_dict["group_name"],
                        "max_members": row_dict["max_members"],
                        "members": safe_members,
                        "last_session": row_dict.get("last_session"),
                    }
                )

        return jsonify(groups), 200

    except MySQLError as e:
        return jsonify({"detail": str(e)}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()


@bp.route("/mine", methods=["GET"])
def get_my_groups():
    """
    Returns all groups a user belongs to, with their role.
    Wraps GetUserGroups(p_user_id).
    Query param: ?user_id=1005
    """
    user_id = request.args.get("user_id", type=int)
    if not user_id:
        return jsonify({"detail": "Missing user_id"}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.callproc("GetUserGroups", (user_id,))

        groups = []

        for result in cursor.stored_results():
            rows = result.fetchall()
            col_names = result.column_names
            for row in rows:
                row_dict = dict(zip(col_names, row))
                groups.append(
                    {
                        "group_id": row_dict["group_id"],
                        "group_name": row_dict["group_name"],
                        "role": row_dict["role"],
                        "user_id": row_dict["user_id"],
                        "user_name": row_dict["user_name"],
                    }
                )

        return jsonify(groups), 200

    except MySQLError as e:
        return jsonify({"detail": str(e)}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()


@bp.route("/sessions/upcoming", methods=["GET"])
def get_upcoming_sessions():
    """
    Wraps GetUpcomingSessionsForUser.
    Query: ?user_id=...&limit=50
    """
    user_id = request.args.get("user_id", type=int)
    limit = request.args.get("limit", default=50, type=int)

    if not user_id:
        return jsonify({"detail": "user_id is required"}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.callproc("GetUpcomingSessionsForUser", (user_id, limit))

        sessions = []

        for result in cursor.stored_results():
            rows = result.fetchall()
            col_names = result.column_names
            for row in rows:
                row_dict = dict(zip(col_names, row))

                if row_dict.get("session_date") is not None:
                    row_dict["session_date"] = row_dict["session_date"].isoformat()
                if row_dict.get("start_time") is not None:
                    row_dict["start_time"] = str(row_dict["start_time"])
                if row_dict.get("end_time") is not None:
                    row_dict["end_time"] = str(row_dict["end_time"])

                sessions.append(row_dict)

        return jsonify(sessions), 200

    except MySQLError as e:
        return jsonify({"detail": str(e)}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()


@bp.route("/<int:group_id>/sessions", methods=["POST"])
def create_session(group_id):
    """
    Schedule a new study session for a specific group, via CreateStudySession.

    Expected JSON body:
    {
      "session_date": "2025-12-01",   # YYYY-MM-DD
      "start_time": "19:00",          # HH:MM (24h)
      "end_time": "20:00",            # HH:MM (24h)
      "location": "Zoom",
      "notes": "Midterm review"
    }
    """
    data = request.get_json(silent=True) or {}

    required = ["session_date", "start_time", "end_time", "location"]
    missing = [k for k in required if not data.get(k)]
    if missing:
        return jsonify({"detail": f"Missing required fields: {', '.join(missing)}"}), 400

    try:
        session_date = datetime.strptime(data["session_date"], "%Y-%m-%d").date()
        start_time = datetime.strptime(data["start_time"], "%H:%M").time()
        end_time = datetime.strptime(data["end_time"], "%H:%M").time()
    except ValueError:
        return jsonify({"detail": "Invalid date or time format"}), 400

    if session_date < date.today():
        return jsonify({"detail": "Session date cannot be in the past"}), 400
    if end_time <= start_time:
        return jsonify({"detail": "End time must be after start time"}), 400

    location = data["location"]
    notes = data.get("notes")

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            cursor.callproc(
                "CreateStudySession",
                (group_id, session_date, start_time, end_time, location, notes),
            )
        except MySQLError as e:
            conn.rollback()
            msg = str(e)
            if "GROUP_NOT_FOUND" in msg:
                return jsonify({"detail": "Group not found"}), 404
            return jsonify({"detail": msg}), 500

        session_id = None
        for result in cursor.stored_results():
            row = result.fetchone()
            if row:
                session_id = row["session_id"]
                break

        conn.commit()
        if session_id is None:
            return jsonify({"detail": "Failed to create session"}), 500

        return jsonify({"session_id": session_id}), 201

    except MySQLError as e:
        if conn is not None:
            conn.rollback()
        return jsonify({"detail": str(e)}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()


@bp.route("/<int:group_id>/requests", methods=["GET"])
def get_group_join_requests(group_id: int):
    """
    List PENDING join requests for a group (owner only).
    Wraps GetGroupJoinRequestsForOwner.

    Query param:
      ?owner_id=1005
    """
    owner_id = request.args.get("owner_id", type=int)
    if not owner_id:
        return jsonify({"detail": "Missing owner_id"}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            cursor.callproc("GetGroupJoinRequestsForOwner", (group_id, owner_id))
        except MySQLError as e:
            msg = str(e)
            if "NOT_OWNER" in msg:
                return jsonify({"detail": "Only group owners can view requests."}), 403
            return jsonify({"detail": msg}), 500

        results = []
        for result in cursor.stored_results():
            rows = result.fetchall()
            for r in rows:
                req_date = r.get("request_date")
                if req_date is not None:
                    req_date = req_date.isoformat()
                results.append(
                    {
                        "user_id": r["user_id"],
                        "full_name": f'{r["first_name"]} {r["last_name"]}',
                        "request_date": req_date,
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


@bp.route("/<int:group_id>/requests/<int:target_user_id>/approve", methods=["POST"])
def approve_join_request(group_id: int, target_user_id: int):
    """
    Approve a pending join request via ApproveJoinRequest.

    Body JSON:
      { "owner_id": 1005 }
    """
    data = request.get_json(silent=True) or {}
    owner_id = data.get("owner_id")

    if not owner_id:
        return jsonify({"detail": "Missing owner_id"}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            cursor.callproc(
                "ApproveJoinRequest",
                (group_id, target_user_id, int(owner_id)),
            )
            conn.commit()
        except MySQLError as e:
            conn.rollback()
            msg = str(e)
            if "NOT_OWNER" in msg:
                return jsonify({"detail": "Only group owners can approve requests."}), 403
            if "NO_PENDING_REQUEST" in msg:
                return jsonify({"detail": "No pending request for this user."}), 404
            if "GROUP_FULL" in msg:
                return jsonify({"detail": "Group is full"}), 409
            if "ALREADY_MEMBER" in msg:
                return jsonify({"detail": "User already a member"}), 409
            if "GROUP_NOT_FOUND" in msg:
                return jsonify({"detail": "Group not found"}), 404
            return jsonify({"detail": msg}), 500

        return jsonify({"status": "approved"}), 200

    except MySQLError as e:
        if conn is not None:
            conn.rollback()
        return jsonify({"detail": str(e)}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()


@bp.route("/<int:group_id>/requests/<int:target_user_id>/reject", methods=["POST"])
def reject_join_request(group_id: int, target_user_id: int):
    """
    Reject a pending join request via RejectJoinRequest.

    Body JSON:
      { "owner_id": 1005 }
    """
    data = request.get_json(silent=True) or {}
    owner_id = data.get("owner_id")

    if not owner_id:
        return jsonify({"detail": "Missing owner_id"}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            cursor.callproc(
                "RejectJoinRequest",
                (group_id, target_user_id, int(owner_id)),
            )
            conn.commit()
        except MySQLError as e:
            conn.rollback()
            msg = str(e)
            if "NOT_OWNER" in msg:
                return jsonify({"detail": "Only group owners can reject requests."}), 403
            if "NO_PENDING_REQUEST" in msg:
                return jsonify({"detail": "No pending request to reject."}), 404
            return jsonify({"detail": msg}), 500

        return jsonify({"status": "rejected"}), 200

    except MySQLError as e:
        if conn is not None:
            conn.rollback()
        return jsonify({"detail": str(e)}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()


@bp.route("/<int:group_id>/members", methods=["GET"])
def get_group_members(group_id: int):
    """
    Return all members of a group.
    Wraps GetGroupMembers(p_group_id).
    """
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.callproc("GetGroupMembers", (group_id,))

        members = []
        for result in cursor.stored_results():
            rows = result.fetchall()
            for r in rows:
                joined_at = r.get("joined_at")
                if joined_at is not None:
                    joined_at = joined_at.isoformat()
                members.append(
                    {
                        "user_id": r["user_id"],
                        "user_name": r["user_name"],
                        "role": r["role"],
                        "joined_at": joined_at,
                    }
                )

        return jsonify(members), 200

    except MySQLError as e:
        return jsonify({"detail": str(e)}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()


@bp.route("/<int:group_id>/members/<int:target_user_id>/kick", methods=["POST"])
def kick_member(group_id: int, target_user_id: int):
    """
    Owner-only: remove a member from the group via KickGroupMember.

    Body JSON: { "owner_id": 1005 }
    """
    data = request.get_json(silent=True) or {}
    owner_id = data.get("owner_id")

    if not owner_id:
        return jsonify({"detail": "Missing field: owner_id"}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        try:
            cursor.callproc(
                "KickGroupMember",
                (group_id, int(owner_id), target_user_id),
            )
            conn.commit()
        except MySQLError as e:
            conn.rollback()
            msg = str(e)
            if "NOT_OWNER" in msg:
                return jsonify({"detail": "Only owner can remove members"}), 403
            if "OWNER_CANNOT_REMOVE_SELF" in msg:
                return jsonify({"detail": "Owner cannot remove themselves"}), 400
            if "MEMBER_NOT_FOUND" in msg:
                return jsonify({"detail": "Member not found in this group"}), 404
            return jsonify({"detail": msg}), 500

        return jsonify({"status": "removed"}), 200

    except MySQLError as e:
        if conn is not None:
            conn.rollback()
        return jsonify({"detail": str(e)}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()


@bp.route("/<int:group_id>/invite-code", methods=["POST"])
def generate_invite_code(group_id: int):
    """
    Owner-only: generate a short-lived invite code for a PRIVATE group.

    Body JSON: { "owner_id": 1005 }
    """
    data = request.get_json(silent=True) or {}
    owner_id = data.get("owner_id")

    if not owner_id:
        return jsonify({"detail": "Missing owner_id"}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check group + private flag
        cursor.execute(
            "SELECT group_id, is_private FROM Study_Group WHERE group_id = %s",
            (group_id,),
        )
        g = cursor.fetchone()
        if not g:
            return jsonify({"detail": "Group not found"}), 404

        if not g["is_private"]:
            return jsonify({"detail": "Invite codes are only for private groups."}), 400

        # Verify owner
        cursor.execute(
            """
            SELECT role
            FROM Group_Member
            WHERE group_id = %s AND user_id = %s
            """,
            (group_id, int(owner_id)),
        )
        role_row = cursor.fetchone()
        if not role_row or role_row["role"] != "owner":
            return jsonify({"detail": "Only group owners can generate invite codes."}), 403

        alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        invite_code = "".join(secrets.choice(alphabet) for _ in range(8))
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        cursor.execute(
            """
            UPDATE Study_Group
            SET invite_code = %s,
                invite_expires_at = %s
            WHERE group_id = %s
            """,
            (invite_code, expires_at, group_id),
        )

        conn.commit()
        return jsonify({
            "invite_code": invite_code,
            "expires_at": expires_at.isoformat() + "Z",
        }), 200

    except MySQLError as e:
        if conn is not None:
            conn.rollback()
        return jsonify({"detail": str(e)}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()


@bp.route("/join-with-code", methods=["POST"])
def join_with_code():
    """
    Join a PRIVATE group using an invite code, via JoinPrivateGroupWithCode.

    Body JSON:
      { "user_id": 1006, "invite_code": "AB12CD34" }
    """
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    invite_code = (data.get("invite_code") or "").strip().upper()

    if not user_id or not invite_code:
        return jsonify({"detail": "user_id and invite_code are required"}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        try:
            cursor.callproc("JoinPrivateGroupWithCode", (int(user_id), invite_code))
        except MySQLError as e:
            conn.rollback()
            msg = str(e)
            if "INVALID_CODE" in msg:
                return jsonify({"detail": "Invalid invite code"}), 404
            if "NOT_PRIVATE_GROUP" in msg:
                return jsonify({"detail": "Invite code is not for a private group"}), 400
            if "CODE_EXPIRED" in msg:
                return jsonify({"detail": "Invite code has expired"}), 410
            if "ALREADY_MEMBER" in msg:
                return jsonify({"detail": "User already a member"}), 409
            if "GROUP_NOT_FOUND" in msg:
                return jsonify({"detail": "Group not found"}), 404
            if "GROUP_FULL" in msg:
                return jsonify({"detail": "Group is full"}), 409
            return jsonify({"detail": msg}), 500

        group_id = None
        for result in cursor.stored_results():
            row = result.fetchone()
            if row:
                group_id = row["group_id"]
                break

        conn.commit()

        if group_id is None:
            return jsonify({"detail": "Failed to join group"}), 500

        return jsonify({
            "status": "joined",
            "group_id": group_id,
        }), 200

    except MySQLError as e:
        if conn is not None:
            conn.rollback()
        return jsonify({"detail": str(e)}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()
