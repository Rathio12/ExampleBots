"""Logging configuration.

In production (ENVIRONMENT=production) every line is a JSON object, which log
tools (Loki, Datadog, CloudWatch…) can parse. Otherwise discord.py's coloured
formatter is used for readable local output.
"""
import json
import logging

import discord


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "time": self.formatTime(record, "%Y-%m-%dT%H:%M:%S%z"),
            "level": record.levelname.lower(),
            "logger": record.name,
            "message": record.getMessage(),
        }
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload)


def setup_logging(level: str, json_logs: bool) -> None:
    handler = logging.StreamHandler()
    if json_logs:
        handler.setFormatter(JsonFormatter())
    else:
        # Reuse discord.py's nice coloured formatter.
        discord.utils.setup_logging(handler=handler, level=getattr(logging, level, logging.INFO), root=True)
        return

    root = logging.getLogger()
    root.setLevel(getattr(logging, level, logging.INFO))
    root.addHandler(handler)
