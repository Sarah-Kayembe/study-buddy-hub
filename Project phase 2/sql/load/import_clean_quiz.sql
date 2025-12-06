-- Import cleaned quiz data into existing schema
-- Requires MySQL 8.0+ (uses ROW_NUMBER()) and LOCAL INFILE enabled on client
-- Run with: mysql --local-infile=1 -u <user> -p < database
-- Notes:
--  - Update @CREATOR_ID to an existing Users.user_id in your DB
--  - Update paths below only if your CSVs move (use forward slashes)

use StudyBuddy;

--  Configure quiz metadata and creator 
SET @CREATOR_ID := 1;  -- Change to an existing user_id in the Users table ( testing with admin for now)
SET @QUIZ_TITLE := 'SQL Basics (Imported)';
SET @QUIZ_DESC  := 'Imported from Clean_data';

START TRANSACTION;

-- ==== Create a Quiz to attach questions to ====
INSERT INTO Quiz (title, description, course_id, creator_id)
VALUES (@QUIZ_TITLE, @QUIZ_DESC, NULL, @CREATOR_ID);
SET @QUIZ_ID := LAST_INSERT_ID();

-- ==== Staging tables (drop/create) ====
DROP TABLE IF EXISTS stage_questions;
CREATE TABLE stage_questions (
  old_question_id INT NOT NULL,
  csv_quiz_id INT NULL,
  question_text TEXT NOT NULL,
  question_type ENUM('multiple_choice','true_false','short_answer') NOT NULL,
  points INT NOT NULL
);

DROP TABLE IF EXISTS stage_answers;
CREATE TABLE stage_answers (
  old_answer_id INT NOT NULL,
  old_question_id INT NOT NULL,
  answer_text TEXT NOT NULL,
  -- Store as text in staging to accept values like 'true', 'false', '1', '0'
  is_correct VARCHAR(16) NOT NULL
);

-- ==== Load CSVs into staging (absolute Windows paths with forward slashes) ====
-- If LOCAL INFILE is disabled on the server, use Workbench's Import Wizard into the staging tables
-- and skip these LOAD DATA statements.

LOAD DATA LOCAL INFILE 'C:/Users/user/Desktop/COS457/Study_Buddy_hub-main/Project phase 2/data/Clean_data/quiz_questions_clean.csv'
INTO TABLE stage_questions
FIELDS TERMINATED BY ',' ENCLOSED BY '"' ESCAPED BY '\\'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(@old_q_id,@csv_quiz_id,@q_text,@q_type,@pts)
SET old_question_id=@old_q_id,
    csv_quiz_id=@csv_quiz_id,
    question_text=@q_text,
    question_type=@q_type,
    points=@pts;

LOAD DATA LOCAL INFILE 'C:/Users/user/Desktop/COS457/Study_Buddy_hub-main/Project phase 2/data/Clean_data/quiz_answers_clean.csv'
INTO TABLE stage_answers
FIELDS TERMINATED BY ',' ENCLOSED BY '"' ESCAPED BY '\\'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(@old_a_id,@old_q_id,@a_text,@is_corr)
SET old_answer_id=@old_a_id,
    old_question_id=@old_q_id,
    answer_text=@a_text,
    is_correct=@is_corr;

-- ==== Deterministic ordering of staged questions for ID mapping ====
DROP TEMPORARY TABLE IF EXISTS stage_q_order;
CREATE TEMPORARY TABLE stage_q_order AS
SELECT
  old_question_id,
  question_text,
  question_type,
  points,
  ROW_NUMBER() OVER (ORDER BY old_question_id) AS rn
FROM stage_questions;

-- ==== Insert real Questions (auto-increment IDs) ====
INSERT INTO Question (quiz_id, question_text, question_type, points)
SELECT @QUIZ_ID, question_text, question_type, points
FROM stage_q_order
ORDER BY rn;

-- First auto-generated question_id from the bulk insert
SET @FIRST_NEW_QID := LAST_INSERT_ID();

-- Map old_question_id -> new auto question_id
DROP TEMPORARY TABLE IF EXISTS qid_map;
CREATE TEMPORARY TABLE qid_map AS
SELECT
  sq.old_question_id,
  (@FIRST_NEW_QID - 1 + ROW_NUMBER() OVER (ORDER BY sq.rn)) AS new_question_id
FROM stage_q_order sq;

-- ==== Insert Answers using the mapping ====
INSERT INTO Answer (question_id, answer_text, is_correct)
SELECT m.new_question_id,
       sa.answer_text,
       CASE
         WHEN LOWER(TRIM(sa.is_correct)) IN ('1','true','t','yes','y') THEN 1
         ELSE 0
       END
FROM stage_answers sa
JOIN qid_map m ON m.old_question_id = sa.old_question_id
ORDER BY sa.old_answer_id;

-- ==== Clean up ====
DROP TABLE stage_questions;
DROP TABLE stage_answers;

COMMIT;


