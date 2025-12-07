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
CREATE INDEX idx_mr_target_created ON Message_Request(target_user_id, created_at, request_id, requester_user_id, request_status);

-- Helps LIKE / prefix queries on code+name
CREATE INDEX idx_courses_code_name
    ON Courses(course_code, course_name);

CREATE INDEX idx_dm_convo_time
  ON Direct_Message(conversation_id, sent_at);

-- Support lookups by (group_id, user_id) for membership & owner checks
CREATE INDEX idx_gm_group_user
  ON Group_Member(group_id, user_id);

-- Support join-request lookups by (group_id, user_id, status)
CREATE INDEX idx_jr_group_user_status
  ON Join_Request(group_id, user_id, join_status);

-- Direct_Conversation lookup by (user_one_id, user_two_id)
CREATE INDEX idx_dc_users
  ON Direct_Conversation(user_one_id, user_two_id);

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
DELIMITER //
CREATE TRIGGER one_owner_only
BEFORE INSERT ON Group_Member
FOR EACH ROW
BEGIN
    DECLARE owner_count INT DEFAULT 0;

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

/* CORE QUERY PROCEDURES */

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


-- Upcoming sessions for a specific user
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


-- Insert or update a Study Buddy Match profile
DROP PROCEDURE IF EXISTS UpsertMatchProfile//
CREATE PROCEDURE UpsertMatchProfile(
  IN p_user_id INT,
  IN p_study_style ENUM('solo', 'pair', 'group', 'no preference'),
  IN p_meeting_pref ENUM('online', 'in_person', 'hybrid', 'no preference'),
  IN p_bio TEXT,
  IN p_profile_image_url VARCHAR(500),
  IN p_study_goal ENUM('make friends', 'ace tests', 'review material', 'all of the above'),
  IN p_focus_time_pref ENUM('morning', 'afternoon', 'evening', 'night', 'no preference'),
  IN p_noise_pref ENUM('silent', 'some noise', 'background music', 'no preference'),
  IN p_age TINYINT UNSIGNED,
  IN p_pref_min_age TINYINT UNSIGNED,
  IN p_pref_max_age TINYINT UNSIGNED
)
BEGIN
  DECLARE v_min_age TINYINT UNSIGNED;
  DECLARE v_max_age TINYINT UNSIGNED;

  -- Default age range logic:
  --   age <= 20 -> [17, 23]
  --   age  > 20 -> [age-3, age+3] clamped to [17, 80]
  IF p_age IS NOT NULL THEN
    IF p_pref_min_age IS NULL OR p_pref_max_age IS NULL THEN
      IF p_age <= 20 THEN
        SET v_min_age = 17;
        SET v_max_age = 23;
      ELSE
        SET v_min_age = GREATEST(17, p_age - 3);
        SET v_max_age = LEAST(80, p_age + 3);
      END IF;
    ELSE
      SET v_min_age = p_pref_min_age;
      SET v_max_age = p_pref_max_age;
    END IF;
  ELSE
    -- No age provided; NULL
    SET v_min_age = p_pref_min_age;
    SET v_max_age = p_pref_max_age;
  END IF;

  INSERT INTO Match_Profile (
    user_id,
    study_style,
    meeting_pref,
    bio,
    profile_image_url,
    study_goal,
    focus_time_pref,
    noise_pref,
    age,
    preferred_min_age,
    preferred_max_age
  ) VALUES (
    p_user_id,
    p_study_style,
    p_meeting_pref,
    p_bio,
    p_profile_image_url,
    p_study_goal,
    p_focus_time_pref,
    p_noise_pref,
    p_age,
    v_min_age,
    v_max_age
  )
  ON DUPLICATE KEY UPDATE
    study_style       = VALUES(study_style),
    meeting_pref      = VALUES(meeting_pref),
    bio               = VALUES(bio),
    profile_image_url = VALUES(profile_image_url),
    study_goal        = VALUES(study_goal),
    focus_time_pref   = VALUES(focus_time_pref),
    noise_pref        = VALUES(noise_pref),
    age               = VALUES(age),
    preferred_min_age = VALUES(preferred_min_age),
    preferred_max_age = VALUES(preferred_max_age);
END//


DROP PROCEDURE IF EXISTS GetStudyBuddyMatches//
CREATE PROCEDURE GetStudyBuddyMatches(
    IN p_user_id INT,
    IN p_limit INT
)
BEGIN
    DECLARE v_college_id INT;
    DECLARE v_my_min_age TINYINT UNSIGNED;
    DECLARE v_my_max_age TINYINT UNSIGNED;

    -- Base user’s college & age pref
    SELECT
        u.college_id,
        mp.preferred_min_age,
        mp.preferred_max_age
    INTO
        v_college_id,
        v_my_min_age,
        v_my_max_age
    FROM Users u
    LEFT JOIN Match_Profile mp
      ON mp.user_id = u.user_id
    WHERE u.user_id = p_user_id;

    WITH my_profile AS (
        SELECT
            mp.user_id,
            mp.study_style,
            mp.meeting_pref,
            mp.study_goal,
            mp.focus_time_pref,
            mp.noise_pref,
            mp.age,
            mp.preferred_min_age,
            mp.preferred_max_age
        FROM Match_Profile mp
        WHERE mp.user_id = p_user_id
    ),
    my_courses AS (
        SELECT course_id
        FROM Match_Profile_Course
        WHERE user_id = p_user_id
    ),
    candidate_base AS (
        SELECT
            mp_other.user_id AS other_user_id,
            u.first_name,
            u.last_name,
            u.college_id,
            mp_other.study_style,
            mp_other.meeting_pref,
            mp_other.study_goal,
            mp_other.focus_time_pref,
            mp_other.noise_pref,
            mp_other.age,
            mp_other.preferred_min_age,
            mp_other.preferred_max_age,
            mp_other.bio AS bio,
            mp_other.profile_image_url,
            COUNT(DISTINCT mpc_other.course_id) AS shared_courses
        FROM Match_Profile mp_other
        JOIN Match_Profile_Course mpc_other
          ON mpc_other.user_id = mp_other.user_id
        JOIN my_courses mc
          ON mc.course_id = mpc_other.course_id
        JOIN Users u
          ON u.user_id = mp_other.user_id
        WHERE mp_other.user_id <> p_user_id
        GROUP BY
            mp_other.user_id,
            u.first_name,
            u.last_name,
            u.college_id,
            mp_other.study_style,
            mp_other.meeting_pref,
            mp_other.study_goal,
            mp_other.focus_time_pref,
            mp_other.noise_pref,
            mp_other.age,
            mp_other.preferred_min_age,
            mp_other.preferred_max_age,
            mp_other.bio,
            mp_other.profile_image_url
    ),
    scored_candidates AS (
        SELECT
            c.*,
            (
                  CASE WHEN c.college_id = v_college_id THEN 40 ELSE 0 END

                + CASE
                    WHEN mp.study_style = 'no preference'
                         THEN 20
                    WHEN c.study_style = mp.study_style
                         THEN 20
                    ELSE 0
                  END

                + CASE
                    WHEN mp.meeting_pref = 'no preference'
                         THEN 15
                    WHEN c.meeting_pref = mp.meeting_pref
                         THEN 15
                    ELSE 0
                  END

                + CASE
                    WHEN mp.study_goal = 'all of the above'
                         THEN 10
                    WHEN c.study_goal = mp.study_goal
                         THEN 10
                    ELSE 0
                  END

                + CASE
                    WHEN mp.focus_time_pref = 'no preference'
                         THEN 5
                    WHEN c.focus_time_pref = mp.focus_time_pref
                         THEN 5
                    ELSE 0
                  END

                + CASE
                    WHEN mp.noise_pref = 'no preference'
                         THEN 5
                    WHEN c.noise_pref = mp.noise_pref
                         THEN 5
                    ELSE 0
                  END

                + LEAST(c.shared_courses, 2) * 10

                + CASE
                    WHEN mp.age IS NOT NULL AND c.age IS NOT NULL THEN
                         CASE
                             WHEN ABS(c.age - mp.age) <= 2 THEN 10
                             WHEN ABS(c.age - mp.age) <= 4 THEN 5
                             ELSE 0
                         END
                    ELSE 0
                  END
            ) AS match_score
        FROM candidate_base c
        JOIN my_profile mp
          ON mp.user_id = p_user_id
    )
    SELECT
        sc.other_user_id,
        sc.first_name,
        sc.last_name,
        sc.college_id,
        sc.study_style,
        sc.meeting_pref,
        sc.study_goal,
        sc.focus_time_pref,
        sc.noise_pref,
        sc.age,
        sc.preferred_min_age,
        sc.preferred_max_age,
        sc.bio,
        sc.profile_image_url,
        sc.shared_courses,
        sc.match_score
    FROM scored_candidates AS sc
    WHERE
        -- Require at least one shared course 
        sc.shared_courses > 0

        -- don’t show if there’s already a pending/accepted message request
        AND NOT EXISTS (
            SELECT 1
            FROM Message_Request mr
            WHERE
              (
                (mr.requester_user_id = p_user_id AND mr.target_user_id = sc.other_user_id)
                OR
                (mr.target_user_id = p_user_id AND mr.requester_user_id = sc.other_user_id)
              )
              AND mr.request_status IN ('pending', 'accepted')
        )

        -- respect my preferred age range (if set)
        AND (
            v_my_min_age IS NULL
            OR v_my_max_age IS NULL
            OR sc.age IS NULL
            OR (sc.age BETWEEN v_my_min_age AND v_my_max_age)
        )

        AND sc.match_score >= 80

    ORDER BY
        sc.match_score DESC,
        sc.shared_courses DESC,
        sc.other_user_id
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
      mr.request_status,
      mr.created_at
  FROM Message_Request AS mr
  JOIN Users u_req
      ON u_req.user_id = mr.requester_user_id
  JOIN Users u_tgt
      ON u_tgt.user_id = mr.target_user_id
  WHERE mr.target_user_id = p_user_id
    AND mr.request_status = 'pending'
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


/*
   Ensures a user can join a group without breaking any rules
   eg, max members doesn't overfill, member isn't already a part of the group
   can be called using: CALL JoinGroupWithLock(group_id, user_id);
*/
DROP PROCEDURE IF EXISTS JoinGroupWithLock//
CREATE PROCEDURE JoinGroupWithLock(
    IN p_group_id INT,
    IN p_user_id INT
)
BEGIN
    DECLARE v_max_members INT;
    DECLARE v_current_members INT;
    DECLARE v_already_member INT;

    SELECT COUNT(*) INTO v_already_member
    FROM Group_Member
    WHERE group_id = p_group_id
      AND user_id = p_user_id
    FOR UPDATE;

    IF v_already_member > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ALREADY_MEMBER';
    END IF;

    SELECT max_members
    INTO v_max_members
    FROM Study_Group
    WHERE group_id = p_group_id
    FOR UPDATE;

    IF v_max_members IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'GROUP_NOT_FOUND';
    END IF;

    SELECT COUNT(*) INTO v_current_members
    FROM Group_Member
    WHERE group_id = p_group_id
    FOR UPDATE;

    IF v_current_members >= v_max_members THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'GROUP_FULL';
    END IF;

    INSERT INTO Group_Member (group_id, user_id, role)
    VALUES (p_group_id, p_user_id, 'member');
END//


DROP PROCEDURE IF EXISTS SearchCoursesSmart//
CREATE PROCEDURE SearchCoursesSmart(
    IN p_query VARCHAR(255),
    IN p_limit INT
)
BEGIN
    DECLARE v_like VARCHAR(260);
    SET v_like = CONCAT('%', p_query, '%');

    SELECT 
        c.course_id,
        c.course_code,
        c.course_name,
        col.college_name,
        -- relevance score for best matches go to the top
        CASE
            WHEN c.course_code = p_query THEN 1
            WHEN c.course_code LIKE CONCAT(p_query, '%') THEN 2
            WHEN c.course_name LIKE CONCAT(p_query, '%') THEN 3
            WHEN c.course_name LIKE v_like THEN 4
            ELSE 5
        END AS rank_score
    FROM Courses c
    LEFT JOIN Colleges col ON col.college_id = c.college_id
    WHERE c.course_code LIKE v_like
       OR c.course_name LIKE v_like
    ORDER BY rank_score, c.course_code, c.course_name
    LIMIT p_limit;
END//

-- Create a group and auto-join creator as owner
DROP PROCEDURE IF EXISTS CreateStudyGroupWithOwner//
CREATE PROCEDURE CreateStudyGroupWithOwner(
    IN p_group_name   VARCHAR(255),
    IN p_max_members  INT,
    IN p_is_private   BOOLEAN,
    IN p_course_id    INT,
    IN p_creator_id   INT
)
BEGIN
    DECLARE v_group_id INT;

    INSERT INTO Study_Group (group_name, max_members, is_private, course_id)
    VALUES (p_group_name, p_max_members, p_is_private, p_course_id);

    SET v_group_id = LAST_INSERT_ID();

    CALL JoinGroupWithLock(v_group_id, p_creator_id);

    UPDATE Group_Member
    SET role = 'owner'
    WHERE group_id = v_group_id
      AND user_id = p_creator_id;

    -- return new group_id
    SELECT v_group_id AS group_id;
END//


-- Public join request flow for a group
DROP PROCEDURE IF EXISTS RequestJoinPublicGroup//
CREATE PROCEDURE RequestJoinPublicGroup(
    IN p_group_id INT,
    IN p_user_id  INT
)
BEGIN
    DECLARE v_group_exists INT DEFAULT 0;
    DECLARE v_is_private   BOOLEAN;
    DECLARE v_count        INT;
    DECLARE v_status       VARCHAR(20);

    SELECT COUNT(*), COALESCE(MAX(is_private), FALSE)
    INTO v_group_exists, v_is_private
    FROM Study_Group
    WHERE group_id = p_group_id;

    IF v_group_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'GROUP_NOT_FOUND';
    END IF;

    IF v_is_private THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'GROUP_IS_PRIVATE';
    END IF;

    SELECT COUNT(*) INTO v_count
    FROM Group_Member
    WHERE group_id = p_group_id
      AND user_id  = p_user_id;

    IF v_count > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ALREADY_MEMBER';
    END IF;

    SELECT join_status
    INTO v_status
    FROM Join_Request
    WHERE group_id = p_group_id
      AND user_id  = p_user_id
      AND join_status IN ('pending','approved')
    ORDER BY request_date DESC
    LIMIT 1;

    IF v_status = 'pending' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'REQUEST_PENDING';
    ELSEIF v_status = 'approved' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'REQUEST_APPROVED';
    END IF;

    INSERT INTO Join_Request (group_id, user_id, join_status)
    VALUES (p_group_id, p_user_id, 'pending');
END//


--  get join requests for a group
DROP PROCEDURE IF EXISTS GetGroupJoinRequestsForOwner//
CREATE PROCEDURE GetGroupJoinRequestsForOwner(
    IN p_group_id INT,
    IN p_owner_id INT
)
BEGIN
    DECLARE v_role VARCHAR(20);

    -- verify owner
    SELECT role
    INTO v_role
    FROM Group_Member
    WHERE group_id = p_group_id
      AND user_id  = p_owner_id;

    IF v_role IS NULL OR v_role <> 'owner' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'NOT_OWNER';
    END IF;

    -- pending requests
    SELECT
        jr.user_id,
        jr.request_date,
        u.first_name,
        u.last_name
    FROM Join_Request AS jr
    JOIN Users AS u
      ON u.user_id = jr.user_id
    WHERE jr.group_id    = p_group_id
      AND jr.join_status = 'pending'
    ORDER BY jr.request_date ASC;
END//


-- approve a join request
DROP PROCEDURE IF EXISTS ApproveJoinRequest//
CREATE PROCEDURE ApproveJoinRequest(
    IN p_group_id       INT,
    IN p_target_user_id INT,
    IN p_owner_id       INT
)
BEGIN
    DECLARE v_role       VARCHAR(20);
    DECLARE v_request_id INT;

    -- verify owner
    SELECT role
    INTO v_role
    FROM Group_Member
    WHERE group_id = p_group_id
      AND user_id  = p_owner_id;

    IF v_role IS NULL OR v_role <> 'owner' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'NOT_OWNER';
    END IF;

    -- pending request
    SELECT request_id
    INTO v_request_id
    FROM Join_Request
    WHERE group_id    = p_group_id
      AND user_id     = p_target_user_id
      AND join_status = 'pending'
    ORDER BY request_date DESC
    LIMIT 1;

    IF v_request_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'NO_PENDING_REQUEST';
    END IF;

    -- try to add member
    CALL JoinGroupWithLock(p_group_id, p_target_user_id);

    -- mark approved
    UPDATE Join_Request
    SET join_status = 'approved',
        approvedBy  = p_owner_id
    WHERE request_id = v_request_id;
END//

-- reject a join request
DROP PROCEDURE IF EXISTS RejectJoinRequest//
CREATE PROCEDURE RejectJoinRequest(
    IN p_group_id       INT,
    IN p_target_user_id INT,
    IN p_owner_id       INT
)
BEGIN
    DECLARE v_role VARCHAR(20);
    DECLARE v_rows INT;

    -- verify owner
    SELECT role
    INTO v_role
    FROM Group_Member
    WHERE group_id = p_group_id
      AND user_id  = p_owner_id;

    IF v_role IS NULL OR v_role <> 'owner' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'NOT_OWNER';
    END IF;

    UPDATE Join_Request
    SET join_status = 'rejected',
        approvedBy  = p_owner_id
    WHERE group_id    = p_group_id
      AND user_id     = p_target_user_id
      AND join_status = 'pending';

    SET v_rows = ROW_COUNT();

    IF v_rows = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'NO_PENDING_REQUEST';
    END IF;
END//


-- Get group members
DROP PROCEDURE IF EXISTS GetGroupMembers//
CREATE PROCEDURE GetGroupMembers(
    IN p_group_id INT
)
BEGIN
    SELECT 
      gm.user_id,
      CONCAT(u.first_name, ' ', u.last_name) AS user_name,
      gm.role,
      gm.joined_at
    FROM Group_Member gm
    JOIN Users u ON u.user_id = gm.user_id
    WHERE gm.group_id = p_group_id
    ORDER BY 
      CASE gm.role
        WHEN 'owner' THEN 1
        WHEN 'admin' THEN 2
        ELSE 3
      END,
      user_name;
END//

-- kick a member from group
DROP PROCEDURE IF EXISTS KickGroupMember//
CREATE PROCEDURE KickGroupMember(
    IN p_group_id       INT,
    IN p_owner_id       INT,
    IN p_target_user_id INT
)
BEGIN
    DECLARE v_role_owner   VARCHAR(20);
    DECLARE v_rows_deleted INT;

    -- verify owner
    SELECT role
    INTO v_role_owner
    FROM Group_Member
    WHERE group_id = p_group_id
      AND user_id  = p_owner_id;

    IF v_role_owner IS NULL OR v_role_owner <> 'owner' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'NOT_OWNER';
    END IF;

    IF p_owner_id = p_target_user_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'OWNER_CANNOT_REMOVE_SELF';
    END IF;

    DELETE FROM Group_Member
    WHERE group_id = p_group_id
      AND user_id  = p_target_user_id;

    SET v_rows_deleted = ROW_COUNT();

    IF v_rows_deleted = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'MEMBER_NOT_FOUND';
    END IF;
END//


-- Create a study session for a group
DROP PROCEDURE IF EXISTS CreateStudySession//
CREATE PROCEDURE CreateStudySession(
    IN p_group_id     INT,
    IN p_session_date DATE,
    IN p_start_time   TIME,
    IN p_end_time     TIME,
    IN p_location     VARCHAR(255),
    IN p_notes        TEXT
)
BEGIN
    DECLARE v_group_exists INT;

    SELECT COUNT(*) INTO v_group_exists
    FROM Study_Group
    WHERE group_id = p_group_id;

    IF v_group_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'GROUP_NOT_FOUND';
    END IF;

    INSERT INTO Study_Session (group_id, location, start_time, end_time, notes, session_date)
    VALUES (p_group_id, p_location, p_start_time, p_end_time, p_notes, p_session_date);

    SELECT LAST_INSERT_ID() AS session_id;
END//


-- Join a PRIVATE group with an invite code
DROP PROCEDURE IF EXISTS JoinPrivateGroupWithCode//
CREATE PROCEDURE JoinPrivateGroupWithCode(
    IN p_user_id     INT,
    IN p_invite_code VARCHAR(32)
)
BEGIN
    DECLARE v_group_id        INT;
    DECLARE v_is_private      BOOLEAN;
    DECLARE v_invite_expires  DATETIME;
    DECLARE v_already_member  INT;

    SELECT group_id, is_private, invite_expires_at
    INTO v_group_id, v_is_private, v_invite_expires
    FROM Study_Group
    WHERE invite_code = p_invite_code
    LIMIT 1;

    IF v_group_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'INVALID_CODE';
    END IF;

    IF NOT v_is_private THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'NOT_PRIVATE_GROUP';
    END IF;

    IF v_invite_expires IS NULL OR v_invite_expires < UTC_TIMESTAMP() THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'CODE_EXPIRED';
    END IF;

    -- membership check
    SELECT COUNT(*) INTO v_already_member
    FROM Group_Member
    WHERE group_id = v_group_id
      AND user_id  = p_user_id;

    IF v_already_member > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'ALREADY_MEMBER';
    END IF;

    CALL JoinGroupWithLock(v_group_id, p_user_id);

    SELECT v_group_id AS group_id;
END//

-- Insert a group chat message
DROP PROCEDURE IF EXISTS AddChatMessage//
CREATE PROCEDURE AddChatMessage(
    IN p_group_id INT,
    IN p_user_id  INT,
    IN p_content  TEXT
)
BEGIN
    INSERT INTO Chat_Message (group_id, user_id, content)
    VALUES (p_group_id, p_user_id, p_content);

    SELECT LAST_INSERT_ID() AS message_id;
END//

-- Start or find a direct conversation + ensure message request row
DROP PROCEDURE IF EXISTS StartDirectConversation//
CREATE PROCEDURE StartDirectConversation(
    IN  p_requester_id INT,
    IN  p_target_id    INT
)
BEGIN
    DECLARE v_u1 INT;
    DECLARE v_u2 INT;
    DECLARE v_convo_id INT;

    IF p_requester_id = p_target_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'CANNOT_MESSAGE_SELF';
    END IF;

    -- normalize
    IF p_requester_id < p_target_id THEN
        SET v_u1 = p_requester_id;
        SET v_u2 = p_target_id;
    ELSE
        SET v_u1 = p_target_id;
        SET v_u2 = p_requester_id;
    END IF;

    -- existing convo?
    SELECT conversation_id
    INTO v_convo_id
    FROM Direct_Conversation
    WHERE user_one_id = v_u1
      AND user_two_id = v_u2
    LIMIT 1;

    IF v_convo_id IS NULL THEN
        INSERT INTO Direct_Conversation (user_one_id, user_two_id)
        VALUES (v_u1, v_u2);
        SET v_convo_id = LAST_INSERT_ID();
    END IF;

    INSERT INTO Message_Request (
        requester_user_id, target_user_id, request_status
    )
    VALUES (p_requester_id, p_target_id, 'pending')
    ON DUPLICATE KEY UPDATE
        request_status = CASE
            WHEN request_status = 'accepted' THEN request_status
            ELSE VALUES(request_status)
        END,
        created_at = CASE
            WHEN request_status = 'accepted' THEN created_at
            ELSE CURRENT_TIMESTAMP
        END;

    SELECT v_convo_id AS conversation_id;
END//


-- Get direct messages in a conversation
DROP PROCEDURE IF EXISTS GetDirectMessages//
CREATE PROCEDURE GetDirectMessages(
    IN p_conversation_id INT,
    IN p_limit           INT
)
BEGIN
    SELECT
        dm.message_id,
        dm.sender_user_id,
        u.first_name,
        u.last_name,
        dm.content,
        dm.sent_at AS sent_time
    FROM Direct_Message dm
    JOIN Users u ON u.user_id = dm.sender_user_id
    WHERE dm.conversation_id = p_conversation_id
    ORDER BY dm.sent_at ASC, dm.message_id ASC
    LIMIT p_limit;
END//


-- Send a direct message
DROP PROCEDURE IF EXISTS SendDirectMessage//
CREATE PROCEDURE SendDirectMessage(
    IN p_conversation_id INT,
    IN p_sender_id       INT,
    IN p_content         TEXT
)
BEGIN
    INSERT INTO Direct_Message (conversation_id, sender_user_id, content)
    VALUES (p_conversation_id, p_sender_id, p_content);

    SELECT LAST_INSERT_ID() AS message_id;
END//

-- Inbox: all conversations for a user
DROP PROCEDURE IF EXISTS GetDmInboxForUser//
CREATE PROCEDURE GetDmInboxForUser(
    IN p_user_id INT,
    IN p_limit   INT
)
BEGIN
    SELECT
        dc.conversation_id,
        CASE
            WHEN dc.user_one_id = p_user_id THEN dc.user_two_id
            ELSE dc.user_one_id
        END AS other_user_id,
        u.first_name,
        u.last_name,
        m.content AS last_message,
        m.sent_at AS last_sent_at,
        mr.request_status,
        CASE
            WHEN mr.requester_user_id = p_user_id THEN 1
            ELSE 0
        END AS is_requester
    FROM Direct_Conversation dc
    JOIN Users u
      ON u.user_id = CASE
            WHEN dc.user_one_id = p_user_id THEN dc.user_two_id
            ELSE dc.user_one_id
        END
    LEFT JOIN Direct_Message m
      ON m.message_id = (
            SELECT dm2.message_id
            FROM Direct_Message dm2
            WHERE dm2.conversation_id = dc.conversation_id
            ORDER BY dm2.sent_at DESC, dm2.message_id DESC
            LIMIT 1
      )
    LEFT JOIN Message_Request mr
      ON mr.request_status = 'pending'
     AND (
            (mr.requester_user_id = p_user_id AND mr.target_user_id = CASE
                WHEN dc.user_one_id = p_user_id THEN dc.user_two_id
                ELSE dc.user_one_id
            END)
         OR (mr.target_user_id = p_user_id AND mr.requester_user_id = CASE
                WHEN dc.user_one_id = p_user_id THEN dc.user_two_id
                ELSE dc.user_one_id
            END)
      )
    WHERE (dc.user_one_id = p_user_id OR dc.user_two_id = p_user_id)
    ORDER BY last_sent_at DESC, dc.conversation_id DESC
    LIMIT p_limit;
END//


-- Respond to a message request (accept/reject)
DROP PROCEDURE IF EXISTS RespondToMessageRequest//
CREATE PROCEDURE RespondToMessageRequest(
    IN p_request_id INT,
    IN p_action     VARCHAR(10),
    IN p_user_id    INT
)
BEGIN
    DECLARE v_req_status  VARCHAR(20);
    DECLARE v_requester   INT;
    DECLARE v_target      INT;
    DECLARE v_new_status  VARCHAR(20);
    DECLARE v_u1          INT;
    DECLARE v_u2          INT;
    DECLARE v_convo_id    INT;

    -- fetch request
    SELECT requester_user_id, target_user_id, request_status
    INTO v_requester, v_target, v_req_status
    FROM Message_Request
    WHERE request_id = p_request_id;

    IF v_requester IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'REQUEST_NOT_FOUND';
    END IF;

    IF v_target <> p_user_id THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'NOT_YOUR_REQUEST';
    END IF;

    IF p_action NOT IN ('accept','reject') THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'INVALID_ACTION';
    END IF;

    SET v_new_status = CASE
        WHEN p_action = 'accept' THEN 'accepted'
        ELSE 'rejected'
    END;

    UPDATE Message_Request
    SET request_status = v_new_status
    WHERE request_id   = p_request_id;

    IF v_requester < v_target THEN
        SET v_u1 = v_requester;
        SET v_u2 = v_target;
    ELSE
        SET v_u1 = v_target;
        SET v_u2 = v_requester;
    END IF;

    IF v_new_status = 'accepted' THEN
        INSERT INTO Direct_Conversation (user_one_id, user_two_id)
        SELECT v_u1, v_u2
        FROM DUAL
        WHERE NOT EXISTS (
            SELECT 1
            FROM Direct_Conversation
            WHERE user_one_id = v_u1 AND user_two_id = v_u2
        );
    ELSE
        SELECT conversation_id
        INTO v_convo_id
        FROM Direct_Conversation
        WHERE user_one_id = v_u1 AND user_two_id = v_u2;

        IF v_convo_id IS NOT NULL THEN
            DELETE FROM Direct_Message
            WHERE conversation_id = v_convo_id;

            DELETE FROM Direct_Conversation
            WHERE conversation_id = v_convo_id;
        END IF;
    END IF;

    SELECT v_new_status AS request_status;
END//

DELIMITER ;

