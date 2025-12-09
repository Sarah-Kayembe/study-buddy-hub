-- ============================================================
-- Sarah Kayembe
-- STORED PROCEDURES FOR STUDY MANAGEMENT & GAMIFICATION SYSTEM
-- ============================================================
USE StudyBuddy;

DELIMITER //

-- ============================================================
-- TOPICS MANAGEMENT
-- ============================================================

-- CREATE: Add a new topic under a course
CREATE PROCEDURE add_topic(
    IN p_course_id INT,
    IN p_user_id INT,
    IN p_topic_name VARCHAR(150),
    IN p_topic_type_id TINYINT UNSIGNED -- Normalized FK
)
BEGIN
    INSERT INTO topics(course_id, user_id, topic_name, topic_type_id)
    VALUES (p_course_id, p_user_id, p_topic_name, p_topic_type_id);
END //

-- READ: Retrieve all topics for a specific course (latest first)
CREATE PROCEDURE get_topics_by_course(IN p_course_id INT)
BEGIN
    SELECT t.*, tt.type_name
    FROM topics t
    JOIN topic_types tt ON t.topic_type_id = tt.topic_type_id
    WHERE t.course_id = p_course_id
    ORDER BY t.created_at DESC;
END //

-- UPDATE: Modify topic name or type
CREATE PROCEDURE update_topic(
    IN p_topic_id INT,
    IN p_new_name VARCHAR(150),
    IN p_new_type_id TINYINT UNSIGNED
)
BEGIN
    UPDATE topics
    SET topic_name = p_new_name,
        topic_type_id = p_new_type_id
    WHERE topic_id = p_topic_id;
END //

-- DELETE: Remove a topic by ID
CREATE PROCEDURE delete_topic(IN p_topic_id INT)
BEGIN
    DELETE FROM topics WHERE topic_id = p_topic_id;
END //


-- ============================================================
-- TASKS MANAGEMENT
-- ============================================================

-- CREATE: Add a new task
CREATE PROCEDURE add_task(
    IN p_user_id INT,
    IN p_course_id INT,
    IN p_topic_id INT UNSIGNED,
    IN p_title VARCHAR(200),
    IN p_due_date DATETIME,
    IN p_priority TINYINT,
    IN p_category_id TINYINT UNSIGNED
)
BEGIN
    INSERT INTO tasks(user_id, course_id, topic_id, title, due_date, priority, category_id)
    VALUES (p_user_id, p_course_id, p_topic_id, p_title, p_due_date, p_priority, p_category_id);
END //

-- READ: Retrieve all tasks for a specific user, ordered by due date
CREATE PROCEDURE get_tasks_by_user(IN p_user_id INT)
BEGIN
    SELECT t.*, c.category_name
    FROM tasks t
    JOIN task_categories c ON t.category_id = c.category_id
    WHERE t.user_id = p_user_id
    ORDER BY t.due_date ASC;
END //

-- UPDATE: Modify task status or title
CREATE PROCEDURE update_task(
    IN p_task_id INT UNSIGNED,
    IN p_new_status ENUM('todo','in_progress','done'),
    IN p_new_title VARCHAR(200)
)
BEGIN
    UPDATE tasks
    SET status = p_new_status,
        title = p_new_title,
        updated_at = NOW()
    WHERE task_id = p_task_id;
END //

-- DELETE: Remove a task by ID
CREATE PROCEDURE delete_task(IN p_task_id INT UNSIGNED)
BEGIN
    DELETE FROM tasks WHERE task_id = p_task_id;
END //


-- ============================================================
-- TIMER SESSIONS (Pomodoro / Flowtime)
-- ============================================================

-- CREATE: Add a new timer session record
CREATE PROCEDURE add_timer_session(
    IN p_host_id INT,
    IN p_start DATETIME,
    IN p_end DATETIME,
    IN p_topic_id INT UNSIGNED,
    IN p_type ENUM('pomodoro','flowtime','custom'),
    IN p_short_break TINYINT,
    IN p_long_break TINYINT,
    IN p_session_type ENUM('solo','group')
)
BEGIN
    INSERT INTO timersessions(host_id, start_time, end_time, topic_id, technique_type, short_break_min, long_break_min, session_type)
    VALUES (p_host_id, p_start, p_end, p_topic_id, p_type, p_short_break, p_long_break, p_session_type);
END //

-- READ: Fetch all timer sessions for a user
CREATE PROCEDURE get_timer_sessions_by_user(IN p_host_id INT)
BEGIN
    SELECT * FROM timersessions WHERE host_id = p_host_id ORDER BY start_time DESC;
END //

-- UPDATE: Adjust start/end times of a session
CREATE PROCEDURE update_timer_session_time(
    IN p_timer_id INT UNSIGNED,
    IN p_new_start DATETIME,
    IN p_new_end DATETIME
)
BEGIN
    UPDATE timersessions
    SET start_time = p_new_start,
        end_time = p_new_end
    WHERE timer_id = p_timer_id;
END //

-- DELETE: Remove a session
CREATE PROCEDURE delete_timer_session(IN p_timer_id INT UNSIGNED)
BEGIN
    DELETE FROM timersessions WHERE timer_id = p_timer_id;
END //


-- ============================================================
-- DAILY FOCUS LOG
-- ============================================================

-- CREATE / UPDATE: Add or update daily focus summary
CREATE PROCEDURE add_or_update_daily_focus(
    IN p_user_id INT,
    IN p_focus_date DATE,
    IN p_sessions SMALLINT,
    IN p_minutes MEDIUMINT  
)
BEGIN
    INSERT INTO dailyfocuslog(user_id, focus_date, total_sessions, total_focus_min)
    VALUES (p_user_id, p_focus_date, p_sessions, p_minutes)
    ON DUPLICATE KEY UPDATE
        total_sessions = total_sessions + p_sessions,
        total_focus_min = total_focus_min + p_minutes;
END //

-- READ: Retrieve all daily logs for a user
CREATE PROCEDURE get_focus_log_by_user(IN p_user_id INT)
BEGIN
    SELECT * FROM dailyfocuslog WHERE user_id = p_user_id ORDER BY focus_date DESC;
END //

-- DELETE: Remove a log entry
CREATE PROCEDURE delete_focus_log(IN p_log_id INT UNSIGNED)
BEGIN
    DELETE FROM dailyfocuslog WHERE log_id = p_log_id;
END //


-- ============================================================
-- USER STUDY STATS
-- ============================================================

-- CREATE: Initialize stats for a new user
CREATE PROCEDURE create_user_stats(IN p_user_id INT)
BEGIN
    INSERT INTO studystats(user_id) VALUES (p_user_id);
END //

-- READ: Get stats for a given user
CREATE PROCEDURE get_user_stats(IN p_user_id INT)
BEGIN
    SELECT * FROM studystats WHERE user_id = p_user_id;
END //

-- UPDATE: Increment session and focus time totals
CREATE PROCEDURE update_user_stats(
    IN p_user_id INT,
    IN p_sessions INT,
    IN p_minutes INT
)
BEGIN
    UPDATE studystats
    SET total_sessions = total_sessions + p_sessions,
        total_focus_time_min = total_focus_time_min + p_minutes,
        last_session_at = NOW()
    WHERE user_id = p_user_id;
END //

-- DELETE: Clear stats for a user
CREATE PROCEDURE delete_user_stats(IN p_user_id INT)
BEGIN
    DELETE FROM studystats WHERE user_id = p_user_id;
END //


-- ============================================================
-- FOCUS ITEMS & INVENTORY SYSTEM
-- ============================================================

-- CREATE: Add a new collectible item
CREATE PROCEDURE add_focus_item(
    IN p_type_id TINYINT UNSIGNED,
    IN p_name VARCHAR(100),
    IN p_cost SMALLINT,
    IN p_rarity ENUM('common','rare','epic','legendary')
)
BEGIN
    INSERT INTO focusitems(item_type_id, item_name, focus_cost_min, rarity_level)
    VALUES (p_type_id, p_name, p_cost, p_rarity);
END //

-- READ: Fetch all available focus items
CREATE PROCEDURE get_focus_items()
BEGIN
    SELECT fi.*, it.type_name
    FROM focusitems fi
    JOIN item_types it ON fi.item_type_id = it.item_type_id;
END //

-- UPDATE: Rename a focus item
CREATE PROCEDURE update_focus_item_name(
    IN p_item_id INT UNSIGNED,
    IN p_new_name VARCHAR(100)
)
BEGIN
    UPDATE focusitems SET item_name = p_new_name WHERE item_id = p_item_id;
END //

-- DELETE: Remove a focus item
CREATE PROCEDURE delete_focus_item(IN p_item_id INT UNSIGNED)
BEGIN
    DELETE FROM focusitems WHERE item_id = p_item_id;
END //

-- CREATE: Award item to user (increment quantity if already owned)
CREATE PROCEDURE add_user_focus_item(IN p_user_id INT, IN p_item_id INT UNSIGNED)
BEGIN
    INSERT INTO userfocusitems(user_id, item_id, quantity, last_earned_at)
    VALUES (p_user_id, p_item_id, 1, NOW())
    ON DUPLICATE KEY UPDATE quantity = quantity + 1, last_earned_at = NOW();
END //


-- ============================================================
-- CITY LAYOUT (User placement of earned items)
-- ============================================================

-- CREATE: Place an item on user’s city map
CREATE PROCEDURE add_city_item(
    IN p_user_id INT,
    IN p_item_id INT UNSIGNED,
    IN p_x SMALLINT,
    IN p_y SMALLINT 
)
BEGIN
    INSERT INTO usercitylayout(user_id, item_id, position_x, position_y)
    VALUES (p_user_id, p_item_id, p_x, p_y);
END //

-- READ: Get all city layout items for a user
CREATE PROCEDURE get_city_items(IN p_user_id INT)
BEGIN
    SELECT * FROM usercitylayout WHERE user_id = p_user_id;
END //

-- UPDATE: Move a city item to new coordinates
CREATE PROCEDURE update_city_item_position(
    IN p_layout_id INT UNSIGNED,
    IN p_new_x SMALLINT,
    IN p_new_y SMALLINT
)
BEGIN
    UPDATE usercitylayout
    SET position_x = p_new_x,
        position_y = p_new_y
    WHERE layout_id = p_layout_id;
END //

-- DELETE: Remove an item from layout
CREATE PROCEDURE delete_city_item(IN p_layout_id INT UNSIGNED)
BEGIN
    DELETE FROM usercitylayout WHERE layout_id = p_layout_id;
END //


-- ============================================================
-- MONTHLY CHALLENGES & USER PROGRESS
-- ============================================================

-- CREATE: Add new monthly challenge
CREATE PROCEDURE add_challenge(
    IN p_title VARCHAR(150),
    IN p_desc VARCHAR(255),
    IN p_start DATE,
    IN p_end DATE,
    IN p_goal INT UNSIGNED,
    IN p_reward INT UNSIGNED
)
BEGIN
    INSERT INTO monthlychallenges(title, description, start_date, end_date, goal_minutes, reward_item_id)
    VALUES (p_title, p_desc, p_start, p_end, p_goal, p_reward);
END //

-- UPDATE: Modify challenge description
CREATE PROCEDURE update_challenge_desc(IN p_id INT UNSIGNED, IN p_new_desc VARCHAR(255))
BEGIN
    UPDATE monthlychallenges SET description = p_new_desc WHERE challenge_id = p_id;
END //

-- CREATE: Register user progress record for challenge
CREATE PROCEDURE add_user_challenge_progress(IN p_user INT, IN p_challenge INT UNSIGNED)
BEGIN
    INSERT INTO userchallengeprogress(user_id, challenge_id) VALUES (p_user, p_challenge);
END //

-- UPDATE: Increment user’s challenge progress (auto-mark complete)
CREATE PROCEDURE update_user_progress(IN p_user INT, IN p_challenge INT UNSIGNED, IN p_minutes INT)
BEGIN
    UPDATE userchallengeprogress
    SET total_minutes = total_minutes + p_minutes,
        is_completed = (total_minutes + p_minutes >= (SELECT goal_minutes FROM monthlychallenges WHERE challenge_id = p_challenge))
    WHERE user_id = p_user AND challenge_id = p_challenge;
END //


-- ============================================================
-- MOOD TRACKING (User well-being reflection)
-- ============================================================

-- CREATE: Add a mood entry linked to a study session
CREATE PROCEDURE add_mood_entry(
    IN p_user INT,
    IN p_timer INT UNSIGNED,
    IN p_mood_id TINYINT UNSIGNED,
    IN p_note VARCHAR(255)
)
BEGIN
    INSERT INTO moodtracking(user_id, timer_id, mood_level_id, note)
    VALUES (p_user, p_timer, p_mood_id, p_note);
END //

-- READ: Get all mood entries for a user (latest first)
CREATE PROCEDURE get_moods_by_user(IN p_user INT)
BEGIN
    SELECT mt.*, ml.level_name
    FROM moodtracking mt
    JOIN mood_levels ml ON mt.mood_level_id = ml.mood_level_id
    WHERE mt.user_id = p_user
    ORDER BY mt.recorded_at DESC;
END //

-- UPDATE: Edit mood note
CREATE PROCEDURE update_mood_note(IN p_mood_id INT UNSIGNED, IN p_new_note VARCHAR(255))
BEGIN
    UPDATE moodtracking SET note = p_new_note WHERE mood_id = p_mood_id;
END //

-- DELETE: Remove mood entry
CREATE PROCEDURE delete_mood(IN p_mood_id INT UNSIGNED)
BEGIN
    DELETE FROM moodtracking WHERE mood_id = p_mood_id;
END //


-- ============================================================
-- LEADERBOARD (Top performers tracking)
-- ============================================================

-- UPDATE / UPSERT: Add or update leaderboard statistics
CREATE PROCEDURE update_leaderboard(
    IN p_user INT,
    IN p_minutes INT,
    IN p_sessions INT
)
BEGIN
    INSERT INTO leaderboardstats(user_id, total_focus_min, total_sessions, updated_at)
    VALUES (p_user, p_minutes, p_sessions, NOW())
    ON DUPLICATE KEY UPDATE
        total_focus_min = total_focus_min + p_minutes,
        total_sessions = total_sessions + p_sessions,
        updated_at = NOW();
END //

-- READ: Retrieve top 10 users for a period (NOTE: Assumes 'username' is created by concatenating first_name and last_name)
CREATE PROCEDURE get_top_leaderboard(IN p_period ENUM('daily','weekly','monthly','all_time'))
BEGIN
    SELECT 
        CONCAT(u.first_name, ' ', u.last_name) AS username, 
        l.total_focus_min, 
        l.total_sessions, 
        l.streak_days
    FROM leaderboardstats l
    JOIN users u ON u.user_id = l.user_id
    WHERE period_type = p_period
    ORDER BY l.total_focus_min DESC
    LIMIT 10;
END //


-- ============================================================
-- REMINDERS (Task alerts)
-- ============================================================

-- CREATE: Add a new reminder for a task
CREATE PROCEDURE add_reminder(
    IN p_task INT UNSIGNED,
    IN p_time DATETIME,
    IN p_method ENUM('in_app','email','sms')
)
BEGIN
    INSERT INTO reminders(task_id, reminder_time, method)
    VALUES (p_task, p_time, p_method);
END //

-- READ: Retrieve reminders by user (via joined tasks)
CREATE PROCEDURE get_reminders_by_user(IN p_user INT)
BEGIN
    SELECT r.* FROM reminders r
    JOIN tasks t ON r.task_id = t.task_id
    WHERE t.user_id = p_user 
    ORDER BY reminder_time;
END //

-- UPDATE: Change reminder time
CREATE PROCEDURE update_reminder_time(IN p_id INT UNSIGNED, IN p_new_time DATETIME)
BEGIN
    UPDATE reminders SET reminder_time = p_new_time WHERE reminder_id = p_id;
END //

-- DELETE: Remove reminder
CREATE PROCEDURE delete_reminder(IN p_id INT UNSIGNED)
BEGIN
    DELETE FROM reminders WHERE reminder_id = p_id;
END //

-- ============================================================
-- SESSION PARTICIPANTS
-- ============================================================

-- CREATE: Add a participant to a group session
CREATE PROCEDURE add_session_participant(
    IN p_timer_id INT UNSIGNED,
    IN p_user_id INT,
    IN p_role ENUM('host','member')
)
BEGIN
    INSERT INTO sessionparticipants(timer_id, user_id, role)
    VALUES (p_timer_id, p_user_id, p_role);
END //

-- READ: Get all participants for a specific timer session
CREATE PROCEDURE get_participants_by_timer(IN p_timer_id INT UNSIGNED)
BEGIN
    SELECT sp.user_id, u.first_name, u.last_name, sp.role, sp.joined_at
    FROM sessionparticipants sp
    JOIN users u ON sp.user_id = u.user_id
    WHERE sp.timer_id = p_timer_id;
END //

-- DELETE: Remove a participant from a session
CREATE PROCEDURE remove_session_participant(
    IN p_timer_id INT UNSIGNED,
    IN p_user_id INT
)
BEGIN
    DELETE FROM sessionparticipants
    WHERE timer_id = p_timer_id AND user_id = p_user_id;
END //


-- ============================================================
-- RESOURCE MANAGEMENT
-- ============================================================

-- CREATE: Add a new resource (link or file upload)
CREATE PROCEDURE add_resource(
    IN p_uploader_id INT,
    IN p_title VARCHAR(100),
    IN p_desc TEXT,
    IN p_type ENUM('file_upload', 'external_link'),
    IN p_url VARCHAR(500),
    IN p_filetype VARCHAR(30)
)
BEGIN
    INSERT INTO resource(uploader_id, title, description, resource_type, storage_url, filetype)
    VALUES (p_uploader_id, p_title, p_desc, p_type, p_url, p_filetype);
END //

-- READ: Get resources uploaded by a specific user
CREATE PROCEDURE get_resources_by_uploader(IN p_uploader_id INT)
BEGIN
    SELECT * FROM resource WHERE uploader_id = p_uploader_id ORDER BY upload_date DESC;
END //

-- DELETE: Remove a resource
CREATE PROCEDURE delete_resource(IN p_resource_id INT UNSIGNED)
BEGIN
    DELETE FROM resource WHERE resource_id = p_resource_id;
END //


-- ============================================================
-- TOPIC TYPES LOOKUP TABLE MANAGEMENT
-- ============================================================

-- CREATE: Add a new topic type (e.g., 'Seminar')
CREATE PROCEDURE add_topic_type(IN p_type_name VARCHAR(50))
BEGIN
    INSERT INTO topic_types(type_name) VALUES (p_type_name);
END //

-- READ: Get all topic types for application lists
CREATE PROCEDURE get_all_topic_types()
BEGIN
    SELECT * FROM topic_types ORDER BY type_name ASC;
END //


DELIMITER //

-- ============================================================
-- TASK CATEGORIES MANAGEMENT
-- ============================================================

-- CREATE: Add a new task category (e.g., 'Presentation')
CREATE PROCEDURE add_task_category(IN p_category_name VARCHAR(50))
BEGIN
    INSERT INTO task_categories(category_name) VALUES (p_category_name);
END //

-- READ: Get all task categories for application lists/filters
CREATE PROCEDURE get_all_task_categories()
BEGIN
    SELECT * FROM task_categories ORDER BY category_name ASC;
END //


-- ============================================================
-- ITEM TYPES MANAGEMENT
-- ============================================================

-- CREATE: Add a new focus item type (e.g., 'Vehicle')
CREATE PROCEDURE add_item_type(IN p_type_name VARCHAR(50))
BEGIN
    INSERT INTO item_types(type_name) VALUES (p_type_name);
END //

-- READ: Get all item types for item creation and filtering the shop
CREATE PROCEDURE get_all_item_types()
BEGIN
    SELECT * FROM item_types ORDER BY type_name ASC;
END //


-- ============================================================
-- MOOD LEVELS MANAGEMENT
-- ============================================================

-- CREATE: Add a new mood level (e.g., 'Excited')
CREATE PROCEDURE add_mood_level(IN p_level_name VARCHAR(50))
BEGIN
    INSERT INTO mood_levels(level_name) VALUES (p_level_name);
END //

-- READ: Get all mood levels for mood entry selection
CREATE PROCEDURE get_all_mood_levels()
BEGIN
    SELECT * FROM mood_levels ORDER BY level_name ASC;
END //

-- ============================================================
-- CALENDAR VIEW DATA
-- ============================================================

-- READ: Retrieves a summary of focus time and recorded mood for a user's solo sessions,
--       designed to populate a calendar view.
CREATE PROCEDURE get_calendar_mood_summary(IN p_user_id INT)
BEGIN
    SELECT
        DATE(ts.start_time) AS study_day,
        ml.level_name AS mood_level,
        SUM(ts.duration_min) AS total_focus_time
    FROM timersessions ts
    -- Join to moodtracking to link the session to the mood recorded
    JOIN moodtracking mt ON ts.timer_id = mt.timer_id
    -- Join to mood_levels to get the sticker/level name
    JOIN mood_levels ml ON mt.mood_level_id = ml.mood_level_id
    WHERE ts.host_id = p_user_id
      AND ts.session_type = 'solo'
    GROUP BY study_day, mood_level
    ORDER BY study_day DESC;
END //

DELIMITER ;
