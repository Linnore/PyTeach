# pyteach_jupyterlite_iframe_server
The based extension of jupyterlab for jupyterlite that enables communication between jupyterlite-iframe and the host page used by PyTeach.

# Development Guide

## Where to Code?

`./src/index.ts`

## Required packages:
```bash
conda install --override-channels --strict-channel-priority -c conda-forge -c nodefaults jupyterlab nodejs git copier jinja2-time jupyterlite-core

```
```bash
jlpm add @jupyterlab/notebook
pip install jupyterlite-pyodide-kernel
```

## Compile

Build `jupyterlab` first:

```bash
jlpm run build
```

Then build `jupyterlite`:

```bash
jupyter lite build --output-dir ../build
```

## Serve Jupyterlite

```bash
jupyter lite serve --output-dir ../build --port 8081
```

### Remark:

Remember to rebuild the jupyterlab then serve the jupyterlite to let the changes compiled into jupyterlite!!!

# Auto Docs

Below are docs generated automatically.

## Requirements

- JupyterLab >= 4.0.0

## Install

To install the extension, execute:

```bash
pip install pyteach_jupyterlite_iframe_server
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall pyteach_jupyterlite_iframe_server
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the pyteach_jupyterlite_iframe_server directory
# Install package in development mode
pip install -e "."
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
pip uninstall pyteach_jupyterlite_iframe_server
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `pyteach-jupyterlite-iframe-server` within that folder.

### Packaging the extension

See [RELEASE](RELEASE.md)
