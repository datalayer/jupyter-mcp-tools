/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */

import { JupyterFrontEnd } from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { NotebookActions } from '@jupyterlab/notebook';

/**
 * Command IDs
 */
export namespace CommandIDs {
  export const appendExecute = 'notebook:append-execute';
  export const getSelectedCell = 'notebook:get-selected-cell';
}

/**
 * Interface for the notebook:append-execute command arguments
 */
export interface IAppendExecuteArgs {
  /**
   * The source code to insert in the cell
   */
  source?: string;

  /**
   * The cell type (code, markdown, or raw)
   */
  type?: 'code' | 'markdown' | 'raw';
}

/**
 * Register all MCP Tools commands
 */
export function registerCommands(
  app: JupyterFrontEnd,
  notebookTracker: INotebookTracker
): void {
  /**
   * Command: notebook:append-execute
   *
   * Appends a new cell at the end of the current notebook with the given source
   * and optionally executes it if it's a code cell.
   */
  app.commands.addCommand(CommandIDs.appendExecute, {
    label: 'Append and Execute Cell',
    caption: 'Append a new cell at the end of the notebook and execute it',
    execute: async (args: any) => {
      const { source = '', type = 'code' } = args as IAppendExecuteArgs;

      // Get the current notebook panel
      const current = notebookTracker.currentWidget;
      if (!current) {
        console.error('No active notebook found');
        throw new Error('No active notebook found');
      }

      const notebook = current.content;

      // Move to the last cell
      const lastCellIndex = notebook.widgets.length - 1;
      if (lastCellIndex >= 0) {
        notebook.activeCellIndex = lastCellIndex;
      }

      // Insert a new cell below the current (last) cell
      NotebookActions.insertBelow(notebook);

      // Get the newly created cell (now the active cell)
      const activeCell = notebook.activeCell;
      if (!activeCell) {
        console.error('Failed to create new cell');
        throw new Error('Failed to create new cell');
      }

      // Set the cell type
      if (type !== 'code') {
        NotebookActions.changeCellType(notebook, type);
      }

      // Set the cell source
      activeCell.model.sharedModel.setSource(source);

      // Execute the cell if it's a code cell
      if (type === 'code') {
        await NotebookActions.run(notebook, current.sessionContext);
        console.log('Cell appended and executed successfully');
      } else {
        console.log(`Cell appended as ${type} (not executed)`);
      }

      return {
        success: true,
        cellType: type,
        cellIndex: notebook.activeCellIndex
      };
    }
  });

  /**
   * Command: notebook:get-selected-cell
   *
   * Gets information about the currently selected cell without executing it.
   */
  app.commands.addCommand(CommandIDs.getSelectedCell, {
    label: 'Get Selected Cell',
    caption: 'Get information about the currently selected cell',
    execute: () => {
      // Get the current notebook panel
      const current = notebookTracker.currentWidget;
      
      if (!current) {
        console.warn('No active notebook');
        return {
          error: 'No active notebook',
          success: false
        };
      }

      const notebook = current.content;
      const activeCell = notebook.activeCell;

      if (!activeCell) {
        console.warn('No active cell in notebook');
        return {
          error: 'No active cell',
          success: false
        };
      }

      const cellIndex = notebook.widgets.indexOf(activeCell);

      const cellInfo = {
        success: true,
        cellType: activeCell.model.type,
        cellIndex: cellIndex,
        source: activeCell.model.sharedModel.getSource(),
        metadata: activeCell.model.metadata,
        executionCount: activeCell.model.type === 'code' 
          ? (activeCell.model as any).executionCount 
          : null
      };

      console.log('Selected cell information:', cellInfo);
      
      const message = `Cell ${cellIndex + 1} (${cellInfo.cellType}): ${
        cellInfo.source.substring(0, 50)
      }${cellInfo.source.length > 50 ? '...' : ''}`;
      
      console.log(message);

      return cellInfo;
    },
    isEnabled: () => {
      return notebookTracker.currentWidget !== null;
    }
  });

  console.log('MCP Tools commands registered');
}
