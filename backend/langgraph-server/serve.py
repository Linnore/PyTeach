import os
import dashscope
import langserve

from dotenv import load_dotenv

from fastapi import FastAPI, Body, Query
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from pyteach.agent import agent
from pyteach.utils import (
    get_logger,
    clean_memory_by_thread,
    get_existing_memory_thread_ids,
)
from pyteach.utils.TTS import TTSCallback, markdown_to_plain_text, SpeechSynthesizer

logger = get_logger()

# Environment and API Key
load_dotenv(".env")

app = FastAPI()
# Add CORS middleware to your FastAPI app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to your frontend's origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


@app.get("/")
async def redirect_root_to_docs():
    return RedirectResponse("/docs")


def namespace_parser(namespace: tuple) -> str:
    if len(namespace) == 0:
        return "From MainGraph"
    elif len(namespace) == 1:
        name = namespace[0].split(":")[0]
        return f"From Subgraph ({name})"
    else:
        raise Exception("Strange!!!")


async def run_chat(input_data: dict):

    # TODO: this should be aligned with the graph state !!!
    logger.debug(input_data)
    task_type = input_data.get("config",
                               {}).get("configurable",
                                       {}).get("task_type", "default_task")
    # system_prompt = ""
    # if task_type == "default_task":
    #     input_state = {"user_input": input_data.get("input")}
    #     logger.debug(f"Task type: {task_type}\nSystem Prompt: {system_prompt}")
    # else:
    #     if task_type == "comment":
    #         system_prompt = comment_sys_prompt
    #     elif task_type == "debug":
    #         system_prompt = debug_sys_prompt
    #     elif task_type == "explain":
    #         system_prompt = explain_sys_prompt
    #     logger.debug(f"Task type: {task_type}\nSystem Prompt: {system_prompt}")
    #     user_input = system_prompt
    #     input_state = {"user_input": user_input}

    input_state = {
        "user_input": input_data.get("input"),
        "task_type": task_type
    }

    # Extract thread_id from input_data, default to "0" if not provided
    thread_id = (input_data.get("config", {}).get("configurable",
                                                  {}).get("thread_id", "0"))

    # Prepare the configuration for the model call
    config = {
        "configurable": {
            "thread_id": thread_id,
        }
    }

    # Stream the response
    response_messages = []
    # for chunk in agent.stream(input_state, config, stream_mode="values"):
    #     # TODO: Currently the agent stores all states in messages;
    #     #       Align this during development
    #     logger.info(f"event: {chunk['messages'][-1].content}")
    #     response_messages.append(chunk["messages"][-1].content)
    #     logger.debug(chunk)
    for namespace, event in agent.stream(input_state,
                                         config=config,
                                         stream_mode="updates",
                                         subgraphs=True):
        for node, update in event.items():
            logger.debug(f"Update from {node}: {update}")
            if node == "__interrupt__":
                logger.debug(f"\n{namespace_parser(namespace)}")
                update[0].value.pretty_print()
                response_messages.append(update[0].value.content)
            else:
                if update:
                    for key, value in update.items():
                        if "messages" in key and update[key]:
                            logger.debug(f"\n{namespace_parser(namespace)}")
                            logger.debug(update[key])
                            update[key][-1].pretty_print()
                            response_messages.append(update[key][-1].content)

    return {"responses": response_messages}


@app.post("/chat/stream")
async def chat_endpoint(input_data: dict = Body(...)):
    responses = await run_chat(input_data)
    return JSONResponse(content=responses)


@app.get("/chat/get_thread_ids")
async def get_thread_ids():
    """Fetch thread IDs that have associated messages from the database."""
    try:
        thread_ids = get_existing_memory_thread_ids()
        return JSONResponse(content={"thread_ids": thread_ids})
    except Exception:
        JSONResponse(status_code=500,
                     content={"message": "Internal Server Error"})


@app.delete("/chat/delete/{thread_id}")
async def delete_chat_history(thread_id: str):
    """Delete chat history for a specific thread ID."""
    try:
        clean_memory_by_thread(thread_id)
        return JSONResponse(
            content={
                "message":
                f"Chat history for thread {thread_id} deleted successfully."
            })
    except Exception:
        return JSONResponse(status_code=500,
                            content={"message": "Internal Server Error"})


# For TTS
@app.get("/synthesize")
async def synthesize(text: str = Query(...)):
    plain_text = markdown_to_plain_text(text)
    callback = TTSCallback()
    dashscope.api_key = os.getenv("TTS_DASHSCOPE_API")
    SpeechSynthesizer.call(
        model="sambert-donna-v1",
        text=plain_text,
        sample_rate=48000,
        format="pcm",
        callback=callback,
    )

    return JSONResponse(content={"message": "Speech synthesis completed"},
                        status_code=200)


# Add langserve routes for the workflow graph
langserve.add_routes(app, agent, path="/chat")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="localhost", port=8080)
