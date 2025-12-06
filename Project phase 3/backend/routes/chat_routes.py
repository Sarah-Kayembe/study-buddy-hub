# backend/routes/chat_routes.py
# Jacob Craig - Chat endpoints (Flask)

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
    Inserts a new chat message into Chat_Message.
    Body JSON: { "user_id": 1005, "content": "hello" }
    """
    data = request.get_json(silent=True) or {}
    user_id = data.get("user_id")
    content = data.get("content")

    if not user_id or not content:
        return jsonify({"detail": "user_id and content are required"}), 400

    conn = None
    cursor = None

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO Chat_Message (group_id, user_id, content)
            VALUES (%s, %s, %s)
            """,
            (group_id, int(user_id), content),
        )

        conn.commit()
        message_id = cursor.lastrowid

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
