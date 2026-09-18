/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */

import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { INotebookTracker, Notebook } from '@jupyterlab/notebook';
import { CodeCell } from '@jupyterlab/cells';

const SETTINGS_PLUGIN_ID = '@datalayer/jupyter-mcp-tools:plugin';
const SHOW_CELL_INDEXES_SETTING = 'showCellIndexes';

function deferUntilAfterRender(callback: () => void): void {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(callback);
  });
}

function resetCellPrompt(cell: CodeCell): void {
  const prompt =
    cell.model.executionState === 'running'
      ? '*'
      : `${cell.model.executionCount || ''}`;
  cell.inputArea?.setPrompt(prompt);
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
function setupNotebookPrompts(
  notebook: Notebook,
  showCellIndexes: () => boolean
): () => void {
  console.log('Setting up indexed prompts for notebook');

  const cellListeners = new WeakMap<CodeCell, () => void>();

  const scheduleCellPromptUpdate = (codeCell: CodeCell) => {
    deferUntilAfterRender(() => {
      const currentIndex = notebook.widgets.indexOf(codeCell);
      if (currentIndex !== -1) {
        if (showCellIndexes()) {
          updateCellPrompt(codeCell, currentIndex);
        } else {
          resetCellPrompt(codeCell);
        }
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
        if (showCellIndexes()) {
          updateCellPrompt(codeCell, index);
        } else {
          resetCellPrompt(codeCell);
        }
      });
    });
  };

  refreshNotebookPrompts();

  // Watch for new, removed, or reordered cells.
  notebook.model?.cells.changed.connect(() => {
    refreshNotebookPrompts();
  });

  return refreshNotebookPrompts;
}

/**
 * Initialization data for the input prompt plugin
 */
const inputPromptPlugin: JupyterFrontEndPlugin<void> = {
  id: '@datalayer/jupyter-mcp-tools:input-prompt',
  description: 'Custom input prompt that shows cell index.',
  autoStart: true,
  requires: [INotebookTracker],
  optional: [ISettingRegistry],
  activate: (
    app: JupyterFrontEnd,
    notebookTracker: INotebookTracker,
    settingRegistry: ISettingRegistry | null
  ) => {
    console.log(
      'JupyterLab extension @datalayer/jupyter-mcp-tools:input-prompt is activated!'
    );

    let showCellIndexes = false;
    const notebooks = new Set<Notebook>();
    const notebookRefreshers = new WeakMap<Notebook, () => void>();

    const refreshAllNotebooks = () => {
      notebooks.forEach(notebook => {
        notebookRefreshers.get(notebook)?.();
      });
    };

    const initializeNotebook = (notebook: Notebook) => {
      if (notebookRefreshers.has(notebook)) {
        notebookRefreshers.get(notebook)?.();
        return;
      }

      notebooks.add(notebook);
      notebookRefreshers.set(
        notebook,
        setupNotebookPrompts(notebook, () => showCellIndexes)
      );
      notebook.disposed.connect(() => {
        notebooks.delete(notebook);
      });
    };

    if (settingRegistry) {
      settingRegistry
        .load(SETTINGS_PLUGIN_ID)
        .then(settings => {
          const syncSettings = () => {
            showCellIndexes =
              settings.get(SHOW_CELL_INDEXES_SETTING).composite === true;
            refreshAllNotebooks();
          };

          settings.changed.connect(syncSettings);
          syncSettings();
        })
        .catch(reason => {
          console.error(
            'Failed to load input prompt settings for @datalayer/jupyter-mcp-tools.',
            reason
          );
        });
    }

    // Setup prompts for new notebooks
    notebookTracker.widgetAdded.connect((sender, panel) => {
      console.log('Notebook opened - setting up indexed prompts');
      const notebook = panel.content;

      // Wait for notebook to be ready
      panel.revealed.then(() => {
        initializeNotebook(notebook);
      });
    });

    // Setup prompts for currently open notebooks
    notebookTracker.forEach(panel => {
      initializeNotebook(panel.content);
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
