/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { INotebookTracker, NotebookPanel, Notebook } from '@jupyterlab/notebook';
import { IInputPrompt, InputPrompt, Cell } from '@jupyterlab/cells';

/**
 * Custom Input Prompt that displays the cell index
 */
class IndexedInputPrompt extends InputPrompt {
  constructor() {
    super();
    this.addClass('jp-mcp-indexed-input-prompt');
  }

  /**
   * Get the cell index from the notebook
   */
  private getCellIndex(): number | null {
    try {
      const cell = this.parent?.parent as Cell | undefined;
      if (cell?.parent) {
        const notebook = cell.parent as Notebook;
        if (notebook.widgets) {
          const index = notebook.widgets.indexOf(cell);
          return index !== -1 ? index : null;
        }
      }
    } catch (e) {
      // Silently fail if we can't determine the index
    }
    return null;
  }

  /**
   * Override to append cell index to the prompt
   */
  set executionCount(value: string | null) {
    // Get the original execution count
    const count = value;
    
    // Try to get cell index
    const cellIndex = this.getCellIndex();
    
    if (count !== null && count !== undefined) {
      // Show execution count with cell index appended
      if (cellIndex !== null) {
        this.node.textContent = `[${count}|${cellIndex + 1}]:`;
      } else {
        this.node.textContent = `[${count}]:`;
      }
    } else {
      // No execution yet, show cell index only
      if (cellIndex !== null) {
        this.node.textContent = `[${cellIndex + 1}]:`;
      } else {
        this.node.textContent = '[ ]:';
      }
    }
  }

  get executionCount(): string | null {
    return this.node.textContent || null;
  }
}

/**
 * Custom ContentFactory that creates indexed input prompts
 * 
 * To fully integrate this factory:
 * 1. Register it with the INotebookWidgetFactory service
 * 2. Or provide it when creating new NotebookPanel instances
 * 
 * Example usage:
 *   const factory = new IndexedInputPromptContentFactory();
 *   const panel = new NotebookPanel({ contentFactory: factory, ... });
 */
export class IndexedInputPromptContentFactory extends NotebookPanel.ContentFactory {
  /**
   * Create an input prompt widget
   * @override
   */
  createInputPrompt(): IInputPrompt {
    return new IndexedInputPrompt();
  }
}

/**
 * Initialization data for the input prompt plugin
 */
const inputPromptPlugin: JupyterFrontEndPlugin<void> = {
  id: '@datalayer/jupyter-mcp-tools:input-prompt',
  description: 'Custom input prompt that shows cell index.',
  autoStart: true,
  requires: [INotebookTracker],
  activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker) => {
    console.log(
      'JupyterLab extension @datalayer/jupyter-mcp-tools:input-prompt is activated!'
    );

    // Track when new notebooks are created/opened
    notebookTracker.widgetAdded.connect((sender, panel) => {
      // Log that we have custom input prompt support
      console.log('Notebook opened with custom input prompt support');
    });

    // Register custom CSS for the indexed input prompt
    const style = document.createElement('style');
    style.textContent = `
      .jp-mcp-indexed-input-prompt {
        font-weight: bold;
        color: var(--jp-content-font-color1);
      }
    `;
    document.head.appendChild(style);
  }
};

export default inputPromptPlugin;
