import sys
from pathlib import Path
from typing import List, Tuple, Optional
import requests
from bs4 import BeautifulSoup
import pandas as pd

"""@Author: Vivek
Scraper for extracting quiz questions and options from GeeksforGeeks."""

URLS: List[str] = [
    "https://www.geeksforgeeks.org/quizzes/sql-basics-quiz-questions",
]

OUTPUT_CSV = Path("data\Raw_data\quiz_data.csv")
REQUEST_TIMEOUT = 15
HEADERS = {
    "User-Agent": "StudyBuddyScraper/1.0 (+https://example.com)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def fetch_html(url: str) -> Optional[str]:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        return resp.text
    except requests.RequestException as exc:
        print(f"[error] GET {url} failed: {exc}")
        return None


def parse_quiz(html: str) -> Tuple[List[str], List[List[str]]]:
    soup = BeautifulSoup(html, "html.parser")

    cards = soup.find_all("div", class_="QuizQuestionCard_quizCard__9T_0J")
    questions: List[str] = []
    options_all: List[List[str]] = []

    for card in cards:
        q_el = card.find(
            "div",
            class_="QuizQuestionCard_quizCard__quizQuestionTextContainer__question__tv5de",
        )
        if not q_el:
            continue
        question = q_el.get_text(strip=True)

        option_items = card.find_all(
            "div",
            class_="QuizQuestionCard_quizCard__optionsList__optionItem__optionLabel__ZJEuI",
        )
        options = [item.get_text(strip=True) for item in option_items]

        if question and options:
            questions.append(question)
            options_all.append(options)

    return questions, options_all


def to_dataframe(questions: List[str], options: List[List[str]]) -> pd.DataFrame:
    return pd.DataFrame({"Question": questions, "Options": options})


def main() -> int:
    all_questions: List[str] = []
    all_options: List[List[str]] = []

    for url in URLS:
        html = fetch_html(url)
        if not html:
            continue
        q, opts = parse_quiz(html)
        all_questions.extend(q)
        all_options.extend(opts)

    df = to_dataframe(all_questions, all_options)
    print(df)

    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_CSV, index=False)
    print(f"[ok] Wrote {len(df)} rows to {OUTPUT_CSV}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())