"""SQLite-backed project state persistence for AIPLC.

Single-project key-value store. All canvas, editor, and I/O mapping state
is written here so it survives server restarts.
"""

import json
import os
import sqlite3
import threading
from pathlib import Path

DB_PATH = Path(os.environ.get("AIPLC_DATA_DIR", "./data")) / "aiplc.db"


class ProjectStore:
    """Thread-safe SQLite key-value store."""

    def __init__(self):
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()
        self.conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
        self._init_tables()

    def _init_tables(self):
        self.conn.executescript("""
            CREATE TABLE IF NOT EXISTS project_state (
                key   TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        self.conn.commit()

    def get(self, key: str, default=None):
        """Return the deserialised value for *key*, or *default*."""
        with self._lock:
            row = self.conn.execute(
                "SELECT value FROM project_state WHERE key=?", (key,)
            ).fetchone()
        if row:
            return json.loads(row[0])
        return default

    def set(self, key: str, value):
        """Persist *value* (JSON-serialisable) under *key*."""
        with self._lock:
            self.conn.execute(
                "INSERT OR REPLACE INTO project_state (key, value, updated_at) "
                "VALUES (?, ?, CURRENT_TIMESTAMP)",
                (key, json.dumps(value, ensure_ascii=False)),
            )
            self.conn.commit()


# Module-level singleton
store = ProjectStore()
