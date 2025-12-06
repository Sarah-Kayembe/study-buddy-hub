USE StudyBuddy;


START TRANSACTION;

INSERT INTO Users (user_id, email, password_hash, first_name, last_name)
VALUES (1001, 'resources@system.local', 'placeholder', 'System', 'Seeder')
ON DUPLICATE KEY UPDATE
   -- Done by Vivek, valid "no-op" update that also ensures
   -- LAST_INSERT_ID() is set to the user_id (1001) whether the row
   -- is new or it already existed.
   user_id = LAST_INSERT_ID(user_id);

   -- Done by vivek modifying to add user_id 1002, 1003, 1004, and 1005 to the Users table. 
   -- This way, when TestDataForStudyGroups.sql runs, all the users it needs will already exist, 
   -- and the foreign key error will be gone.
   -- Create other test/system users that other scripts might need
INSERT INTO Users (user_id, email, password_hash, first_name, last_name)
VALUES
    (1002, 'testuser1@system.local', 'placeholder', 'Test', 'User1'),
    (1003, 'testuser2@system.local', 'placeholder', 'Test', 'User2'),
    (1004, 'testuser3@system.local', 'placeholder', 'Test', 'User3'),
    (1005, 'testuser4@system.local', 'placeholder', 'Test', 'User4')
ON DUPLICATE KEY UPDATE
   -- This just ensures the INSERTs don't fail if they already exist
   email = VALUES(email);


SET @uploader_id := LAST_INSERT_ID();
-- safer version of an insert of a system user into the db. 
-- sets id and every time this is used, will revert to system seeder id


INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 6463687174', '', 'LINK', 'https://www.zhihu.com/question/6463687174');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / Www.Zhihu.Com', '', 'LINK', 'https://www.zhihu.com/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Reddit.Com / R/Chatgptpro/Comments/1Djvzff/What Is The Limit For Number Of Files And Data', '', 'LINK', 'https://www.reddit.com/r/ChatGPTPro/comments/1djvzff/what_is_the_limit_for_number_of_files_and_data/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Reddit.Com / R/F1Dataanalysis', '', 'LINK', 'https://www.reddit.com/r/F1DataAnalysis/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Reddit.Com / R/Chess/Comments/Rawd6M/Heres How To Use Lichess Analysis Effectively', '', 'LINK', 'https://www.reddit.com/r/chess/comments/rawd6m/heres_how_to_use_lichess_analysis_effectively/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Epa.Gov / Www.Epa.Gov', '', 'LINK', 'https://www.epa.gov/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Epa.Gov / Www.Epa.Gov', '', 'LINK', 'https://www.epa.gov/in');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Epa.Gov / Environmental Topics', '', 'LINK', 'https://www.epa.gov/environmental-topics');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Epa.Gov / Laws Regulations', '', 'LINK', 'https://www.epa.gov/laws-regulations');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'who.int', '', 'LINK', 'https://www.who.int/health-topics/environmental-health');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'icity.ly', '', 'LINK', 'https://art.icity.ly/museums/h6sbu47');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'semester.ly', '', 'LINK', 'https://jhu.semester.ly/c/AS.070.632');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'sebhau.edu.ly', '', 'LINK', 'https://sebhau.edu.ly/lang/course-descriptions/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'uob.edu.ly', '', 'LINK', 'https://journals.uob.edu.ly/JOFOA/article/view/5931/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'icity.ly', '', 'LINK', 'https://art.icity.ly/museums/sskb3ds');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Britannica.Com / Anthropology', '', 'LINK', 'https://www.britannica.com/science/anthropology');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Britannica.Com / Anthropology', '', 'LINK', 'https://www.britannica.com/summary/anthropology');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Britannica.Com / The Major Branches Of Anthropology', '', 'LINK', 'https://www.britannica.com/science/anthropology/The-major-branches-of-anthropology');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Britannica.Com / Social And Cultural Anthropology', '', 'LINK', 'https://www.britannica.com/science/anthropology/Social-and-cultural-anthropology');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Britannica.Com / World Anthropology', '', 'LINK', 'https://www.britannica.com/science/anthropology/World-anthropology');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Mexico.Internationaltrucks.Com / Mexico.Internationaltrucks.Com', '', 'LINK', 'https://mexico.internationaltrucks.com/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Mexico.Internationaltrucks.Com / Distribuidores International', '', 'LINK', 'https://mexico.internationaltrucks.com/distribuidores-international');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Mexico.Internationaltrucks.Com / Nosotros', '', 'LINK', 'https://mexico.internationaltrucks.com/nosotros');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Mexico.Internationaltrucks.Com / Camiones De Carga', '', 'LINK', 'https://mexico.internationaltrucks.com/camiones-de-carga');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.360.Internationaltrucks.Com / Www.360.Internationaltrucks.Com', '', 'LINK', 'http://www.360.internationaltrucks.com/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Public.Com / Public.Com', '', 'LINK', 'https://public.com/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Public.Com / Public.Com', '', 'LINK', 'https://public.com/login');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Public.Com / Stocks', '', 'LINK', 'https://public.com/invest/stocks');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Public.Com / About Us', '', 'LINK', 'https://public.com/about-us');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Public.Com / High Yield Cash Account', '', 'LINK', 'https://public.com/high-yield-cash-account');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'En.M.Wikipedia.Org / Africa', '', 'LINK', 'https://en.m.wikipedia.org/wiki/Africa');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Britannica.Com / Africa', '', 'LINK', 'https://www.britannica.com/place/Africa');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Ontheworldmap.Com / Africa', '', 'LINK', 'https://ontheworldmap.com/africa/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Worldatlas.Com / Af.Htm', '', 'HTML', 'https://www.worldatlas.com/webimage/countrys/af.htm');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Bbc.Com / Africa', '', 'LINK', 'https://www.bbc.com/news/world/africa');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Merriam-Webster.Com / Dictionary', '', 'LINK', 'https://www.merriam-webster.com/dictionary/topic');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Thoughtco.Com / Different Writing Topics 1692446', '', 'LINK', 'https://www.thoughtco.com/different-writing-topics-1692446');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Thoughtco.Com / Argument Essay Topics 1856987', '', 'LINK', 'https://www.thoughtco.com/argument-essay-topics-1856987');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Collinsdictionary.Com / English', '', 'LINK', 'https://www.collinsdictionary.com/dictionary/english/topic');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Thoughtco.Com / Persuasive Essay Topics 1856978', '', 'LINK', 'https://www.thoughtco.com/persuasive-essay-topics-1856978');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Japan-Guide.Com / E623A.Html', '', 'HTML', 'https://www.japan-guide.com/e/e623a.html');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Japan-Guide.Com / E2164.Html', '', 'HTML', 'https://www.japan-guide.com/e/e2164.html');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Japan-Guide.Com / Www.Japan-Guide.Com', '', 'LINK', 'https://www.japan-guide.com/event/?aMONTH=10&aYEAR=2025');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Japan-Guide.Com / Overtourism.Html', '', 'HTML', 'https://www.japan-guide.com/news/overtourism.html');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Japan-Guide.Com / E6028.Html', '', 'HTML', 'https://www.japan-guide.com/e/e6028.html');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Merriam-Webster.Com / Dictionary', '', 'LINK', 'https://www.merriam-webster.com/dictionary/topic');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Thoughtco.Com / Different Writing Topics 1692446', '', 'LINK', 'https://www.thoughtco.com/different-writing-topics-1692446');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Thoughtco.Com / Argument Essay Topics 1856987', '', 'LINK', 'https://www.thoughtco.com/argument-essay-topics-1856987');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Collinsdictionary.Com / English', '', 'LINK', 'https://www.collinsdictionary.com/dictionary/english/topic');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Thoughtco.Com / Persuasive Essay Topics 1856978', '', 'LINK', 'https://www.thoughtco.com/persuasive-essay-topics-1856978');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Epa.Gov / Www.Epa.Gov', '', 'LINK', 'https://www.epa.gov/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Epa.Gov / Www.Epa.Gov', '', 'LINK', 'https://www.epa.gov/in');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Epa.Gov / Environmental Topics', '', 'LINK', 'https://www.epa.gov/environmental-topics');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Epa.Gov / Laws Regulations', '', 'LINK', 'https://www.epa.gov/laws-regulations');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'who.int', '', 'LINK', 'https://www.who.int/health-topics/environmental-health');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, '2020Forum.Dryfta.Com / 2020Forum.Dryfta.Com', '', 'LINK', 'https://2020forum.dryfta.com/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, '2020Forum.Dryfta.Com / Passwordreset', '', 'LINK', 'https://2020forum.dryfta.com/de/register/passwordreset');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, '2020Forum.Dryfta.Com / 2020Forum.Dryfta.Com', '', 'LINK', 'https://2020forum.dryfta.com/de/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, '2020Forum.Dryfta.Com / Session Recommendations', '', 'LINK', 'https://2020forum.dryfta.com/speakers/session-recommendations');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, '2020Forum.Dryfta.Com / 73 Information For Presenters', '', 'LINK', 'https://2020forum.dryfta.com/73-information-for-presenters');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Public.Com / Public.Com', '', 'LINK', 'https://public.com/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Public.Com / Public.Com', '', 'LINK', 'https://public.com/login');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Public.Com / Stocks', '', 'LINK', 'https://public.com/invest/stocks');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Public.Com / About Us', '', 'LINK', 'https://public.com/about-us');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Public.Com / High Yield Cash Account', '', 'LINK', 'https://public.com/high-yield-cash-account');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'English.Stackexchange.Com / What Is The Difference Between The Nouns Start And Beginning', '', 'LINK', 'https://english.stackexchange.com/questions/67484/what-is-the-difference-between-the-nouns-start-and-beginning');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'English.Stackexchange.Com / At The Beginning Or In The Beginning', '', 'LINK', 'https://english.stackexchange.com/questions/20389/at-the-beginning-or-in-the-beginning');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'English.Stackexchange.Com / At The Beginning Of The Century Or In The Beginning Of The Century', '', 'LINK', 'https://english.stackexchange.com/questions/3815/at-the-beginning-of-the-century-or-in-the-beginning-of-the-century');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'English.Stackexchange.Com / What Is The Difference Between Begin And Start', '', 'LINK', 'https://english.stackexchange.com/questions/21043/what-is-the-difference-between-begin-and-start');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'English.Stackexchange.Com / Is There A Difference In Meaning Between From The Beginning And Since Th', '', 'LINK', 'https://english.stackexchange.com/questions/26078/is-there-a-difference-in-meaning-between-from-the-beginning-and-since-the-beg');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'English.Stackexchange.Com / What Is The Difference Between The Nouns Start And Beginning', '', 'LINK', 'https://english.stackexchange.com/questions/67484/what-is-the-difference-between-the-nouns-start-and-beginning');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'English.Stackexchange.Com / At The Beginning Or In The Beginning', '', 'LINK', 'https://english.stackexchange.com/questions/20389/at-the-beginning-or-in-the-beginning');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'English.Stackexchange.Com / At The Beginning Of The Century Or In The Beginning Of The Century', '', 'LINK', 'https://english.stackexchange.com/questions/3815/at-the-beginning-of-the-century-or-in-the-beginning-of-the-century');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'English.Stackexchange.Com / What Is The Difference Between Begin And Start', '', 'LINK', 'https://english.stackexchange.com/questions/21043/what-is-the-difference-between-begin-and-start');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'English.Stackexchange.Com / Is There A Difference In Meaning Between From The Beginning And Since Th', '', 'LINK', 'https://english.stackexchange.com/questions/26078/is-there-a-difference-in-meaning-between-from-the-beginning-and-since-the-beg');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'A1Ahr0Chm6Ly9Zdxbwb3J0Lmdvb2Dszs5Jb20Vbwfpbc9Hbnn3Zxivmtcwote Agw9Zw4My289R0Vosuuuugxhdgzvcm0Lm0Rezx', '', 'LINK', 'a1aHR0cHM6Ly9zdXBwb3J0Lmdvb2dsZS5jb20vbWFpbC9hbnN3ZXIvMTcwOTE_aGw9ZW4mY289R0VOSUUuUGxhdGZvcm0lM0REZXNrdG9w');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'A1Ahr0Chm6Ly9Zdxbwb3J0Lmdvb2Dszs5Jb20Vbwfwcy9Hbnn3Zxivnjm0Nze Agw9Zw4My289R0Vosuuuugxhdgzvcm0Lm0Rezx', '', 'LINK', 'a1aHR0cHM6Ly9zdXBwb3J0Lmdvb2dsZS5jb20vbWFwcy9hbnN3ZXIvNjM0NzE_aGw9ZW4mY289R0VOSUUuUGxhdGZvcm0lM0REZXNrdG9w');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Support.Google.Com / 15984485', '', 'LINK', 'https://support.google.com/gemini/answer/15984485?hl=en&co=GENIE.Platform%3DDesktop');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'A1Ahr0Chm6Ly9Zdxbwb3J0Lmdvb2Dszs5Jb20Vcgl4Zwxwag9Uzs9Hbnn3Zxivmti1Nzeymjc Agw9Zw4', '', 'LINK', 'a1aHR0cHM6Ly9zdXBwb3J0Lmdvb2dsZS5jb20vcGl4ZWxwaG9uZS9hbnN3ZXIvMTI1NzEyMjc_aGw9ZW4');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Support.Google.Com / 7550584', '', 'LINK', 'https://support.google.com/googlenest/answer/7550584?hl=en&co=GENIE.Platform%3DAndroid');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 453061371', '', 'LINK', 'https://www.zhihu.com/question/453061371?write');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 433733185', '', 'LINK', 'https://www.zhihu.com/question/433733185');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 14711289428', '', 'LINK', 'https://www.zhihu.com/question/14711289428');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / Updated', '', 'LINK', 'https://www.zhihu.com/question/269694713/answers/updated');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 41490452', '', 'LINK', 'https://www.zhihu.com/question/41490452');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 453061371', '', 'LINK', 'https://www.zhihu.com/question/453061371?write');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 433733185', '', 'LINK', 'https://www.zhihu.com/question/433733185');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 14711289428', '', 'LINK', 'https://www.zhihu.com/question/14711289428');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / Updated', '', 'LINK', 'https://www.zhihu.com/question/269694713/answers/updated');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 41490452', '', 'LINK', 'https://www.zhihu.com/question/41490452');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Cre8Pharmacy.Com / Www.Cre8Pharmacy.Com', '', 'LINK', 'https://www.cre8pharmacy.com/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Cre8Pharmacy.Com / About', '', 'LINK', 'https://www.cre8pharmacy.com/about/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Cre8Pharmacy.Com / Contact', '', 'LINK', 'https://www.cre8pharmacy.com/contact/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Cre8Pharmacy.Com / Supplements', '', 'LINK', 'https://www.cre8pharmacy.com/supplements/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Cre8Pharmacy.Com / New Account', '', 'LINK', 'https://www.cre8pharmacy.com/new-account/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 10939528478', '', 'LINK', 'https://www.zhihu.com/question/10939528478');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 325431300', '', 'LINK', 'https://www.zhihu.com/question/325431300');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 296986437', '', 'LINK', 'https://www.zhihu.com/question/296986437');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 438988585', '', 'LINK', 'https://www.zhihu.com/question/438988585');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 612505124', '', 'LINK', 'https://www.zhihu.com/question/612505124');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 10939528478', '', 'LINK', 'https://www.zhihu.com/question/10939528478');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 325431300', '', 'LINK', 'https://www.zhihu.com/question/325431300');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 296986437', '', 'LINK', 'https://www.zhihu.com/question/296986437');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 438988585', '', 'LINK', 'https://www.zhihu.com/question/438988585');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 612505124', '', 'LINK', 'https://www.zhihu.com/question/612505124');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Merriam-Webster.Com / Fundamental', '', 'LINK', 'https://www.merriam-webster.com/dictionary/fundamental');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Dictionary.Cambridge.Org / Fundamentals', '', 'LINK', 'https://dictionary.cambridge.org/dictionary/english/fundamentals');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Investopedia.Com / Fundamentals.Asp', '', 'LINK', 'https://www.investopedia.com/terms/f/fundamentals.asp');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Dictionary.Com / Fundamental', '', 'LINK', 'https://www.dictionary.com/browse/fundamental');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'En.Wikipedia.Org / Fundamental', '', 'LINK', 'https://en.wikipedia.org/wiki/Fundamental');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Merriam-Webster.Com / Dictionary', '', 'LINK', 'https://www.merriam-webster.com/dictionary/the');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Thefreedictionary.Com / Www.Thefreedictionary.Com', '', 'LINK', 'https://www.thefreedictionary.com/the');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Dictionary.Cambridge.Org / English', '', 'LINK', 'https://dictionary.cambridge.org/dictionary/english/the');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Learnenglish.Britishcouncil.Org / Definite Article', '', 'LINK', 'https://learnenglish.britishcouncil.org/grammar/english-grammar-reference/definite-article');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'En.M.Wiktionary.Org / Wiki', '', 'LINK', 'https://en.m.wiktionary.org/wiki/the');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Ibm.Com / Digital Transformation', '', 'LINK', 'https://www.ibm.com/think/topics/digital-transformation');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Ibm.Com / Digital Transformation', '', 'LINK', 'https://www.ibm.com/br-pt/think/topics/digital-transformation');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Ibm.Com / Digital Forensics', '', 'LINK', 'https://www.ibm.com/think/topics/digital-forensics');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Ibm.Com / Digital Transformation', '', 'LINK', 'https://www.ibm.com/es-es/think/topics/digital-transformation');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Ibm.Com / Digital Twin', '', 'LINK', 'https://www.ibm.com/think/topics/digital-twin');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 483747578', '', 'LINK', 'https://www.zhihu.com/question/483747578');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 49355121', '', 'LINK', 'https://www.zhihu.com/question/49355121?sort=created');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 531184822', '', 'LINK', 'https://www.zhihu.com/question/531184822');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 551747204', '', 'LINK', 'https://www.zhihu.com/question/551747204');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'English.Stackexchange.Com / Difference Between Introduction To And Introduction Of', '', 'LINK', 'https://english.stackexchange.com/questions/26508/difference-between-introduction-to-and-introduction-of');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 483747578', '', 'LINK', 'https://www.zhihu.com/question/483747578');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 49355121', '', 'LINK', 'https://www.zhihu.com/question/49355121?sort=created');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 531184822', '', 'LINK', 'https://www.zhihu.com/question/531184822');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 551747204', '', 'LINK', 'https://www.zhihu.com/question/551747204');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'English.Stackexchange.Com / Difference Between Introduction To And Introduction Of', '', 'LINK', 'https://english.stackexchange.com/questions/26508/difference-between-introduction-to-and-introduction-of');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 483747578', '', 'LINK', 'https://www.zhihu.com/question/483747578');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 49355121', '', 'LINK', 'https://www.zhihu.com/question/49355121?sort=created');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 531184822', '', 'LINK', 'https://www.zhihu.com/question/531184822');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 551747204', '', 'LINK', 'https://www.zhihu.com/question/551747204');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'English.Stackexchange.Com / Difference Between Introduction To And Introduction Of', '', 'LINK', 'https://english.stackexchange.com/questions/26508/difference-between-introduction-to-and-introduction-of');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'sketch.io', '', 'LINK', 'https://sketch.io/sketchpad/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'sketch.io', '', 'LINK', 'https://sketch.io/sketchpad-v5.1/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'sketch.io', '', 'LINK', 'https://sketch.io/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'sketch.io', '', 'LINK', 'https://sketch.io/mobile/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'sketch.io', '', 'LINK', 'https://sketch.io/sketchpad-v4/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 483747578', '', 'LINK', 'https://www.zhihu.com/question/483747578');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 49355121', '', 'LINK', 'https://www.zhihu.com/question/49355121?sort=created');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 531184822', '', 'LINK', 'https://www.zhihu.com/question/531184822');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 551747204', '', 'LINK', 'https://www.zhihu.com/question/551747204');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'English.Stackexchange.Com / Difference Between Introduction To And Introduction Of', '', 'LINK', 'https://english.stackexchange.com/questions/26508/difference-between-introduction-to-and-introduction-of');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Dictionary.Cambridge.Org / Photography', '', 'LINK', 'https://dictionary.cambridge.org/zhs/%E8%AF%8D%E5%85%B8/%E8%8B%B1%E8%AF%AD-%E6%B1%89%E8%AF%AD-%E7%AE%80%E4%BD%93/photography');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Dictionary.Cambridge.Org / Photography', '', 'LINK', 'https://dictionary.cambridge.org/zht/%E8%A9%9E%E5%85%B8/%E8%8B%B1%E8%AA%9E-%E6%BC%A2%E8%AA%9E-%E7%B9%81%E9%AB%94/photography');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Photo.Net / Www.Photo.Net', '', 'LINK', 'https://www.photo.net/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Dictionary.Cambridge.Org / Photography', '', 'LINK', 'https://dictionary.cambridge.org/vi/dictionary/english/photography');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Photo.Net / Forums/Forum/1 General Photography Discussion', '', 'LINK', 'https://www.photo.net/forums/forum/1-general-photography-discussion/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 483747578', '', 'LINK', 'https://www.zhihu.com/question/483747578');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 49355121', '', 'LINK', 'https://www.zhihu.com/question/49355121?sort=created');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 531184822', '', 'LINK', 'https://www.zhihu.com/question/531184822');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 551747204', '', 'LINK', 'https://www.zhihu.com/question/551747204');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'English.Stackexchange.Com / Difference Between Introduction To And Introduction Of', '', 'LINK', 'https://english.stackexchange.com/questions/26508/difference-between-introduction-to-and-introduction-of');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 483747578', '', 'LINK', 'https://www.zhihu.com/question/483747578');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 49355121', '', 'LINK', 'https://www.zhihu.com/question/49355121?sort=created');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 531184822', '', 'LINK', 'https://www.zhihu.com/question/531184822');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 551747204', '', 'LINK', 'https://www.zhihu.com/question/551747204');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'English.Stackexchange.Com / Difference Between Introduction To And Introduction Of', '', 'LINK', 'https://english.stackexchange.com/questions/26508/difference-between-introduction-to-and-introduction-of');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'En.Wikipedia.Org / Sculpture', '', 'LINK', 'https://en.wikipedia.org/wiki/Sculpture');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Britannica.Com / Sculpture', '', 'LINK', 'https://www.britannica.com/art/sculpture');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Nga.Gov / Explore Basics Sculpture', '', 'LINK', 'https://www.nga.gov/educational-resources/explore-basics-sculpture');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Artlex.Com / Sculptures/Famous Sculptures', '', 'LINK', 'https://www.artlex.com/sculptures/famous-sculptures/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Jerwoodvisualarts.Org / Art Techniques And Materials Glossary/Sculpture', '', 'LINK', 'https://jerwoodvisualarts.org/art-techniques-and-materials-glossary/sculpture/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'En.Wikipedia.Org / Sculpture', '', 'LINK', 'https://en.wikipedia.org/wiki/Sculpture');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Britannica.Com / Sculpture', '', 'LINK', 'https://www.britannica.com/art/sculpture');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Nga.Gov / Explore Basics Sculpture', '', 'LINK', 'https://www.nga.gov/educational-resources/explore-basics-sculpture');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Artlex.Com / Sculptures/Famous Sculptures', '', 'LINK', 'https://www.artlex.com/sculptures/famous-sculptures/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Jerwoodvisualarts.Org / Art Techniques And Materials Glossary/Sculpture', '', 'LINK', 'https://jerwoodvisualarts.org/art-techniques-and-materials-glossary/sculpture/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Merriam-Webster.Com / Dictionary', '', 'LINK', 'https://www.merriam-webster.com/dictionary/topic');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Thoughtco.Com / Different Writing Topics 1692446', '', 'LINK', 'https://www.thoughtco.com/different-writing-topics-1692446');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Thoughtco.Com / Argument Essay Topics 1856987', '', 'LINK', 'https://www.thoughtco.com/argument-essay-topics-1856987');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Collinsdictionary.Com / English', '', 'LINK', 'https://www.collinsdictionary.com/dictionary/english/topic');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Thoughtco.Com / Persuasive Essay Topics 1856978', '', 'LINK', 'https://www.thoughtco.com/persuasive-essay-topics-1856978');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Merriam-Webster.Com / Exploring', '', 'LINK', 'https://www.merriam-webster.com/dictionary/exploring');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Dictionary.Cambridge.Org / Exploring', '', 'LINK', 'https://dictionary.cambridge.org/us/dictionary/english/exploring');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Exploring.Org / Www.Exploring.Org', '', 'LINK', 'https://www.exploring.org/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Collinsdictionary.Com / Exploring', '', 'LINK', 'https://www.collinsdictionary.com/us/dictionary/english/exploring');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Thefreedictionary.Com / Exploring', '', 'LINK', 'https://www.thefreedictionary.com/exploring');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 453061371', '', 'LINK', 'https://www.zhihu.com/question/453061371?write');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 433733185', '', 'LINK', 'https://www.zhihu.com/question/433733185');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 14711289428', '', 'LINK', 'https://www.zhihu.com/question/14711289428');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / Updated', '', 'LINK', 'https://www.zhihu.com/question/269694713/answers/updated');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 41490452', '', 'LINK', 'https://www.zhihu.com/question/41490452');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Merriam-Webster.Com / Dictionary', '', 'LINK', 'https://www.merriam-webster.com/dictionary/the');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Thefreedictionary.Com / Www.Thefreedictionary.Com', '', 'LINK', 'https://www.thefreedictionary.com/the');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Dictionary.Cambridge.Org / English', '', 'LINK', 'https://dictionary.cambridge.org/dictionary/english/the');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Learnenglish.Britishcouncil.Org / Definite Article', '', 'LINK', 'https://learnenglish.britishcouncil.org/grammar/english-grammar-reference/definite-article');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'En.M.Wiktionary.Org / Wiki', '', 'LINK', 'https://en.m.wiktionary.org/wiki/the');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Reddit.Com / R/Whatsthatbook', '', 'LINK', 'https://www.reddit.com/r/whatsthatbook/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Reddit.Com / R/Books', '', 'LINK', 'https://www.reddit.com/r/books/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Reddit.Com / R/Sportsbook', '', 'LINK', 'https://www.reddit.com/r/sportsbook/?feedViewType=classicView');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Reddit.Com / R/Minecraft/Comments/10Aq58P/Is There Any Way To Transfer Enchantments From', '', 'LINK', 'https://www.reddit.com/r/Minecraft/comments/10aq58p/is_there_any_way_to_transfer_enchantments_from/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Reddit.Com / R/Piracy/Comments/14Otpui/Where Do You People Find Ebooks There Days', '', 'LINK', 'https://www.reddit.com/r/Piracy/comments/14otpui/where_do_you_people_find_ebooks_there_days/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Merriam-Webster.Com / Experimental', '', 'LINK', 'https://www.merriam-webster.com/dictionary/experimental');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Dictionary.Cambridge.Org / Experimental', '', 'LINK', 'https://dictionary.cambridge.org/us/dictionary/english/experimental');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'En.Wikipedia.Org / Experiment', '', 'LINK', 'https://en.wikipedia.org/wiki/Experiment');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Collinsdictionary.Com / Experimental', '', 'LINK', 'https://www.collinsdictionary.com/dictionary/english/experimental');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Oxfordlearnersdictionaries.Com / Experimental', '', 'LINK', 'https://www.oxfordlearnersdictionaries.com/definition/english/experimental');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Healthline.Com / Hiv Aids', '', 'LINK', 'https://www.healthline.com/health/hiv-aids');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Medlineplus.Gov / Hiv.Html', '', 'HTML', 'https://medlineplus.gov/hiv.html');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'who.int', '', 'LINK', 'https://www.who.int/news-room/questions-and-answers/item/HIV-AIDS');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Hiv.Gov / Www.Hiv.Gov', '', 'LINK', 'https://www.hiv.gov/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Cdc.Gov / Index.Html', '', 'HTML', 'https://www.cdc.gov/hiv/index.html');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Ibm.Com / Digital Transformation', '', 'LINK', 'https://www.ibm.com/think/topics/digital-transformation');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Ibm.Com / Digital Transformation', '', 'LINK', 'https://www.ibm.com/br-pt/think/topics/digital-transformation');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Ibm.Com / Digital Forensics', '', 'LINK', 'https://www.ibm.com/think/topics/digital-forensics');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Ibm.Com / Digital Transformation', '', 'LINK', 'https://www.ibm.com/es-es/think/topics/digital-transformation');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Ibm.Com / Digital Twin', '', 'LINK', 'https://www.ibm.com/think/topics/digital-twin');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Merriam-Webster.Com / Experimental', '', 'LINK', 'https://www.merriam-webster.com/dictionary/experimental');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Dictionary.Cambridge.Org / Experimental', '', 'LINK', 'https://dictionary.cambridge.org/us/dictionary/english/experimental');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'En.Wikipedia.Org / Experiment', '', 'LINK', 'https://en.wikipedia.org/wiki/Experiment');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Collinsdictionary.Com / Experimental', '', 'LINK', 'https://www.collinsdictionary.com/dictionary/english/experimental');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Oxfordlearnersdictionaries.Com / Experimental', '', 'LINK', 'https://www.oxfordlearnersdictionaries.com/definition/english/experimental');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Forums.Autodesk.Com / Autocad En', '', 'LINK', 'https://forums.autodesk.com/t5/autocad-forums/ct-p/autocad-en');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Forums.Autodesk.Com / Autocad Forum Es', '', 'LINK', 'https://forums.autodesk.com/t5/autocad-todos-los-productos-foro/bd-p/autocad-forum-es');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Forums.Autodesk.Com / 10178655', '', 'LINK', 'https://forums.autodesk.com/t5/installation-licensing-forum/2022-products-direct-download-links/td-p/10178655');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Forums.Autodesk.Com / 13389658', '', 'LINK', 'https://forums.autodesk.com/t5/installation-licensing-forum/2026-product-download-links/td-p/13389658');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Forums.Autodesk.Com / Autocad Forum Ja', '', 'LINK', 'https://forums.autodesk.com/t5/autocad-ri-ben-yuforamu/bd-p/autocad-forum-ja');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Internships.Com / Lit 39571917781', '', 'LINK', 'https://www.internships.com/posting/lit_39571917781');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Skills.Internships.Com / Skills.Internships.Com', '', 'LINK', 'https://skills.internships.com/?view=experience_table');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 20495911', '', 'LINK', 'https://www.zhihu.com/question/20495911');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 645075676', '', 'LINK', 'https://www.zhihu.com/question/645075676?write');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 1916115206569960157', '', 'LINK', 'https://www.zhihu.com/question/1916115206569960157');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / 19871938', '', 'LINK', 'https://www.zhihu.com/question/19871938');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Zhihu.Com / Updated', '', 'LINK', 'https://www.zhihu.com/question/48504205/answers/updated');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Shop.Advanceautoparts.Com / Shop.Advanceautoparts.Com', '', 'LINK', 'https://shop.advanceautoparts.com/?msockid=30f6a7f8807763a61a21b164818a62d1');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Shop.Advanceautoparts.Com / All Makes', '', 'LINK', 'https://shop.advanceautoparts.com/find/all-makes?msockid=30f6a7f8807763a61a21b164818a62d1');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Shop.Advanceautoparts.Com / 81542', '', 'LINK', 'https://shop.advanceautoparts.com/c1/engine/81542?msockid=30f6a7f8807763a61a21b164818a62d1');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'A1Ahr0Chm6Ly9Zag9Wlmfkdmfuy2Vhdxrvcgfydhmuy29Tl2Jyyw5Kcy9Hzhzhbmnllwf1Dg8Tcgfydhm Bxnvy2Tpzd0Zmgy2Yt', '', 'LINK', 'a1aHR0cHM6Ly9zaG9wLmFkdmFuY2VhdXRvcGFydHMuY29tL2JyYW5kcy9hZHZhbmNlLWF1dG8tcGFydHM_bXNvY2tpZD0zMGY2YTdmODgwNzc2M2E2MWEyMWIxNjQ4MThhNjJkMQ');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'A1Ahr0Chm6Ly9Zag9Wlmfkdmfuy2Vhdxrvcgfydhmuy29Tl2M0L2Jhdhrlcnkvmtm2Ndy Bxnvy2Tpzd0Zmgy2Ytdmodgwnzc2M2', '', 'LINK', 'a1aHR0cHM6Ly9zaG9wLmFkdmFuY2VhdXRvcGFydHMuY29tL2M0L2JhdHRlcnkvMTM2NDY_bXNvY2tpZD0zMGY2YTdmODgwNzc2M2E2MWEyMWIxNjQ4MThhNjJkMQ');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'independent.co.uk', '', 'LINK', 'https://www.independent.co.uk/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'En.M.Wikipedia.Org / The Independent', '', 'LINK', 'https://en.m.wikipedia.org/wiki/The_Independent');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'independent.co.uk', '', 'LINK', 'https://www.independent.co.uk/us');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'independent.co.uk', '', 'LINK', 'https://www.independent.co.uk/news/uk');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Www.Merriam-Webster.Com / Independent', '', 'LINK', 'https://www.merriam-webster.com/dictionary/independent');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'google.com.ar', '', 'HTML', 'https://www.google.com.ar/index.html');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'google.com.ar', '', 'LINK', 'https://translate.google.com.ar/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'google.com.ar', '', 'LINK', 'https://www.google.com.ar/videohp');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'google.com.ar', '', 'LINK', 'https://www.google.com.ar/intl/es/maps/about/');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'google.com.ar', '', 'LINK', 'https://www.google.com.ar/alerts');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Shop.Advanceautoparts.Com / Shop.Advanceautoparts.Com', '', 'LINK', 'https://shop.advanceautoparts.com/?msockid=2980831a16046a3f2c0b958617396bb5');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Shop.Advanceautoparts.Com / All Makes', '', 'LINK', 'https://shop.advanceautoparts.com/find/all-makes?msockid=2980831a16046a3f2c0b958617396bb5');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'Shop.Advanceautoparts.Com / 81542', '', 'LINK', 'https://shop.advanceautoparts.com/c1/engine/81542?msockid=2980831a16046a3f2c0b958617396bb5');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'A1Ahr0Chm6Ly9Zag9Wlmfkdmfuy2Vhdxrvcgfydhmuy29Tl2Jyyw5Kcy9Hzhzhbmnllwf1Dg8Tcgfydhm Bxnvy2Tpzd0Yotgwod', '', 'LINK', 'a1aHR0cHM6Ly9zaG9wLmFkdmFuY2VhdXRvcGFydHMuY29tL2JyYW5kcy9hZHZhbmNlLWF1dG8tcGFydHM_bXNvY2tpZD0yOTgwODMxYTE2MDQ2YTNmMmMwYjk1ODYxNzM5NmJiNQ');
INSERT INTO Resource (uploader_id, title, description, filetype, source) VALUES (@uploader_id, 'A1Ahr0Chm6Ly9Zag9Wlmfkdmfuy2Vhdxrvcgfydhmuy29Tl2M0L2Jhdhrlcnkvmtm2Ndy Bxnvy2Tpzd0Yotgwodmxyte2Mdq2Yt', '', 'LINK', 'a1aHR0cHM6Ly9zaG9wLmFkdmFuY2VhdXRvcGFydHMuY29tL2M0L2JhdHRlcnkvMTM2NDY_bXNvY2tpZD0yOTgwODMxYTE2MDQ2YTNmMmMwYjk1ODYxNzM5NmJiNQ');

COMMIT;


