#!/bin/bash

# is actually better to run 
#	./jupyterlite-iframe-server/launch.sh
# and
#	./llm-server/launch.sh
# from separate bash terminals as can turn each one off (ctrl+C and /bye respectively)

# if (1) divert output and (2) run in the background then
# (a) cannot kill jupyterlite-iframe-server easily in windows
# (b) cannot turn off ollama model (as can't tell it to /bye)

# i.e. dont run this if doing dev

# run from backend/

# echo "launch jupyterlite-iframe-server"
# bash ./jupyterlite-iframe-server/launch.sh > logs/backend_jupyterlite.log 2>&1 &

# echo "launch llm-server"
# bash ./llm-server/launch.sh > logs/backend_llm.log 2>&1 &

# echo "launch agentic-system-server"
# bash ./llm-server/launch.sh > logs/backend_agent.log 2>&1 &
