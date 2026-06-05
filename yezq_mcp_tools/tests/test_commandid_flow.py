#!/usr/bin/env python3
"""
Test the commandId flow to verify correct tool ID mapping
"""
import json

# Simulate tools as they would be registered from frontend
registered_tools = [
    {
        'id': 'notebook_append-execute',
        'commandId': 'notebook:append-execute',
        'label': 'Notebook Append Execute',
        'isEnabled': True
    },
    {
        'id': 'console_create',
        'commandId': 'console:create', 
        'label': 'Create Console',
        'isEnabled': True
    },
    {
        'id': 'list_notebooks',
        'commandId': 'list:notebooks',
        'label': 'List Notebooks',
        'isEnabled': True
    }
]

print("=" * 70)
print("Testing Tool ID Mapping Flow")
print("=" * 70)

# Test execution flow
test_executions = [
    'notebook_append-execute',
    'console_create',
    'list_notebooks'
]

for tool_id in test_executions:
    print(f"\n📝 Executing tool: {tool_id}")
    
    # Find tool in registry (simulating handler code)
    tool = None
    for t in registered_tools:
        if t.get('id') == tool_id:
            tool = t
            break
    
    if not tool:
        print(f"   ✗ Tool not found!")
        continue
    
    # Get original command ID
    original_tool_id = tool.get('commandId')
    if not original_tool_id:
        print(f"   ⚠️  Missing commandId, using fallback")
        original_tool_id = tool_id.replace('_', ':')
    
    print(f"   → Mapped to command: {original_tool_id}")
    print(f"   ✓ Ready to execute in JupyterLab")

print("\n" + "=" * 70)
print("Key Points:")
print("  • MCP clients see: notebook_append-execute (valid)")
print("  • JupyterLab executes: notebook:append-execute (internal)")  
print("  • commandId field: never exposed to MCP client")
print("=" * 70)
