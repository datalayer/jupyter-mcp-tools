# Copyright (c) 2023-2024 Datalayer, Inc.
#
# BSD 3-Clause License

"""
Python client for jupyter-mcp-tools extension.

This client provides programmatic access to the JupyterLab commands
registered as MCP tools.
"""

import asyncio
import json
import logging
from typing import Optional, List, Dict, Any
from urllib.parse import urljoin

import aiohttp

logger = logging.getLogger(__name__)


class MCPToolsClient:
    """
    Client for interacting with the jupyter-mcp-tools extension.
    
    This client connects to a running JupyterLab instance with the
    jupyter-mcp-tools extension installed and queries the available tools.
    """
    
    def __init__(
        self,
        base_url: str = "http://localhost:8888",
        token: Optional[str] = None,
        timeout: int = 30
    ):
        """
        Initialize the MCP Tools client.
        
        Args:
            base_url: Base URL of the JupyterLab server
            token: Authentication token for the server
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.timeout = timeout
        self._session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        """Async context manager entry."""
        await self.connect()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()
    
    async def connect(self):
        """Establish connection session."""
        headers = {}
        if self.token:
            headers['Authorization'] = f'Token {self.token}'
        
        self._session = aiohttp.ClientSession(
            headers=headers,
            timeout=aiohttp.ClientTimeout(total=self.timeout)
        )
    
    async def close(self):
        """Close the connection session."""
        if self._session:
            await self._session.close()
            self._session = None
    
    async def get_tools(
        self,
        query: Optional[str] = None,
        enabled_only: bool = True,
        wait_timeout: int = 30
    ) -> List[Dict[str, Any]]:
        """
        Get the list of available tools from the extension.
        
        The tools are JupyterLab commands registered through the extension.
        Each tool includes:
        - id: Command ID
        - label: Human-readable label
        - caption: Description/tooltip
        - usage: Usage information
        - isEnabled: Whether the command is currently enabled
        - parameters: Parameter schema
        
        Args:
            query: Optional filter string to match against tool ID or label.
                   Can be a single command (e.g., "console_create") or 
                   multiple commands separated by commas (e.g., "console_create,notebook_append-execute").
                   Each command in the list will be matched against tool IDs and labels.
                   If provided, only tools matching any of the queries will be returned.
            enabled_only: If True, only return enabled tools
            wait_timeout: Seconds to wait for JupyterLab extension to register tools
        
        Returns:
            List of tool dictionaries
        
        Examples:
            >>> async with MCPToolsClient() as client:
            ...     # Single query
            ...     tools = await client.get_tools(query="console_create")
            ...     print(tools[0]['label'])
            'Console'
            
            >>> async with MCPToolsClient() as client:
            ...     # Multiple queries (comma-separated)
            ...     tools = await client.get_tools(query="console_create,notebook_append")
            ...     print(len(tools))
            2
        """
        if not self._session:
            await self.connect()
        
        # The extension stores registered tools in the WebSocket handler
        # We need to query through the WebSocket or add an HTTP endpoint
        # For now, we'll add an HTTP endpoint to the extension
        
        url = urljoin(self.base_url, '/jupyter-mcp-tools/tools')
        params = {
            'timeout': str(wait_timeout)
        }
        
        if query:
            params['query'] = query
        if enabled_only:
            params['enabled_only'] = 'true'
        
        try:
            async with self._session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get('tools', [])
                elif response.status == 503:
                    # Service unavailable - tools not registered yet
                    data = await response.json()
                    logger.warning(f"Tools not registered: {data.get('message')}")
                    return []
                else:
                    error_text = await response.text()
                    logger.error(
                        f"Failed to get tools: HTTP {response.status} - {error_text}"
                    )
                    return []
        except aiohttp.ClientError as e:
            logger.error(f"Error connecting to jupyter-mcp-tools extension: {e}")
            return []
        except Exception as e:
            logger.error(f"Unexpected error getting tools: {e}")
            return []
    
    async def get_tool(self, tool_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a specific tool.
        
        Args:
            tool_id: The tool/command ID to query
        
        Returns:
            Tool dictionary or None if not found
        """
        tools = await self.get_tools(query=tool_id, enabled_only=False)
        for tool in tools:
            if tool.get('id') == tool_id:
                return tool
        return None
    
    async def execute_tool(
        self,
        tool_id: str,
        parameters: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute a tool through the extension via HTTP endpoint.
        
        Args:
            tool_id: The tool/command ID to execute
            parameters: Tool parameters
        
        Returns:
            Execution result dictionary with 'success', 'result', or 'error' fields
        
        Raises:
            ValueError: If tool execution fails
        """
        if not self._session:
            await self.connect()
        
        url = urljoin(self.base_url, '/jupyter-mcp-tools/execute')
        payload = {
            'tool_id': tool_id,
            'parameters': parameters or {}
        }
        
        try:
            async with self._session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    return result
                else:
                    error_text = await response.text()
                    raise ValueError(
                        f"Failed to execute tool: HTTP {response.status} - {error_text}"
                    )
        except aiohttp.ClientError as e:
            raise ValueError(f"Error connecting to jupyter-mcp-tools extension: {e}")
        except Exception as e:
            raise ValueError(f"Unexpected error executing tool: {e}")


# Convenience function for simple queries
async def get_tools(
    base_url: str = "http://localhost:8888",
    token: Optional[str] = None,
    query: Optional[str] = None,
    enabled_only: bool = True,
    wait_timeout: int = 30
) -> List[Dict[str, Any]]:
    """
    Convenience function to get tools without managing client lifecycle.
    
    Args:
        base_url: Base URL of the JupyterLab server
        token: Authentication token
        query: Optional filter string to match against tool ID or label.
               Can be a single command (e.g., "console_create") or 
               multiple commands separated by commas (e.g., "console_create,notebook_append-execute").
        enabled_only: If True, only return enabled tools
        wait_timeout: Seconds to wait for JupyterLab extension to register tools
    
    Returns:
        List of tool dictionaries
    
    Examples:
        >>> # Single query
        >>> tools = await get_tools(query="console_create")
        >>> print(len(tools))
        1
        
        >>> # Multiple queries (comma-separated)
        >>> tools = await get_tools(query="console_create,notebook_append")
        >>> print(len(tools))
        2
    """
    async with MCPToolsClient(base_url, token) as client:
        return await client.get_tools(query=query, enabled_only=enabled_only, wait_timeout=wait_timeout)
