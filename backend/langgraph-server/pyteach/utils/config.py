from typing import TypedDict, Literal


class GraphConfig(TypedDict):
    mode: Literal["released", "dev"] = "dev"
