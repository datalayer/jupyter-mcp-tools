/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { ILabShell } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';

import { requestAPI } from './handler';
import { MCPToolsWidget } from './components/MCPToolsWidget';
import { registerCommands } from './commands';
import { MCPToolsWebSocket } from './websocket';
import inputPromptPlugins from './inputPrompt';

/**
 * Initialization data for the @datalayer/jupyter-mcp-tools extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: '@datalayer/jupyter-mcp-tools:plugin',
  description: 'Jupyter MCP Tools.',
  autoStart: true,
  optional: [ISettingRegistry],
  requires: [ILabShell, INotebookTracker],
  activate: (
    app: JupyterFrontEnd,
    labShell: ILabShell,
    notebookTracker: INotebookTracker,
    settingRegistry: ISettingRegistry | null
  ) => {
    console.log(
      'JupyterLab extension @datalayer/jupyter-mcp-tools is activated!'
    );

    // Register MCP Tools commands
    registerCommands(app, notebookTracker);

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

/**
 * Export all plugins as an array
 */
const plugins: JupyterFrontEndPlugin<any>[] = [plugin, ...inputPromptPlugins];

export default plugins;
