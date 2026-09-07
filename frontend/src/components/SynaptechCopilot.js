import React, { useState, useEffect, useRef } from 'react';
import './SynaptechCopilot.css';
import { apiService } from '../apiService';
import { useNotification } from '../NotificationContext';

const INITIAL_SUGGESTIONS = [
  'Evaluate Monolith vs Microservices',
  'How to optimize sprint velocity?',
  'OWASP security checklist',
  'Explain Event-Driven architecture'
];

const SynaptechCopilot = ({
  isOpen: propIsOpen,
  onToggle: propOnToggle,
  onClose: propOnClose,
  dockMode: propDockMode,
  onToggleDock: propOnToggleDock
}) => {
  // Support both controlled mode (from App.js) and internal standalone mode
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [internalDockMode, setInternalDockMode] = useState('docked');
  const [isMinimized, setIsMinimized] = useState(false);

  const isControlled = typeof propIsOpen === 'boolean';
  const isOpen = isControlled ? propIsOpen : internalIsOpen;
  const dockMode = propDockMode || internalDockMode;

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '👋 Hello! I am your Synaptech AI Copilot. Ask me anything about system architecture design, sprint velocity bottlenecks, or OWASP security remediation!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { showError } = useNotification();

  const scrollToBottom = () => {
    if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      // Auto-focus input when opened
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen, isMinimized]);

  // Global Keyboard shortcuts: Ctrl+/ or Cmd+/ to toggle, Esc to minimize or close
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        handleToggleOpen();
      } else if (e.key === 'Escape' && isOpen) {
        if (!isMinimized) {
          setIsMinimized(true);
        } else {
          handleClose();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, isMinimized]);

  const handleToggleOpen = () => {
    if (isControlled && propOnToggle) {
      propOnToggle();
    } else {
      setInternalIsOpen((prev) => !prev);
    }
    setIsMinimized(false);
  };

  const handleClose = () => {
    if (isControlled && propOnClose) {
      propOnClose();
    } else {
      setInternalIsOpen(false);
    }
    setIsMinimized(false);
  };

  const handleToggleDock = () => {
    if (propOnToggleDock) {
      propOnToggleDock();
    } else {
      setInternalDockMode((prev) => (prev === 'docked' ? 'floating' : 'docked'));
    }
  };

  const handleSendMessage = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await apiService.chatWithCopilot({
        message: textToSend,
        history: messages.map((m) => ({ role: m.role, content: m.text }))
      });

      const aiMsg = { role: 'assistant', text: response.reply };
      setMessages((prev) => [...prev, aiMsg]);
      if (response.suggestedPrompts && response.suggestedPrompts.length > 0) {
        setSuggestions(response.suggestedPrompts);
      }
    } catch (err) {
      showError('Copilot could not reach AI service.');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: '⚠️ Connection timeout. Please check your network or try again shortly.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    setMessages([{ role: 'assistant', text: 'Chat history cleared. How can I help you next?' }]);
    setSuggestions(INITIAL_SUGGESTIONS);
  };

  const renderFormattedMessage = (content) => {
    if (!content) return null;
    const lines = content.split('\n');
    const elements = [];
    let currentList = [];

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`ul-${elements.length}`} style={{ margin: '6px 0 10px 0', paddingLeft: '20px' }}>
            {currentList.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>
                {formatInlineTokens(item)}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    const formatInlineTokens = (str) => {
      const parts = [];
      const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(str)) !== null) {
        if (match.index > lastIndex) {
          parts.push(str.substring(lastIndex, match.index));
        }
        const token = match[0];
        if (token.startsWith('**') && token.endsWith('**')) {
          parts.push(<strong key={match.index} style={{ color: '#93c5fd' }}>{token.slice(2, -2)}</strong>);
        } else if (token.startsWith('`') && token.endsWith('`')) {
          parts.push(<code key={match.index} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: '4px', fontSize: '0.85em', color: '#f43f5e' }}>{token.slice(1, -1)}</code>);
        } else if (token.startsWith('*') && token.endsWith('*')) {
          parts.push(<em key={match.index} style={{ color: '#cbd5e1' }}>{token.slice(1, -1)}</em>);
        }
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < str.length) {
        parts.push(str.substring(lastIndex));
      }
      return parts.length > 0 ? parts : str;
    };

    lines.forEach((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) {
        flushList();
        elements.push(<div key={`sp-${i}`} style={{ height: '6px' }} />);
        return;
      }

      if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h4 key={`h4-${i}`} style={{ margin: '10px 0 6px 0', color: '#60a5fa', fontSize: '0.98rem', fontWeight: 700 }}>
            {formatInlineTokens(trimmed.substring(4))}
          </h4>
        );
      } else if (trimmed.startsWith('#### ')) {
        flushList();
        elements.push(
          <h5 key={`h5-${i}`} style={{ margin: '8px 0 4px 0', color: '#93c5fd', fontSize: '0.90rem', fontWeight: 600 }}>
            {formatInlineTokens(trimmed.substring(5))}
          </h5>
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        currentList.push(trimmed.substring(2));
      } else if (/^\d+\.\s/.test(trimmed)) {
        currentList.push(trimmed.replace(/^\d+\.\s/, ''));
      } else {
        flushList();
        elements.push(
          <p key={`p-${i}`} style={{ margin: '0 0 6px 0', lineHeight: 1.55 }}>
            {formatInlineTokens(line)}
          </p>
        );
      }
    });

    flushList();
    return elements;
  };

  return (
    <>
      {/* 1. Closed State: Floating Trigger Launcher */}
      {!isOpen && (
        <button
          type="button"
          className="copilot-launcher"
          onClick={handleToggleOpen}
          title="Open Synaptech AI Copilot (Ctrl + /)"
          aria-label="Open AI Copilot"
        >
          <span className="copilot-launcher-icon">🧠</span>
          <span className="copilot-launcher-text">Synaptech Copilot</span>
          <span className="copilot-launcher-pill">AI Active</span>
        </button>
      )}

      {/* 2. Minimized Glance Bar State: Never overlaps cards */}
      {isOpen && isMinimized && (
        <div 
          className="copilot-minimized-bar" 
          onClick={() => setIsMinimized(false)}
          title="Click to expand Synaptech Copilot"
        >
          <div className="copilot-minimized-left">
            <span style={{ fontSize: '1.25rem' }}>🧠</span>
            <span className="copilot-status-dot" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="copilot-minimized-title">Synaptech Copilot</span>
              <span className="copilot-minimized-sub">Click to expand</span>
            </div>
          </div>
          <div className="copilot-minimized-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="copilot-btn-icon"
              onClick={() => setIsMinimized(false)}
              title="Expand Copilot"
              aria-label="Expand Copilot"
            >
              ⤢
            </button>
            <button
              type="button"
              className="copilot-btn-icon"
              onClick={handleClose}
              title="Close Copilot"
              aria-label="Close Copilot"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 3. Open & Expanded State */}
      {isOpen && !isMinimized && (
        <>
          {/* Mobile/Tablet Backdrop (only when drawer mode on smaller screens) */}
          {dockMode === 'docked' && (
            <div 
              className="copilot-mobile-backdrop" 
              onClick={handleClose}
              aria-hidden="true"
            />
          )}

          <div className={dockMode === 'docked' ? 'copilot-drawer-docked' : 'copilot-window-floating'}>
            {/* Header */}
            <div className="copilot-header">
              <div className="copilot-header-info">
                <div className="copilot-header-avatar">
                  <span>🧠</span>
                  <span className="copilot-status-dot-pulse" />
                </div>
                <div>
                  <div className="copilot-title-row">
                    <span className="copilot-title">Synaptech Copilot</span>
                    <span className="copilot-badge">AI Assistant</span>
                  </div>
                  <div className="copilot-subtext">
                    Online &bull; Context Aware &bull; <kbd>Ctrl+/</kbd>
                  </div>
                </div>
              </div>

              <div className="copilot-controls">
                <button
                  type="button"
                  className="copilot-btn-icon"
                  onClick={handleToggleDock}
                  title={dockMode === 'docked' ? 'Switch to Floating Window' : 'Dock to Side Panel'}
                  aria-label="Toggle Dock Mode"
                >
                  {dockMode === 'docked' ? '⤢' : '◧'}
                </button>
                <button
                  type="button"
                  className="copilot-btn-icon"
                  onClick={() => setIsMinimized(true)}
                  title="Minimize to Bottom Bar"
                  aria-label="Minimize Copilot"
                >
                  —
                </button>
                <button
                  type="button"
                  className="copilot-btn-icon"
                  onClick={handleClearHistory}
                  title="Clear Chat History"
                  aria-label="Clear History"
                >
                  🗑️
                </button>
                <button
                  type="button"
                  className="copilot-btn-icon copilot-btn-close"
                  onClick={handleClose}
                  title="Close Copilot (Esc)"
                  aria-label="Close Copilot"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Messages Stream */}
            <div className="copilot-messages">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message-bubble ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}
                >
                  <div className="message-header-meta">
                    {msg.role === 'user' ? '👤 You' : '🧠 Copilot'}
                  </div>
                  {msg.role === 'user' ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                  ) : (
                    <div className="message-formatted-content">{renderFormattedMessage(msg.text)}</div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="message-bubble message-ai" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="copilot-loading-spinner" />
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Analyzing engineering context...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Suggestion Chips */}
            {suggestions.length > 0 && (
              <div className="copilot-suggestions">
                <div className="suggestions-label">Suggested Inquiries:</div>
                <div className="suggestions-scroll">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="suggestion-chip"
                      onClick={() => handleSendMessage(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Bar */}
            <div className="copilot-input-bar">
              <input
                ref={inputRef}
                type="text"
                className="copilot-input"
                placeholder="Ask about architecture, velocity, security..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button
                type="button"
                className="copilot-send-btn"
                onClick={() => handleSendMessage()}
                disabled={loading || !input.trim()}
                title="Send Message"
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default SynaptechCopilot;
