"""One log line per request, tagged with a request id.

Each line looks like:
    method=GET path=/quiz/quizzes status=200 duration_ms=12.4 request_id=3f9c1a2b7d4e

The request id is taken from an incoming X-Request-ID header when a proxy
sets one, or generated otherwise, and is echoed back in the response so a
user's error report can be matched to the exact log line.
"""
import logging
import os
import re
import time
import uuid

from flask import g, request

logger = logging.getLogger("studybuddy.requests")

# Only trust simple ids, so a client can't inject fake lines into the log.
SAFE_REQUEST_ID = re.compile(r"^[A-Za-z0-9._-]{1,64}$")


def configure_logging():
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO").upper(),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )


def register_request_logging(app):
    @app.before_request
    def start_timer():
        g.start_time = time.perf_counter()
        incoming = request.headers.get("X-Request-ID", "")
        g.request_id = incoming if SAFE_REQUEST_ID.match(incoming) else uuid.uuid4().hex[:12]

    @app.after_request
    def log_request(response):
        duration_ms = (time.perf_counter() - g.start_time) * 1000
        logger.info(
            "method=%s path=%s status=%s duration_ms=%.1f request_id=%s",
            request.method,
            request.path,
            response.status_code,
            duration_ms,
            g.request_id,
        )
        response.headers["X-Request-ID"] = g.request_id
        return response
