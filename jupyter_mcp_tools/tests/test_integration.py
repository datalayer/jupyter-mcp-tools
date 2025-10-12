#!/usr/bin/env python
"""
Test script to verify the MCPToolsClient integration.

This script tests:
1. Waiting for tools to be registered
2. Querying tools with a filter
3. Handling timeout scenarios
"""

import asyncio
from jupyter_mcp_tools.client import get_tools


async def test_get_tools():
    """Test getting tools from the extension."""
    print("Testing MCPToolsClient integration...")
    print("-" * 60)
    
    # Test 1: Get console:create tool with default timeout
    print("\nTest 1: Query for 'console:create' tool (30s timeout)")
    try:
        tools = await get_tools(
            base_url="http://localhost:8888",
            token="",
            query="console:create",
            wait_timeout=30
        )
        
        if tools:
            print(f"✓ Found {len(tools)} matching tool(s)")
            for tool in tools:
                print(f"  - {tool['id']}: {tool['label']}")
                print(f"    Enabled: {tool.get('isEnabled', False)}")
        else:
            print("✗ No tools found")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Test 2: Get all tools
    print("\nTest 2: Query for all enabled tools")
    try:
        tools = await get_tools(
            base_url="http://localhost:8888",
            token="",
            enabled_only=True,
            wait_timeout=5  # Short timeout since tools should already be registered
        )
        
        if tools:
            print(f"✓ Found {len(tools)} enabled tool(s)")
            print(f"  First 5: {[t['id'] for t in tools[:5]]}")
        else:
            print("✗ No tools found")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    # Test 3: Test with very short timeout (should fail if tools not yet registered)
    print("\nTest 3: Query with 1s timeout (may fail if not yet registered)")
    try:
        # Reset the registration event to test timeout
        from jupyter_mcp_tools.websocket import WsEchoHandler
        
        # Note: This test only makes sense if run before tools are registered
        if WsEchoHandler.are_tools_registered():
            print("⚠ Tools already registered, skipping timeout test")
        else:
            tools = await get_tools(
                base_url="http://localhost:8888",
                token="",
                query="console",
                wait_timeout=1
            )
            
            if tools:
                print(f"✓ Found {len(tools)} tool(s) (faster than expected)")
            else:
                print("✓ Timeout handled correctly (no tools yet)")
    except Exception as e:
        print(f"✗ Error: {e}")
    
    print("\n" + "-" * 60)
    print("Tests completed!")


if __name__ == "__main__":
    asyncio.run(test_get_tools())
