import os
import re
import pandas as pd
from pathlib import Path

"""
CourseResourcesCleaner Version 2

Input file:
    course_resources.csv
    columns: CourseName,TopicName,ContentSnippet,ResourceURL,ResourceType

Outputs (also in same folder):
    course_resources_cleaned.csv
    import_clean_resources.sql   
"""

PROJECT_ROOT = Path(__file__).resolve().parent

RAW_CSV   = PROJECT_ROOT / "course_resources.csv"
CLEAN_CSV = PROJECT_ROOT / "course_resources_cleaned.csv"
SQL_OUT   = PROJECT_ROOT / "import_clean_resources.sql"

# ---------- CONSTANTS ----------

EXPECTED_COLS = [
    "CourseName",
    "TopicName",
    "ContentSnippet",
    "ResourceURL",
    "ResourceType",
]

# table columns
#   resource_id, uploader_id, title, description, filetype, source
TABLE_NAME = "resource"          
DEFAULT_UPLOADER_ID = 1001         

def strip_weird(s: str) -> str:
    """Normalize spacing, remove non-breaking spaces, trim."""
    if s is None:
        return ""
    s = str(s).replace("\u00a0", " ")
    s = s.strip()
    return " ".join(s.split())  # collapse internal whitespace to single spaces


def normalize_snippet(s: str) -> str:
    """ContentSnippet can have newlines/tabs, make one line."""
    if s is None:
        return ""
    s = re.sub(r"\s+", " ", str(s))
    return s.strip()


def sql_escape(s: str) -> str:
    """Escape single quotes for SQL string literals."""
    if s is None:
        return ""
    return str(s).replace("'", "''")

if not RAW_CSV.exists():
    raise FileNotFoundError(f"Missing raw CSV: {RAW_CSV}")

# Read CSV as strings
df = pd.read_csv(RAW_CSV, dtype=str, keep_default_na=False)

# strip spaces
df.rename(columns=lambda c: str(c).strip().replace("\ufeff", ""), inplace=True)

missing = [c for c in EXPECTED_COLS if c not in df.columns]
if missing:
    raise ValueError(
        f"CSV must have columns: {', '.join(EXPECTED_COLS)} "
        f"(missing: {', '.join(missing)})"
    )

# Keep only the expected columns in the right order
df = df[EXPECTED_COLS]

raw_rows = len(df)

# Clean each column
df["CourseName"]     = df["CourseName"].map(strip_weird)
df["TopicName"]      = df["TopicName"].map(strip_weird)
df["ContentSnippet"] = df["ContentSnippet"].map(normalize_snippet)
df["ResourceURL"]    = df["ResourceURL"].map(strip_weird)
df["ResourceType"]   = df["ResourceType"].map(strip_weird).str.upper()

# Drop rows where CourseName, TopicName, and URL are all empty
before_nonempty = len(df)
df = df[
    ~(
        df["CourseName"].str.strip().eq("") &
        df["TopicName"].str.strip().eq("") &
        df["ResourceURL"].str.strip().eq("")
    )
].reset_index(drop=True)
after_nonempty = len(df)

# Deduplicate exact duplicates
before_dedup = len(df)
df = df.drop_duplicates().reset_index(drop=True)
after_dedup = len(df)

print(f"Raw rows: {raw_rows}")
print(f"Dropped empty rows: {before_nonempty - after_nonempty}")
print(f"Dropped duplicates: {before_dedup - after_dedup}")
print(f"Final rows: {after_dedup}")
print("=== First 10 cleaned rows ===")
print(df.head(10).to_string(index=False))

# Write csv

df.to_csv(CLEAN_CSV, index=False, encoding="utf-8")
print(f"[OK] Cleaned CSV -> {CLEAN_CSV}")

# Write sql

lines = [
    "USE StudyBuddy;",
    "START TRANSACTION;"
]

for _, row in df.iterrows():
    topic   = sql_escape(row["TopicName"])       # title
    snippet = sql_escape(row["ContentSnippet"])  # description
    url     = sql_escape(row["ResourceURL"])     # source
    rtype   = sql_escape(row["ResourceType"])    # filetype

    lines.append(
        f"INSERT INTO {TABLE_NAME} "
        "(uploader_id, title, description, filetype, source) "
        f"VALUES ({DEFAULT_UPLOADER_ID}, "
        f"'{topic}', '{snippet}', '{rtype}', '{url}');"
    )

lines.append("COMMIT;")

with open(SQL_OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"[OK] SQL INSERT script -> {SQL_OUT}")


