use StudyBuddy;
-- By Rise Akizaki

-- Query Example 1 for Analysis
-- Find course (names) which are part of USM, and are ART courses

-- Query 1
EXPLAIN ANALYZE
SELECT cr.course_name, cl.college_name
FROM Courses cr
JOIN Colleges cl ON cr.college_id = cl.college_id
WHERE cl.college_name LIKE '%University of Southern Maine%'
AND cr.course_code LIKE '%ART%';

-- Query 2
CREATE INDEX college_name_index ON Colleges (college_name);
CREATE INDEX course_code_index ON Courses (course_code);

EXPLAIN ANALYZE
SELECT cr.course_name, cl.college_name
FROM Courses cr
JOIN Colleges cl ON cr.college_id = cl.college_id
WHERE cl.college_name LIKE 'University of Southern Maine%'   
AND cr.course_code LIKE 'ART%';               


-- Query Example 2 for Analysis
-- Find course (names) which are part of USM, and are COS courses

SET optimizer_switch='derived_merge=off'; -- To prevent optimization during testing

-- Query 1
EXPLAIN ANALYZE
SELECT course_name 
FROM (
	SELECT *
	FROM Colleges
	JOIN Courses USING (college_id)
)
AS joinedTables
WHERE joinedTables.course_code LIKE 'COS%';

-- Query 2
EXPLAIN ANALYZE
SELECT cr.course_name
FROM Courses cr
JOIN Colleges cl ON cr.college_id = cl.college_id
WHERE cr.course_code LIKE 'COS%';