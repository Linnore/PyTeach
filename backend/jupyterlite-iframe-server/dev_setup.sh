#!/bin/bash

# Setup script for developing the jupyterlite-iframe-server
# run from backend/jupyterlite-iframe-server

# Packages for jupyterlite develeopment
conda install --override-channels --strict-channel-priority -c conda-forge -c nodefaults jupyterlab nodejs git copier jinja2-time jupyterlite-core
pip install jupyterlite-pyodide-kernel load_dotenv
pip install langgraph langchain_ollama langchain_community langserve fastapi sse_starlette
conda install graphviz
conda install pygraphviz

cd ./dev
pip install -ve .
jupyter labextension develop --overwrite .
#jlpm build