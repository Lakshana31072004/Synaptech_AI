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
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
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
