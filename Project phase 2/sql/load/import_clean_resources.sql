use StudyBuddy;

USE StudyBuddy;

LOAD DATA LOCAL INFILE 'data/Clean_data/course_resources_cleaned.csv'
INTO TABLE resource
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(@CourseName, @TopicName, @ContentSnippet, @ResourceURL, @ResourceType)
SET

  uploader_id = 1001,
  title       = CONCAT(@CourseName, ' — ', @TopicName),
  description = @ContentSnippet,
  filetype    = @ResourceType,
  source      = @ResourceURL,
  upload_date = CURDATE();
