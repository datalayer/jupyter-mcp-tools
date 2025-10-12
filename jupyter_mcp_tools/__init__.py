# Copyright (c) 2023-2024 Datalayer, Inc.
#
# BSD 3-Clause License

try:
    from ._version import __version__
except ImportError:
    # Fallback when using the package in dev mode without installing
    # in editable mode with pip. It is highly recommended to install
    # the package from a stable release or in editable mode: https://pip.pypa.io/en/stable/topics/local-project-installs/#editable-installs
    import warnings
    warnings.warn("Importing 'jupyter_mcp_tools' outside a proper installation.")
    __version__ = "dev"

from .handlers import setup_handlers
from .client import MCPToolsClient, get_tools

__all__ = [
    '__version__',
    'setup_handlers',
    'MCPToolsClient',
    'get_tools'
]


def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "@datalayer/jupyter-mcp-tools"
    }]


def _jupyter_server_extension_points():
    return [{
        "module": "jupyter_mcp_tools"
    }]


def _load_jupyter_server_extension(server_app):
    """Registers the API handler to receive HTTP requests from the frontend extension.

    Parameters
    ----------
    server_app: jupyterlab.labapp.LabApp
        JupyterLab application instance
    """
    setup_handlers(server_app.web_app, server_app)
    name = "jupyter_mcp_tools"
    server_app.log.info(f"Registered {name} server extension")
