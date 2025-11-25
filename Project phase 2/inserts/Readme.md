# Insert Folder README
These scripts were used to load data from CSV files stored in data/Raw_Data/ and to generate synthetic test data for the StudyBuddy database. They help populate tables with clean, structured, and realistic sample data so we can test queries, stored procedures, and overall system functionality.

**How to Run the Files**

Make sure all CSV files are in data/Raw_Data/ and all insert scripts are in the inserts/ folder.
Run the scripts in chronological order:

insert_college.py

insert_major.py

insert_users.py

insert_courses.py

Insert all lookup tables (e.g., focus items, categories, etc.)

Insert all remaining tables (tasks, sessions, participation logs, synthetic data scripts)