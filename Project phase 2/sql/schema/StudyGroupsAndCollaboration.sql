Use StudyBuddy;

CREATE TABLE Study_Group(
	group_id INT PRIMARY KEY AUTO_INCREMENT,
    group_name VARCHAR(100) NOT NULL,
    created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    max_members INT NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    course_id INT NOT NULL, 
	invite_code VARCHAR(16) NULL,
	invite_expires_at DATETIME NULL,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
);

CREATE TABLE Join_Request(
	request_id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    join_status ENUM('pending', 'approved', 'rejected', 'expired') NOT NULL DEFAULT 'pending',
    request_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expire_date DATETIME NULL,
    approvedBy INT NULL,
    FOREIGN KEY (group_id) REFERENCES Study_Group(group_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (approvedBy) REFERENCES Users(user_id)
);

CREATE TABLE Study_Session(
	session_id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT NOT NULL,
    location VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    notes TEXT NULL,
    session_date DATE NOT NULL,
    FOREIGN KEY (group_id) REFERENCES Study_Group(group_id)
);

CREATE TABLE Chat_Message(
	message_id INT PRIMARY KEY AUTO_INCREMENT,
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    sent_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    edited BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (group_id) REFERENCES Study_Group(group_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE Resource(
	resource_id INT PRIMARY KEY AUTO_INCREMENT,
    uploader_id INT NOT NULL, 
    title VARCHAR(100) NOT NULL,
    description TEXT NULL,
    filetype VARCHAR(30) NOT NULL,
	source VARCHAR(1000) NOT NULL,
    upload_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploader_id) REFERENCES Users(user_id)
);

CREATE TABLE Match_Profile(
	user_id INT PRIMARY KEY,
    study_style ENUM('solo', 'pair', 'group') NOT NULL,
    meeting_pref ENUM('online', 'in_person', 'hybrid') NOT NULL,
    bio TEXT NULL,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);

CREATE TABLE Message_Request (
	request_id INT PRIMARY KEY AUTO_INCREMENT,
    requester_user_id INT NOT NULL,
    target_user_id INT NOT NULL,
    course_id INT NOT NULL,
    request_status ENUM('pending', 'accepted', 'rejected', 'expired') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_user_id) REFERENCES Users(user_id),
    FOREIGN KEY (target_user_id) REFERENCES Users(user_id),
    FOREIGN KEY (course_id) REFERENCES Courses(course_id)
    );
    
    CREATE TABLE Group_Member (
	group_id INT NOT NULL, 
    user_id INT NOT NULL,
	joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    role ENUM('member', 'admin', 'owner') NOT NULL DEFAULT 'member',
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES Study_Group(group_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
);



    
