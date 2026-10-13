-- XP and coin balance for each user, used by Focus Den levels and the shop.
CREATE TABLE IF NOT EXISTS user_progress (
    user_id INT PRIMARY KEY,
    xp INT UNSIGNED NOT NULL DEFAULT 0,
    coins INT UNSIGNED NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_progress_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Credit focus time already logged before progression existed:
-- 2 XP and 1 coin per minute, the same rate new sessions earn.
INSERT IGNORE INTO user_progress (user_id, xp, coins)
SELECT user_id, total_focus_time_min * 2, total_focus_time_min
FROM studystats;
