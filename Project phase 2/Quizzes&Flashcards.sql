CREATE DATABASE flashcardsdb;
use flashcardsdb;
-- Schema for Quizzes & Flashcards
-- Author: Vivek Reddy Bhimavarapu

-- Table `FlashcardSet`
-- A "deck" or set of flashcards, usually for a course.
DROP TABLE IF EXISTS `FlashcardSet`;
CREATE TABLE IF NOT EXISTS `FlashcardSet` (
  `set_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `course_id` INT NULL,
  `creator_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`set_id`),
  INDEX `fk_FlashcardSet_Courses_idx` (`course_id` ASC) VISIBLE,
  INDEX `fk_FlashcardSet_Users_idx` (`creator_id` ASC) VISIBLE,
  CONSTRAINT `fk_FlashcardSet_Courses`
    FOREIGN KEY (`course_id`)
    REFERENCES `Courses` (`course_id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_FlashcardSet_Users`
    FOREIGN KEY (`creator_id`)
    REFERENCES `Users` (`user_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)
ENGINE = InnoDB
COMMENT = 'Stores sets of flashcards (decks) created by users.';


-- Table `Flashcard`
-- A single flashcard with a front and back.
DROP TABLE IF EXISTS `Flashcard`;
CREATE TABLE IF NOT EXISTS `Flashcard` (
  `flashcard_id` INT NOT NULL AUTO_INCREMENT,
  `set_id` INT NOT NULL,
  `front_text` TEXT NOT NULL,
  `back_text` TEXT NOT NULL,
  PRIMARY KEY (`flashcard_id`),
  INDEX `fk_Flashcard_FlashcardSet_idx` (`set_id` ASC) VISIBLE,
  CONSTRAINT `fk_Flashcard_FlashcardSet`
    FOREIGN KEY (`set_id`)
    REFERENCES `FlashcardSet` (`set_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)
ENGINE = InnoDB
COMMENT = 'Stores individual flashcards belonging to a set.';


-- Table `Quiz`
-- Stores quiz metadata, linked to a course.
DROP TABLE IF EXISTS `Quiz`;
CREATE TABLE IF NOT EXISTS `Quiz` (
  `quiz_id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `course_id` INT NULL,
  `creator_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`quiz_id`),
  INDEX `fk_Quiz_Courses_idx` (`course_id` ASC) VISIBLE,
  INDEX `fk_Quiz_Users_idx` (`creator_id` ASC) VISIBLE,
  CONSTRAINT `fk_Quiz_Courses`
    FOREIGN KEY (`course_id`)
    REFERENCES `Courses` (`course_id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_Quiz_Users`
    FOREIGN KEY (`creator_id`)
    REFERENCES `Users` (`user_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)
ENGINE = InnoDB
COMMENT = 'Stores metadata for quizzes created by users.';


-- Table `Question`
-- Stores a single question for a quiz.
DROP TABLE IF EXISTS `Question`;
CREATE TABLE IF NOT EXISTS `Question` (
  `question_id` INT NOT NULL AUTO_INCREMENT,
  `quiz_id` INT NOT NULL,
  `question_text` TEXT NOT NULL,
  `question_type` ENUM('multiple_choice', 'true_false', 'short_answer') NOT NULL,
  `points` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`question_id`),
  INDEX `fk_Question_Quiz_idx` (`quiz_id` ASC) VISIBLE,
  CONSTRAINT `fk_Question_Quiz`
    FOREIGN KEY (`quiz_id`)
    REFERENCES `Quiz` (`quiz_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)
ENGINE = InnoDB
COMMENT = 'Stores individual questions within a quiz.';


-- Table `Answer`
-- Stores a possible answer for a multiple-choice question.
DROP TABLE IF EXISTS `Answer`;
CREATE TABLE IF NOT EXISTS `Answer` (
  `answer_id` INT NOT NULL AUTO_INCREMENT,
  `question_id` INT NOT NULL,
  `answer_text` TEXT NOT NULL,
  `is_correct` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 for correct, 0 for incorrect',
  PRIMARY KEY (`answer_id`),
  INDEX `fk_Answer_Question_idx` (`question_id` ASC) VISIBLE,
  CONSTRAINT `fk_Answer_Question`
    FOREIGN KEY (`question_id`)
    REFERENCES `Question` (`question_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)
ENGINE = InnoDB
COMMENT = 'Stores potential answers for multiple-choice questions.';


-- Table `UserQuizAttempt`
-- Tracks a user's attempt and score on a quiz.
DROP TABLE IF EXISTS `UserQuizAttempt`;
CREATE TABLE IF NOT EXISTS `UserQuizAttempt` (
  `attempt_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `quiz_id` INT NOT NULL,
  `score` INT NOT NULL,
  `max_score` INT NOT NULL,
  `completed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`attempt_id`),
  INDEX `fk_UserQuizAttempt_Users_idx` (`user_id` ASC) VISIBLE,
  INDEX `fk_UserQuizAttempt_Quiz_idx` (`quiz_id` ASC) VISIBLE,
  CONSTRAINT `fk_UserQuizAttempt_Users`
    FOREIGN KEY (`user_id`)
    REFERENCES `Users` (`user_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_UserQuizAttempt_Quiz`
    FOREIGN KEY (`quiz_id`)
    REFERENCES `Quiz` (`quiz_id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
)
ENGINE = InnoDB
COMMENT = 'Logs user attempts and scores for quizzes.';

