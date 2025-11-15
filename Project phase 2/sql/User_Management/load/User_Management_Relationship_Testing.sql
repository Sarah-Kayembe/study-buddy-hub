use StudyBuddy;

-- Testing Relationships between Users, Majors, and Colleges

INSERT INTO Majors (major_name)
VALUES ('Biology');

INSERT INTO users (email, password_hash, first_name, last_name, college_level, college_id, major_id)
VALUES ('bobjones@gmail.com', 12345, 'bob', 'jones', 'Senior', 813, 1);

SELECT m.major_name, u.first_name
FROM Users u
JOIN Majors m ON m.major_id = u.major_id; 

SELECT cl.college_name, u.first_name
FROM Users u
JOIN Colleges cl ON cl.college_id = u.college_id; 
