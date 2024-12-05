#!/bin/bash

# execute from backend/jupyterlite-iframe-server
# instructions copied from backend\jupyterlite-iframe-server\dev\README.md

# load dev env
# conda activate pyteach_jupyterlite

# go into dev dir
cd ./dev

# add required packages
jlpm add @jupyterlab/notebook

# compile
jlpm run build

# build `jupyterlite`: i.e. output to ./build at same level as ./dev
jupyter lite build --output-dir ../build