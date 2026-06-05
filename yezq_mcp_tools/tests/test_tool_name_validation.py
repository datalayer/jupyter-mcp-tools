#!/usr/bin/env python3
"""
Test script to verify tool name validation in MCP protocol
"""
import re

def validate_mcp_tool_name(name):
    """Validate tool name against MCP pattern"""
    pattern = r'^[a-zA-Z0-9_-]+$'
    return bool(re.match(pattern, name))

# Test various tool names
test_names = [
    "notebook_append-execute",  # Valid: underscore and hyphen
    "notebook:append-execute",  # Invalid: has colon
    "console_create",           # Valid: underscore only
    "console:create",           # Invalid: has colon
    "list_notebooks",           # Valid: underscore only
    "file-browser-open",        # Valid: hyphens only
]

print("MCP Tool Name Validation Tests:")
print("=" * 60)
for name in test_names:
    is_valid = validate_mcp_tool_name(name)
    status = "✓ VALID" if is_valid else "✗ INVALID"
    print(f"{status:12} {name}")

print("\n" + "=" * 60)
print("\nMCP Pattern: ^[a-zA-Z0-9_-]+$")
print("Allowed: letters, numbers, underscores (_), hyphens (-)")
print("NOT allowed: colons (:), spaces, special characters")
