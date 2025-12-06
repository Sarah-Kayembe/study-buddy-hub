USE StudyBuddy;

-- groups + their course
SELECT g.group_id, g.group_name, g.max_members, g.is_private, g.created_time,
       c.course_id
FROM Study_Group g
JOIN Courses c ON c.course_id = g.course_id
ORDER BY g.group_id;

-- member list per group 
SELECT g.group_name, gm.user_id, gm.role, gm.joined_at
FROM Group_Member gm
JOIN Study_Group g ON g.group_id = gm.group_id
JOIN Users u ON u.user_id = gm.user_id
ORDER BY g.group_name, gm.role, gm.user_id;

-- member counts per group 
SELECT g.group_id, g.group_name, COUNT(m.user_id) AS member_count
FROM Study_Group g
LEFT JOIN Group_Member m ON m.group_id = g.group_id
GROUP BY g.group_id, g.group_name
ORDER BY g.group_id;

-- pending join requests and whether they’re already members 
SELECT g.group_name, jr.user_id, jr.join_status, jr.request_date, jr.expire_date,
       CASE WHEN gm.user_id IS NULL THEN 'NOT_MEMBER' ELSE 'ALREADY_MEMBER' END AS membership_state
FROM Join_Request jr
JOIN Study_Group g ON g.group_id = jr.group_id
LEFT JOIN Group_Member gm
  ON gm.group_id = jr.group_id AND gm.user_id = jr.user_id
WHERE jr.join_status = 'pending'
ORDER BY jr.expire_date;

-- sessions for today 
SELECT g.group_name, s.location, s.session_date, s.start_time, s.end_time, s.notes
FROM Study_Session s
JOIN Study_Group g ON g.group_id = s.group_id
WHERE s.session_date = CURRENT_DATE()
ORDER BY g.group_name, s.start_time;

-- chat timeline 
SELECT g.group_name, cm.user_id, cm.content, cm.sent_time, cm.edited
FROM Chat_Message cm
JOIN Study_Group g ON g.group_id = cm.group_id
JOIN Users u ON u.user_id = cm.user_id
ORDER BY cm.sent_time DESC;

-- resources by uploader 
SELECT r.resource_id, r.title, r.filetype, r.upload_date, r.uploader_id
FROM Resource r
JOIN Users u ON u.user_id = r.uploader_id
ORDER BY r.upload_date DESC;

-- match profiles exist with valid users
SELECT mp.user_id, mp.study_style, mp.meeting_pref, LEFT(mp.bio, 60) AS bio_preview
FROM Match_Profile mp
JOIN Users u ON u.user_id = mp.user_id
ORDER BY mp.user_id;

-- message requests tie to valid users & course
SELECT mr.request_id, mr.requester_user_id, mr.target_user_id, mr.course_id, mr.request_status, mr.created_at
FROM Message_Request mr
JOIN Users r ON r.user_id = mr.requester_user_id
JOIN Users t ON t.user_id = mr.target_user_id
JOIN Courses c ON c.course_id = mr.course_id
ORDER BY mr.created_at DESC;
