import json

from jupyter_mcp_tools.handlers_ws import WsEchoHandler
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({
            "data": "This is /jupyter-mcp-tools/get-example endpoint!"
        }))


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
