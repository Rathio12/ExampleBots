"""A small built-in question bank. `correct` is the index of the right answer.

Want more? Load questions from a JSON file or the free Open Trivia DB API.
"""

TRIVIA_QUESTIONS = [
    {"question": "What year was Discord launched?", "answers": ["2013", "2015", "2017", "2019"], "correct": 1},
    {"question": "Which library is used by this Python bot?", "answers": ["discord.js", "discord.py", "JDA", "Discord.Net"], "correct": 1},
    {"question": "What is the maximum length of a slash command name?", "answers": ["16", "32", "64", "100"], "correct": 1},
    {"question": "How many buttons fit in one action row?", "answers": ["3", "4", "5", "10"], "correct": 2},
    {"question": "Which planet is known as the Red Planet?", "answers": ["Venus", "Mars", "Jupiter", "Mercury"], "correct": 1},
    {"question": "What does HTTP status 429 mean?", "answers": ["Not Found", "Unauthorized", "Too Many Requests", "Server Error"], "correct": 2},
    {"question": "How many seconds does a bot have to respond to an interaction?", "answers": ["1", "3", "10", "15"], "correct": 1},
]
