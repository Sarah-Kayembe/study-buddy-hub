**About this phase**
Phase 2 focuses on standing up the entire StudyBuddy database stack: defining all MySQL schemas/procedures for user management, study groups, quizzes/flashcards, and loading a comprehensive set of seed data (users, resources, study groups, fake activity, quiz content). The deliverable is the scripted pipeline in build_database.py plus the associated SQL files so anyone can recreate the database from scratch and verify the relationships/constraints for the project’s features.


**How to run this phase**
  -Install MySQL 8.0+ and Python 3.9+ if they aren’t already on your machine.
  -Clone/download the repo, then open a terminal in Study_Buddy_hub/Project phase 2.
  -Install the connector: pip install mysql-connector-python.
  -Make sure your MySQL server has local_infile enabled (needed for CSV imports).
  -Run python build_database.py. When prompted (MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD), type your MySQL info or hit Enter to accept defaults.
  -Watch the log as it executes each SQL file; once you see “Build completed.” the StudyBuddy database is ready.
  -(Optional) Verify in MySQL: mysql -u <user> -p, USE StudyBuddy;, run SELECT COUNT(*) FROM Users; to confirm data is loaded.
  
Tasks due for 11/04/2025 - JakeCraig22 - Jake Craig
- All SQL for the Study Groups & Collaboration section.
  - Creating tables related to Study Groups & Collaboration.
  - Inserting sample data for testing.
  - Verifying foreign keys and joins.

Tasks due for 11/09/2025 - JakeCraig22 - Jake Craig
- Ensuring scraped data can be inserted into the resources table.
  - Clean and make sure scraped data is good for insertion into table.
  - Test inserts and handle any issues.
- Query Optimization analysis of Study Groups & Collaboration.
  - 'EXPLAIN' for query performance.
  - Add or test where improvements are needed.

Tasks due for 11/04/2025 - Sarah-Kayembe - Sarah Kayembe
- Create a schema that builds the Study Management Table and gamification.
  - Design and implement table structures for Study Management and Gamification.
  - Ensure relationships and constraints are properly defined.
  - Test schema creation and fix any dependency errors.
- Stored procedures and functions for the Study Management Table and gamification.
  - Develop key stored procedures for data retrieval and updates.
  - Create functions for gamification progress tracking.
  - Verify procedures and functions through test cases.
- Data scraping for colleges.
  - Write and test Python scraper for collecting college names in all states.
  - Clean and prepare data for database insertion.

Tasks due for 11/05/2025 - Sarah-Kayembe - Sarah Kayembe
- Query optimization analysis for the Study Management Table and gamification.
  - Perform query performance analysis using `EXPLAIN`, show `PROFILE` and `STATUS`.
  - Identify bottlenecks (if any) and apply indexing or optimization as needed.
- Data scraping for courses.
  - Collect course information.
  - Validate scraped data for consistency and completeness.
- Data scraping for resources.
  - Scraping of study materials and learning resources.
  - Check and remove duplicates.
- Data scraping for quiz and flashcards.
  - Collect quizzes and flashcards by topic or course.
  - Ensure scraped data aligns with course structure.

Tasks due for 11/07/2025 - Sarah-Kayembe - Sarah Kayembe
- Write a short document describing the data cleaning and scraping process.
  - Include source websites, methods used, and sample outputs.
  - Upload document to repository for documentation and review.

Tasks due for 11/04/2025 - VivekReddy10-08-2004 - Vivek Reddy Bhimavarapu
  All SQL for the Quizzes & Flashcards section.
  - Define the schema for a Quizzes & Flashcards app.
  - Creates tables.
  - Adds relationships via foreign keys.
    
Tasks due for 11/09/2025 - VivekReddy10-08-2004 - Vivek Reddy Bhimavarapu
- Inserting scraped data into the tables.
- Query optimization analysis of Quizzes & Flashcards section.

Tasks due for 11/04/2025 - rakizakiedu - Rise Akizaki
- SQL for the User_Management section.
  - Creating all tables for said section (User, College, Course, Major)
  - Testing relationships, and foreign keys

Tasks due for 11/06/2025 - rakizakiedu - Rise Akizaki
- Data cleaning for courses.
  - Handle missing or malformed course records.
  - Reformat fields to match schema requirements.
- Data cleaning for quiz and flashcards.
  - Remove inconsistencies and normalize formats.
  - Validate relationships with courses table.

Tasks due for 11/07/2025 - rakizakiedu - Rise Akizaki
- On the document for the data cleaning and scraping process, summarize steps taken for data cleaning and transformation.

Tasks due for 11/09/2025 - rakizakiedu - Rise Akizaki
- Query optimization analysis of User_Management section.


Group deadlines:
TEAM CONTRIBUTION FILE Nov 9
TEST THE ENTIRE SCRIPT Nov 10
REVIEW ALL THE WORK  Nov 11
RECORDED VIDEO DEMONSTRATION Nov 12
