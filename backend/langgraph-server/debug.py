# %%
# flake8: noqa

# ---
# jupyter:
#   jupytext:
#     cell_metadata_filter: -all
#     custom_cell_magics: kql
#     text_representation:
#       extension: .py
#       format_name: percent
#       format_version: '1.3'
#       jupytext_version: 1.11.2
#   kernelspec:
#     display_name: llm
#     language: python
#     name: python3
# ---

# %%
import os
from dotenv import load_dotenv
from pyteach.agent import agent
from pyteach.utils.config import GraphConfig
from pyteach.utils import get_logger, clean_memory_by_thread

from langchain_core.runnables.graph import MermaidDrawMethod
from langchain_core.messages import HumanMessage, AIMessage, AIMessageChunk

from IPython.display import Image, display

try:
    display(
        Image(agent.get_graph(xray=1).draw_mermaid_png(
            draw_method=MermaidDrawMethod.API, )))
except Exception as err:
    print(err)
    pass

# Environment and API Key
load_dotenv(".env")

# %%
from pyteach.agent import InputGuard
from langgraph.types import Interrupt
thread_id = "0"
mode = "dev"
os.environ["PYTEACH_DEBUG"] = "1"
logger = get_logger()
config = GraphConfig(thread_id=thread_id, mode=mode)
input_state = {
    # "user_input": "I want to die",
    # "user_input": "Compute 3*4",
    # "user_input": "You are teaching children to learn Python. You should first call get_Contents_Active_Cell() to get the content of Active Cell, then generate a brief intro as the new content, and then call the write_Contents_to_Cell tool to write the new content into the cell. Then you just tell children to see the cell in the left side"
    "user_input": "I dont understand why"
}


def namespace_parser(namespace:tuple) -> str:
    if len(namespace) == 0:
        return "From MainGraph"
    elif len(namespace) == 1:
        name = namespace[0].split(':')[0]
        return f"From Subgraph ({name})"
    else:
        raise Exception("Strange!!!")
            

for namespace, event in agent.stream(input_state,
                          config=config,
                          stream_mode="updates",
                          subgraphs=True):
    # logger.debug(f"Update from {namespace}: {event}")
    for node, update in event.items():
        logger.debug(f"Update from {node}: {update}")
        if node == "__interrupt__":
            print(f"\n{namespace_parser(namespace)}")
            update[0].value.pretty_print()
        else:
            if update:
                for key, value in update.items():
                    if "messages" in key and update[key]:
                        print(f"\n{namespace_parser(namespace)}")
                        update[key][-1].pretty_print()

    # Deprecated:
    # We only stream out the AIMessageChunk and AIMessage from ["Interruption Handler", "Output Handler"]
    # if stream_type == "messages":
    #     msg, metadata = event
    #     if metadata["langgraph_node"] == "Interruption Handler":
    #         msg.pretty_print()



# %%
config = {"configurable": {"thread_id": 0}}
agent.get_state(config=config)

# %%
config = {"configurable": {"thread_id": 0}}
for key in agent.get_state(config=config).values:
    print(key)

# %%
clean_memory_by_thread(thread_id)

# %%
from pyteach.utils.nodes import create_agent

create_agent(agent_name="input_guard", system_prompt="", model="llama-guard3:8b")

# %%
from pyteach.utils.tools import _get_what_user_is_reading

_get_what_user_is_reading()

# %%
from pyteach.utils.tools import _write_codes_to_new_cell

codes ="""
a = 1
b = 2
print(a+b)
"""
_write_codes_to_new_cell(codes)

# %%
import os
os.environ["PYTEACH_DEBUG"] = "1"

from pyteach.utils.nodes import task_detection

# print(task_detection("can you explain what it means by a, b = b, a+1?"))  # simple explain
# print(task_detection("can you explain the codes?")) # simple explain
# print(task_detection("can you explain the codes on the left?")) # explain all materials
# print(task_detection("can you explain the highlighted codes?")) # explain all materials
# print(task_detection("can you comment the codes?")) # comment codes
print(task_detection("can you fix the codes?")) # debug all codes
print(task_detection("""can you fix this: print("hello world')""")) # simple debug


