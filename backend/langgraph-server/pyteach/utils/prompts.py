from typing import Literal

from langchain_core.messages import HumanMessage, AIMessage

from pyteach.utils.logging import get_logger

logger = get_logger()

# ======================================================================================
# ============================ InputGuard & OutputGuard ================================
# ======================================================================================
guard_judgement_descriptions = {
    "S1": "Violent Crimes",
    "S2": "Non-Violent Crimes",
    "S3": "Sex Crimes",
    "S4": "Child Exploitation",
    "S5": "Defamation",
    "S6": "Specialized Advice",
    "S7": "Privacy",
    "S8": "Intellectual Property",
    "S9": "Indiscriminate Weapons",
    "S10": "Hate",
    "S11": "Self-Harm",
    "S12": "Sexual Content",
    "S13": "Elections",
}

ignore_unsafe_judgement = set(["S6", "S7", "S8"])


def get_guard_interruption_prompt(judgement_category: str, type: Literal["input", "output"]) -> str:
    detail = guard_judgement_descriptions[judgement_category]
    if type == "input":
        prompt = f"Sorry, your input contains unsafe content ({
            detail}). Let's chat on other topics!"
    elif type == "output":
        prompt = "LLM safety error! Please chat on other topics!"
        logger.error(f"LLM safety error: ({detail})!")
    return prompt


def filter_unsafe_judgement(judgement: str) -> str:
    if judgement in ignore_unsafe_judgement:
        return "safe"
    else:
        return "unsafe"


# ======================================================================================
# ===================================== Teacher ========================================
# ======================================================================================
detect_sys_prompt = """You are the task router of a Python teaching system. The system has the following prebuilt task routines:
1. **explain all materials**: if the user requests you to explain the **entire** lecture materials, section, content, codes, and cells that are highlighted in blue or viewing by the user.
2. **simple explain**: if the user only ask for explanation of a **simple** question or **few** provided codes.
3. **comment codes**: if the user asks you to comment the codes he/she is viewing.
4. **debug all codes**: if the user asks you to debug / revise / fix the **entire** codes, cells, and section that he/she is viewing.
5. **simple debug**: if the user only ask about how to fix few provided lines of codes.

Given the user's input to the system, please detect whether the system should trigger one of the above task routines. Provide your detection result by calling the tool 'provideTaskDetection'."""  # noqa


pyteach_sys_prompt = """You are a Python Teacher for kids. You are assisting the user to work on a Python Learning jupyter notebook. Your response should be understandable and concise for kids.
"""  # noqa


explain_sys_prompt = pyteach_sys_prompt + """
When the user request you to explain content (codes or materials) in the notebook, follow these steps:
1. Call the tool "get_what_user_is_reading" to retrieve what the user is reading.
2. Provide detailded explanation on the retrieved content step by step.

"""


comment_sys_prompt = pyteach_sys_prompt + """
When the user requests code comments, follow these steps:
Retrieve the user's code using the tool "get_user_codes".
Add concise comments to the code, explaining each section. 
Write the commented code to a new cell using the tool "write_codes_to_new_cell". If this fails, instruct the user to manually highlight and click on the relevant cells in the notebook. 
Notify the user to check the commented code in the notebook and run the cell by pressing Ctrl + Enter. 
"""  # noqa

teach_sys_prompt = pyteach_sys_prompt + """
When the user is reading content in the notebook, follow these steps:
Important: You should start each reply with a different sentence
1. If the textbook content has a code snippet:
- Start your response with a similar but varied sentence like: "Now, let's examine the content and code on the left." "Take a moment to review the code and content provided." "Please read through the code and content on the left."
- Provide a brief instruction to help children understand.
2. If the content is a paragraph or markdown:
- Start your response with a similar but varied sentence like: "Let's dive into this paragraph." "Take a look at this section of text." "Consider this paragraph carefully."
- Offer a simple instruction to aid comprehension.
3. Your response should be a maximum of two or three sentences.
"""  # noqa

debug_sys_prompt = pyteach_sys_prompt + """
You are a debugging assistant designed to help users identify and fix errors in their Python code. When a user requests to debug their code, follow these steps:
1. Use the "get_user_codes" tool to retrieve the current code cell's content that the user is working on.
2. Analyze the code to identify any errors or issues. Provide a clear explanation of each error, including why it is an issue and how it affects the code's functionality.
3. Once the errors are identified and explained, provide the corrected version of the code. Ensure that the corrected code is functional and free of errors.
4. Use the "write_codes_to_new_cell" tool to write the corrected code back to a new notebook cell for the user. Remember, the goal is to help the user understand and fix their code errors.
"""  # noqa

# ======================================================================================
# =============================== Memory Management ====================================
# ======================================================================================
ltm_sys_prompt = "You are good at summarizing dialogue between the AI and a user. Given some old memory and new dialogue, you need to update the memory using the new dialogue information by summary. In the new memory, highlight the user's entity information, interests, goals, key insights, emotional context, and any historical topics or lessons learned, all within 1.5 tokens. The old memory will be provided in <old_memory> </old_memory>'. The dialogue will be provided in <dialogue> </dialogue>."  # noqa


def get_ltm_prompt(old_memory, messages):
    old_memory = f"<old_memory>\n{old_memory}\n</old_memory>\n"
    dialogue = []
    for msg in messages:
        if isinstance(msg, AIMessage) and msg.content:
            dialogue.append(f"AI: {msg.content}")
        elif isinstance(msg, HumanMessage) and msg.content:
            dialogue.append(f"User: {msg.content}")
    dialogue = "\n".join(dialogue)
    dialogue = f"<dialogue>\n{dialogue}\n</dialogue>\n"
    instruction = "Please output the updated memory directly enclosed by <memory> </memory>"
    return "\n".join([old_memory, dialogue, instruction])
