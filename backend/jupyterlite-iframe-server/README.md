# jupyterlite-iframe-server

## Prepare the Development Environment

**ONLY FOR THE FIRST-TIME SETUP**
Linux or MacOS:
```bash

dev_setup.sh
```

Windows:
1. Enable the `Developer Mode` in your Windows System Settings (may required system restart)
2. may also need to give writing rights to the following directories
- `C:\ProgramData\anaconda3\share\jupyter\labextensions` (to allow symlinks to be written)
- `backend\jupyterlite-iframe-server\dev\pyteach_jupyterlite_iframe_server\labextension`
3. Use git-bash to excecute `dev_setup.sh` or in Windows Terminal
```bash
dev_setup.bat
```

## Build Jupyterlite-Iframe-Server from `./dev`

After preparing the development environment, build jupyterlite-iframe-server form `./dev` following instructions in `./README.md`.

## Launch a Built Jupyterlite-Iframe-Server

`launch-jupyterlite.sh` or `launch-jupyterlite.bat`