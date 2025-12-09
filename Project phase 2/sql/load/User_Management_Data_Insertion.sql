use StudyBuddy;
-- By Rise Akizaki

-- Inserting data into colleges table

LOAD DATA LOCAL INFILE 'data\\Clean_data\\colleges_clean.csv'
INTO TABLE colleges
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(college_name);


-- Inserting data in courses table

LOAD DATA LOCAL INFILE 'data\\Clean_data\\usm_courses_clean.csv'
INTO TABLE courses
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(course_code, course_name, college_id);

-- seed study-group dummy users with fixed IDs
-- Added by Vivek
-- TestDataForStudyGroups.sql references Users 1001–1003 when it inserts join requests, 
-- group members, etc., and MySQL enforces Join_Request.user_id → Users.user_id. Without those rows, 
-- that loader fails with the FK error you hit earlier
INSERT INTO Users (user_id, email, password_hash, first_name, last_name)
VALUES
  (1001, 'sg_owner@example.com', 'x', 'Study', 'Owner'),
  (1002, 'sg_member@example.com', 'x', 'Study', 'Member'),
  (1003, 'sg_requester@example.com', 'x', 'Study', 'Requester'),
  (1004, 'sg_morning@example.com', 'x', 'Study', 'Morning'),
  (1005, 'sg_pair@example.com', 'x', 'Study', 'Pair'),
  (1006, 'sg_solo@example.com', 'x', 'Study', 'Solo');
