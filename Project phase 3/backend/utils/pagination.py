DEFAULT_LIMIT = 20
MAX_LIMIT = 100


def parse_pagination(args):
    """Read ?page= and ?limit= from a request's query string.

    Returns (page, limit, offset). page is at least 1 and limit is kept
    between 1 and MAX_LIMIT. Raises ValueError if either isn't a number.
    """
    page = max(1, int(args.get("page", 1)))
    limit = min(max(int(args.get("limit", DEFAULT_LIMIT)), 1), MAX_LIMIT)
    return page, limit, (page - 1) * limit
