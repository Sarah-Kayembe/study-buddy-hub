# backend/routes/studygroup_routes.py
# Jacob Craig - Study group endpoints (Flask)
import secrets
from datetime import datetime, date, time, timedelta

from flask import Blueprint, request, jsonify
from mysql.connector import Error as MySQLError
from db import get_db_connection

from db import get_db_connection

bp = Blueprint("studygroups", __name__, url_prefix="/groups")


@bp.route("", methods=["POST"])
def create_group():
    """
    Create a new study group, then auto-join creator via JoinGroupWithLock.
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

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # 1) create the group
        cursor.execute(
            """
            INSERT INTO Study_Group (group_name, max_members, is_private, course_id)
            VALUES (%s, %s, %s, %s)
            """,
            (
                data["group_name"],
                int(data["max_members"]),
                bool(data.get("is_private", False)),
                int(data["course_id"]),
            ),
        )

        group_id = cursor.lastrowid

        # 2) auto-join the creator using your proc (concurrency-safe)
        creator_id = int(data["creator_user_id"])
        cursor.callproc("JoinGroupWithLock", (group_id, creator_id))

        # 3) make the creator the owner instead of plain member
        cursor.execute(
            """
            UPDATE Group_Member
            SET role = 'owner'
            WHERE group_id = %s AND user_id = %s
            """,
            (group_id, creator_id),
        )

        conn.commit()
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
    PUBLIC GROUPS: create a join request (pending) instead of auto-joining.

    Flow:
      - Look up the group.
      - If the group is PRIVATE → reject here (later they'll join by invite code).
      - If user is already a member → 409.
      - If user already has a pending/approved request → 409 with a friendly message.
      - Otherwise → INSERT into Join_Request with join_status='pending'.

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
        # dictionary=True so we can access columns by name
        cursor = conn.cursor(dictionary=True)

        # 1) Look up the group
        cursor.execute(
            "SELECT group_id, is_private FROM Study_Group WHERE group_id = %s",
            (group_id,),
        )
        group_row = cursor.fetchone()
        if not group_row:
            return jsonify({"detail": "Group not found"}), 404

        # PRIVATE group? → using invite codes later, not this endpoint.
        if group_row["is_private"]:
            return jsonify({
                "detail": "This is a private group. Use an invite code to join."
            }), 403

        # 2) Is user already a member?
        cursor.execute(
            """
            SELECT 1
            FROM Group_Member
            WHERE group_id = %s AND user_id = %s
            """,
            (group_id, int(user_id)),
        )
        if cursor.fetchone():
            return jsonify({"detail": "User already a member"}), 409

        # 3) Is there already a pending / approved request?
        cursor.execute(
            """
            SELECT join_status
            FROM Join_Request
            WHERE group_id = %s AND user_id = %s
              AND join_status IN ('pending', 'approved')
            """,
            (group_id, int(user_id)),
        )
        existing = cursor.fetchone()
        if existing:
            status = existing["join_status"]
            if status == "pending":
                return jsonify({
                    "status": "request_pending",
                    "message": "You already have a pending join request for this group."
                }), 409
            if status == "approved":
                return jsonify({
                    "status": "already_approved",
                    "message": "You have already been approved for this group."
                }), 409

        # 4) Create new pending request (no expiration or you can add one if you want)
        cursor.execute(
            """
            INSERT INTO Join_Request (group_id, user_id, join_status)
            VALUES (%s, %s, 'pending')
            """,
            (group_id, int(user_id)),
        )
        conn.commit()

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

# Assuming your blueprint is something like:
# bp = Blueprint("studygroups", __name__, url_prefix="/groups")

@bp.route("/sessions/upcoming", methods=["GET"])
def get_upcoming_sessions():
    user_id = request.args.get("user_id", type=int)
    limit = request.args.get("limit", default=50, type=int)

    if not user_id:
        return jsonify({"detail": "user_id is required"}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # CALL GetUpcomingSessionsForUser(p_user_id, p_limit)
        cursor.callproc("GetUpcomingSessionsForUser", (user_id, limit))

        sessions = []

        for result in cursor.stored_results():
            rows = result.fetchall()
            col_names = result.column_names
            for row in rows:
                row_dict = dict(zip(col_names, row))

                # Make everything JSON-friendly
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
    Schedule a new study session for a specific group.

    Expected JSON body:
    {
      "session_date": "2025-12-01",   # YYYY-MM-DD
      "start_time": "19:00",         # HH:MM (24h)
      "end_time": "20:00",           # HH:MM (24h)
      "location": "Zoom",
      "notes": "Midterm review"
    }
    """
    data = request.get_json() or {}

    required = ["session_date", "start_time", "end_time", "location"]
    missing = [k for k in required if not data.get(k)]
    if missing:
        return jsonify({"detail": f"Missing required fields: {', '.join(missing)}"}), 400

    # Basic parsing / validation
    try:
        session_date = datetime.strptime(data["session_date"], "%Y-%m-%d").date()
        start_time = datetime.strptime(data["start_time"], "%H:%M").time()
        end_time = datetime.strptime(data["end_time"], "%H:%M").time()
    except ValueError:
        return jsonify({"detail": "Invalid date or time format"}), 400

    # NEW: don’t allow sessions in the past
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
        cursor = conn.cursor()

        # Make sure group exists (optional but nice)
        cursor.execute(
            "SELECT group_id FROM Study_Group WHERE group_id = %s",
            (group_id,),
        )
        row = cursor.fetchone()
        if row is None:
            return jsonify({"detail": "Group not found"}), 404

        # Insert session
        cursor.execute(
            """
            INSERT INTO Study_Session (group_id, location, start_time, end_time, notes, session_date)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (group_id, location, start_time, end_time, notes, session_date),
        )
        conn.commit()

        session_id = cursor.lastrowid
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

    Query param:
      ?owner_id=1005   # the current logged-in owner

    Returns:
      [
        {
          "user_id": 1234,
          "full_name": "Alice Smith",
          "request_date": "2025-11-30T12:34:56"
        },
        ...
      ]
    """
    owner_id = request.args.get("owner_id", type=int)
    if not owner_id:
        return jsonify({"detail": "Missing owner_id"}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # 1) Check that this user is an OWNER of the group
        cursor.execute(
            """
            SELECT role
            FROM Group_Member
            WHERE group_id = %s AND user_id = %s
            """,
            (group_id, owner_id),
        )
        role_row = cursor.fetchone()
        if not role_row or role_row["role"] != "owner":
            return jsonify({"detail": "Only group owners can view requests."}), 403

        # 2) Fetch pending requests + user names
        cursor.execute(
            """
            SELECT
                jr.user_id,
                jr.request_date,
                u.first_name,
                u.last_name
            FROM Join_Request AS jr
            JOIN Users AS u
                ON u.user_id = jr.user_id
            WHERE jr.group_id = %s
              AND jr.join_status = 'pending'
            ORDER BY jr.request_date ASC
            """,
            (group_id,),
        )
        rows = cursor.fetchall()

        results = []
        for r in rows:
            # convert datetime to iso string
            req_date = r["request_date"]
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
    Approve a pending join request for a PUBLIC group.

    Body JSON:
      { "owner_id": 1005 }

    Steps:
      - Check owner_id is an owner of the group.
      - Make sure there is a PENDING Join_Request for this user+group.
      - Call JoinGroupWithLock(group_id, target_user_id) to safely add member.
      - Mark the Join_Request row as 'approved' and set approvedBy = owner_id.
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

        # 1) Verify owner
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
            return jsonify({"detail": "Only group owners can approve requests."}), 403

        # 2) Find a pending join request
        cursor.execute(
            """
            SELECT request_id, join_status
            FROM Join_Request
            WHERE group_id = %s
              AND user_id = %s
              AND join_status = 'pending'
            ORDER BY request_date DESC
            LIMIT 1
            """,
            (group_id, target_user_id),
        )
        req_row = cursor.fetchone()
        if not req_row:
            return jsonify({"detail": "No pending request for this user."}), 404

        request_id = req_row["request_id"]

        # 3) Actually add the user using concurrency-safe procedure
        cursor.close()
        cursor = conn.cursor()  # plain cursor for callproc

        try:
            cursor.callproc("JoinGroupWithLock", (group_id, target_user_id))
        except MySQLError as e:
            # If joining fails (full, etc.), rollback and return an error.
            conn.rollback()
            msg = str(e)
            if "GROUP_FULL" in msg:
                return jsonify({"detail": "Group is full"}), 409
            if "ALREADY_MEMBER" in msg:
                return jsonify({"detail": "User already a member"}), 409
            if "GROUP_NOT_FOUND" in msg:
                return jsonify({"detail": "Group not found"}), 404
            return jsonify({"detail": msg}), 500

        # 4) Mark Join_Request as approved
        cursor.close()
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE Join_Request
            SET join_status = 'approved',
                approvedBy = %s
            WHERE request_id = %s
            """,
            (int(owner_id), request_id),
        )

        conn.commit()
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
    Reject a pending join request.

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
        cursor = conn.cursor(dictionary=True)

        # 1) Verify owner
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
            return jsonify({"detail": "Only group owners can reject requests."}), 403

        # 2) Mark pending request as rejected
        cursor.execute(
            """
            UPDATE Join_Request
            SET join_status = 'rejected',
                approvedBy = %s
            WHERE group_id = %s
              AND user_id = %s
              AND join_status = 'pending'
            """,
            (int(owner_id), group_id, target_user_id),
        )

        if cursor.rowcount == 0:
            conn.rollback()
            return jsonify({"detail": "No pending request to reject."}), 404

        conn.commit()
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
    Used by the Manage members modal (for owners & regular members).
    """
    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT 
              gm.user_id,
              CONCAT(u.first_name, ' ', u.last_name) AS user_name,
              gm.role,
              gm.joined_at
            FROM Group_Member gm
            JOIN Users u ON u.user_id = gm.user_id
            WHERE gm.group_id = %s
            ORDER BY 
              CASE gm.role
                WHEN 'owner' THEN 1
                WHEN 'admin' THEN 2
                ELSE 3
              END,
              user_name
            """,
            (group_id,),
        )

        rows = cursor.fetchall()
        return jsonify(rows), 200

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
    Owner-only: remove a member from the group.

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
        cursor = conn.cursor(dictionary=True)

        # 1) Verify requester is an owner of this group
        cursor.execute(
            """
            SELECT role
            FROM Group_Member
            WHERE group_id = %s AND user_id = %s
            """,
            (group_id, int(owner_id)),
        )
        owner_row = cursor.fetchone()
        if not owner_row or owner_row["role"] != "owner":
            return jsonify({"detail": "Only owner can remove members"}), 403

        if int(owner_id) == int(target_user_id):
            return jsonify({"detail": "Owner cannot remove themselves"}), 400

        # 2) Delete the member row (triggers will update Group_Summary)
        cursor.execute(
            """
            DELETE FROM Group_Member
            WHERE group_id = %s AND user_id = %s
            """,
            (group_id, int(target_user_id)),
        )

        if cursor.rowcount == 0:
            return jsonify({"detail": "Member not found in this group"}), 404

        conn.commit()
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

    Returns:
      { "invite_code": "AB12CD34", "expires_at": "2025-11-30T20:45:00" }
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

        # 1) Check group + private flag
        cursor.execute(
            "SELECT group_id, is_private FROM Study_Group WHERE group_id = %s",
            (group_id,),
        )
        g = cursor.fetchone()
        if not g:
            return jsonify({"detail": "Group not found"}), 404

        if not g["is_private"]:
            return jsonify({"detail": "Invite codes are only for private groups."}), 400

        # 2) Verify owner
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

        # 3) Generate random 8-char alphanumeric code
        alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"  # avoid confusing chars
        invite_code = "".join(secrets.choice(alphabet) for _ in range(8))
        expires_at = datetime.utcnow() + timedelta(minutes=10)

        # 4) Store on the group (overwrites previous code)
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
    Join a PRIVATE group using an invite code.

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

        # 1) Find matching private group with non-expired code
        cursor.execute(
            """
            SELECT group_id, is_private, invite_expires_at
            FROM Study_Group
            WHERE invite_code = %s
            """,
            (invite_code,),
        )
        g = cursor.fetchone()
        if not g:
            return jsonify({"detail": "Invalid invite code"}), 404

        if not g["is_private"]:
            return jsonify({"detail": "Invite code is not for a private group"}), 400

        expires_at = g["invite_expires_at"]
        if not expires_at or expires_at < datetime.utcnow():
            return jsonify({"detail": "Invite code has expired"}), 410

        group_id = g["group_id"]
        user_id_int = int(user_id)

        # 2) Check already member
        cursor.execute(
            """
            SELECT 1
            FROM Group_Member
            WHERE group_id = %s AND user_id = %s
            """,
            (group_id, user_id_int),
        )
        if cursor.fetchone():
            return jsonify({"detail": "User already a member"}), 409

        # 3) Add user via concurrency-safe proc
        cursor.close()
        cursor = conn.cursor()
        try:
            cursor.callproc("JoinGroupWithLock", (group_id, user_id_int))
        except MySQLError as e:
            conn.rollback()
            msg = str(e)
            if "GROUP_FULL" in msg:
                return jsonify({"detail": "Group is full"}), 409
            if "ALREADY_MEMBER" in msg:
                return jsonify({"detail": "User already a member"}), 409
            if "GROUP_NOT_FOUND" in msg:
                return jsonify({"detail": "Group not found"}), 404
            return jsonify({"detail": msg}), 500

        conn.commit()
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
