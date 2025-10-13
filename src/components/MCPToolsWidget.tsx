/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */

import { ReactWidget } from '@jupyterlab/apputils';
import { LabIcon } from '@jupyterlab/ui-components';
import React from 'react';
import { MCPToolsPanel } from './MCPToolsPanel';

/**
 * MCP Tools icon
 */
const mcpIcon = new LabIcon({
  name: '@datalayer/jupyter-mcp-tools:icon',
  svgstr: `
    <svg fill="currentColor" fill-rule="evenodd" height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>ModelContextProtocol</title><path d="M15.688 2.343a2.588 2.588 0 00-3.61 0l-9.626 9.44a.863.863 0 01-1.203 0 .823.823 0 010-1.18l9.626-9.44a4.313 4.313 0 016.016 0 4.116 4.116 0 011.204 3.54 4.3 4.3 0 013.609 1.18l.05.05a4.115 4.115 0 010 5.9l-8.706 8.537a.274.274 0 000 .393l1.788 1.754a.823.823 0 010 1.18.863.863 0 01-1.203 0l-1.788-1.753a1.92 1.92 0 010-2.754l8.706-8.538a2.47 2.47 0 000-3.54l-.05-.049a2.588 2.588 0 00-3.607-.003l-7.172 7.034-.002.002-.098.097a.863.863 0 01-1.204 0 .823.823 0 010-1.18l7.273-7.133a2.47 2.47 0 00-.003-3.537z"></path><path d="M14.485 4.703a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a4.115 4.115 0 000 5.9 4.314 4.314 0 006.016 0l7.12-6.982a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a2.588 2.588 0 01-3.61 0 2.47 2.47 0 010-3.54l7.12-6.982z"></path></svg>`
});

/**
 * ITool interface
 */
export interface ITool {
  id: string;
  label: string;
  caption: string;
  usage: string;
  isEnabled: boolean;
  parameters: any;
}

/**
 * IMessage log entry interface
 */
export interface IMessageLog {
  id: string;
  timestamp: Date;
  direction: 'sent' | 'received';
  type: string;
  data: any;
}

/**
 * MCP Tools Widget - JupyterLab widget wrapper for React component
 */
export class MCPToolsWidget extends ReactWidget {
  private _tools: ITool[] = [];
  private _messages: IMessageLog[] = [];
  private _executeCallbackLocal:
    | ((toolId: string, parameters: any) => void)
    | null = null;
  private _executeCallbackRemote:
    | ((toolId: string, parameters: any) => void)
    | null = null;

  constructor() {
    super();
    this.addClass('jp-MCPToolsWidget');
    this.id = 'mcp-tools-widget';
    this.title.label = ''; // No text label, only icon
    this.title.caption = 'Model Context Protocol Tools';
    this.title.icon = mcpIcon;
    this.title.closable = true;
  }

  /**
   * Set the tools list
   */
  setTools(tools: ITool[]): void {
    console.log(`MCPToolsWidget.setTools() called with ${tools.length} tools`);
    this._tools = tools;
    this.update();
    console.log(`MCPToolsWidget._tools now has ${this._tools.length} tools`);
  }

  /**
   * Get current tools
   */
  getTools(): ITool[] {
    return this._tools;
  }

  /**
   * Add a message to the log
   */
  addMessage(direction: 'sent' | 'received', type: string, data: any): void {
    const message: IMessageLog = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      direction,
      type,
      data
    };
    this._messages.push(message);

    // Keep only last 100 messages
    if (this._messages.length > 100) {
      this._messages = this._messages.slice(-100);
    }

    this.update();
  }

  /**
   * Clear all messages
   */
  clearMessages(): void {
    this._messages = [];
    this.update();
  }

  /**
   * Set callback for local tool execution
   */
  setExecuteCallbackLocal(
    callback: (toolId: string, parameters: any) => void
  ): void {
    this._executeCallbackLocal = callback;
  }

  /**
   * Set callback for remote tool execution
   */
  setExecuteCallbackRemote(
    callback: (toolId: string, parameters: any) => void
  ): void {
    this._executeCallbackRemote = callback;
  }

  /**
   * Handle local tool execution
   */
  private handleExecuteToolLocal = (toolId: string, parameters: any): void => {
    if (this._executeCallbackLocal) {
      this._executeCallbackLocal(toolId, parameters);
    }
  };

  /**
   * Handle remote tool execution
   */
  private handleExecuteToolRemote = (toolId: string, parameters: any): void => {
    if (this._executeCallbackRemote) {
      this._executeCallbackRemote(toolId, parameters);
    }
  };

  /**
   * Render the React component
   */
  protected render(): React.ReactElement {
    console.log(
      `MCPToolsWidget.render() called with ${this._tools.length} tools and ${this._messages.length} messages`
    );
    return (
      <MCPToolsPanel
        tools={this._tools}
        messages={this._messages}
        onExecuteToolLocal={this.handleExecuteToolLocal}
        onExecuteToolRemote={this.handleExecuteToolRemote}
      />
    );
  }
}
