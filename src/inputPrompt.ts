/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { INotebookTracker, NotebookPanel, Notebook } from '@jupyterlab/notebook';
import { CodeCell } from '@jupyterlab/cells';

/**
 * Update a code cell's input prompt to show the cell index
 */
function updateCellPrompt(cell: CodeCell, index: number): void {
  const prompt = cell.inputArea?.promptNode;
  if (prompt) {
    const executionCount = cell.model.executionCount;
    
    if (executionCount !== null && executionCount !== undefined) {
      // Show execution count with cell index appended
      prompt.textContent = `[${executionCount}|${index + 1}]:`;
    } else {
      // No execution yet, show cell index only
      prompt.textContent = `[${index + 1}]:`;
    }
    
    // Add custom class for styling
    prompt.classList.add('jp-mcp-indexed-input-prompt');
    console.log(`Updated prompt for cell ${index + 1}:`, prompt.textContent);
  }
}

/**
 * Setup prompt updates for all cells in a notebook
 */
function setupNotebookPrompts(notebook: Notebook): void {
  console.log('Setting up indexed prompts for notebook');
  
  // Update existing cells
  notebook.widgets.forEach((cell, index) => {
    if (cell.model.type === 'code') {
      updateCellPrompt(cell as CodeCell, index);
    }
  });
  
  // Watch for execution count changes
  notebook.widgets.forEach((cell, index) => {
    if (cell.model.type === 'code') {
      const codeCell = cell as CodeCell;
      codeCell.model.stateChanged.connect(() => {
        const currentIndex = notebook.widgets.indexOf(cell);
        if (currentIndex !== -1) {
          updateCellPrompt(codeCell, currentIndex);
        }
      });
    }
  });
  
  // Watch for new cells
  notebook.model?.cells.changed.connect(() => {
    setTimeout(() => {
      notebook.widgets.forEach((cell, index) => {
        if (cell.model.type === 'code') {
          updateCellPrompt(cell as CodeCell, index);
        }
      });
    }, 100);
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
      .jp-mcp-indexed-input-prompt {
        font-weight: bold !important;
        color: var(--jp-content-font-color1) !important;
      }
    `;
    document.head.appendChild(style);

    console.log('Indexed input prompt plugin ready');
  }
};

export default inputPromptPlugin;

