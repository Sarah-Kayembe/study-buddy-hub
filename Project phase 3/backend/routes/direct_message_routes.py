# Jacob Craig

from flask import Blueprint, request, jsonify
from mysql.connector import Error as MySQLError
from db import get_db_connection

bp = Blueprint("dm", __name__, url_prefix="/dm")


@bp.route("/start", methods=["POST"])
def start_conversation():
    """
    Find or create a 1-1 conversation between two users.
    Wraps StartDirectConversation(requester, target).
    """
    data = request.get_json(silent=True) or {}
    requester_id = data.get("requester_user_id")
    target_id = data.get("target_user_id")

    if not requester_id or not target_id:
        return jsonify({"detail": "requester_user_id and target_user_id are required"}), 400

    if requester_id == target_id:
        return jsonify({"detail": "Cannot start a conversation with yourself."}), 400

    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        try:
            cur.callproc(
                "StartDirectConversation",
                (int(requester_id), int(target_id)),
            )
        except MySQLError as e:
            conn.rollback()
            msg = str(e)
            if "CANNOT_MESSAGE_SELF" in msg:
                return jsonify({"detail": "Cannot start a conversation with yourself."}), 400
            return jsonify({"detail": msg}), 500

        conversation_id = None
        for result in cur.stored_results():
            row = result.fetchone()
            if row:
                conversation_id = row["conversation_id"]
                break

        conn.commit()

        if conversation_id is None:
            return jsonify({"detail": "Failed to start conversation"}), 500

        return jsonify({"conversation_id": conversation_id}), 200

    except MySQLError as e:
        if conn:
            conn.rollback()
        return jsonify({"detail": str(e)}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@bp.route("/<int:conversation_id>/messages", methods=["GET"])
def get_messages(conversation_id: int):
    """
    Get latest messages for a 1-1 conversation.
    Wraps GetDirectMessages(p_conversation_id, p_limit).
    """
    limit = request.args.get("limit", default=50, type=int)

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        cur.callproc("GetDirectMessages", (conversation_id, limit))

        rows = []
        for result in cur.stored_results():
            for r in result.fetchall():
                # r already includes sent_time aliased in the proc
                if r.get("sent_time") is not None:
                    r["sent_time"] = r["sent_time"].isoformat()
                rows.append(r)

        return jsonify(rows), 200

    except MySQLError as e:
        return jsonify({"detail": str(e)}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@bp.route("/<int:conversation_id>/messages", methods=["POST"])
def send_message(conversation_id: int):
    """
    Send a message in a 1-1 conversation.
    Wraps SendDirectMessage(p_conversation_id, p_sender_id, p_content).
    """
    data = request.get_json(silent=True) or {}
    sender_id = data.get("sender_user_id")
    content = (data.get("content") or "").strip()

    if not sender_id:
        return jsonify({"detail": "sender_user_id is required"}), 400
    if not content:
        return jsonify({"detail": "Message content cannot be empty."}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        cur.callproc(
            "SendDirectMessage",
            (conversation_id, int(sender_id), content),
        )

        message_id = None
        for result in cur.stored_results():
            row = result.fetchone()
            if row:
                message_id = row["message_id"]
                break

        conn.commit()

        if message_id is None:
            return jsonify({"detail": "Failed to send message"}), 500

        return jsonify({"status": "ok", "message_id": message_id}), 201

    except MySQLError as e:
        if conn:
            conn.rollback()
        return jsonify({"detail": str(e)}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@bp.route("/inbox", methods=["GET"])
def get_inbox():
    """
    All conversations for a user + last message + request status.
    Wraps GetDmInboxForUser(p_user_id, p_limit).
    """
    user_id = request.args.get("user_id", type=int)
    limit = request.args.get("limit", default=50, type=int)

    if not user_id:
        return jsonify({"detail": "user_id is required"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        cur.callproc("GetDmInboxForUser", (user_id, limit))

        rows = []
        for result in cur.stored_results():
            for r in result.fetchall():
                if r.get("last_sent_at") is not None:
                    r["last_sent_at"] = r["last_sent_at"].isoformat()
                rows.append(r)

        return jsonify(rows), 200

    except MySQLError as e:
        return jsonify({"detail": str(e)}), 500
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@bp.route("/requests", methods=["GET"])
def get_message_requests():
    """
    Pending message requests for a user.
    Wraps GetMessageRequestsForUser.
    """
    user_id = request.args.get("user_id", type=int)
    limit = request.args.get("limit", default=50, type=int)

    if not user_id:
        return jsonify({"detail": "user_id is required"}), 400

    conn = None
    cur = None

    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        cur.callproc("GetMessageRequestsForUser", (user_id, limit))

        rows = []
        for result in cur.stored_results():
            rows.extend(result.fetchall())

        return jsonify(rows or []), 200

    except MySQLError as e:
        return jsonify({"detail": str(e)}), 500

    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()


@bp.route("/requests/<int:request_id>/<action>", methods=["POST"])
def respond_to_request(request_id: int, action: str):
    """
    POST /dm/requests/<id>/accept or /reject
    body: { "user_id": <target_user_id> }

    Wraps RespondToMessageRequest(p_request_id, p_action, p_user_id).
    """
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"detail": "user_id is required"}), 400
    if action not in ("accept", "reject"):
        return jsonify({"detail": "Invalid action"}), 400

    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        try:
            cur.callproc(
                "RespondToMessageRequest",
                (request_id, action, int(user_id)),
            )
        except MySQLError as e:
            conn.rollback()
            msg = str(e)
            if "REQUEST_NOT_FOUND" in msg:
                return jsonify({"detail": "Request not found"}), 404
            if "NOT_YOUR_REQUEST" in msg:
                return jsonify({"detail": "Not your request"}), 403
            if "INVALID_ACTION" in msg:
                return jsonify({"detail": "Invalid action"}), 400
            return jsonify({"detail": msg}), 500

        new_status = None
        for result in cur.stored_results():
            row = result.fetchone()
            if row:
                new_status = row["request_status"]
                break

        conn.commit()

        if new_status is None:
            return jsonify({"status": "ok"}), 200

        return jsonify({"status": "ok", "request_status": new_status}), 200

    except MySQLError as e:
        if conn:
            conn.rollback()
        return jsonify({"detail": str(e)}), 500

    finally:
        if cur is not None:
            cur.close()
        if conn is not None:
            conn.close()
