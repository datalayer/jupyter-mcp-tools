"use strict";
(self["webpackChunkyezq_mcp_tools"] = self["webpackChunkyezq_mcp_tools"] || []).push([["lib_index_js"],{

/***/ "./lib/commands.js"
/*!*************************!*\
  !*** ./lib/commands.js ***!
  \*************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CommandIDs: () => (/* binding */ CommandIDs),
/* harmony export */   registerCommands: () => (/* binding */ registerCommands)
/* harmony export */ });
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/notebook */ "webpack/sharing/consume/default/@jupyterlab/notebook");
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_0__);
/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */

/**
 * Command IDs
 */
var CommandIDs;
(function (CommandIDs) {
    CommandIDs.appendExecute = 'notebook:append-execute';
    CommandIDs.getSelectedCell = 'notebook:get-selected-cell';
})(CommandIDs || (CommandIDs = {}));
/**
 * Register all MCP Tools commands
 */
function registerCommands(app, notebookTracker) {
    /**
     * Command: notebook:append-execute
     *
     * Appends a new cell at the end of the current notebook with the given source
     * and optionally executes it if it's a code cell.
     */
    app.commands.addCommand(CommandIDs.appendExecute, {
        label: 'Append and Execute Cell',
        caption: 'Append a new cell at the end of the notebook and execute it',
        execute: async (args) => {
            const { source = '', type = 'code' } = args;
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
            _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_0__.NotebookActions.insertBelow(notebook);
            // Get the newly created cell (now the active cell)
            const activeCell = notebook.activeCell;
            if (!activeCell) {
                console.error('Failed to create new cell');
                throw new Error('Failed to create new cell');
            }
            // Set the cell type
            if (type !== 'code') {
                _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_0__.NotebookActions.changeCellType(notebook, type);
            }
            // Set the cell source
            activeCell.model.sharedModel.setSource(source);
            // Execute the cell if it's a code cell
            if (type === 'code') {
                await _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_0__.NotebookActions.run(notebook, current.sessionContext);
                console.log('Cell appended and executed successfully');
            }
            else {
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
                    ? activeCell.model.executionCount
                    : null
            };
            console.log('Selected cell information:', cellInfo);
            const message = `Cell ${cellIndex + 1} (${cellInfo.cellType}): ${cellInfo.source.substring(0, 50)}${cellInfo.source.length > 50 ? '...' : ''}`;
            console.log(message);
            return cellInfo;
        },
        isEnabled: () => {
            return notebookTracker.currentWidget !== null;
        }
    });
    console.log('MCP Tools commands registered');
}


/***/ },

/***/ "./lib/components/MCPToolsPanel.js"
/*!*****************************************!*\
  !*** ./lib/components/MCPToolsPanel.js ***!
  \*****************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MCPToolsPanel: () => (/* binding */ MCPToolsPanel)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */

/**
 * Tool item component with parameter form
 */
const ToolItem = ({ tool, onExecuteLocal, onExecuteRemote }) => {
    var _a, _b;
    const [showForm, setShowForm] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    const [parameters, setParameters] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('{}');
    const [error, setError] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null);
    // Check if tool has parameters defined
    const hasParameters = tool.parameters &&
        tool.parameters.properties &&
        Object.keys(tool.parameters.properties).length > 0;
    // Generate default parameters from schema
    const generateDefaultParameters = () => {
        if (!hasParameters) {
            return '{}';
        }
        const properties = tool.parameters.properties;
        const defaults = {};
        for (const [key, prop] of Object.entries(properties)) {
            const typedProp = prop;
            if (typedProp.default !== undefined) {
                defaults[key] = typedProp.default;
            }
            else if (typedProp.type === 'string') {
                defaults[key] = typedProp.description
                    ? `<${typedProp.description}>`
                    : '';
            }
            else if (typedProp.type === 'number') {
                defaults[key] = 0;
            }
            else if (typedProp.type === 'boolean') {
                defaults[key] = false;
            }
            else if (typedProp.type === 'array') {
                defaults[key] = [];
            }
            else if (typedProp.type === 'object') {
                defaults[key] = {};
            }
            else {
                defaults[key] = null;
            }
        }
        return JSON.stringify(defaults, null, 2);
    };
    const handleExecute = (mode) => {
        // If tool has parameters and form is not shown, show the form first
        if (hasParameters && !showForm) {
            setShowForm(true);
            // Initialize with default parameter structure
            setParameters(generateDefaultParameters());
            return;
        }
        // Execute the tool
        try {
            const parsedParams = JSON.parse(parameters);
            if (mode === 'local') {
                onExecuteLocal(tool.id, parsedParams);
            }
            else {
                onExecuteRemote(tool.id, parsedParams);
            }
            setShowForm(false);
            setError(null);
            setParameters('{}'); // Reset parameters after execution
        }
        catch (e) {
            setError('Invalid JSON format');
        }
    };
    const handleCancel = () => {
        setShowForm(false);
        setError(null);
        setParameters('{}');
    };
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-tool-item" },
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-tool-header" },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-tool-info" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-tool-label", title: tool.caption },
                    tool.label || tool.id,
                    hasParameters && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", { className: "mcp-tool-param-badge", title: "This command requires parameters" }, "params"))),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-tool-id" }, tool.id)),
            !showForm && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-tool-buttons" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", { className: "mcp-tool-button mcp-button-local jp-Button jp-mod-small", onClick: () => handleExecute('local'), disabled: !tool.isEnabled, title: "Execute command locally" }, "Local"),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", { className: "mcp-tool-button mcp-button-remote jp-Button jp-mod-small jp-mod-styled", onClick: () => handleExecute('remote'), disabled: !tool.isEnabled, title: "Execute command via WebSocket" }, "Remote")))),
        showForm && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-tool-form" },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-form-header" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", { className: "mcp-form-title" }, "Parameters"),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", { className: "mcp-form-close", onClick: handleCancel, title: "Cancel" }, "\u00D7")),
            ((_a = tool.parameters) === null || _a === void 0 ? void 0 : _a.description) && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-form-description" }, tool.parameters.description)),
            ((_b = tool.parameters) === null || _b === void 0 ? void 0 : _b.required) && tool.parameters.required.length > 0 && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-form-required" },
                "Required: ",
                tool.parameters.required.join(', '))),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("textarea", { className: "mcp-form-input", value: parameters, onChange: e => setParameters(e.target.value), placeholder: '{"source": "print(\\"Hello!\\")", "type": "code"}', rows: 6 }),
            error && react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-form-error" }, error),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-form-actions" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", { className: "jp-Button jp-mod-small jp-mod-reject", onClick: handleCancel }, "Cancel"),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", { className: "jp-Button jp-mod-small", onClick: () => handleExecute('local'), title: "Execute locally" }, "Local"),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", { className: "jp-Button jp-mod-small jp-mod-accept", onClick: () => handleExecute('remote'), title: "Execute via WebSocket" }, "Remote"))))));
};
/**
 * Message log item component
 */
const MessageLogItem = ({ message }) => {
    const [expanded, setExpanded] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: `mcp-message-item mcp-message-${message.direction}` },
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-message-header", onClick: () => setExpanded(!expanded) },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-message-info" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", { className: `mcp-message-direction mcp-${message.direction}` }, message.direction === 'sent' ? '→' : '←'),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", { className: "mcp-message-type" }, message.type),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", { className: "mcp-message-time" }, message.timestamp.toLocaleTimeString())),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", { className: "mcp-message-expand" }, expanded ? '▼' : '▶')),
        expanded && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-message-body" },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("pre", null, JSON.stringify(message.data, null, 2))))));
};
/**
 * Main MCP Tools Panel component
 */
const MCPToolsPanel = ({ tools, messages, onExecuteToolLocal, onExecuteToolRemote }) => {
    const [activeTab, setActiveTab] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('tools');
    const [searchTerm, setSearchTerm] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)('');
    const [showOnlyWithParams, setShowOnlyWithParams] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false);
    // Debug logging
    console.log(`MCPToolsPanel render: ${tools.length} tools, ${messages.length} messages`);
    // Filter tools based on search term and parameter filter
    const filteredTools = tools.filter((tool) => {
        // Search term filter
        const matchesSearch = tool.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tool.label &&
                tool.label.toLowerCase().includes(searchTerm.toLowerCase()));
        // Parameter filter
        const hasParameters = tool.parameters &&
            tool.parameters.properties &&
            Object.keys(tool.parameters.properties).length > 0;
        const matchesParamFilter = !showOnlyWithParams || hasParameters;
        return matchesSearch && matchesParamFilter;
    });
    console.log(`MCPToolsPanel: Filtered to ${filteredTools.length} tools (search: "${searchTerm}")`);
    return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-tools-panel" },
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-panel-header" },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-panel-stats" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", { title: "Total tools" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, tools.length),
                    " tools"),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", { className: "mcp-stats-separator" }, "\u2022"),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", { title: "Total messages" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("strong", null, messages.length),
                    " messages"))),
        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-panel-tabs" },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", { className: `mcp-tab ${activeTab === 'tools' ? 'mcp-tab-active' : ''}`, onClick: () => setActiveTab('tools') },
                "Commands (",
                filteredTools.length,
                ")"),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("button", { className: `mcp-tab ${activeTab === 'messages' ? 'mcp-tab-active' : ''}`, onClick: () => setActiveTab('messages') },
                "Messages (",
                messages.length,
                ")")),
        activeTab === 'tools' && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-panel-content" },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-search-box" },
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", { type: "text", className: "mcp-search-input jp-mod-styled", placeholder: "Search commands...", value: searchTerm, onChange: e => setSearchTerm(e.target.value) }),
                react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-filter-toggle" },
                    react__WEBPACK_IMPORTED_MODULE_0___default().createElement("label", { className: "mcp-toggle-label" },
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("input", { type: "checkbox", checked: showOnlyWithParams, onChange: e => setShowOnlyWithParams(e.target.checked), className: "mcp-toggle-checkbox" }),
                        react__WEBPACK_IMPORTED_MODULE_0___default().createElement("span", { className: "mcp-toggle-text" }, "Show only with parameters")))),
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-tools-list" }, filteredTools.length === 0 ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-empty-state" }, searchTerm ? 'No commands found' : 'Loading commands...')) : (filteredTools.map(tool => (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(ToolItem, { key: tool.id, tool: tool, onExecuteLocal: onExecuteToolLocal, onExecuteRemote: onExecuteToolRemote }))))))),
        activeTab === 'messages' && (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-panel-content" },
            react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-messages-list" }, messages.length === 0 ? (react__WEBPACK_IMPORTED_MODULE_0___default().createElement("div", { className: "mcp-empty-state" }, "No messages yet")) : (messages
                .slice()
                .reverse()
                .map(message => (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(MessageLogItem, { key: message.id, message: message })))))))));
};


/***/ },

/***/ "./lib/components/MCPToolsWidget.js"
/*!******************************************!*\
  !*** ./lib/components/MCPToolsWidget.js ***!
  \******************************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MCPToolsWidget: () => (/* binding */ MCPToolsWidget)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "webpack/sharing/consume/default/react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/apputils */ "webpack/sharing/consume/default/@jupyterlab/apputils");
/* harmony import */ var _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlab/ui-components */ "webpack/sharing/consume/default/@jupyterlab/ui-components");
/* harmony import */ var _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _MCPToolsPanel__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./MCPToolsPanel */ "./lib/components/MCPToolsPanel.js");
/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */




/**
 * MCP Tools icon
 */
const mcpIcon = new _jupyterlab_ui_components__WEBPACK_IMPORTED_MODULE_2__.LabIcon({
    name: '@datalayer/jupyter-mcp-tools:icon',
    svgstr: `
    <svg fill="currentColor" fill-rule="evenodd" height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>ModelContextProtocol</title><path d="M15.688 2.343a2.588 2.588 0 00-3.61 0l-9.626 9.44a.863.863 0 01-1.203 0 .823.823 0 010-1.18l9.626-9.44a4.313 4.313 0 016.016 0 4.116 4.116 0 011.204 3.54 4.3 4.3 0 013.609 1.18l.05.05a4.115 4.115 0 010 5.9l-8.706 8.537a.274.274 0 000 .393l1.788 1.754a.823.823 0 010 1.18.863.863 0 01-1.203 0l-1.788-1.753a1.92 1.92 0 010-2.754l8.706-8.538a2.47 2.47 0 000-3.54l-.05-.049a2.588 2.588 0 00-3.607-.003l-7.172 7.034-.002.002-.098.097a.863.863 0 01-1.204 0 .823.823 0 010-1.18l7.273-7.133a2.47 2.47 0 00-.003-3.537z"></path><path d="M14.485 4.703a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a4.115 4.115 0 000 5.9 4.314 4.314 0 006.016 0l7.12-6.982a.823.823 0 000-1.18.863.863 0 00-1.204 0l-7.119 6.982a2.588 2.588 0 01-3.61 0 2.47 2.47 0 010-3.54l7.12-6.982z"></path></svg>`
});
/**
 * MCP Tools Widget - JupyterLab widget wrapper for React component
 */
class MCPToolsWidget extends _jupyterlab_apputils__WEBPACK_IMPORTED_MODULE_1__.ReactWidget {
    constructor() {
        super();
        this._tools = [];
        this._messages = [];
        this._executeCallbackLocal = null;
        this._executeCallbackRemote = null;
        /**
         * Handle local tool execution
         */
        this.handleExecuteToolLocal = (toolId, parameters) => {
            if (this._executeCallbackLocal) {
                this._executeCallbackLocal(toolId, parameters);
            }
        };
        /**
         * Handle remote tool execution
         */
        this.handleExecuteToolRemote = (toolId, parameters) => {
            if (this._executeCallbackRemote) {
                this._executeCallbackRemote(toolId, parameters);
            }
        };
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
    setTools(tools) {
        console.log(`MCPToolsWidget.setTools() called with ${tools.length} tools`);
        this._tools = tools;
        this.update();
        console.log(`MCPToolsWidget._tools now has ${this._tools.length} tools`);
    }
    /**
     * Get current tools
     */
    getTools() {
        return this._tools;
    }
    /**
     * Add a message to the log
     */
    addMessage(direction, type, data) {
        const message = {
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
    clearMessages() {
        this._messages = [];
        this.update();
    }
    /**
     * Set callback for local tool execution
     */
    setExecuteCallbackLocal(callback) {
        this._executeCallbackLocal = callback;
    }
    /**
     * Set callback for remote tool execution
     */
    setExecuteCallbackRemote(callback) {
        this._executeCallbackRemote = callback;
    }
    /**
     * Render the React component
     */
    render() {
        console.log(`MCPToolsWidget.render() called with ${this._tools.length} tools and ${this._messages.length} messages`);
        return (react__WEBPACK_IMPORTED_MODULE_0___default().createElement(_MCPToolsPanel__WEBPACK_IMPORTED_MODULE_3__.MCPToolsPanel, { tools: this._tools, messages: this._messages, onExecuteToolLocal: this.handleExecuteToolLocal, onExecuteToolRemote: this.handleExecuteToolRemote }));
    }
}


/***/ },

/***/ "./lib/handler.js"
/*!************************!*\
  !*** ./lib/handler.js ***!
  \************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   requestAPI: () => (/* binding */ requestAPI)
/* harmony export */ });
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/services */ "webpack/sharing/consume/default/@jupyterlab/services");
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__);
/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */


/**
 * Call the API extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
async function requestAPI(endPoint = '', init = {}) {
    // Make request to Jupyter API
    const settings = _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.makeSettings();
    const requestUrl = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(settings.baseUrl, 'jupyter-mcp-tools', // API Namespace
    endPoint);
    let response;
    try {
        response = await _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.makeRequest(requestUrl, init, settings);
    }
    catch (error) {
        throw new _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.NetworkError(error);
    }
    let data = await response.text();
    if (data.length > 0) {
        try {
            data = JSON.parse(data);
        }
        catch (error) {
            console.log('Not a JSON response body.', response);
        }
    }
    if (!response.ok) {
        throw new _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.ResponseError(response, data.message || data);
    }
    return data;
}


/***/ },

/***/ "./lib/index.js"
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jupyterlab_settingregistry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/settingregistry */ "webpack/sharing/consume/default/@jupyterlab/settingregistry");
/* harmony import */ var _jupyterlab_settingregistry__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_settingregistry__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_application__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/application */ "webpack/sharing/consume/default/@jupyterlab/application");
/* harmony import */ var _jupyterlab_application__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_application__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlab/notebook */ "webpack/sharing/consume/default/@jupyterlab/notebook");
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _handler__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./handler */ "./lib/handler.js");
/* harmony import */ var _components_MCPToolsWidget__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./components/MCPToolsWidget */ "./lib/components/MCPToolsWidget.js");
/* harmony import */ var _commands__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./commands */ "./lib/commands.js");
/* harmony import */ var _websocket__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./websocket */ "./lib/websocket.js");
/* harmony import */ var _inputPrompt__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./inputPrompt */ "./lib/inputPrompt.js");
/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */








/**
 * Initialization data for the @datalayer/jupyter-mcp-tools extension.
 */
const plugin = {
    id: 'yezq-mcp-tools:plugin',
    description: 'Jupyter MCP Tools.',
    autoStart: true,
    optional: [_jupyterlab_settingregistry__WEBPACK_IMPORTED_MODULE_0__.ISettingRegistry],
    requires: [_jupyterlab_application__WEBPACK_IMPORTED_MODULE_1__.ILabShell, _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_2__.INotebookTracker],
    activate: (app, labShell, notebookTracker, settingRegistry) => {
        console.log('JupyterLab extension yezq-mcp-tools is activated!');
        console.log('@datalayer/jupyter-mcp-tools from YZQ Javascript End! Go workflows!');
        // Register MCP Tools commands
        (0,_commands__WEBPACK_IMPORTED_MODULE_5__.registerCommands)(app, notebookTracker);
        if (settingRegistry) {
            settingRegistry
                .load(plugin.id)
                .then(settings => {
                console.log('@datalayer/jupyter-mcp-tools settings loaded:', settings.composite);
            })
                .catch(reason => {
                console.error('Failed to load settings for @datalayer/jupyter-mcp-tools.', reason);
            });
        }
        // Create the widget
        const widget = new _components_MCPToolsWidget__WEBPACK_IMPORTED_MODULE_4__.MCPToolsWidget();
        // Add widget to left sidebar
        labShell.add(widget, 'left', { rank: 500 });
        // Wait for JupyterLab to be fully restored before initializing WebSocket
        app.restored.then(() => {
            console.log('JupyterLab fully restored, initializing MCP Tools...');
            // Create WebSocket manager
            const wsManager = new _websocket__WEBPACK_IMPORTED_MODULE_6__.MCPToolsWebSocket(app, widget);
            // Connect WebSocket (tool registration will happen in onopen)
            console.log('Connecting WebSocket...');
            wsManager.connect();
        });
        (0,_handler__WEBPACK_IMPORTED_MODULE_3__.requestAPI)('get-example')
            .then(data => {
            console.log(data);
        })
            .catch(reason => {
            console.error(`The jupyter_mcp_tools server extension appears to be missing.\n${reason}`);
        });
    }
};
/**
 * Export both plugins as an array
 */
const plugins = [plugin, _inputPrompt__WEBPACK_IMPORTED_MODULE_7__["default"]];
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (plugins);


/***/ },

/***/ "./lib/inputPrompt.js"
/*!****************************!*\
  !*** ./lib/inputPrompt.js ***!
  \****************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/notebook */ "webpack/sharing/consume/default/@jupyterlab/notebook");
/* harmony import */ var _jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_0__);
/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */

/**
 * Update a code cell's input prompt to show the cell index
 */
function updateCellPrompt(cell, index) {
    var _a;
    const prompt = (_a = cell.inputArea) === null || _a === void 0 ? void 0 : _a.promptNode;
    if (prompt) {
        const executionCount = cell.model.executionCount;
        // Clear existing content
        prompt.innerHTML = '';
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
        }
        else {
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
function setupNotebookPrompts(notebook) {
    var _a;
    console.log('Setting up indexed prompts for notebook');
    // Update existing cells
    notebook.widgets.forEach((cell, index) => {
        if (cell.model.type === 'code') {
            updateCellPrompt(cell, index);
        }
    });
    // Watch for execution count changes
    notebook.widgets.forEach((cell, index) => {
        if (cell.model.type === 'code') {
            const codeCell = cell;
            codeCell.model.stateChanged.connect(() => {
                const currentIndex = notebook.widgets.indexOf(cell);
                if (currentIndex !== -1) {
                    updateCellPrompt(codeCell, currentIndex);
                }
            });
        }
    });
    // Watch for new cells
    (_a = notebook.model) === null || _a === void 0 ? void 0 : _a.cells.changed.connect(() => {
        setTimeout(() => {
            notebook.widgets.forEach((cell, index) => {
                if (cell.model.type === 'code') {
                    updateCellPrompt(cell, index);
                }
            });
        }, 100);
    });
}
/**
 * Initialization data for the input prompt plugin
 */
const inputPromptPlugin = {
    id: '@datalayer/jupyter-mcp-tools:input-prompt',
    description: 'Custom input prompt that shows cell index.',
    autoStart: true,
    requires: [_jupyterlab_notebook__WEBPACK_IMPORTED_MODULE_0__.INotebookTracker],
    activate: (app, notebookTracker) => {
        console.log('JupyterLab extension @datalayer/jupyter-mcp-tools:input-prompt is activated!');
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
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (inputPromptPlugin);


/***/ },

/***/ "./lib/websocket.js"
/*!**************************!*\
  !*** ./lib/websocket.js ***!
  \**************************/
(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MCPToolsWebSocket: () => (/* binding */ MCPToolsWebSocket)
/* harmony export */ });
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/services */ "webpack/sharing/consume/default/@jupyterlab/services");
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__);
/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */


/**
 * Safely serialize a value for JSON transmission, handling circular references
 */
function safeSerialize(obj, maxDepth = 3, currentDepth = 0, seen = new WeakSet()) {
    // Handle primitives
    if (obj === null || obj === undefined) {
        return obj;
    }
    if (typeof obj === 'boolean' ||
        typeof obj === 'number' ||
        typeof obj === 'string') {
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
        const result = {};
        const keys = Object.keys(obj).slice(0, 100); // Limit to 100 keys
        for (const key of keys) {
            try {
                result[key] = safeSerialize(obj[key], maxDepth, currentDepth + 1, seen);
            }
            catch (e) {
                result[key] = '<serialization error>';
            }
        }
        return result;
    }
    // Fallback for functions and other types
    try {
        return String(obj);
    }
    catch (e) {
        return '<unserializable>';
    }
}
/**
 * WebSocket connection manager for MCP tools
 */
class MCPToolsWebSocket {
    constructor(app, widget) {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
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
    connect() {
        const settings = _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.makeSettings();
        const wsUrl = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(settings.wsUrl, 'jupyter-mcp-tools', 'echo');
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
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            setTimeout(() => this.connect(), this.reconnectDelay);
        }
        else {
            console.error('Max reconnection attempts reached');
        }
    }
    /**
     * Register all available JupyterLab commands as tools
     */
    async registerTools() {
        const commands = this.app.commands;
        const allCommandIds = commands.listCommands();
        console.log(`Total JupyterLab commands available: ${allCommandIds.length}`);
        const tools = [];
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
                }
                catch (e) {
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
                    console.warn(`Skipping command "${commandId}" - transformed tool ID "${toolId}" contains invalid characters for MCP (must match ^[a-zA-Z0-9_-]+$)`);
                    skippedCount++;
                    continue;
                }
                // Get command parameters using describedBy introspection
                const parameters = await this.getCommandParameters(commandId);
                const tool = {
                    id: toolId,
                    commandId: commandId, // Store original command ID for execution
                    label: label || toolId,
                    caption: caption || '',
                    usage: usage || '',
                    isEnabled: isEnabled,
                    parameters: parameters
                };
                tools.push(tool);
            }
            catch (error) {
                console.warn(`Error processing command ${commandId}:`, error);
            }
        }
        if (skippedCount > 0) {
            console.log(`Skipped ${skippedCount} commands with invalid MCP tool names`);
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
    async getCommandParameters(commandId) {
        try {
            // Define parameter schemas for known commands that require parameters
            const knownSchemas = {
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
        }
        catch (error) {
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
    handleMessage(data) {
        try {
            const message = JSON.parse(data);
            console.log('Received message:', message);
            // Log received message
            this.widget.addMessage('received', message.type || 'unknown', message);
            if (message.type === 'apply_tool') {
                this.applyToolFromServer(message.tool_id, message.parameters || {}, message.execution_id);
            }
        }
        catch (error) {
            console.error('Error handling message:', error);
        }
    }
    /**
     * Apply/execute a tool (command) - LOCAL execution (direct)
     */
    async applyToolLocal(toolId, parameters) {
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
            }
            else {
                console.error(`Command not found: ${commandId}`);
                this.widget.addMessage('sent', 'local_execute', {
                    tool_id: toolId,
                    parameters,
                    error: `Command not found: ${commandId}`,
                    success: false
                });
            }
        }
        catch (error) {
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
    async applyToolRemote(toolId, parameters) {
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
        }
        catch (error) {
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
    async applyToolFromServer(toolId, parameters, executionId) {
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
            }
            else {
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
        }
        catch (error) {
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
    sendMessage(message) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
            // Log sent message
            this.widget.addMessage('sent', message.type || 'unknown', message);
        }
        else {
            console.error('WebSocket is not connected');
        }
    }
    /**
     * Close the WebSocket connection
     */
    close() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}


/***/ }

}]);
//# sourceMappingURL=lib_index_js.f082699137a13a39cf6c.js.map