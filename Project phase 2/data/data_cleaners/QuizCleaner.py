import pandas as pd
# This program creates two separate data frames, storing a quiz's questions, and their respective answers in proper format.
# Program by Rise Akizaki

# absolute filepath 
file_path = r"C:\Users\Work\Documents\GitHub\Study_Buddy_hub\Project phase 2\data\raw_data\quiz_data.csv"
df = pd.read_csv(file_path)

file_height = len(df)

# for Questions
qdf = pd.DataFrame(columns=['question_id', 'quiz_id', 'question_text', 'question_type', 'points'])
adf = pd.DataFrame(columns=['answer_id', 'question_id', 'answer_text', 'is_correct'])

def CleanQuestionData():
    for i in range(file_height):
        qdf.loc[i] = [i, 0, df.loc[i, 'Question'], "multiple_choice", 1]
    print("Finished cleaning questions data")

# Note: It isn't possible to create an automatic algorithm to detect whether an answer is correct without using some kind of AI.
# Because of that, "is_correct" field should be changed manually. By default, all will be 0 (ie, false)
def CleanAnswerData():
    globalAnswerIndex = 0

    for i in range(file_height):
        for var in (CleanAnswer(df.loc[i, 'Options'])):
            adf.loc[globalAnswerIndex] = [globalAnswerIndex, i, var, 0]
            globalAnswerIndex += 1
    print("Finished cleaning answers data")

def CleanAnswer(answer):
    answers = []
    answerCharacters = []
    answerApoCounter = 0 # Keeps track of the apostrophes
    for i in range(len(answer)):
        if (answer[i] == '['):
            continue
        elif (answer[i] == "'"): 
            answerApoCounter += 1

            if (answerApoCounter >= 2): # The second apostrophe means that the whole answer has been stored already
                answerApoCounter = 0
                answers.append("".join(answerCharacters)) # Joins together all the answer characters
                answerCharacters.clear()
        else:
            if (answer[i] != ","):
                answerCharacters.append(answer[i])

    return answers        

CleanQuestionData()
questionsOutputPath = "quiz_questions_clean.csv"
qdf.to_csv(questionsOutputPath, index = False)

CleanAnswerData()
answersOutputPath = "quiz_answers_clean.csv"
adf.to_csv(answersOutputPath, index = False)
