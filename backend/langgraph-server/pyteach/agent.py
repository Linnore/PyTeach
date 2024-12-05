from langgraph.graph import StateGraph, END, START

from pyteach.utils import get_sql_checkpointer
from pyteach.utils.nodes import (
    teacher, teacher_tool_calling_router, teacher_toolkit, init_teacher,
    init_input_guard, input_guard_judgement, input_interruption_handler,
    input_guard_router, input_guard_to_teacher, init_output_guard,
    output_guard_judgement, output_interruption_handler, output_guard_router,
    output_guard_to_user)
from pyteach.utils.state import (TeacherState, GlobalInputState,
                                 InputGuardState, GlobalOutputState,
                                 OutputGuardState)
from pyteach.utils.config import GraphConfig

# ======================================================================================
# =================================== Input Guard ======================================
# ======================================================================================
InputGuard = StateGraph(config_schema=GraphConfig,
                        input=GlobalInputState,
                        output=TeacherState)
InputGuard.add_node("Init and Receive Input",
                    init_input_guard,
                    input=InputGuardState),
InputGuard.add_node("Input Guard LLM",
                    input_guard_judgement,
                    input=InputGuardState),
InputGuard.add_node("Interruption Handler",
                    input_interruption_handler,
                    input=InputGuardState)
InputGuard.add_node("Transfer to Teacher",
                    input_guard_to_teacher,
                    input=InputGuardState)

InputGuard.add_edge(START, "Init and Receive Input")
InputGuard.add_edge("Init and Receive Input", "Input Guard LLM")
InputGuard.add_conditional_edges("Input Guard LLM", input_guard_router, {
    "safe": "Transfer to Teacher",
    "unsafe": "Interruption Handler"
})
InputGuard.add_edge("Interruption Handler", "Init and Receive Input")
InputGuard.add_edge("Transfer to Teacher", END)
InputGuard = InputGuard.compile()

# ======================================================================================
# =================================== Teacher ==========================================
# ======================================================================================
Teacher = StateGraph(config_schema=GraphConfig,
                     input=TeacherState,
                     output=TeacherState)
Teacher.add_node("Init Teacher", init_teacher, input=TeacherState)
Teacher.add_node("LLM Teacher", teacher, input=TeacherState)
Teacher.add_node("Toolkit", teacher_toolkit)

Teacher.add_edge(START, "Init Teacher")
Teacher.add_edge("Init Teacher", "LLM Teacher")
Teacher.add_conditional_edges(
    "LLM Teacher",
    teacher_tool_calling_router,
    {
        "tool_calling": "Toolkit",
        "output": END,
    },
)
Teacher.add_edge("Toolkit", "LLM Teacher")
Teacher = Teacher.compile()

# ======================================================================================
# =================================== Output Guard =====================================
# ======================================================================================
OutputGuard = StateGraph(config_schema=GraphConfig,
                         input=OutputGuardState,
                         output=GlobalOutputState)
OutputGuard.add_node("Init and Receive Output",
                     init_output_guard,
                     input=OutputGuardState)
OutputGuard.add_node("Output Guard LLM",
                     output_guard_judgement,
                     input=OutputGuardState)
OutputGuard.add_node("Interruption Handler",
                     output_interruption_handler,
                     input=OutputGuardState)
OutputGuard.add_node("Transfer to User",
                     output_guard_to_user,
                     input=OutputGuardState)

OutputGuard.add_edge(START, "Init and Receive Output")
OutputGuard.add_edge("Init and Receive Output", "Output Guard LLM")
OutputGuard.add_conditional_edges("Output Guard LLM", output_guard_router, {
    "safe": "Transfer to User",
    "unsafe": "Interruption Handler",
})
OutputGuard.add_edge("Interruption Handler", END)
OutputGuard.add_edge("Transfer to User", END)
OutputGuard = OutputGuard.compile()

# ======================================================================================
# ============================== PyTeach - Agentic System ==============================
# ======================================================================================
PyTeachWorkflow = StateGraph(config_schema=GraphConfig,
                             input=InputGuardState,
                             output=GlobalOutputState)
PyTeachWorkflow.add_node("Input Guard", InputGuard, input=InputGuardState)
PyTeachWorkflow.add_node("Teacher", Teacher, input=TeacherState)
PyTeachWorkflow.add_node("Output Guard", OutputGuard, input=OutputGuardState)

PyTeachWorkflow.add_edge(START, "Input Guard")
PyTeachWorkflow.add_edge("Input Guard", "Teacher")
PyTeachWorkflow.add_edge("Teacher", "Output Guard")
PyTeachWorkflow.add_edge("Output Guard", END)

# PyTeachWorkflow.add_edge(START, "Teacher")
# PyTeachWorkflow.add_edge("Teacher", END)

memory = get_sql_checkpointer()
# memory = MemorySaver()
agent = PyTeachWorkflow.compile(checkpointer=memory)
