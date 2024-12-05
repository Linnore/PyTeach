# PyTeach
Todo: Project description.

# Setup PyTeach
## detailed versions
- backend: `./backend/README.md`
- frontend: `./frontend/README.md`

## TLDR version
1. [backend] JupyterLite

- build env for JupyterLite (only need to do once)
```bash
cd backend/jupyterlite-iframe-server/
./dev_setup.sh
```

- build JupyterLite extension (need to rebuild each time dev code updated)
```bash
cd backend/jupyterlite-iframe-server/
./build-jupyterlite.sh
```

2. [backend] local LLM via [Ollama](https://github.com/ollama/ollama)
<!---
two options, can either

### a. use [`llama.cpp`](https://github.com/ggerganov/llama.cpp) to serve `gguf` models 

`llm-server` (details in `backend/llm-server/README.md`)
- get `llama.cpp` binaries
	- download appropriate build from https://github.com/ggerganov/llama.cpp/releases
	- unzip and place contents of `build/bin` into `./llama.cpp`

- download `gguf` model file
```bash
pip install huggingface_hub
huggingface-cli download Qwen/Qwen2-7B-Instruct-GGUF qwen2-7b-instruct-q5_k_m.gguf --local-dir ./backend/llm-server/model/ --local-dir-use-symlinks False
```
-->
- download and install Ollama from https://ollama.com/download
<!---
- start Ollama server (automatically fetches models you don't already have)
- install python packages
	- `https://github.com/openai/openai-python`
```bash
pip install ollama
pip install openai
```
--->

## 3. [frontend] Next.js web server
<!---
no setup needed (details in `./frontend/README.md`)
-->
```bash
cd frontend/dev/pyteach-next/
npm install next
```

# Launch PyTeach
## 1. [backend] JupyterLite
```bash
python -m http.server 8081 -b 127.0.0.1 -d ./backend/jupyterlite-iframe-server/build/ # from PyTeach root
```

## 2. [backend] LLM server
<!---
either
### a. with `llama.cpp` (served at `http://127.0.0.1:8082/`)
```bash
backend/llm-server/llama.cpp/llama-server -m ./backend/llm-server/models/qwen2-7b-instruct-q5_k_m.gguf -ngl 10 -fa --port 8082
```

or
### b. 
-->
```bash
ollama run llama3.1 # 8b
ollama run phi3:mini # 3b
ollama run phi3:medium # 14b
/bye # stop ollama
/clear # clears context
```
[phi3](https://ollama.com/library/phi3:3.8b)

example [ollama models](https://github.com/ollama/ollama?tab=readme-ov-file#model-library)
You should have at least 8 GB of RAM available to run the 7B models, 16 GB to run the 13B models, and 32 GB to run the 33B models.

## 3. [frontend] Next.js server
<!---
```bash
python -m http.server 8080 -b 127.0.0.1 -d ./frontend/build/demo/
```
-->
```bash
cd frontend/dev/pyteach-next/
conda activate pyteach_jupyterlite
npm run dev
```

## 4. Text to Speech server
```bash
pip install pyaudio
cd tmp/
python3 TTS.py
```

## Port
Currently, port binding is hard-coded as:
<!---
- 8080 for frontend
-->
<!---
- 8082 for llm-server-llama.cpp
-->
- `http://127.0.0.1:8080` backend agentic system (and TTS text to speech)
- `http://127.0.0.1:8081` backend JupyterLite
- `http://127.0.0.1:11434` backend Ollama
- `http://127.0.0.1:3000` frontend Next.js
- `http://127.0.0.1:3001` socket server for communication between any third-party with jupyterlite

<!---
## Remarks
- may need to `chmod +x dev_setup.sh` to run scripts # AT should not be a problem if we committed the .sh files correctly
-->

Todo:
Consider creating a script to find available ports and prepare the port binding using environment variables.

## JupyterLite Files
### info
https://jupyterlite.readthedocs.io/en/latest/howto/content/files.html

### local contents
source ipynb files should be placed here `backend\jupyterlite-iframe-server\dev\files`
they are "built" to `backend\jupyterlite-iframe-server\build\files` when `jupyterlite-iframe-server` is built, i.e. running `jupyter lite build --output-dir ../build`

### server contents
ipynb files created using server interface (i.e. `http://127.0.0.1:8081/lab/index.html`) get saved in browser cache (cleaning cache clears server contents)
for the location visit `chrome://version/` and look for "Profile Path"
- files found here `C:\Users\alfred\AppData\Local\Google\Chrome\User Data\Profile 1\IndexedDB\http_127.0.0.1_8081.indexeddb.blob`
- logs found here `C:\Users\alfred\AppData\Local\Google\Chrome\User Data\Profile 1\IndexedDB\http_127.0.0.1_8081.indexeddb.leveldb`