USE StudyBuddy;

SET autocommit = 0;
START TRANSACTION;
SAVEPOINT seed_start;

INSERT INTO Study_Group(group_name, max_members, is_private, course_id)
VALUES
	('group1', 8, FALSE, 420),
    ('group2', 10, FALSE, 420),
    ('group3', 6, FALSE, 161);
    
INSERT INTO Study_Session(group_id, location, start_time, end_time, notes, session_date)
    SELECT group_id, 'Discord VC', '19:00', '20:00', 'cool study', CURRENT_DATE()
    FROM Study_Group WHERE group_name = 'group2';
    
INSERT INTO Study_Session(group_id, location, start_time, end_time, notes, session_date)
    SELECT group_id, 'Discord VC', '19:00', '20:00', 'need to start studying instead of procrastinating', CURRENT_DATE()
    FROM Study_Group WHERE group_name = 'group3';
    
INSERT INTO Study_Session(group_id, location, start_time, end_time, notes, session_date)
    SELECT group_id, 'Zoom', '17:00', '17:30', 'Quick meetup to differentiate tasks', CURRENT_DATE()
    FROM Study_Group WHERE group_name = 'group1';

INSERT INTO Study_Session(group_id, location, start_time, end_time, notes, session_date)
    SELECT group_id, 'Library', '16:00', '18:00', 'another cool study', CURRENT_DATE()
    FROM Study_Group WHERE group_name = 'group2';
    
INSERT INTO Join_Request (group_id, user_id, join_status, request_date, expire_date)
SELECT group_id, 1002, 'pending', NOW(), NOW() + INTERVAL 7 DAY
FROM Study_Group WHERE group_name='group1';

INSERT INTO Join_Request (group_id, user_id, join_status, request_date, expire_date)
SELECT group_id, 1003, 'approved', NOW(), NOW() + INTERVAL 7 DAY
FROM Study_Group WHERE group_name='group1';

INSERT INTO Group_Member (group_id, user_id, role)
SELECT group_id, 1001, 'owner' FROM Study_Group WHERE group_name = 'group1';
INSERT INTO Group_Member (group_id, user_id, role)
SELECT group_id, 1003, 'member' FROM Study_Group WHERE group_name = 'group1';
INSERT INTO Group_Member (group_id, user_id, role)
SELECT group_id, 1001, 'owner' FROM Study_Group WHERE group_name='group2';

INSERT INTO Chat_Message (group_id, user_id, content)
SELECT group_id, 1001, 'Welcome to the group!' FROM Study_Group WHERE group_name='group1';
INSERT INTO Chat_Message (group_id, user_id, content)
SELECT group_id, 1003, 'Thanks! excited to join.' FROM Study_Group WHERE group_name='group1';

-- Change made by Vivek Because the Resource table 
-- in StudyGroupsAndCollaboration.sql has a source column marked NOT NULL with no default, 
-- every insert must provide a value for it. 
INSERT INTO Resource (uploader_id, title, description, filetype)
VALUES
  (1001, 'study_plan.md', 'Agenda for week 1', 'MD', 'manual seed'),
  (1003, 'joins.pdf', 'Inner/Outer Join Cheat Sheet', 'PDF', 'manual seed');

INSERT INTO Match_Profile (user_id, study_style, meeting_pref, bio)
VALUES
  (1001, 'group', 'hybrid', 'Team player and night owl'),
  (1002, 'pair', 'in_person', 'Quick learner, focused'),
  (1003, 'solo', 'online', 'Prefers late-night sessions'),
  (1004, 'group', 'hybrid', 'Love mornings!'),
  (1005, 'pair', 'in_person', 'Three is a crowd'),
  (1006, 'solo', 'online', 'Doing this because I need to');

INSERT INTO Message_Request (requester_user_id, target_user_id, course_id, request_status)
VALUES
  (1002, 1001, 420, 'pending'),
  (1003, 1001, 420, 'accepted');
  
SELECT * FROM Study_Group;
SELECT * FROM Group_Member;
SELECT * FROM Study_Session;
SELECT * FROM Join_Request;
SELECT * FROM Chat_Message;
SELECT * FROM Resource;
SELECT * FROM Match_Profile;
SELECT * FROM Message_Request

-- rolled back
