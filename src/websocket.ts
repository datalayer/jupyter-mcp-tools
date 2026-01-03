/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */

import { JupyterFrontEnd } from '@jupyterlab/application';
import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';

import { MCPToolsWidget, ITool } from './components/MCPToolsWidget';

/**
 * Safely serialize a value for JSON transmission, handling circular references
 */
function safeSerialize(
  obj: any,
  maxDepth = 3,
  currentDepth = 0,
  seen = new WeakSet()
): any {
  // Handle primitives
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (
    typeof obj === 'boolean' ||
    typeof obj === 'number' ||
    typeof obj === 'string'
  ) {
    return obj;
  }

  // Prevent infinite recursion
  if (currentDepth > maxDepth) {
    return '<max depth reached>';
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj
      .slice(0, 100)
      .map(item => safeSerialize(item, maxDepth, currentDepth + 1, seen));
  }

  // Handle objects with circular reference detection
  if (typeof obj === 'object') {
    if (seen.has(obj)) {
      return '<circular reference>';
    }

    seen.add(obj);

    const result: any = {};
    const keys = Object.keys(obj).slice(0, 100); // Limit to 100 keys

    for (const key of keys) {
      try {
        result[key] = safeSerialize(obj[key], maxDepth, currentDepth + 1, seen);
      } catch (e) {
        result[key] = '<serialization error>';
      }
    }

    return result;
  }

  // Fallback for functions and other types
  try {
    return String(obj);
  } catch (e) {
    return '<unserializable>';
  }
}

/**
 * WebSocket connection manager for MCP tools
 */
export class MCPToolsWebSocket {
  private ws: WebSocket | null = null;
  private app: JupyterFrontEnd;
  private widget: MCPToolsWidget;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  constructor(app: JupyterFrontEnd, widget: MCPToolsWidget) {
    this.app = app;
    this.widget = widget;

    // Set up callback for local tool execution (direct)
    this.widget.setExecuteCallbackLocal((toolId, parameters) => {
      this.applyToolLocal(toolId, parameters);
    });

    // Set up callback for remote tool execution (via WebSocket)
    this.widget.setExecuteCallbackRemote((toolId, parameters) => {
      this.applyToolRemote(toolId, parameters);
    });
  }

  /**
   * Connect to the WebSocket server
   */
  connect(): void {
    const settings = ServerConnection.makeSettings();
    const wsUrl = URLExt.join(settings.wsUrl, 'jupyter-mcp-tools', 'echo');

    console.log('Connecting to WebSocket:', wsUrl);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      // Defer tool registration to next tick to ensure all command registrations are complete
      requestAnimationFrame(async () => {
        await this.registerTools();
      });
    };

    this.ws.onmessage = event => {
      this.handleMessage(event.data);
    };

    this.ws.onerror = error => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      this.attemptReconnect();
    };
  }

  /**
   * Attempt to reconnect to the WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );
      setTimeout(() => this.connect(), this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Register all available JupyterLab commands as tools
   */
  private async registerTools(): Promise<void> {
    const commands = this.app.commands;
    const allCommandIds = commands.listCommands();
    console.log(`Total JupyterLab commands available: ${allCommandIds.length}`);

    const tools: ITool[] = [];

    // MCP tool name pattern - only letters, numbers, underscores, and hyphens
    const mcpNamePattern = /^[a-zA-Z0-9_-]+$/;
    let skippedCount = 0;

    // Iterate through all registered commands
    for (const commandId of allCommandIds) {
      try {
        // Try to check if command is enabled (with fallback to true)
        let isEnabled = true;
        try {
          isEnabled = commands.isEnabled(commandId);
        } catch (e) {
          // If isEnabled check fails, default to true
          isEnabled = true;
        }

        const label = commands.label(commandId);
        const caption = commands.caption(commandId);
        const usage = commands.usage(commandId);

        // Replace colons with underscores in the command ID for MCP compatibility
        // MCP tool names must match pattern: ^[a-zA-Z0-9_-]+$
        const toolId = commandId.replace(/:/g, '_');

        // Validate that the transformed tool ID matches MCP pattern
        if (!mcpNamePattern.test(toolId)) {
          console.warn(
            `Skipping command "${commandId}" - transformed tool ID "${toolId}" contains invalid characters for MCP (must match ^[a-zA-Z0-9_-]+$)`
          );
          skippedCount++;
          continue;
        }

        // Get command parameters using describedBy introspection
        const parameters = await this.getCommandParameters(commandId);

        const tool: ITool = {
          id: toolId,
          commandId: commandId, // Store original command ID for execution
          label: label || toolId,
          caption: caption || '',
          usage: usage || '',
          isEnabled: isEnabled,
          parameters: parameters
        };
        tools.push(tool);
      } catch (error) {
        console.warn(`Error processing command ${commandId}:`, error);
      }
    }

    if (skippedCount > 0) {
      console.log(
        `Skipped ${skippedCount} commands with invalid MCP tool names`
      );
    }

    console.log(`Successfully processed ${tools.length} tools`);

    // Update widget with tools list
    this.widget.setTools(tools);

    // Send register_tools message
    const message = {
      type: 'register_tools',
      tools: tools
    };

    this.sendMessage(message);
    console.log(`Registered ${tools.length} tools with backend`);
  }

  /**
   * Extract command parameters if available
   */
  private async getCommandParameters(commandId: string): Promise<any> {
    try {
      // Define parameter schemas for known commands that require parameters
      const knownSchemas: Record<string, any> = {
        'notebook:append-execute': {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              description: 'The source code to insert in the cell'
            },
            type: {
              type: 'string',
              enum: ['code', 'markdown', 'raw'],
              description: 'The cell type',
              default: 'code'
            }
          },
          required: ['source'],
          description: 'Append and execute a cell in the current notebook'
        },
        'filebrowser:open-path': {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to open'
            }
          },
          required: ['path'],
          description: 'Open a file or directory by path'
        },
        'docmanager:open': {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'Path to the file to open'
            },
            factory: {
              type: 'string',
              description: 'Widget factory name (optional)'
            },
            kernel: {
              type: 'object',
              description: 'Kernel options (optional)'
            }
          },
          required: ['path'],
          description: 'Open a document'
        },
        'notebook:insert-cell-below': {
          type: 'object',
          properties: {
            activate: {
              type: 'boolean',
              description: 'Whether to activate the new cell',
              default: true
            }
          },
          description: 'Insert a cell below the current cell'
        },
        'notebook:insert-cell-above': {
          type: 'object',
          properties: {
            activate: {
              type: 'boolean',
              description: 'Whether to activate the new cell',
              default: true
            }
          },
          description: 'Insert a cell above the current cell'
        },
        'console:create': {
          type: 'object',
          properties: {
            activate: {
              type: 'boolean',
              description: 'Whether to activate the console',
              default: true
            },
            insertMode: {
              type: 'string',
              enum: ['split-right', 'split-left', 'split-top', 'split-bottom'],
              description: 'Where to insert the console',
              default: 'split-right'
            },
            path: {
              type: 'string',
              description: 'Path for the console session'
            }
          },
          description: 'Create a new console'
        }
      };

      // Check if we have a known schema
      if (knownSchemas[commandId]) {
        return knownSchemas[commandId];
      }

      // For commands not in our known list, return empty schema
      // Note: Lumino's CommandRegistry doesn't expose parameter schemas,
      // only the actual argument values passed to commands
      return {
        type: 'object',
        properties: {},
        description: 'Command arguments (if any)'
      };
    } catch (error) {
      console.warn(`Error getting parameters for ${commandId}:`, error);
      return {
        type: 'object',
        properties: {},
        description: 'Command arguments (if any)'
      };
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      console.log('Received message:', message);

      // Log received message
      this.widget.addMessage('received', message.type || 'unknown', message);

      if (message.type === 'apply_tool') {
        this.applyToolFromServer(
          message.tool_id,
          message.parameters || {},
          message.execution_id
        );
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Apply/execute a tool (command) - LOCAL execution (direct)
   */
  private async applyToolLocal(toolId: string, parameters: any): Promise<void> {
    try {
      console.log(`Executing tool LOCALLY: ${toolId}`, parameters);

      // Convert underscore-separated tool ID back to colon-separated command ID
      // The tool ID was transformed from "console:create" to "console_create" during registration
      const commandId = toolId.replace(/_/g, ':');

      if (this.app.commands.hasCommand(commandId)) {
        const result = await this.app.commands.execute(commandId, parameters);
        console.log(`Tool ${toolId} executed successfully`);

        // Sanitize result to avoid circular references in message log
        const sanitizedResult = safeSerialize(result, 2);

        // Add success message to log
        this.widget.addMessage('sent', 'local_execute', {
          tool_id: toolId,
          parameters,
          result: sanitizedResult,
          success: true
        });
      } else {
        console.error(`Command not found: ${commandId}`);
        this.widget.addMessage('sent', 'local_execute', {
          tool_id: toolId,
          parameters,
          error: `Command not found: ${commandId}`,
          success: false
        });
      }
    } catch (error) {
      console.error(`Error executing tool locally ${toolId}:`, error);
      this.widget.addMessage('sent', 'local_execute', {
        tool_id: toolId,
        parameters,
        error: String(error),
        success: false
      });
    }
  }

  /**
   * Apply/execute a tool (command) - REMOTE execution (via WebSocket)
   */
  private async applyToolRemote(
    toolId: string,
    parameters: any
  ): Promise<void> {
    try {
      console.log(
        `Sending tool execution request via WebSocket: ${toolId}`,
        parameters
      );

      // Send apply_tool message to server
      const message = {
        type: 'apply_tool',
        tool_id: toolId,
        parameters: parameters
      };

      this.sendMessage(message);
      console.log(`Sent apply_tool message for ${toolId} to server`);
    } catch (error) {
      console.error(`Error sending tool execution request ${toolId}:`, error);
      this.widget.addMessage('sent', 'apply_tool_error', {
        tool_id: toolId,
        parameters,
        error: String(error)
      });
    }
  }

  /**
   * Apply/execute a tool (command) - triggered from WebSocket server
   */
  private async applyToolFromServer(
    toolId: string,
    parameters: any,
    executionId?: string
  ): Promise<void> {
    try {
      console.log(`Applying tool from server: ${toolId}`, parameters);

      // Convert underscore-separated tool ID back to colon-separated command ID
      // This reverses the transformation done in registerTools()
      const commandId = toolId.replace(/_/g, ':');

      if (this.app.commands.hasCommand(commandId)) {
        const result = await this.app.commands.execute(commandId, parameters);
        console.log(`Tool ${toolId} executed successfully`);

        // Sanitize result to avoid circular references
        const sanitizedResult = safeSerialize(result, 2);

        // Send success response back
        const response = {
          type: 'tool_result',
          tool_id: toolId,
          execution_id: executionId,
          success: true,
          result: sanitizedResult
        };
        this.sendMessage(response);
      } else {
        console.error(`Command not found: ${commandId}`);
        const response = {
          type: 'tool_result',
          tool_id: toolId,
          execution_id: executionId,
          success: false,
          error: `Command not found: ${commandId}`
        };
        this.sendMessage(response);
      }
    } catch (error) {
      console.error(`Error applying tool ${toolId}:`, error);
      const response = {
        type: 'tool_result',
        tool_id: toolId,
        execution_id: executionId,
        success: false,
        error: String(error)
      };
      this.sendMessage(response);
    }
  }

  /**
   * Send a message through the WebSocket
   */
  private sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      // Log sent message
      this.widget.addMessage('sent', message.type || 'unknown', message);
    } else {
      console.error('WebSocket is not connected');
    }
  }

  /**
   * Close the WebSocket connection
   */
  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
