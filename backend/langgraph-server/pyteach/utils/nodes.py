import os

from typing import Literal

from ollama import Client

from langchain_ollama import ChatOllama
from langchain_core.runnables import RunnableConfig
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.errors import NodeInterrupt

from pyteach.utils import get_logger
from pyteach.utils.prebuilt import ToolNode
from pyteach.utils.tools import (tools, get_what_user_is_reading,
                                 get_user_codes, write_codes_to_new_cell)
from pyteach.utils.structured_io import (provideTaskDetection,
                                         detectionToTaskType)
from pyteach.utils.state import (InputGuardState, GlobalOutputState,
                                 TeacherState, OutputGuardState)
from pyteach.utils.prompts import (pyteach_sys_prompt,
                                   get_guard_interruption_prompt,
                                   filter_unsafe_judgement, get_ltm_prompt,
                                   ltm_sys_prompt, explain_sys_prompt,
                                   comment_sys_prompt, teach_sys_prompt, detect_sys_prompt, debug_sys_prompt)

# TODO: Configurable through .env
OLLAMA_BASE = os.getenv("OLLAMA_BASE", "http://localhost:11434")

# STM_INTERVAL = (1, 3)
STM_INTERVAL = (4, 12)

logger = get_logger()

# ======================================================================================
# =================================== Common ===========================================
# ======================================================================================
# Use this to create different agents (e.g. guard, main-llm)
modelfile_template = """
FROM {model}

PARAMETER temperature {temperature}
PARAMETER seed 118010142
PARAMETER num_ctx {num_ctx}

SYSTEM \"""{system_prompt}\"""
"""


def create_agent(agent_name,
                 system_prompt,
                 ollama_base=OLLAMA_BASE,
                 num_ctx=10240,
                 model="qwen2.5"):
    modelfile = modelfile_template.format(model=model,
                                          temperature=0,
                                          num_ctx=num_ctx,
                                          system_prompt=system_prompt)
    if agent_name == "PyTeach-Teach":
        modelfile = modelfile_template.format(model=model,
                                          temperature=0.5,
                                          num_ctx=num_ctx,
                                          system_prompt=system_prompt)
    logger.debug(f"Creating agent {agent_name}:\n {modelfile}")
    client = Client(ollama_base)
    client.create(model=agent_name, modelfile=modelfile)


def get_model(agent_name: str, base_url: str = OLLAMA_BASE):
    return ChatOllama(model=agent_name, base_url=base_url)


# ======================================================================================
# =================================== InputGuard =======================================
# ======================================================================================
def init_input_guard(state: InputGuardState,
                     config: RunnableConfig) -> InputGuardState:
    create_agent(agent_name="input_guard",
                 system_prompt="",
                 model="llama-guard3:1b")


def input_guard_judgement(state: InputGuardState,
                          config: RunnableConfig) -> InputGuardState:
    guard = get_model("input_guard")
    input_msg = [HumanMessage(state["user_input"])]
    response = guard.invoke(input_msg)
    update = {}
    update["guard_judgement"] = response.content.split('\n')[0]
    if update["guard_judgement"] == "unsafe":
        update["judgement_category"] = response.content.split('\n')[1]
    elif update["guard_judgement"] == "safe":
        update["judgement_category"] = ""
    else:
        logger.debug("Unkonw Guard Judgement!")
        raise Exception("Unkonw Guard Judgement!")
    logger.debug(f"Input guard judgement: {update['guard_judgement']}")
    return update


def input_guard_router(state: InputGuardState, config: RunnableConfig):
    return state["guard_judgement"]


def input_interruption_handler(state: InputGuardState,
                               config: RunnableConfig) -> InputGuardState:
    judgement_category = state["judgement_category"]
    interruption_prompt = get_guard_interruption_prompt(
        judgement_category, "input")
    logger.debug("Interruption: Received unsafe input!")
    raise NodeInterrupt(AIMessage(interruption_prompt))


def input_guard_to_teacher(state: InputGuardState,
                           config: RunnableConfig) -> TeacherState:
    return


# ======================================================================================
# =================================== Teacher ==========================================
# ======================================================================================
def init_teacher(state: TeacherState, config: RunnableConfig) -> TeacherState:
    logger.debug(f"init_teach received: {state}")
    task_type = state.get("task_type")

    # Task detection
    if state.get("task_type") == "default_task" and state["user_input"]:
        task_type = task_detection(state["user_input"])

    # Init pre-defined routines for specific tasks
    if task_type == "explain":
        create_agent("PyTeach-Explain", explain_sys_prompt)
        user_input_msg = HumanMessage(
            "Please retrieve and explain the content in the jupyter notebook to me."
            )
    elif task_type == "comment":
        create_agent("PyTeach-Comment", comment_sys_prompt)
        user_input_msg = HumanMessage(
                "Please retrieve and comment the codes.")
    elif task_type == "debug":
        # TODO
        create_agent("Pyteach-Debug", debug_sys_prompt)
        user_input_msg = HumanMessage(
            "Please retrieve and debug the codes.")
    elif task_type == "teach":
        # TODO
        create_agent("PyTeach-Teach", teach_sys_prompt)
        user_input_msg = HumanMessage(state["user_input"])
    elif task_type == "default_task":
        user_input_msg = HumanMessage(state["user_input"])
    else:
        raise Exception("Unknown task_type!")

    create_agent("PyTeach", pyteach_sys_prompt)
    # append the user input to the messages list

    ltm = state.get("ltm", "")
    stm_pointer = int(state.get("stm_pointer", 0))
    crt_messages = state.get("messages", [])
    crt_stm_messages = crt_messages[stm_pointer:]

    # Memory maintenance
    if len(crt_stm_messages) >= STM_INTERVAL[1]:
        logger.debug(
            f"stm contains {len(crt_stm_messages)} messages BEFORE memory maintenance."
        )
        create_agent("memory_updater", ltm_sys_prompt)
        memory_updater = get_model("memory_updater")
        response = memory_updater.invoke(
            [HumanMessage(get_ltm_prompt(ltm, crt_stm_messages))])
        ltm = response.content

        logger.debug(
            f"stm contains {len(crt_messages[stm_pointer:])} messages AFTER memory maintenance."
        )
        stm_pointer = len(crt_messages) + 1 - STM_INTERVAL[0]

        logger.debug(f"LTM updated: {ltm}")

    update = {
        "task_type": task_type,
        "messages": [user_input_msg],
        "ltm": ltm,
        "stm_pointer": stm_pointer
    }

    # logger.debug(update)
    return update


# Task detection
def task_detection(
    user_input: str
) -> Literal["default_task", "explain", "comment", "debug", "teach"]:
    create_agent("PyTeach-Detect", detect_sys_prompt)
    llm = get_model("PyTeach-Detect").with_structured_output(
        provideTaskDetection)
    response: provideTaskDetection = llm.invoke([HumanMessage(user_input)])
    logger.debug(f"Response of task_detection: {response}")
    if response:
        return detectionToTaskType.get(response.task_type, "default_task")
    return "default_task"


# Define the function that determines whether to continue or not
def teacher_tool_calling_router(state: TeacherState, config: RunnableConfig):
    messages = state["messages"]
    last_message = messages[-1]
    if not last_message.tool_calls:
        return "output"
    else:
        return "tool_calling"


def teacher(state: TeacherState, config: RunnableConfig) -> TeacherState:
    logger.debug(f"teacher received: {state}")
    if state["task_type"] == "explain":
        llm = get_model(agent_name="Pyteach-Explain").bind_tools(
            [get_what_user_is_reading])
    elif state["task_type"] == "comment":
        llm = get_model(agent_name="Pyteach-Comment").bind_tools(
            [get_user_codes, write_codes_to_new_cell])
    elif state["task_type"] == "debug":
        # TODO
        llm = get_model(agent_name="Pyteach-Debug").bind_tools(
            [get_user_codes, write_codes_to_new_cell])
    elif state["task_type"] == "teach":
        # TODO
        llm = get_model(agent_name="PyTeach-Teach")
    # elif state["task_type"] == "teach":
    #     # TODO
    #     llm = get_model(agent_name="Pyteach").bind_tools(tools)
    elif state["task_type"] == "default_task":
        llm = get_model(agent_name="Pyteach").bind_tools(tools)
    else:
        raise Exception("Unknown task_type!")

    # TODO: Manage the messages that give the llm to invoke. Should not be all!
    ltm = state.get("ltm", "")
    stm_pointer = state.get("stm_pointer", 0)
    crt_messages = state.get("messages", [])
    crt_stm_messages = crt_messages[stm_pointer:]

    input_msg = []
    if ltm:
        input_msg.append(
            SystemMessage(f"The followings are your memory:\n{ltm}"))
    if crt_stm_messages:
        input_msg.extend(crt_stm_messages)
    logger.debug(f"Teacher's input_msg: {input_msg}")

    update = {}
    response: AIMessage = llm.invoke(input_msg)
    update["messages"] = [response]
    if not (hasattr(response, "tools_call") and response.tool_calls):
        update["output_message"] = response

    return update


teacher_toolkit = ToolNode(tools, input_key="messages", output_key="messages")


# ======================================================================================
# =================================== Output Guard =====================================
# ======================================================================================
def init_output_guard(state: OutputGuardState,
                      config: RunnableConfig) -> OutputGuardState:
    create_agent("output_guard", "", model="llama-guard3:1b")


def output_guard_judgement(state: OutputGuardState,
                           config: RunnableConfig) -> OutputGuardState:
    guard = get_model("output_guard")
    input_msg = [state["output_message"]]
    response = guard.invoke(input_msg)
    update = {}
    update["guard_judgement"] = response.content.split('\n')[0]
    if update["guard_judgement"] == "unsafe":
        update["judgement_category"] = response.content.split('\n')[1]
        update["guard_judgement"] = filter_unsafe_judgement(
            update["judgement_category"])

    if update["guard_judgement"] == "safe":
        update["judgement_category"] = ""
    elif update["guard_judgement"] != "unsafe":
        logger.debug("Unkonw Guard Judgement!")
        raise Exception("Unkonw Guard Judgement!")
    logger.debug(f"Output guard judgement: {update['guard_judgement']}")
    return update


def output_guard_router(state: OutputGuardState, config: RunnableConfig):
    return state["guard_judgement"]


def output_interruption_handler(state: OutputGuardState,
                                config: RunnableConfig) -> OutputGuardState:
    judgement_category = state["judgement_category"]
    interruption_prompt = get_guard_interruption_prompt(
        judgement_category, "output")
    logger.debug("Interruption: LLM generate unsafe output!")
    raise NodeInterrupt(AIMessage(interruption_prompt))


def output_guard_to_user(state: OutputGuardState,
                         config: RunnableConfig) -> GlobalOutputState:
    return
