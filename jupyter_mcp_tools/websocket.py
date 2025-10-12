# Copyright (c) 2023-2024 Datalayer, Inc.
#
# BSD 3-Clause License

import json

import requests

from tornado.websocket import WebSocketHandler

from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.base.zmqhandlers import WebSocketMixin


def safe_serialize(obj, max_depth=3, current_depth=0):
    """
    Safely serialize an object, handling circular references and complex types.
    Returns a JSON-serializable representation.
    """
    if current_depth > max_depth:
        return "<max depth reached>"
    
    if obj is None or isinstance(obj, (bool, int, float, str)):
        return obj
    
    if isinstance(obj, (list, tuple)):
        return [safe_serialize(item, max_depth, current_depth + 1) for item in obj[:100]]  # Limit to 100 items
    
    if isinstance(obj, dict):
        result = {}
        for key, value in list(obj.items())[:100]:  # Limit to 100 keys
            try:
                result[str(key)] = safe_serialize(value, max_depth, current_depth + 1)
            except:
                result[str(key)] = "<serialization error>"
        return result
    
    # For objects, try to extract useful information
    try:
        if hasattr(obj, '__dict__'):
            return f"<{type(obj).__name__} object>"
        return str(obj)
    except:
        return f"<{type(obj).__name__}>"


class WsEchoHandler(WebSocketMixin, WebSocketHandler, JupyterHandler):
    """
    WebSocket handler for MCP tools communication.
    
    Handles three types of messages:
    1. register_tools: Registers available JupyterLab commands as tools
    2. list_tools: Returns the list of registered tools
    3. apply_tool: Executes a specific tool and relays it to the frontend
    """
    
    # Class variable to store registered tools across all connections
    registered_tools = []
    
    def open(self):
        print("WebSocket opened.")
        self.log.info("MCP Tools WebSocket connection opened")

    def on_message(self, message):
        """Handle incoming WebSocket messages"""
        try:
            print(f"WebSocket message received: {message}")
            data = json.loads(message)
            message_type = data.get('type', '')
            
            if message_type == 'register_tools':
                self.handle_register_tools(data)
            elif message_type == 'list_tools':
                self.handle_list_tools(data)
            elif message_type == 'apply_tool':
                self.handle_apply_tool(data)
            elif message_type == 'tool_result':
                # Handle results from tool execution (optional, for logging)
                self.handle_tool_result(data)
            else:
                # Legacy behavior: forward to external service
                self.forward_to_external_service(message)
                
        except json.JSONDecodeError as e:
            self.log.error(f"Invalid JSON message: {e}")
            self.send_error_response("Invalid JSON format")
        except Exception as e:
            self.log.error(f"Error handling message: {e}")
            self.send_error_response(str(e))

    def handle_register_tools(self, data):
        """Handle registration of tools from the frontend"""
        tools = data.get('tools', [])
        WsEchoHandler.registered_tools = tools
        self.log.info(f"Registered {len(tools)} tools")
        print(f"Registered {len(tools)} tools")
        
        # Send acknowledgment
        response = {
            'type': 'register_tools_response',
            'success': True,
            'count': len(tools)
        }
        self.write_message(json.dumps(response))

    def handle_list_tools(self, data):
        """Handle request to list all registered tools"""
        self.log.info(f"Listing {len(WsEchoHandler.registered_tools)} tools")
        
        response = {
            'type': 'list_tools_response',
            'tools': WsEchoHandler.registered_tools
        }
        self.write_message(json.dumps(response))

    def handle_apply_tool(self, data):
        """Handle request to apply/execute a tool"""
        tool_id = data.get('tool_id', '')
        parameters = data.get('parameters', {})
        
        self.log.info(f"Applying tool: {tool_id} with parameters: {parameters}")
        print(f"Applying tool: {tool_id}")
        
        # Find the tool in registered tools
        tool = None
        for t in WsEchoHandler.registered_tools:
            if t.get('id') == tool_id:
                tool = t
                break
        
        if not tool:
            self.send_error_response(f"Tool not found: {tool_id}")
            return
        
        # Relay the apply_tool message to the frontend
        # The frontend will execute the command and send back a result
        relay_message = {
            'type': 'apply_tool',
            'tool_id': tool_id,
            'parameters': parameters
        }
        self.write_message(json.dumps(relay_message))

    def handle_tool_result(self, data):
        """Handle tool execution results from the frontend"""
        tool_id = data.get('tool_id', '')
        success = data.get('success', False)
        result = data.get('result', None)
        error = data.get('error', None)
        
        if success:
            # Safely serialize the result for logging
            safe_result = safe_serialize(result, max_depth=2)
            self.log.info(f"Tool {tool_id} executed successfully")
            print(f"Tool {tool_id} executed successfully")
            
            # Send sanitized result back to client
            response = {
                'type': 'tool_result_ack',
                'tool_id': tool_id,
                'success': True,
                'result_summary': safe_result if isinstance(safe_result, str) else '<result>'
            }
            try:
                self.write_message(json.dumps(response))
            except Exception as e:
                self.log.error(f"Error sending tool result acknowledgment: {e}")
        else:
            self.log.error(f"Tool {tool_id} failed: {error}")
            print(f"Tool {tool_id} failed: {error}")
            
            # Send error acknowledgment
            response = {
                'type': 'tool_result_ack',
                'tool_id': tool_id,
                'success': False,
                'error': str(error)
            }
            try:
                self.write_message(json.dumps(response))
            except Exception as e:
                self.log.error(f"Error sending error acknowledgment: {e}")

    def forward_to_external_service(self, message):
        """Legacy behavior: forward message to external HTTP service"""
        try:
            r = requests.request('POST', 'http://localhost:8080', data=message)
            t = r.text
            j = json.loads(t)
            print(j)
            self.write_message(t)
        except Exception as e:
            self.log.error(f"Error forwarding to external service: {e}")
            self.send_error_response(f"External service error: {str(e)}")

    def send_error_response(self, error_message):
        """Send an error response to the client"""
        response = {
            'type': 'error',
            'error': error_message
        }
        self.write_message(json.dumps(response))

    def on_close(self):
        print("WebSocket closed")
        self.log.info("MCP Tools WebSocket connection closed")
