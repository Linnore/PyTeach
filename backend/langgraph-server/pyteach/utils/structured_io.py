from pydantic import BaseModel, Field
from typing import Literal


class provideTaskDetection(BaseModel):
    task_type: Literal[
        "unknown", "explain all materials", "simple explain",
        "comment codes", "debug all codes", "simple debug"] = Field(
            description="Does the user request a specific task?",
            default="unknown")  # noqa


detectionToTaskType = {
    "unknown": "default_task",
    "explain all materials": "explain",
    "simple explain": "default_task",
    "comment codes": "comment",
    "debug all codes": "debug",
    "simple debug": "default_task"
}
