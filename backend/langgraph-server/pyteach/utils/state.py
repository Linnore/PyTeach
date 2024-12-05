from langgraph.graph import add_messages
from langchain_core.messages import BaseMessage
from typing import TypedDict, Annotated, Sequence

# class GlobalState(TypedDict):
#     messages: Annotated[Sequence[BaseMessage], add_messages]


class GlobalInputState(TypedDict):
    user_input: str
    task_type: str


class GlobalOutputState(TypedDict):
    output_message: BaseMessage


class InputGuardState(TypedDict):
    # Shared states
    user_input: str
    task_type: str

    # Private states
    guard_judgement: str
    judgement_category: str
    interrupt: bool


class TeacherState(TypedDict):
    # Shared states
    user_input: str
    task_type: str

    # Private states
    messages: Annotated[Sequence[BaseMessage], add_messages]
    output_message: BaseMessage
    ltm: str  # long time memory as summary
    stm_pointer: str  # shot time memory pointer


class OutputGuardState(TypedDict):
    output_message: BaseMessage
    guard_judgement: str
    judgement_category: str
