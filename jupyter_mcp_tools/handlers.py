# Copyright (c) 2023-2024 Datalayer, Inc.
#
# BSD 3-Clause License

from jupyter_server.utils import url_path_join

from jupyter_mcp_tools.route import RouteHandler
from jupyter_mcp_tools.websocket import WsEchoHandler

def setup_handlers(web_app, server_app=None):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "jupyter-mcp-tools", "get-example")
    ws_pattern = url_path_join(base_url, "jupyter-mcp-tools", "echo")
    
    handlers = [
        (route_pattern, RouteHandler),
        (ws_pattern, WsEchoHandler),
    ]
    web_app.add_handlers(host_pattern, handlers)
