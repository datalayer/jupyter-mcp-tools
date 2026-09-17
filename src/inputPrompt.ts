/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { INotebookTracker, Notebook } from '@jupyterlab/notebook';
import { CodeCell } from '@jupyterlab/cells';

function deferUntilAfterRender(callback: () => void): void {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(callback);
  });
}

/**
 * Update a code cell's input prompt to show the cell index
 */
function updateCellPrompt(cell: CodeCell, index: number): void {
  const prompt = cell.inputArea?.promptNode;
  if (prompt) {
    const executionCount = cell.model.executionCount;

    // Clear existing content
    prompt.replaceChildren();

    if (executionCount !== null && executionCount !== undefined) {
      // Show execution count in default style
      const execSpan = document.createElement('span');
      execSpan.textContent = `[${executionCount}]`;
      execSpan.className = 'jp-mcp-exec-count';
      prompt.appendChild(execSpan);

      // Show cell index in different style
      const indexSpan = document.createElement('span');
      indexSpan.textContent = `[${index}]`;
      indexSpan.className = 'jp-mcp-cell-index';
      prompt.appendChild(indexSpan);

      // Add colon
      const colon = document.createElement('span');
      colon.textContent = ':';
      prompt.appendChild(colon);
    } else {
      // No execution yet, show cell index only
      const indexSpan = document.createElement('span');
      indexSpan.textContent = `[${index}]`;
      indexSpan.className = 'jp-mcp-cell-index';
      prompt.appendChild(indexSpan);

      // Add colon
      const colon = document.createElement('span');
      colon.textContent = ':';
      prompt.appendChild(colon);
    }

    console.log(`Updated prompt for cell ${index}`);
  }
}

/**
 * Setup prompt updates for all cells in a notebook
 */
function setupNotebookPrompts(notebook: Notebook): void {
  console.log('Setting up indexed prompts for notebook');

  const cellListeners = new WeakMap<CodeCell, () => void>();

  const scheduleCellPromptUpdate = (codeCell: CodeCell) => {
    deferUntilAfterRender(() => {
      const currentIndex = notebook.widgets.indexOf(codeCell);
      if (currentIndex !== -1) {
        updateCellPrompt(codeCell, currentIndex);
      }
    });
  };

  const trackCodeCell = (codeCell: CodeCell) => {
    if (cellListeners.has(codeCell)) {
      return;
    }

    const refreshPrompt = () => {
      scheduleCellPromptUpdate(codeCell);
    };

    cellListeners.set(codeCell, refreshPrompt);
    codeCell.model.stateChanged.connect(refreshPrompt);
    codeCell.disposed.connect(() => {
      codeCell.model.stateChanged.disconnect(refreshPrompt);
      cellListeners.delete(codeCell);
    });
  };

  const refreshNotebookPrompts = () => {
    deferUntilAfterRender(() => {
      notebook.widgets.forEach((cell, index) => {
        if (cell.model.type !== 'code') {
          return;
        }

        const codeCell = cell as CodeCell;
        trackCodeCell(codeCell);
        updateCellPrompt(codeCell, index);
      });
    });
  };

  refreshNotebookPrompts();

  // Watch for new, removed, or reordered cells.
  notebook.model?.cells.changed.connect(() => {
    refreshNotebookPrompts();
  });
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

    // Setup prompts for new notebooks
    notebookTracker.widgetAdded.connect((sender, panel) => {
      console.log('Notebook opened - setting up indexed prompts');
      const notebook = panel.content;
      
      // Wait for notebook to be ready
      panel.revealed.then(() => {
        setupNotebookPrompts(notebook);
      });
    });

    // Setup prompts for currently open notebooks
    notebookTracker.forEach(panel => {
      setupNotebookPrompts(panel.content);
    });

    // Register custom CSS for the indexed input prompt
    const style = document.createElement('style');
    style.textContent = `
      .jp-InputPrompt {
        min-width: auto !important;
        width: auto !important;
        overflow: visible !important;
      }
      
      .jp-mcp-exec-count {
        color: var(--jp-content-font-color1);
        font-weight: bold;
      }
      
      .jp-mcp-cell-index {
        color: var(--jp-warn-color1);
        font-size: 0.85em;
        font-style: italic;
        opacity: 0.8;
        margin-left: 2px;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(style);

    console.log('Indexed input prompt plugin ready');
  }
};

export default inputPromptPlugin;

