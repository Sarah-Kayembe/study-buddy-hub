USE StudyBuddy;

/* 
   These indexes target frequent filter, join, and order-by patterns
   redeuces filesorts and improve range-scan
*/

-- Study_Group: filter by (course_id, is_private), then join by PK
-- quick access to public groups for a course
CREATE INDEX idx_group_course_priv ON Study_Group(course_id, is_private, group_id);

-- extra course to group path for cross-course queries (shared courses).
CREATE INDEX idx_group_course_group ON Study_Group(course_id, group_id);

-- Group_Member: enables lookups both by user and by group
-- “My Groups” lists and “Upcoming Sessions” joins.
CREATE INDEX idx_gm_user_group ON Group_Member(user_id, group_id);

-- Study_Session:
--  “today” sessions: session_date to group to start_time
--   User’s upcoming sessions: group to session_date to start_time
CREATE INDEX idx_session_date_group_start ON Study_Session(session_date, group_id, start_time);
CREATE INDEX idx_session_group_date_start ON Study_Session(group_id, session_date, start_time);

-- Join_Request: filters by join_status and ordering by expire_date or request_date.
-- Allows “Using index” reads instead of filesorts
CREATE INDEX idx_jr_status_expire_group ON Join_Request(join_status, expire_date, group_id, user_id, request_date);
CREATE INDEX idx_jr_status_reqdate_group ON Join_Request(join_status, request_date, group_id, user_id);

-- Chat_Message: chat history lookup by group and sent_time.
CREATE INDEX idx_chat_group_time ON Chat_Message(group_id, sent_time);

-- Message_Request: covering index for inbox filtering, sorting, and projection.
CREATE INDEX idx_mr_target_created ON Message_Request(target_user_id, created_at, request_id, requester_user_id, course_id, request_status);


/* 
   GROUP SUMMARY TABLE
   Stores precomputed aggregates to improve performance for
   group discovery queries (member counts and latest session)
 */

CREATE TABLE `Group_Summary` (
  `group_id` INT NOT NULL,                      -- Matches Study_Group.group_id
  `member_count` INT NOT NULL DEFAULT 0,        -- Cached total members
  `last_session` DATE NULL,                     -- Most recent session date
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,    -- Auto-updated timestamp
  PRIMARY KEY (`group_id`),
  CONSTRAINT `fk_gs_group`
    FOREIGN KEY (`group_id`)
    REFERENCES `Study_Group`(`group_id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


/*
   Seeds Group_Summary with existing data
*/

INSERT INTO Group_Summary (group_id, member_count, last_session)
SELECT
  g.group_id,
  COALESCE((
    SELECT COUNT(DISTINCT gm.user_id)
    FROM Group_Member gm
    WHERE gm.group_id = g.group_id
  ), 0) AS member_count,
  (
    SELECT MAX(s.session_date)
    FROM Study_Session s
    WHERE s.group_id = g.group_id
  ) AS last_session
FROM Study_Group g
ON DUPLICATE KEY UPDATE
  member_count = VALUES(member_count),
  last_session = VALUES(last_session);


/* 
    AUTO-MAINTAINS
   Keeps summary table in sync as members/sessions change.
 */

DELIMITER //

-- When a member joins a group, increment count (insert if new)
DROP TRIGGER IF EXISTS gm_after_insert//
CREATE TRIGGER gm_after_insert
AFTER INSERT ON Group_Member
FOR EACH ROW
BEGIN
  INSERT INTO Group_Summary (group_id, member_count)
  VALUES (NEW.group_id, 1)
  ON DUPLICATE KEY UPDATE member_count = member_count + 1;
END//

-- When a member leaves or is removed, decrement count safely.
DROP TRIGGER IF EXISTS gm_after_delete//
CREATE TRIGGER gm_after_delete
AFTER DELETE ON Group_Member
FOR EACH ROW
BEGIN
  UPDATE Group_Summary
  SET member_count = GREATEST(member_count - 1, 0)
  WHERE group_id = OLD.group_id;
END//

-- When a new study session is added, update the group’s last_session date.
DROP TRIGGER IF EXISTS session_after_insert//
CREATE TRIGGER session_after_insert
AFTER INSERT ON Study_Session
FOR EACH ROW
BEGIN
  INSERT INTO Group_Summary (group_id, last_session)
  VALUES (NEW.group_id, NEW.session_date)
  ON DUPLICATE KEY UPDATE
    last_session = IF(last_session IS NULL OR NEW.session_date > last_session,
                      NEW.session_date, last_session);
END//

DELIMITER ;

-- Trigger to enforce one owner only
-- Will work on optimizing this later... 
DELIMITER //
CREATE TRIGGER one_owner_only
BEFORE INSERT ON Group_Member
FOR EACH ROW
BEGIN
    DECLARE owner_count INT DEFAULT 0;
    -- count

    -- only check when trying to add an owner
    IF NEW.role = 'owner' THEN
        SELECT COUNT(*) INTO owner_count
        FROM Group_Member
        WHERE group_id = NEW.group_id
        AND role = 'owner';
        IF owner_count > 0 THEN
            -- stop the insert by setting a bad value or doing nothing
            SET NEW.role = NULL;
        END IF;
    END IF;
END//
DELIMITER ;

-- making sure end time before start time
ALTER TABLE Study_Session
ADD CONSTRAINT chk_time CHECK (end_time > start_time);

ANALYZE TABLE
  Study_Group,
  Group_Member,
  Study_Session,
  Join_Request,
  Chat_Message,
  Match_Profile,
  Message_Request,
  Resource,
  Group_Summary;

DELIMITER //

/* 
   PROCEDURES FOR STUDY GROUPS & COLLABORATION
   (each one wraps one of your EXPLAIN queries)
   Call examples are shown in comments.
 */

-- Discover public groups for a course
-- Ex CALL GetPublicGroupsForCourse(420, 20);
DROP PROCEDURE IF EXISTS GetPublicGroupsForCourse//
CREATE PROCEDURE GetPublicGroupsForCourse(
    IN p_course_id INT,
    IN p_limit INT
)
BEGIN
  SELECT g.group_id, g.group_name, g.max_members,
         gs.member_count AS members,
         gs.last_session
  FROM Study_Group AS g
  LEFT JOIN Group_Summary AS gs ON gs.group_id = g.group_id
  WHERE g.course_id = p_course_id
    AND g.is_private = FALSE
  ORDER BY (gs.last_session IS NULL) ASC,
           gs.last_session DESC,
           gs.member_count DESC
  LIMIT p_limit;
END//


-- All groups a user belongs to (+ their role)
-- Ex CALL GetUserGroups(1001);
DROP PROCEDURE IF EXISTS GetUserGroups//
CREATE PROCEDURE GetUserGroups(
    IN p_user_id INT
)
BEGIN
  SELECT 
      g.group_id,
      g.group_name,
      gm.role,
      u.user_id,
      CONCAT(u.first_name, ' ', u.last_name) AS user_name
  FROM Group_Member AS gm
  JOIN Study_Group AS g 
        ON g.group_id = gm.group_id
  JOIN Users AS u
        ON u.user_id = gm.user_id
  WHERE gm.user_id = p_user_id
  ORDER BY g.group_name;
END//

-- Pending join requests (owner dashboard)
-- EX CALL GetPendingJoinRequests();
DROP PROCEDURE IF EXISTS GetPendingJoinRequests//
CREATE PROCEDURE GetPendingJoinRequests()
BEGIN
  SELECT g.group_name, jr.user_id, jr.request_date, jr.expire_date
  FROM Join_Request AS jr
  JOIN Study_Group AS g ON g.group_id = jr.group_id
  WHERE jr.join_status = 'pending'
  ORDER BY jr.expire_date;
END//


-- Return all pending join request with if the user is already a member of the group or is not a member
-- Helps group owner to know if request is valid
-- CALL GetPendingRequestsWithMembership(50);
DROP PROCEDURE IF EXISTS GetPendingRequestsWithMembership//
CREATE PROCEDURE GetPendingRequestsWithMembership(
    IN p_limit INT
)
BEGIN
  SELECT jr.request_id, jr.group_id, jr.user_id,
         CASE WHEN gm.user_id IS NULL THEN 'NOT_MEMBER'
              ELSE 'ALREADY_MEMBER'
         END AS membership_state
  FROM Join_Request AS jr
  LEFT JOIN Group_Member AS gm
    ON gm.group_id = jr.group_id AND gm.user_id = jr.user_id
  WHERE jr.join_status = 'pending'
  ORDER BY jr.request_date DESC
  LIMIT p_limit;
END//


-- return all sessions going on today
-- CALL GetTodaysSessions();
DROP PROCEDURE IF EXISTS GetTodaysSessions//
CREATE PROCEDURE GetTodaysSessions()
BEGIN
  SELECT g.group_name, s.location, s.session_date, s.start_time, s.end_time, s.notes
  FROM Study_Session AS s
  JOIN Study_Group AS g ON g.group_id = s.group_id
  WHERE s.session_date = CURRENT_DATE()
  ORDER BY g.group_name, s.start_time;
END//


-- Upcoming sessions for a user a specific user
-- ex CALL GetUpcomingSessionsForUser(1001, 50);
DROP PROCEDURE IF EXISTS GetUpcomingSessionsForUser//
CREATE PROCEDURE GetUpcomingSessionsForUser(
    IN p_user_id INT,
    IN p_limit INT
)
BEGIN
  SELECT 
      g.group_name,
      s.session_date,
      s.start_time,
      s.location,
      u.user_id,
      CONCAT(u.first_name, ' ', u.last_name) AS user_name
  FROM Group_Member AS gm
  JOIN Study_Session AS s 
        ON s.group_id = gm.group_id
  JOIN Study_Group AS g 
        ON g.group_id = gm.group_id
  JOIN Users AS u
        ON u.user_id = gm.user_id
  WHERE gm.user_id = p_user_id
    AND s.session_date >= CURRENT_DATE()
  ORDER BY s.session_date, s.start_time
  LIMIT p_limit;
END//

-- Chat history (latest messages in a specific group)
-- Ex CALL GetChatMessagesForGroup(1, 50);
DROP PROCEDURE IF EXISTS GetChatMessagesForGroup//
CREATE PROCEDURE GetChatMessagesForGroup(
    IN p_group_id INT,
    IN p_limit INT
)
BEGIN
  SELECT c.message_id, c.user_id, c.content, c.sent_time
  FROM Chat_Message AS c
  WHERE c.group_id = p_group_id
  ORDER BY c.sent_time DESC, c.message_id DESC
  LIMIT p_limit;
END//


-- Suggested matches for a specific user
-- Ex CALL GetSuggestedMatches(1001, 20);
DROP PROCEDURE IF EXISTS GetSuggestedMatches//
CREATE PROCEDURE GetSuggestedMatches(
    IN p_user_id INT,
    IN p_limit INT
)
BEGIN
  WITH shared_peers AS (
      SELECT DISTINCT gm2.user_id
      FROM Group_Member gm1
      JOIN Study_Group g1 ON g1.group_id = gm1.group_id
      JOIN Study_Group g2 ON g2.course_id = g1.course_id
      JOIN Group_Member gm2 ON gm2.group_id = g2.group_id
      WHERE gm1.user_id = p_user_id
        AND gm2.user_id <> p_user_id
  )
  SELECT 
      mp1.user_id AS base_user_id,
      CONCAT(u_self.first_name, ' ', u_self.last_name) AS base_user_name,
      mp2.user_id AS suggested_user_id,
      CONCAT(u_other.first_name, ' ', u_other.last_name) AS suggested_user_name,
      mp2.study_style,
      mp2.meeting_pref
  FROM Match_Profile mp1
  JOIN Match_Profile mp2
      ON mp1.user_id = p_user_id
     AND mp2.user_id IN (SELECT user_id FROM shared_peers)
  JOIN Users u_self
      ON u_self.user_id = mp1.user_id
  JOIN Users u_other
      ON u_other.user_id = mp2.user_id
  WHERE mp2.meeting_pref = mp1.meeting_pref
     OR mp2.study_style = mp1.study_style
  ORDER BY mp2.user_id
  LIMIT p_limit;
END//

-- Message-request inbox for a user
-- Ex CALL GetMessageRequestsForUser(1001, 50);
DROP PROCEDURE IF EXISTS GetMessageRequestsForUser//
CREATE PROCEDURE GetMessageRequestsForUser(
    IN p_user_id INT,
    IN p_limit INT
)
BEGIN
  SELECT 
      mr.request_id,
      mr.requester_user_id,
      CONCAT(u_req.first_name, ' ', u_req.last_name) AS requester_name,
      mr.target_user_id,
      CONCAT(u_tgt.first_name, ' ', u_tgt.last_name) AS target_user_name,
      mr.course_id,
      mr.request_status,
      mr.created_at
  FROM Message_Request AS mr
  JOIN Users u_req
      ON u_req.user_id = mr.requester_user_id
  JOIN Users u_tgt
      ON u_tgt.user_id = mr.target_user_id
  WHERE mr.target_user_id = p_user_id
  ORDER BY mr.created_at DESC
  LIMIT p_limit;
END//

-- Latest uploaded resources
-- Ex CALL GetLatestResources(25);
DROP PROCEDURE IF EXISTS GetLatestResources//
CREATE PROCEDURE GetLatestResources(
    IN p_limit INT
)
BEGIN
  SELECT resource_id, title, filetype, source
  FROM Resource
  ORDER BY resource_id DESC
  LIMIT p_limit;
END//

DELIMITER ;

