# Copyright (c) 2023-2024 Datalayer, Inc.
#
# BSD 3-Clause License

import json
import tornado

from jupyter_server.base.handlers import APIHandler

class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({
            "data": "This is /jupyter-mcp-tools/get-example endpoint!"
        }))
