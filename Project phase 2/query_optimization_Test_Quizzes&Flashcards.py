import mysql.connector as mc
import time

"""Author: Vivek
Query Optimization Analysis for Quizzes and Flashcards in StudyBuddy Database."""
# Connecting to the Database 
def get_connection():
    """Establishes a connection to the StudyBuddy database."""
    return mc.connect(
        host="localhost",
        port=3306,
        user="root",
        password="REMOVED",
        database="StudyBuddy",
    )

#Benchmark Helper Functions 

def explain_analyze(cur, query, params=None):
    """Runs EXPLAIN ANALYZE on a query and returns the formatted plan."""
    # Note: EXPLAIN ANALYZE is for MySQL 8.0.18+
    # For older versions, this would just be EXPLAIN
    try:
        cur.execute(f"EXPLAIN ANALYZE {query}", params)
        return "\n".join([row[0] for row in cur.fetchall()])
    except mc.Error as err:
        print(f"\n[WARNING] EXPLAIN ANALYZE failed. Are you on MySQL 8.0.18+?")
        print(f"  Error: {err}")
        print("  Falling back to regular EXPLAIN...")
        cur.execute(f"EXPLAIN {query}", params)
        return "\n".join([str(row) for row in cur.fetchall()])


def timed(cur, query, params=None, n=3):
    """
    Runs a query n times and returns the best wall-clock time in ms.
    Uses SQL_NO_CACHE to avoid query cache.
    """
    if not query.lstrip().upper().startswith("SELECT"):
        raise ValueError("timed() is only for SELECT queries")

    # Add SQL_NO_CACHE to bypass query cache for accurate timing
    if "SELECT" in query:
        query = query.replace("SELECT", "SELECT SQL_NO_CACHE", 1)
    
    times = []
    for _ in range(n):
        start = time.perf_counter()
        cur.execute(query, params)
        cur.fetchall()  # Ensure all results are fetched
        end = time.perf_counter()
        times.append((end - start) * 1000)  # time in ms
    return min(times)


#Main Analysis Script 

def main():
    """
    Main benchmarking script.
    
    ASSUMPTION: The 'StudyBuddy' database and all its data
    (including quizzes/answers) have ALREADY been loaded
    by the build_database.py script.
    """
    print("Starting query optimization analysis...")
    print("ASSUMPTION: 'build_database.py' has already been run and data is loaded.")
    
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(buffered=True)
        
        # --- 1. Verify Data (Sanity Check) ---
        print("\n=== Data Verification ===")
        cur.execute("SELECT COUNT(*) FROM Quiz")
        print(f"  Quizzes: {cur.fetchone()[0]}")
        cur.execute("SELECT COUNT(*) FROM Question")
        print(f"  Questions: {cur.fetchone()[0]}")
        cur.execute("SELECT COUNT(*) FROM Answer")
        print(f"  Answers: {cur.fetchone()[0]}")
        
        # Get a Quiz ID to test with (assumes quiz_id=1 exists)
        cur.execute("SELECT quiz_id FROM Quiz LIMIT 1")
        result = cur.fetchone()
        if not result:
            print("\n[FATAL] No quizzes found in the database.")
            print("  Please run 'build_database.py' first.")
            return
            
        quiz_id = result[0]
        print(f"  Using quiz_id={quiz_id} for benchmarks.")

        # --- 2. Define Queries ---
        # Query A: Simple lookup of questions for a quiz
        qA = """
        SELECT question_id, question_text, points
        FROM Question
        WHERE quiz_id = %s
        ORDER BY question_id
        """

        # Query B: Count correct answers per question for a quiz
        qB = """
        SELECT
            q.question_id,
            q.question_text,
            COUNT(a.answer_id) AS correct_answers
        FROM Question q
        JOIN Answer a ON q.question_id = a.question_id
        WHERE q.quiz_id = %s AND a.is_correct = 1
        GROUP BY q.question_id, q.question_text
        """

        # --- 3. Benchmark BEFORE Indexes ---
        print("\n=== 1. BEFORE INDEXES ===")
        print("Query A plan (before):")
        print(explain_analyze(cur, qA, (quiz_id,)))
        print(f"Query A time (ms, best of 3): {timed(cur, qA, (quiz_id,)):.3f}")
        
        print("\nQuery B plan (before):")
        print(explain_analyze(cur, qB, (quiz_id,)))
        print(f"Query B time (ms, best of 3): {timed(cur, qB, (quiz_id,)):.3f}")

        # --- 4. Create Indexes ---
        print("\n=== 2. CREATING INDEXES ===")
        
        def ensure_index(tbl, idx, create_sql):
            cur.execute(
                """
                SELECT COUNT(*) FROM information_schema.statistics
                WHERE table_schema = DATABASE() AND table_name = %s AND index_name = %s
                """,
                (tbl, idx),
            )
            if cur.fetchone()[0] == 0:
                print(f"Creating index {idx} on {tbl}...")
                cur.execute(create_sql)
                conn.commit()
            else:
                print(f"Index {idx} already exists on {tbl}.")

        # Index for Query A (and B): Covers `quiz_id` for WHERE,
        # and `question_id` for ordering/joining
        ensure_index(
            "Question",
            "idx_question_quizid_qid",
            "CREATE INDEX idx_question_quizid_qid ON Question (quiz_id, question_id)"
        )

        # Index for Query B: Covers `question_id` for JOIN
        # and `is_correct` for WHERE
        ensure_index(
            "Answer",
            "idx_answer_qid_correct",
            "CREATE INDEX idx_answer_qid_correct ON Answer (question_id, is_correct)"
        )

        # --- 5. Benchmark AFTER Indexes ---
        print("\n=== 3. AFTER INDEXES ===")
        print("Query A plan (after):")
        print(explain_analyze(cur, qA, (quiz_id,)))
        print(f"Query A time (ms, best of 3): {timed(cur, qA, (quiz_id,)):.3f}")
        
        print("\nQuery B plan (after):")
        print(explain_analyze(cur, qB, (quiz_id,)))
        print(f"Query B time (ms, best of 3): {timed(cur, qB, (quiz_id,)):.3f}")

        print("\n[SUCCESS] Analysis complete.")

    except mc.Error as err:
        print(f"\n[FATAL] A MySQL error occurred: {err}")
    
    finally:
        if conn and conn.is_connected():
            cur.close()
            conn.close()
            print("\nMySQL connection closed.")

if __name__ == "__main__":
    main()