-- Minimal seed data for Phase 3 backend
-- Run after schema.sql: mysql -u root -p StudyBuddy < seed.sql

USE StudyBuddy;

SET FOREIGN_KEY_CHECKS = 0;

-- Colleges and majors
INSERT INTO Colleges (college_name) VALUES ('Test College');
INSERT INTO Majors (major_name) VALUES ('Computer Science');

-- Single test user (id will be 1)
INSERT INTO Users (email, password_hash, first_name, last_name, college_level, bio, college_id, major_id)
VALUES ('test@example.com', 'password-placeholder', 'Test', 'User', 'Graduate', 'Seed user', 1, 1);

-- Single test course (id will be 1)
INSERT INTO Courses (course_code, course_name, college_id) VALUES ('CS101', 'Intro to CS', 1);

-- Sample flashcard set and card
INSERT INTO FlashcardSet (title, description, course_id, creator_id) VALUES ('Sample Set', 'Seed flashcards', 1, 1);
INSERT INTO Flashcard (set_id, front_text, back_text) VALUES (1, 'What is 2+2?', '4');

-- Sample quiz with one question and two answers
INSERT INTO Quiz (title, description, course_id, creator_id) VALUES ('Sample Quiz', 'Seed quiz', 1, 1);
INSERT INTO Question (quiz_id, question_text, question_type, points) VALUES (1, 'What is 2+2?', 'multiple_choice', 1);
INSERT INTO Answer (question_id, answer_text, is_correct) VALUES (1, '3', 0);
INSERT INTO Answer (question_id, answer_text, is_correct) VALUES (1, '4', 1);

-- A sample user attempt (score 1 of 1)
INSERT INTO UserQuizAttempt (user_id, quiz_id, score, max_score) VALUES (1, 1, 1, 1);

SET FOREIGN_KEY_CHECKS = 1;
