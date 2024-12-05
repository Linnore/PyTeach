import os
import sqlite3

# import aiosqlite
# from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

from typing import Any
from langgraph.checkpoint.sqlite import SqliteSaver


from pyteach.utils import get_logger

logger = get_logger()


def get_db_path(db):
    pyteach_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    memory_dir = os.path.join(pyteach_dir, "memory")

    if not os.path.exists(memory_dir):
        os.makedirs(memory_dir)
    db_path = os.path.join(memory_dir, db)
    return db_path


def get_sql_checkpointer(db: str = "checkpoints.sqlite"):
    db_path = get_db_path(db)
    conn = sqlite3.connect(db_path, check_same_thread=False)
    memory_checkpointer = SqliteSaver(conn)
    # conn = aiosqlite.connect(db_path)
    # memory_checkpointer = AsyncSqliteSaver(conn)
    return memory_checkpointer


def clean_memory_by_thread(thread_id: Any, db: str = "checkpoints.sqlite"):
    try:
        db_path = get_db_path(db)
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Delete from both checkpoints and checkpoint_writes tables
        cursor.execute(
            "DELETE FROM checkpoints WHERE thread_id = ?", (thread_id,))
        cursor.execute("DELETE FROM writes WHERE thread_id = ?", (thread_id,))

        conn.commit()
        cursor.close()
        conn.close()
        logger.debug(f"Memory for thread {thread_id} deleted successfully.")

    except Exception as e:
        logger.error(
            f"Error deleting Memory for thread {thread_id}: {e}")


def get_existing_memory_thread_ids(db: str = "checkpoints.sqlite"):
    """Fetch thread IDs that have associated messages from the database."""
    try:
        db_path = get_db_path(db)
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Retrieve distinct thread IDs from the 'checkpoints' table
        cursor.execute("SELECT DISTINCT thread_id FROM checkpoints;")
        rows = cursor.fetchall()

        # Extract thread IDs into a list
        # Assuming thread_id is the first column
        thread_ids = [row[0] for row in rows]
        cursor.close()
        conn.close()

        logger.debug(f"Existing thread_ids: {thread_ids}")
        return thread_ids

    except Exception as e:
        logger.error(f"Error fetching thread IDs: {e}")
        return e
