# Copyright (c) 2023-2024 Datalayer, Inc.
#
# BSD 3-Clause License

#!/usr/bin/env python3
"""
Test client for MCP Tools WebSocket API

This script demonstrates how to interact with the JupyterLab MCP Tools extension
via WebSocket to list and execute commands.

Usage:
    python test_mcp_client.py --url ws://localhost:8888/jupyter-mcp-tools/echo
"""

import asyncio
import json
import argparse
import sys
from typing import Optional

try:
    import websockets
except ImportError:
    print("Error: websockets library not found. Install with: pip install websockets")
    sys.exit(1)


class MCPToolsClient:
    """Client for interacting with JupyterLab MCP Tools WebSocket API"""
    
    def __init__(self, url: str):
        self.url = url
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
    
    async def connect(self):
        """Connect to the WebSocket server"""
        print(f"Connecting to {self.url}...")
        try:
            self.websocket = await websockets.connect(self.url)
            print("Connected successfully!")
        except Exception as e:
            print(f"Connection failed: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from the WebSocket server"""
        if self.websocket:
            await self.websocket.close()
            print("Disconnected.")
    
    async def send_message(self, message: dict) -> dict:
        """Send a message and wait for response"""
        if not self.websocket:
            raise RuntimeError("Not connected to WebSocket")
        
        print(f"\n→ Sending: {json.dumps(message, indent=2)}")
        await self.websocket.send(json.dumps(message))
        
        response = await self.websocket.recv()
        response_data = json.loads(response)
        print(f"← Received: {json.dumps(response_data, indent=2)}")
        
        return response_data
    
    async def list_tools(self) -> list:
        """Request list of available tools"""
        print("\n" + "="*60)
        print("LISTING AVAILABLE TOOLS")
        print("="*60)
        
        response = await self.send_message({"type": "list_tools"})
        
        if response.get("type") == "list_tools_response":
            tools = response.get("tools", [])
            print(f"\nFound {len(tools)} tools")
            
            # Print first 10 tools as examples
            print("\nSample tools:")
            for i, tool in enumerate(tools[:10], 1):
                print(f"  {i}. {tool.get('id')}")
                print(f"     Label: {tool.get('label')}")
                print(f"     Caption: {tool.get('caption', 'N/A')}")
                print()
            
            if len(tools) > 10:
                print(f"  ... and {len(tools) - 10} more tools")
            
            return tools
        else:
            print("Unexpected response type")
            return []
    
    async def apply_tool(self, tool_id: str, parameters: dict = None) -> dict:
        """Apply/execute a tool"""
        print("\n" + "="*60)
        print(f"APPLYING TOOL: {tool_id}")
        print("="*60)
        
        message = {
            "type": "apply_tool",
            "tool_id": tool_id,
            "parameters": parameters or {}
        }
        
        # Send the apply_tool request
        response = await self.send_message(message)
        
        # Wait for tool_result response
        if response.get("type") == "apply_tool":
            print("Tool execution request sent to frontend, waiting for result...")
            result_response = await self.websocket.recv()
            result_data = json.loads(result_response)
            print(f"← Result: {json.dumps(result_data, indent=2)}")
            return result_data
        
        return response
    
    async def interactive_mode(self):
        """Interactive mode for testing"""
        print("\n" + "="*60)
        print("INTERACTIVE MODE")
        print("="*60)
        print("\nCommands:")
        print("  list              - List all available tools")
        print("  apply <tool_id>   - Apply a specific tool")
        print("  quit/exit         - Exit interactive mode")
        print()
        
        while True:
            try:
                command = input("\n> ").strip()
                
                if command in ["quit", "exit"]:
                    break
                elif command == "list":
                    await self.list_tools()
                elif command.startswith("apply "):
                    tool_id = command[6:].strip()
                    if tool_id:
                        await self.apply_tool(tool_id)
                    else:
                        print("Usage: apply <tool_id>")
                elif command == "":
                    continue
                else:
                    print(f"Unknown command: {command}")
            except EOFError:
                break
            except Exception as e:
                print(f"Error: {e}")


async def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description="Test client for JupyterLab MCP Tools WebSocket API"
    )
    parser.add_argument(
        "--url",
        default="ws://localhost:8888/jupyter-mcp-tools/echo",
        help="WebSocket URL (default: ws://localhost:8888/jupyter-mcp-tools/echo)"
    )
    parser.add_argument(
        "--token",
        help="Jupyter server token (if required)"
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List available tools and exit"
    )
    parser.add_argument(
        "--apply",
        metavar="TOOL_ID",
        help="Apply a specific tool and exit"
    )
    parser.add_argument(
        "--interactive",
        "-i",
        action="store_true",
        help="Enter interactive mode"
    )
    
    args = parser.parse_args()
    
    # Add token to URL if provided
    url = args.url
    if args.token:
        separator = "&" if "?" in url else "?"
        url = f"{url}{separator}token={args.token}"
    
    client = MCPToolsClient(url)
    
    try:
        await client.connect()
        
        # Give the frontend time to register tools
        print("Waiting for frontend to register tools...")
        await asyncio.sleep(2)
        
        if args.list:
            await client.list_tools()
        elif args.apply:
            await client.apply_tool(args.apply)
        elif args.interactive:
            await client.interactive_mode()
        else:
            # Default: list tools
            await client.list_tools()
        
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
    except Exception as e:
        print(f"\nError: {e}")
        return 1
    finally:
        await client.disconnect()
    
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
