# PyTeach Backend
The backend of PyTeach consists of three parts:
 - jupyterlite-iframe-server
 - llm-server
 - react-server (todo)

Todo: description.


## Launch Individual Backend Component
Please refer to the `README.md` in each component folder.

### Jupyterlite-Iframe-Server
```bash
cd jupyterlite-iframe-server
nohup bash launch.sh > ../logs/jupyterlite.log 2>&1 &
cd ../
```

### LLM-Server
```bash
cd llm-server
bash launch.sh
```

### Agentic System (LangGraph)
```bash
cd agentic-system-server
bash launch.sh
```

## Launch the entire backend:
Todo. This is not applicable at the moment!
```bash
# bash
bash launch_backend.sh
```