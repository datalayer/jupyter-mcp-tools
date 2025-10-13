/*
 * Copyright (c) 2023-2025 Datalayer, Inc.
 * Distributed under the terms of the Modified BSD License.
 */

import React, { useState } from 'react';

/**
 * Tool interface matching the registered tool structure
 */
interface ITool {
  id: string;
  label: string;
  caption: string;
  usage: string;
  isEnabled: boolean;
  parameters: any;
}

/**
 * Message log entry interface
 */
interface IMessageLog {
  id: string;
  timestamp: Date;
  direction: 'sent' | 'received';
  type: string;
  data: any;
}

/**
 * Props for MCPToolsPanel component
 */
interface IMCPToolsPanelProps {
  tools: ITool[];
  messages: IMessageLog[];
  onExecuteToolLocal: (toolId: string, parameters: any) => void;
  onExecuteToolRemote: (toolId: string, parameters: any) => void;
}

/**
 * Tool item component with parameter form
 */
const ToolItem: React.FC<{
  tool: ITool;
  onExecuteLocal: (toolId: string, parameters: any) => void;
  onExecuteRemote: (toolId: string, parameters: any) => void;
}> = ({ tool, onExecuteLocal, onExecuteRemote }) => {
  const [showForm, setShowForm] = useState(false);
  const [parameters, setParameters] = useState('{}');
  const [error, setError] = useState<string | null>(null);

  // Check if tool has parameters defined
  const hasParameters =
    tool.parameters &&
    tool.parameters.properties &&
    Object.keys(tool.parameters.properties).length > 0;

  // Generate default parameters from schema
  const generateDefaultParameters = () => {
    if (!hasParameters) {
      return '{}';
    }

    const properties = tool.parameters.properties;
    const defaults: any = {};

    for (const [key, prop] of Object.entries(properties)) {
      const typedProp = prop as any;
      if (typedProp.default !== undefined) {
        defaults[key] = typedProp.default;
      } else if (typedProp.type === 'string') {
        defaults[key] = typedProp.description
          ? `<${typedProp.description}>`
          : '';
      } else if (typedProp.type === 'number') {
        defaults[key] = 0;
      } else if (typedProp.type === 'boolean') {
        defaults[key] = false;
      } else if (typedProp.type === 'array') {
        defaults[key] = [];
      } else if (typedProp.type === 'object') {
        defaults[key] = {};
      } else {
        defaults[key] = null;
      }
    }

    return JSON.stringify(defaults, null, 2);
  };

  const handleExecute = (mode: 'local' | 'remote') => {
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
      } else {
        onExecuteRemote(tool.id, parsedParams);
      }
      setShowForm(false);
      setError(null);
      setParameters('{}'); // Reset parameters after execution
    } catch (e) {
      setError('Invalid JSON format');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setError(null);
    setParameters('{}');
  };

  return (
    <div className="mcp-tool-item">
      <div className="mcp-tool-header">
        <div className="mcp-tool-info">
          <div className="mcp-tool-label" title={tool.caption}>
            {tool.label || tool.id}
            {hasParameters && (
              <span
                className="mcp-tool-param-badge"
                title="This command requires parameters"
              >
                params
              </span>
            )}
          </div>
          <div className="mcp-tool-id">{tool.id}</div>
        </div>
        {!showForm && (
          <div className="mcp-tool-buttons">
            <button
              className="mcp-tool-button mcp-button-local jp-Button jp-mod-small"
              onClick={() => handleExecute('local')}
              disabled={!tool.isEnabled}
              title="Execute command locally"
            >
              Local
            </button>
            <button
              className="mcp-tool-button mcp-button-remote jp-Button jp-mod-small jp-mod-styled"
              onClick={() => handleExecute('remote')}
              disabled={!tool.isEnabled}
              title="Execute command via WebSocket"
            >
              Remote
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <div className="mcp-tool-form">
          <div className="mcp-form-header">
            <span className="mcp-form-title">Parameters</span>
            <button
              className="mcp-form-close"
              onClick={handleCancel}
              title="Cancel"
            >
              ×
            </button>
          </div>
          {tool.parameters?.description && (
            <div className="mcp-form-description">
              {tool.parameters.description}
            </div>
          )}
          {tool.parameters?.required && tool.parameters.required.length > 0 && (
            <div className="mcp-form-required">
              Required: {tool.parameters.required.join(', ')}
            </div>
          )}
          <textarea
            className="mcp-form-input"
            value={parameters}
            onChange={e => setParameters(e.target.value)}
            placeholder='{"source": "print(\"Hello!\")", "type": "code"}'
            rows={6}
          />
          {error && <div className="mcp-form-error">{error}</div>}
          <div className="mcp-form-actions">
            <button
              className="jp-Button jp-mod-small jp-mod-reject"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="jp-Button jp-mod-small"
              onClick={() => handleExecute('local')}
              title="Execute locally"
            >
              Local
            </button>
            <button
              className="jp-Button jp-mod-small jp-mod-accept"
              onClick={() => handleExecute('remote')}
              title="Execute via WebSocket"
            >
              Remote
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Message log item component
 */
const MessageLogItem: React.FC<{ message: IMessageLog }> = ({ message }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`mcp-message-item mcp-message-${message.direction}`}>
      <div
        className="mcp-message-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="mcp-message-info">
          <span className={`mcp-message-direction mcp-${message.direction}`}>
            {message.direction === 'sent' ? '→' : '←'}
          </span>
          <span className="mcp-message-type">{message.type}</span>
          <span className="mcp-message-time">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
        <span className="mcp-message-expand">{expanded ? '▼' : '▶'}</span>
      </div>
      {expanded && (
        <div className="mcp-message-body">
          <pre>{JSON.stringify(message.data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

/**
 * Main MCP Tools Panel component
 */
export const MCPToolsPanel: React.FC<IMCPToolsPanelProps> = ({
  tools,
  messages,
  onExecuteToolLocal,
  onExecuteToolRemote
}) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'messages'>('tools');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyWithParams, setShowOnlyWithParams] = useState(false);

  // Debug logging
  console.log(
    `MCPToolsPanel render: ${tools.length} tools, ${messages.length} messages`
  );

  // Filter tools based on search term and parameter filter
  const filteredTools = tools.filter((tool: ITool) => {
    // Search term filter
    const matchesSearch =
      tool.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tool.label &&
        tool.label.toLowerCase().includes(searchTerm.toLowerCase()));

    // Parameter filter
    const hasParameters =
      tool.parameters &&
      tool.parameters.properties &&
      Object.keys(tool.parameters.properties).length > 0;

    const matchesParamFilter = !showOnlyWithParams || hasParameters;

    return matchesSearch && matchesParamFilter;
  });

  console.log(
    `MCPToolsPanel: Filtered to ${filteredTools.length} tools (search: "${searchTerm}")`
  );

  return (
    <div className="mcp-tools-panel">
      <div className="mcp-panel-header">
        <div className="mcp-panel-stats">
          <span title="Total tools">
            <strong>{tools.length}</strong> tools
          </span>
          <span className="mcp-stats-separator">•</span>
          <span title="Total messages">
            <strong>{messages.length}</strong> messages
          </span>
        </div>
      </div>

      <div className="mcp-panel-tabs">
        <button
          className={`mcp-tab ${activeTab === 'tools' ? 'mcp-tab-active' : ''}`}
          onClick={() => setActiveTab('tools')}
        >
          Commands ({filteredTools.length})
        </button>
        <button
          className={`mcp-tab ${activeTab === 'messages' ? 'mcp-tab-active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Messages ({messages.length})
        </button>
      </div>

      {activeTab === 'tools' && (
        <div className="mcp-panel-content">
          <div className="mcp-search-box">
            <input
              type="text"
              className="mcp-search-input jp-mod-styled"
              placeholder="Search commands..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <div className="mcp-filter-toggle">
              <label className="mcp-toggle-label">
                <input
                  type="checkbox"
                  checked={showOnlyWithParams}
                  onChange={e => setShowOnlyWithParams(e.target.checked)}
                  className="mcp-toggle-checkbox"
                />
                <span className="mcp-toggle-text">
                  Show only with parameters
                </span>
              </label>
            </div>
          </div>

          <div className="mcp-tools-list">
            {filteredTools.length === 0 ? (
              <div className="mcp-empty-state">
                {searchTerm ? 'No commands found' : 'Loading commands...'}
              </div>
            ) : (
              filteredTools.map(tool => (
                <ToolItem
                  key={tool.id}
                  tool={tool}
                  onExecuteLocal={onExecuteToolLocal}
                  onExecuteRemote={onExecuteToolRemote}
                />
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="mcp-panel-content">
          <div className="mcp-messages-list">
            {messages.length === 0 ? (
              <div className="mcp-empty-state">No messages yet</div>
            ) : (
              messages
                .slice()
                .reverse()
                .map(message => (
                  <MessageLogItem key={message.id} message={message} />
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
