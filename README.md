<!--
  ~ Copyright (c) 2023-2024 Datalayer, Inc.
  ~
  ~ BSD 3-Clause License
-->

[![Datalayer](https://assets.datalayer.tech/datalayer-25.svg)](https://datalayer.io)

[![Become a Sponsor](https://img.shields.io/static/v1?label=Become%20a%20Sponsor&message=%E2%9D%A4&logo=GitHub&style=flat&color=1ABC9C)](https://github.com/sponsors/datalayer)

# 🪐✨ Jupyter MCP Tools

[![PyPI - Version](https://img.shields.io/pypi/v/jupyter-mcp-tools)](https://pypi.org/project/jupyter-mcp-tools)

[![Github Actions Status](https://github.com/datalayer/jupyter-mcp-tools/workflows/Build/badge.svg)](https://github.com/datalayer/jupyter-mcp-tools/actions/workflows/build.yml)

Jupyter MCP Tools.

This extension is composed of a Python package named `jupyter_mcp_tools`
for the server extension and a NPM package named `@datalayer/jupyter-mcp-tools`
for the frontend extension.

## Requirements

- JupyterLab >= 4.0.0

## Install

To install the extension, execute:

```bash
pip install jupyter_mcp_tools
```

## Use

```bash
# Ensure Jupyter Server is starting without any extension enabled.
jupyter server --ServerApp.allow_origin=*
```

```bash
# Browse the default home page, it should show a white page in your browser with the following content: `A Jupyter Server is running.`
open http://localhost:8888
```

```bash
# Now you can render `ExtensionWS` Server content in your browser.
open http://localhost:8888/simple_ws/default
open http://localhost:8888/simple_ws/params/test?var1=foo
open http://localhost:8888/simple_ws/template1/test
open http://localhost:8888/simple_ws/typescript
open http://localhost:8888/simple_ws/nope
open http://localhost:8888/simple_ws/redirect
open http://localhost:8888/static/simple_ws/favicon.ico
#
open http://localhost:8888/static/simple_ws/home_ws.html
open http://localhost:8888/static/simple_ws/test_ws.html
```

Start a Jupyter Server with a Node.js HTTP Server and send from a client a message via WebSocket.

```bash
# WebSocket Client <-> Jupyter WebSocket Server <-> HTTP Node.js Server
# open http://localhost:8080
npm run server
...
WebSocket opened
PRODUCER: Event for URL ws://localhost:8888/simple_ws/echo
WebSocket message: Hello Jupyter Server
URL /
'Params'
POST
Partial body: Hello Jupyter Server
Body: Hello Jupyter Server
{'text': 'Hello Jupyter Server'}
LISTENER: Got Message {"text":"Hello Jupyter Server"}
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyter_mcp_tools
```

## Troubleshoot

If you are seeing the frontend extension, but it is not working, check
that the server extension is enabled:

```bash
jupyter server extension list
```

If the server extension is installed and enabled, but you are not seeing
the frontend extension, check the frontend extension is installed:

```bash
jupyter labextension list
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyter_mcp_tools directory
# Install package in development mode
pip install -e ".[test]"
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Server extension must be manually installed in develop mode
jupyter server extension enable jupyter_mcp_tools
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
# Server extension must be manually disabled in develop mode
jupyter server extension disable jupyter_mcp_tools
pip uninstall jupyter_mcp_tools
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `@datalayer/jupyter-mcp-tools` within that folder.

### Testing the extension

#### Server tests

This extension is using [Pytest](https://docs.pytest.org/) for Python code testing.

Install test dependencies (needed only once):

```sh
pip install -e ".[test]"
# Each time you install the Python package, you need to restore the front-end extension link
jupyter labextension develop . --overwrite
```

To execute them, run:

```sh
pytest -vv -r ap --cov jupyter_mcp_tools
```

#### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
jlpm
jlpm test
```

#### Integration tests

This extension uses [Playwright](https://playwright.dev/docs/intro) for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](./ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](RELEASE.md)
