-- Daily challenge rewards a student has already claimed, one row per
-- challenge per day, so each reward can only be collected once a day.
CREATE TABLE challenge_claims (
    user_id INT NOT NULL,
    challenge_key VARCHAR(40) NOT NULL,
    day DATE NOT NULL,
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, day, challenge_key),
    CONSTRAINT fk_challenge_claims_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
