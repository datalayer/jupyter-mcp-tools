/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { URLExt } from '@jupyterlab/coreutils';
import { ServerConnection } from '@jupyterlab/services';
import { ILabShell } from '@jupyterlab/application';

import { requestAPI } from './handler';
import { MCPToolsWidget, ITool } from './components/MCPToolsWidget';

/**
 * Safely serialize a value for JSON transmission, handling circular references
 */
function safeSerialize(obj: any, maxDepth = 3, currentDepth = 0, seen = new WeakSet()): any {
  // Handle primitives
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'boolean' || typeof obj === 'number' || typeof obj === 'string') {
    return obj;
  }

  // Prevent infinite recursion
  if (currentDepth > maxDepth) {
    return '<max depth reached>';
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.slice(0, 100).map(item => safeSerialize(item, maxDepth, currentDepth + 1, seen));
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
class MCPToolsWebSocket {
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
      requestAnimationFrame(() => {
        this.registerTools();
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
  private registerTools(): void {
    const commands = this.app.commands;
    const allCommandIds = commands.listCommands();
    console.log(`Total JupyterLab commands available: ${allCommandIds.length}`);

    const tools: ITool[] = [];

    // Iterate through all registered commands
    allCommandIds.forEach(commandId => {
      try {
        // Check if command is enabled
        const isEnabled = commands.isEnabled(commandId);
        const label = commands.label(commandId);
        const caption = commands.caption(commandId);
        const usage = commands.usage(commandId);

        // Replace colons with spaces in the command ID for MCP compatibility
        const toolId = commandId.replace(/:/g, ' ');

        const tool: ITool = {
          id: toolId,
          label: label || toolId,
          caption: caption || '',
          usage: usage || '',
          isEnabled: isEnabled,
          // Get command schema if available
          parameters: this.getCommandParameters(commandId)
        };
        tools.push(tool);
      } catch (error) {
        console.warn(`Error processing command ${commandId}:`, error);
      }
    });

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
  private getCommandParameters(commandId: string): any {
    try {
      // Try to get the command's schema or args description
      // Note: Not all commands have a schema, so we return a generic structure
      return {
        type: 'object',
        properties: {},
        description: 'Command arguments (if any)'
      };
    } catch (error) {
      return {};
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

      if (this.app.commands.hasCommand(toolId)) {
        const result = await this.app.commands.execute(toolId, parameters);
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
        console.error(`Command not found: ${toolId}`);
        this.widget.addMessage('sent', 'local_execute', {
          tool_id: toolId,
          parameters,
          error: `Command not found: ${toolId}`,
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
  private async applyToolRemote(toolId: string, parameters: any): Promise<void> {
    try {
      console.log(`Sending tool execution request via WebSocket: ${toolId}`, parameters);

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

      // Convert space-separated tool ID back to colon-separated command ID
      // This reverses the transformation done in registerTools()
      const commandId = toolId.replace(/ /g, ':');

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

/**
 * Initialization data for the @datalayer/jupyter-mcp-tools extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@datalayer/jupyter-mcp-tools:plugin',
  description: 'Jupyter MCP Tools.',
  autoStart: true,
  optional: [ISettingRegistry],
  requires: [ILabShell],
  activate: (
    app: JupyterFrontEnd,
    labShell: ILabShell,
    settingRegistry: ISettingRegistry | null
  ) => {
    console.log(
      'JupyterLab extension @datalayer/jupyter-mcp-tools is activated!'
    );

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log(
            '@datalayer/jupyter-mcp-tools settings loaded:',
            settings.composite
          );
        })
        .catch(reason => {
          console.error(
            'Failed to load settings for @datalayer/jupyter-mcp-tools.',
            reason
          );
        });
    }

    // Create the widget
    const widget = new MCPToolsWidget();

    // Add widget to left sidebar
    labShell.add(widget, 'left', { rank: 500 });

    // Wait for JupyterLab to be fully restored before initializing WebSocket
    app.restored.then(() => {
      console.log('JupyterLab fully restored, initializing MCP Tools...');

      // Create WebSocket manager
      const wsManager = new MCPToolsWebSocket(app, widget);

      // Connect WebSocket (tool registration will happen in onopen)
      console.log('Connecting WebSocket...');
      wsManager.connect();
    });

    requestAPI<any>('get-example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The jupyter_mcp_tools server extension appears to be missing.\n${reason}`
        );
      });
  }
};

export default plugin;
