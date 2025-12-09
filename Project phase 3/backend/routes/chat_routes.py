# Jacob Craig 

from flask import Blueprint, request, jsonify
from mysql.connector import Error as MySQLError
from datetime import datetime

from db import get_db_connection

bp = Blueprint("chat", __name__, url_prefix="/groups")


@bp.route("/<int:group_id>/chat", methods=["GET"])
def get_chat_messages(group_id: int):
    """
    Returns latest chat messages for a group.
    Wraps GetChatMessagesForGroup stored procedure.
    Query param: ?limit=50
    """
    limit = request.args.get("limit", default=50, type=int)

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.callproc("GetChatMessagesForGroup", (group_id, limit))

        messages = []

        for result in cursor.stored_results():
            rows = result.fetchall()
            col_names = result.column_names  # ['message_id','user_id','content','sent_time']
            for row in rows:
                row_dict = dict(zip(col_names, row))
                sent = row_dict["sent_time"]
                messages.append(
                    {
                        "message_id": row_dict["message_id"],
                        "user_id": row_dict["user_id"],
                        "content": row_dict["content"],
                        "sent_time": sent.isoformat()
                        if isinstance(sent, datetime)
                        else sent,
                    }
                )

        return jsonify(messages), 200

    except MySQLError as e:
        return jsonify({"detail": str(e)}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()


@bp.route("/<int:group_id>/chat", methods=["POST"])
def post_chat_message(group_id: int):
    """
    Inserts a new chat message via AddChatMessage.
    Body JSON: { "user_id": 1005, "content": "hello" }
    """
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    content = (data.get("content") or "").strip()

    if not user_id or not content:
        return jsonify({"detail": "user_id and content are required"}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # CALL AddChatMessage(p_group_id, p_user_id, p_content)
        cursor.callproc("AddChatMessage", (group_id, int(user_id), content))

        message_id = None
        for result in cursor.stored_results():
            row = result.fetchone()
            if row:
                message_id = row[0] if not isinstance(row, dict) else row["message_id"]
                break

        conn.commit()

        if message_id is None:
            return jsonify({"detail": "Failed to create message"}), 500

        return jsonify({"message_id": message_id}), 201

    except MySQLError as e:
        if conn is not None:
            conn.rollback()
        return jsonify({"detail": str(e)}), 500

    finally:
        if cursor is not None:
            cursor.close()
        if conn is not None:
            conn.close()
