"""
Import quiz data from Phase 2 CSV files into Phase 3 database.
Usage: python import_quiz_data.py
"""

import csv
import os
import sys
import mysql.connector
from pathlib import Path

# Database configuration
DB_CONFIG = {
    'host': os.getenv('SB_DB_HOST', 'localhost'),
    'user': os.getenv('SB_DB_USER', 'root'),
    'password': os.getenv('SB_DB_PASSWORD', 'REMOVED'),
    'database': os.getenv('SB_DB_NAME', 'studybuddy')
}

# Paths to Phase 2 CSV files
PHASE2_DIR = Path(__file__).parent.parent.parent.parent / "Project phase 2" / "data" / "Clean_data"
QUESTIONS_CSV = PHASE2_DIR / "quiz_questions_clean.csv"
ANSWERS_CSV = PHASE2_DIR / "quiz_answers_clean.csv"


def load_csv(filepath):
    """Load CSV file and return list of dictionaries."""
    if not filepath.exists():
        print(f" File not found: {filepath}")
        return []
    
    data = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data.append(row)
    print(f"Loaded {len(data)} rows from {filepath.name}")
    return data


def import_quiz_data():
    """Import quiz data from Phase 2 CSVs to Phase 3 database."""
    
    print("\n" + "="*60)
    print("Quiz Data Import: Phase 2 → Phase 3")
    print("="*60)
    
    # Load CSV data
    print("\n Loading CSV files...")
    questions = load_csv(QUESTIONS_CSV)
    answers = load_csv(ANSWERS_CSV)
    
    if not questions or not answers:
        print("Failed to load CSV files")
        return False
    
    # Connect to database
    print(f"\n Connecting to database: {DB_CONFIG['database']}...")
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        print(" Database connected")
    except mysql.connector.Error as err:
        print(f" Database connection failed: {err}")
        return False
    
    try:
        # Create quiz
        print("\n Creating quiz...")
        quiz_title = "SQL Basics (Imported from Phase 2)"
        quiz_desc = "Comprehensive SQL quiz with multiple choice questions"
        creator_id = 1
        
        cursor.execute(
            "INSERT INTO quiz (title, description, course_id, creator_id) VALUES (%s, %s, %s, %s)",
            (quiz_title, quiz_desc, None, creator_id)
        )
        quiz_id = cursor.lastrowid
        print(f" Created quiz (ID: {quiz_id})")
        
        # Map old question IDs to new question IDs
        qid_map = {}
        question_count = 0
        
        print("\n Importing questions...")
        for idx, q in enumerate(questions, start=1):
            old_qid = int(q.get('question_id', -1))
            question_text = q.get('question_text', '').strip()
            question_type = q.get('question_type', 'multiple_choice')
            points = int(q.get('points', 1))
            
            if not question_text:
                continue
            
            cursor.execute(
                "INSERT INTO question (quiz_id, question_text, question_type, points) VALUES (%s, %s, %s, %s)",
                (quiz_id, question_text, question_type, points)
            )
            new_qid = cursor.lastrowid
            qid_map[old_qid] = new_qid
            question_count += 1
        
        print(f"Imported {question_count} questions")
        
        # Import answers
        answer_count = 0
        print("\n Importing answers...")
        # Known correct answers for this dataset (by original question order starting at 0)
        correct_map = {
            0: "Structure Query Language",
            1: "SELECT",
            2: "To filter rows based on a specified condition",
            3: "UPDATE",
            4: "Group rows that have the same values into summary rows",
            5: "AND",
            6: "Orders the result set based on specified columns",
            7: "DELETE",
            8: "Filters duplicate rows from the result set",
            9: "ALTER",
        }
        for a in answers:
            old_qid = int(a.get('question_id', -1))
            answer_text = a.get('answer_text', '').strip()
            is_correct_str = a.get('is_correct', '0').strip().lower()
            
            # Map is_correct from CSV; if CSV lacked correct flag, derive from known correct_map
            if old_qid in correct_map and answer_text == correct_map[old_qid]:
                is_correct = 1
            else:
                is_correct = 1 if is_correct_str in ['1', 'true', 'yes'] else 0
            
            if old_qid not in qid_map or not answer_text:
                continue
            
            new_qid = qid_map[old_qid]
            cursor.execute(
                "INSERT INTO answer (question_id, answer_text, is_correct) VALUES (%s, %s, %s)",
                (new_qid, answer_text, is_correct)
            )
            answer_count += 1
        
        print(f"Imported {answer_count} answers")
        
        # Commit transaction
        conn.commit()
        
        print("\n" + "="*60)
        print("Import successful!")
        print(f"  - Quiz ID: {quiz_id}")
        print(f"  - Questions: {question_count}")
        print(f"  - Answers: {answer_count}")
        print("="*60 + "\n")
        
        return True
        
    except mysql.connector.Error as err:
        conn.rollback()
        print(f"Database error: {err}")
        return False
    finally:
        try:
            cursor.close()
        except:
            pass
        try:
            conn.close()
        except:
            pass


if __name__ == "__main__":
    success = import_quiz_data()
    sys.exit(0 if success else 1)
