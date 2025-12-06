-- ------------------------------------------------------------
-- Sarah Kayembe - Study Management and Gamification
-- Optimized SQL Schema
-- ------------------------------------------------------------
-- Note: Assumes 'users' and 'courses' tables are created already,
-- ------------------------------------------------------------

USE StudyBuddy;

-- LOOKUP TABLES (New Tables for Normalized Types)
-- ============================================================

-- Reference table for topic categories (e.g., 'lecture', 'lab', 'tutorial')
CREATE TABLE topic_types (
    topic_type_id TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reference table for task categories (e.g., 'assignment', 'project', 'exam_prep')
CREATE TABLE task_categories (
    category_id TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reference table for focus item types (e.g., 'plant', 'animal', 'house')
CREATE TABLE item_types (
    item_type_id TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reference table for mood levels (e.g., 'very_bad', 'neutral', 'great')
CREATE TABLE mood_levels (
    mood_level_id TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    level_name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- topics
-- (Each course contains multiple topics)
-- ------------------------------------------------------------
CREATE TABLE topics (
    topic_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    course_id INT DEFAULT NULL,
    user_id INT DEFAULT NULL,
    topic_name VARCHAR(150) NOT NULL,
    topic_type_id TINYINT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_topic_course
        FOREIGN KEY (course_id) REFERENCES Courses(course_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_topic_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_topic_type
        FOREIGN KEY (topic_type_id) REFERENCES topic_types(topic_type_id),
    CONSTRAINT uq_topic_per_course UNIQUE (course_id, topic_name),
    CONSTRAINT chk_topic_name_format CHECK (topic_name REGEXP '^[A-Za-z0-9 :,.\-?!()]{3,150}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Index allows fast filtering of topics created by a specific user.
CREATE INDEX idx_topic_user ON topics(user_id);


-- ------------------------------------------------------------
-- tasks
-- (Assignments, projects, and to-dos tracked by Users)
-- ------------------------------------------------------------
CREATE TABLE tasks (
    task_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT DEFAULT NULL,
    topic_id INT UNSIGNED DEFAULT NULL,
    title VARCHAR(200) NOT NULL,
    due_date DATETIME,
    status ENUM('todo','in_progress','done') DEFAULT 'todo',
    priority TINYINT UNSIGNED NOT NULL DEFAULT 3,
    category_id TINYINT UNSIGNED DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_task_course
        FOREIGN KEY (course_id) REFERENCES Courses(course_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_task_topic
        FOREIGN KEY (topic_id) REFERENCES topics(topic_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_task_category
        FOREIGN KEY (category_id) REFERENCES task_categories(category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Optimization: Index speeds up dashboard queries filtering tasks by the current user, status (e.g., 'todo'), and ordering by due date.
CREATE INDEX idx_task_user_status_due ON tasks(user_id, status, due_date);
-- Optimization: Index helps filter tasks when viewing by course and specific status (e.g., "Show completed assignments for MATH101").
CREATE INDEX idx_task_course_status ON tasks(course_id, status, due_date);


-- ------------------------------------------------------------
-- timerSessions
-- (Represents focus or Pomodoro sessions)
-- ------------------------------------------------------------
CREATE TABLE timersessions (
    timer_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    host_id INT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    duration_min SMALLINT UNSIGNED GENERATED ALWAYS AS (TIMESTAMPDIFF(MINUTE, start_time, end_time)) STORED,
    topic_id INT UNSIGNED DEFAULT NULL,
    technique_type ENUM('pomodoro','flowtime','custom') DEFAULT 'pomodoro',
    short_break_min TINYINT UNSIGNED DEFAULT NULL,
    long_break_min TINYINT UNSIGNED DEFAULT NULL,
    session_type ENUM('solo','group') DEFAULT 'solo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_timer_host
        FOREIGN KEY (host_id) REFERENCES Users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_timer_topic
        FOREIGN KEY (topic_id) REFERENCES topics(topic_id)
        ON DELETE SET NULL,
    CONSTRAINT chk_time_order CHECK (end_time > start_time),
    CONSTRAINT chk_max_duration CHECK (TIMESTAMPDIFF(MINUTE,start_time,end_time) <= 120)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Index speeds up queries to find all sessions started by a specific host, often ordered by time.
CREATE INDEX idx_timer_host_start ON timersessions(host_id, start_time);
-- Optimization: Composite index used for faster calculation of user total stats (filtering by host and summing duration over a time range).
CREATE INDEX idx_timer_host_end_duration ON timersessions(host_id, end_time, duration_min);


-- ------------------------------------------------------------
-- sessionParticipants
-- (Users participating in timer sessions)
-- ------------------------------------------------------------
CREATE TABLE sessionparticipants (
    timer_id INT UNSIGNED NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    role ENUM('host','member') DEFAULT 'member',
    PRIMARY KEY (timer_id, user_id),
    CONSTRAINT fk_participant_timer
        FOREIGN KEY (timer_id) REFERENCES timersessions(timer_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_participant_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Index improves lookup speed when finding all sessions a particular user participated in.
CREATE INDEX idx_participant_user ON sessionparticipants(user_id);


-- ------------------------------------------------------------
-- reminders
-- (Notifications tied to tasks)
-- ------------------------------------------------------------
CREATE TABLE reminders (
    reminder_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task_id INT UNSIGNED NOT NULL,
    reminder_time DATETIME NOT NULL,
    method ENUM('in_app','email','sms') DEFAULT 'in_app',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reminder_task
        FOREIGN KEY (task_id) REFERENCES tasks(task_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Index is crucial for the application to quickly find and fire upcoming reminders by time.
CREATE INDEX idx_reminder_time ON reminders(reminder_time);


-- ============================================================
-- GAMIFICATION & STATS TABLES (OPTIMIZED)
-- ============================================================

-- ------------------------------------------------------------
-- focusItems
-- (Collectible or reward items Users can earn)
-- ------------------------------------------------------------
CREATE TABLE focusitems (
    item_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    item_type_id TINYINT UNSIGNED NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    image_url VARCHAR(255),
    rarity_level ENUM('common','rare','epic','legendary') DEFAULT 'common', -- Rarity is a small, stable list, so ENUM remains
    focus_cost_min SMALLINT UNSIGNED DEFAULT 0,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_item_type
        FOREIGN KEY (item_type_id) REFERENCES item_types(item_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Index speeds up filtering the item shop or inventory by item category (type).
CREATE INDEX idx_focus_type ON focusitems(item_type_id);


-- ------------------------------------------------------------
-- dailyFocusLog
-- (Daily log tracking user’s total focus time and sessions)
-- ------------------------------------------------------------
CREATE TABLE dailyfocuslog (
    log_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    focus_date DATE NOT NULL,
    total_sessions SMALLINT UNSIGNED DEFAULT 0,
    total_focus_min MEDIUMINT UNSIGNED DEFAULT 0,
    focus_start_times JSON,
    focus_topics JSON,
    item_earned_id INT UNSIGNED DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_focuslog_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_focuslog_item
        FOREIGN KEY (item_earned_id) REFERENCES focusitems(item_id)
        ON DELETE SET NULL,
    CONSTRAINT uq_user_date UNIQUE (user_id, focus_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ------------------------------------------------------------
-- studyStats
-- (Aggregated user performance metrics)
-- ------------------------------------------------------------
CREATE TABLE studystats (
    user_id INT PRIMARY KEY,
    total_sessions INT UNSIGNED DEFAULT 0,
    total_focus_time_min INT UNSIGNED DEFAULT 0,
    avg_duration_min DECIMAL(6,2),
    longest_streak_days SMALLINT UNSIGNED DEFAULT 0,
    current_streak_days SMALLINT UNSIGNED DEFAULT 0,
    last_session_at DATETIME DEFAULT NULL,
    favorite_item_type ENUM(
        'Plant',
        'Flower',
        'Tree',
        'Bush',
        'Rock',
        'Water Feature',
        'Animal',
        'Pet',
        'Bird',
        'Insect',
        'House',
        'Apartment',
        'Building',
        'Structure',
        'Bridge',
        'Tower',
        'Floor',
        'Pathway',
        'Furniture',
        'Decoration',
        'Wall Ornament',
        'Light Fixture',
        'Vehicle',
        'Accessory',
        'Other'
    ),
    favorite_item_name VARCHAR(100),
    most_frequent_topic INT UNSIGNED,
    CONSTRAINT fk_stats_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_stats_topic
        FOREIGN KEY (most_frequent_topic) REFERENCES topics(topic_id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Index speeds up reports or leaderboards that analyze or filter users based on their most frequent study topic.
CREATE INDEX idx_stats_topic ON studystats(most_frequent_topic);


-- ------------------------------------------------------------
-- userFocusItems
-- (Items owned by each user)
-- ------------------------------------------------------------
CREATE TABLE userfocusitems (
    user_id INT NOT NULL,
    item_id INT UNSIGNED NOT NULL,
    quantity SMALLINT UNSIGNED DEFAULT 0,
    last_earned_at DATETIME,
    is_placed BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id, item_id),
    CONSTRAINT fk_user_item_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user_item_item
        FOREIGN KEY (item_id) REFERENCES focusitems(item_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Index improves queries that need to find all users who own a particular item.
CREATE INDEX idx_user_item_item ON userfocusitems(item_id);


-- ------------------------------------------------------------
-- userCityLayout
-- (Where Users arrange their focus items in a virtual city)
-- ------------------------------------------------------------
CREATE TABLE usercitylayout (
    layout_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT UNSIGNED NOT NULL,
    position_x SMALLINT NOT NULL,
    position_y SMALLINT NOT NULL,
    placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_city_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_city_item
        FOREIGN KEY (item_id) REFERENCES focusitems(item_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Index is crucial for quickly retrieving a user's entire city layout when they open the application.
CREATE INDEX idx_city_user ON usercitylayout(user_id);


-- ------------------------------------------------------------
-- monthlyChallenges
-- ------------------------------------------------------------
CREATE TABLE monthlychallenges (
    challenge_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    goal_minutes INT UNSIGNED DEFAULT 600,
    reward_item_id INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_challenge_reward
        FOREIGN KEY (reward_item_id) REFERENCES focusitems(item_id)
        ON DELETE SET NULL,
    CONSTRAINT chk_challenge_title_format CHECK (title REGEXP '^[A-Za-z0-9 ,.\-?!()]{3,150}$'),
    CONSTRAINT chk_challenge_date_order CHECK (end_date > start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Index allows fast lookups when querying which challenges reward a specific item.
CREATE INDEX idx_challenge_reward ON monthlychallenges(reward_item_id);


-- ------------------------------------------------------------
-- userChallengeProgress
-- (Tracks each user’s progress toward completing monthly study challenges)
-- ------------------------------------------------------------
CREATE TABLE userchallengeprogress (
    user_id INT NOT NULL,
    challenge_id INT UNSIGNED NOT NULL,
    total_minutes MEDIUMINT UNSIGNED DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at DATETIME,
    PRIMARY KEY (user_id, challenge_id),
    CONSTRAINT fk_progress_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_progress_challenge
        FOREIGN KEY (challenge_id) REFERENCES monthlychallenges(challenge_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Index speeds up queries needed to aggregate data for a single challenge (e.g., "Show all users participating in the November Blitz").
CREATE INDEX idx_progress_challenge ON userchallengeprogress(challenge_id);


-- ------------------------------------------------------------
-- moodTracking
-- (Records Users’ daily moods linked to their focus sessions for emotional tracking)
-- ------------------------------------------------------------
CREATE TABLE moodtracking (
    mood_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    timer_id INT UNSIGNED,
    mood_level_id TINYINT UNSIGNED DEFAULT 3, -- FK replacing ENUM
    note VARCHAR(255),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_mood_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_mood_timer
        FOREIGN KEY (timer_id) REFERENCES timersessions(timer_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_mood_level
        FOREIGN KEY (mood_level_id) REFERENCES mood_levels(mood_level_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Index allows fast retrieval of a user's entire mood history.
CREATE INDEX idx_mood_user ON moodtracking(user_id);


-- ------------------------------------------------------------
-- leaderboardStats
-- (Stores each user’s cumulative study performance used to display leaderboards)
-- ------------------------------------------------------------
CREATE TABLE leaderboardstats (
    leaderboard_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_focus_min INT UNSIGNED DEFAULT 0,
    total_sessions INT UNSIGNED DEFAULT 0,
    streak_days SMALLINT UNSIGNED DEFAULT 0,
    period_type ENUM('daily','weekly','monthly','all_time') DEFAULT 'weekly',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_leader_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- Index is necessary for quickly updating or retrieving a user's leaderboard entry.
CREATE INDEX idx_leader_user ON leaderboardstats(user_id);
