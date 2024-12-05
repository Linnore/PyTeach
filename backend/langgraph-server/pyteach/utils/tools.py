import uuid
import socketio

from langchain_core.tools import tool

from pyteach.utils.rag_tool import RAG
from pyteach.utils.logging import get_logger

logger = get_logger()


@tool(parse_docstring=True)
def RAG_on_textbook(user_query: str) -> str:
    """Retrieve context in the Kids Python textbook. Call this tool when the user query the textbook.

    Args:
        user_query: the user's question

    Returns:
        str: textbook content related to the user's question
    """
    return RAG.rag_function(user_query)


def _get_what_user_is_reading() -> str:
    with socketio.SimpleClient() as sio:
        sio.connect('http://localhost:3001')

        as_info = dict(source_id="getActiveCellContent" + str(uuid.uuid4()),
                       source_type="AS")
        sio.emit("register", as_info)

        data = as_info.copy()
        data["task"] = "getActiveCellContent"
        sio.emit("from_AS_to_socket", data)
        event_type, response = sio.receive()
        return response


@tool
def get_what_user_is_reading() -> str:
    """This tool provides what user is reading in the jupyter notebook. Call this tool when the context is insufficent to answer the user's question."""  # noqa
    response = _get_what_user_is_reading()
    info = response["jupyterlite_info"]
    cell_content = info["ActiveCellContent"]
    cell_type = info["ActiveCellType"]

    if cell_type == "code":
        result = f"The user is reading the following codes:\n{cell_content}"
    elif cell_type == "markdown" or cell_type == "raw":
        result = f"The user is reading the following lecture materials:\n{cell_content}"
    else:
        raise Exception("Unknown cell type")
    return result


@tool
def get_user_codes() -> str:
    """Call this tool when you need access of user's codes."""  # noqa
    response = _get_what_user_is_reading()
    info = response["jupyterlite_info"]
    cell_content = info["ActiveCellContent"]
    cell_type = info["ActiveCellType"]

    if cell_type == "code":
        result = f"The followings are user's codes:\n{cell_content}"
    else:
        result = f"The user is not viewing codes. Instruct the user to click and highlight the code cell he/she wants"  # noqa
    return result


def _write_codes_to_new_cell(codes: str) -> str:
    with socketio.SimpleClient() as sio:
        sio.connect('http://localhost:3001')

        as_info = dict(source_id="writeContentToCell" + str(uuid.uuid4()),
                       source_type="AS")
        sio.emit("register", as_info)

        data = as_info.copy()
        data["task"] = "writeContentToCell"
        data["newContent"] = codes
        sio.emit("from_AS_to_socket", data)
        event_type, response = sio.receive()
        return response


def _validate_codes(codes: str) -> str:
    # code validation before write codes. if codes are not executable, return "fail: {reason}""
    # Check execution
    try:
        exec(codes)
    except Exception as e:
        error_message = [("user", f"Your solution failed the code execution test, error_message: {e} You should regenerate the code and call the tool 'write_codes_to_new_cell' again to write the correct version of the Python code into a new notebook cell.")]
        logger.debug("---CODE BLOCK CHECK: FAILED---")
        return error_message

    # No errors
    logger.debug("---NO CODE TEST FAILURES---")
    return "success"


@tool(parse_docstring=True)
def write_codes_to_new_cell(codes: str) -> str:
    """
    Call this tool when you need to write codes into the jupyter notebbok.

    Args:
        codes: the codes to be written into a new jupyter code cell.

    Returns:
        str: status of the action, eight "success" or "fail: {reason}".
    """
    # TODO: code validation before write codes. if codes are not executable, return "fail: {reason}""
    validation_result = _validate_codes(codes)
    if validation_result == "success":
        _write_codes_to_new_cell(codes)
        return "success"
    else:
        return validation_result


tools = [get_what_user_is_reading, get_user_codes, write_codes_to_new_cell, RAG_on_textbook]
