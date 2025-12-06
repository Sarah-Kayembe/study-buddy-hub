import os, re, base64, pandas as pd
from urllib.parse import urlparse, parse_qs, unquote

# CourseResourceCleaner.py
# Cleans /data/course_resources.csv and writes:
#   1) /data/clean/course_resources_cleaned.csv
#   2) /Project phase 2/StudyGroups&CollaborationSQL/insert_resources.sql

# === File Paths ===
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))   # /data
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))               # /Project phase 2

INPUT_CSV     = os.path.join(BASE_DIR, "course_resources.csv")
CLEAN_DIR     = os.path.join(BASE_DIR, "clean")
CLEAN_CSV_OUT = os.path.join(CLEAN_DIR, "course_resources_cleaned.csv")

SQL_OUT_DIR = os.path.join(PROJECT_ROOT, "StudyGroups&CollaborationSQL")
SQL_OUT     = os.path.join(SQL_OUT_DIR, "insert_resources.sql")

os.makedirs(CLEAN_DIR, exist_ok=True)
os.makedirs(SQL_OUT_DIR, exist_ok=True)

DEFAULT_UPLOADER_ID = 1001  # change if needed

# === Known Filetypes ===
KNOWN_EXT = {
    "pdf":"PDF","doc":"DOC","docx":"DOCX","ppt":"PPT","pptx":"PPTX",
    "xls":"XLS","xlsx":"XLSX","csv":"CSV","txt":"TXT","zip":"ZIP",
    "rar":"RAR","7z":"7Z","html":"HTML","htm":"HTML",
    "png":"PNG","jpg":"JPG","jpeg":"JPG","gif":"GIF","svg":"SVG",
    "mp4":"MP4","mov":"MOV","avi":"AVI","mp3":"MP3","wav":"WAV"
}

# === Helper Functions ===

def sql_escape(s: str) -> str:
    # Escape single quotes for SQL output
    return str(s).replace("'", "''") if s else ""

def strip_weird(s: str) -> str:
    # Trim weird spacing and characters
    if s is None:
        return ""
    s = str(s).replace("›", " ").replace("\u00a0", " ").strip()
    return " ".join(s.split())

def maybe_b64_url(s: str) -> str:
    # Decode base64-style URLs if they start with http(s)
    if not s:
        return ""
    t = s.strip()
    if t.lower().startswith(("http://", "https://")):
        return t

    for m in re.finditer(r"[A-Za-z0-9+/_=-]{20,}", t, flags=re.I):
        cand = m.group(0).replace("-", "+").replace("_", "/")
        pad = len(cand) % 4
        if pad:
            cand += "=" * (4 - pad)
        try:
            decoded = base64.b64decode(cand, validate=False).decode("utf-8", errors="ignore").strip()
            if decoded.lower().startswith(("http://", "https://")):
                return decoded
        except Exception:
            continue

    m = re.search(r"aHR0[0-9A-Za-z+/=_-]*", t, flags=re.I)
    if m:
        cand = m.group(0)
        pad = len(cand) % 4
        if pad:
            cand += "=" * (4 - pad)
        try:
            decoded = base64.b64decode(cand, validate=False).decode("utf-8", errors="ignore").strip()
            if decoded.lower().startswith(("http://", "https://")):
                return decoded
        except Exception:
            pass
    return s

def unwrap_bing(u: str) -> str:
    # Unwrap Bing redirect URLs
    if not u:
        return ""
    try:
        p = urlparse(u)
        if p.netloc.lower().endswith("bing.com") and p.path.startswith("/ck/"):
            qs = parse_qs(p.query)
            raw = unquote(qs.get("u", [""])[0])
            return maybe_b64_url(raw)
        return u
    except Exception:
        return u

def normalize_url(u: str) -> str:
    # Final cleanup for URLs
    u = strip_weird(u)
    if not u:
        return ""
    if "bing.com/ck/" in u:
        u = unwrap_bing(u)
    else:
        u = maybe_b64_url(u)
    return u.strip()

def title_from_url(u: str) -> str:
    # Generate fallback titles from URL paths
    try:
        p = urlparse(u)
        if not p.netloc:
            return (u or "").strip()[:100]
        seg = os.path.basename(p.path) or p.path.strip("/")
        if not seg:
            return p.netloc[:100]
        base, _ext = os.path.splitext(seg)
        base = base.replace("-", " ").replace("_", " ").strip()
        return (base or p.netloc)[:100]
    except Exception:
        return (u or "")[:100]

def clean_title(raw_title: str, url: str) -> str:
    # Clean raw title, fallback if too short or generic
    t = strip_weird(raw_title)
    cut_at = min([x for x in [t.find("http://"), t.find("https://")] if x != -1] or [len(t)])
    t = t[:cut_at].strip()
    BORING = {"in","login","event","topic","topics","home","index","default","search"}

    def url_fallback(u: str) -> str:
        p = urlparse(u)
        host = p.netloc or ""
        seg  = os.path.basename(p.path) or p.path.strip("/")
        seg  = seg.replace("-", " ").replace("_", " ").strip()
        if not seg or len(seg) < 4 or seg.lower() in BORING:
            parts = [s for s in p.path.split("/") if s]
            seg = (parts[-2].replace("-", " ").replace("_", " ").strip() if len(parts) >= 2 else host)
        title = f"{host} / {seg}" if seg and host else (seg or host)
        return title.title()[:100]

    if (not t) or re.search(r"\.(com|org|gov|edu|net)(/|$)", t.lower()) or t.lower() in BORING or len(t) < 3:
        t = url_fallback(url)
    return t[:100]

def filetype_from_url(u: str) -> str:
    # Detect filetype from URL extension
    if not u:
        return "LINK"
    try:
        p = urlparse(u)
        _root, ext = os.path.splitext(p.path)
        ext = ext.lstrip(".").lower()
        return KNOWN_EXT.get(ext, "LINK")
    except Exception:
        return "LINK"

# === Main ===

if not os.path.exists(INPUT_CSV):
    raise FileNotFoundError(f"missing file: {INPUT_CSV}")

# CSV header should be: query,title,url
df = pd.read_csv(INPUT_CSV, dtype=str, keep_default_na=False)
for col in ["title", "url"]:
    if col not in df.columns:
        raise ValueError("CSV must have columns: query,title,url")

raw_count = len(df)

# Clean URLs and Titles
sources = df["url"].map(normalize_url)
titles = [clean_title(rt, src) for rt, src in zip(df["title"], sources)]

cdf = pd.DataFrame({
    "title":       pd.Series(titles, dtype="string"),
    "description": pd.Series([""] * raw_count, dtype="string"),
    "filetype":    pd.Series(sources.map(filetype_from_url).tolist(), dtype="string"),
    "source":      pd.Series(sources, dtype="string")
})

# Drop truly empty rows
before_drop = len(cdf)
cdf = cdf[~(cdf["title"].str.strip().eq("") & cdf["source"].str.strip().eq(""))].reset_index(drop=True)
after_drop = len(cdf)

print(f"raw rows: {raw_count}")
print(f"dropped empty rows: {before_drop - after_drop}")
print("=== first 15 cleaned rows ===")
print(cdf.head(15).to_string(index=False))

# Write Clean CSV
cdf.to_csv(CLEAN_CSV_OUT, index=False, encoding="utf-8")
print(f"\n[OK] Cleaned {len(cdf)} rows -> {CLEAN_CSV_OUT}")

# Write SQL 
lines = [
    "USE StudyBuddy;",
    f"SET @uploader_id := {DEFAULT_UPLOADER_ID};",
    "START TRANSACTION;"
]
for _, row in cdf.iterrows():
    title = sql_escape(row["title"])
    descr = sql_escape(row["description"])
    ftype = sql_escape(row["filetype"])
    src   = sql_escape(row["source"])
    lines.append(
        "INSERT INTO Resource (uploader_id, title, description, filetype, source) "
        f"VALUES (@uploader_id, '{title}', '{descr}', '{ftype}', '{src}');"
    )
lines.append("COMMIT;")

with open(SQL_OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"[OK] Wrote SQL -> {SQL_OUT}")

