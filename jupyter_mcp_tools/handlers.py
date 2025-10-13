# Copyright (c) 2023-2024 Datalayer, Inc.
#
# BSD 3-Clause License

import asyncio
import json
from jupyter_server.utils import url_path_join
from jupyter_server.base.handlers import JupyterHandler, APIHandler
from tornado import web

from jupyter_mcp_tools.route import RouteHandler
from jupyter_mcp_tools.websocket import WsEchoHandler


class MCPToolsListHandler(JupyterHandler):
    """
    HTTP handler to list registered MCP tools.
    
    GET /jupyter-mcp-tools/tools?query=<filter>&enabled_only=<bool>&timeout=<seconds>
    """
    
    @web.authenticated
    async def get(self):
        """Return list of registered tools, waiting for registration if needed."""
        # Get query parameters
        query = self.get_argument('query', default=None)
        enabled_only = self.get_argument('enabled_only', default='true').lower() == 'true'
        timeout = int(self.get_argument('timeout', default='30'))
        
        # Wait for tools to be registered if they haven't been yet
        if not WsEchoHandler.are_tools_registered():
            self.log.info(f"Waiting up to {timeout}s for tools to be registered...")
            success = await WsEchoHandler.wait_for_tools(timeout=timeout)
            if not success:
                self.set_status(503)  # Service Unavailable
                self.set_header('Content-Type', 'application/json')
                self.write(json.dumps({
                    'error': 'Tools not yet registered',
                    'message': f'JupyterLab extension has not registered tools within {timeout}s timeout'
                }))
                self.finish()
                return
        
        # Get tools from WebSocket handler's class variable
        all_tools = WsEchoHandler.registered_tools
        
        # Transform tool IDs: replace colons with underscores for MCP compatibility
        # MCP tool names must match pattern: ^[a-zA-Z0-9_-]+$
        # But keep colons in labels, or replace with spaces for better display
        transformed_tools = []
        for tool in all_tools:
            transformed_tool = tool.copy()
            original_id = tool.get('id', '')
            # Transform ID: replace colons with underscores for MCP
            transformed_tool['id'] = original_id.replace(':', '_')
            # Transform label: replace colons with spaces for display
            original_label = tool.get('label', '')
            if ':' in original_label:
                transformed_tool['label'] = original_label.replace(':', ' ')
            transformed_tools.append(transformed_tool)
        
        # Filter tools
        tools = transformed_tools
        if query:
            # Support comma-separated queries (e.g., "console_create,notebook_append")
            query_terms = [term.strip().lower() for term in query.split(',')]
            
            # Filter by ID or label matching any of the query terms
            tools = [
                tool for tool in tools
                if any(
                    term in tool.get('id', '').lower() or
                    term in tool.get('label', '').lower()
                    for term in query_terms
                )
            ]
        
        if enabled_only:
            tools = [tool for tool in tools if tool.get('isEnabled', False)]
        
        response = {
            'tools': tools,
            'count': len(tools),
            'total': len(transformed_tools)
        }
        
        self.set_header('Content-Type', 'application/json')
        self.write(json.dumps(response))
        self.finish()


class MCPToolsExecuteHandler(APIHandler):
    """Handler for executing tools via HTTP POST request."""
    
    @web.authenticated
    async def post(self):
        """Execute a tool and return the result."""
        try:
            # Parse request body
            body = self.request.body.decode('utf-8')
            data = json.loads(body)
            
            tool_id = data.get('tool_id', '')
            parameters = data.get('parameters', {})
            
            if not tool_id:
                self.set_status(400)
                self.write(json.dumps({
                    'success': False,
                    'error': 'Missing tool_id in request'
                }))
                self.finish()
                return
            
            self.log.info(f"Executing tool: {tool_id}")
            
            # Find the tool in registered tools to get the original command ID
            tool = None
            for t in WsEchoHandler.registered_tools:
                if t.get('id') == tool_id:
                    tool = t
                    break
            
            if not tool:
                self.log.error(f"Tool not found in registry: {tool_id}")
                self.log.info(f"Available tools: {[t.get('id') for t in WsEchoHandler.registered_tools]}")
                self.set_status(404)
                self.write(json.dumps({
                    'success': False,
                    'error': f'Tool not found: {tool_id}. Available tools: {[t.get("id") for t in WsEchoHandler.registered_tools[:5]]}'
                }))
                self.finish()
                return
            
            # Get the original command ID from the tool if available
            # Otherwise fall back to naive conversion (for backward compatibility)
            original_tool_id = tool.get('commandId')
            if not original_tool_id:
                self.log.warning(f"Tool {tool_id} missing commandId field, using fallback conversion")
                original_tool_id = tool_id.replace('_', ':')
            
            self.log.info(f"Mapped tool_id '{tool_id}' to command_id '{original_tool_id}'")
            
            # Create an event to wait for the result
            result_event = asyncio.Event()
            result_data = {'success': False, 'error': 'Timeout waiting for result'}
            
            # Store the event in the WebSocket handler for this execution
            execution_id = f"{original_tool_id}_{asyncio.get_event_loop().time()}"
            WsEchoHandler.pending_executions[execution_id] = {
                'event': result_event,
                'result': result_data
            }
            
            # Send execute request via WebSocket to all connected clients
            # Find an active WebSocket connection
            if not WsEchoHandler.active_connections:
                self.set_status(503)
                self.write(json.dumps({
                    'success': False,
                    'error': 'No active WebSocket connection to JupyterLab extension'
                }))
                self.finish()
                return
            
            # Send to the first active connection
            ws_handler = list(WsEchoHandler.active_connections)[0]
            message = {
                'type': 'apply_tool',
                'execution_id': execution_id,
                'tool_id': original_tool_id,
                'parameters': parameters
            }
            ws_handler.write_message(json.dumps(message))
            
            # Wait for result with timeout
            try:
                await asyncio.wait_for(result_event.wait(), timeout=30.0)
                result = WsEchoHandler.pending_executions[execution_id]['result']
            except asyncio.TimeoutError:
                result = result_data  # Use default timeout error
            finally:
                # Clean up
                WsEchoHandler.pending_executions.pop(execution_id, None)
            
            self.set_header('Content-Type', 'application/json')
            self.write(json.dumps(result))
            self.finish()
            
        except json.JSONDecodeError as e:
            self.set_status(400)
            self.write(json.dumps({
                'success': False,
                'error': f'Invalid JSON: {str(e)}'
            }))
            self.finish()
        except Exception as e:
            self.log.error(f"Error executing tool: {e}", exc_info=True)
            self.set_status(500)
            self.write(json.dumps({
                'success': False,
                'error': str(e)
            }))
            self.finish()


def setup_handlers(web_app, server_app=None):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "jupyter-mcp-tools", "get-example")
    ws_pattern = url_path_join(base_url, "jupyter-mcp-tools", "echo")
    tools_pattern = url_path_join(base_url, "jupyter-mcp-tools", "tools")
    execute_pattern = url_path_join(base_url, "jupyter-mcp-tools", "execute")
    
    handlers = [
        (route_pattern, RouteHandler),
        (ws_pattern, WsEchoHandler),
        (tools_pattern, MCPToolsListHandler),
        (execute_pattern, MCPToolsExecuteHandler),
    ]
    web_app.add_handlers(host_pattern, handlers)
