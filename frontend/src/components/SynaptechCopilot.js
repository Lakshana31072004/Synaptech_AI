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

const SynaptechCopilot = () => {
  const [isOpen, setIsOpen] = useState(false);
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
  const { showError } = useNotification();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

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

  return (
    <>
      {/* Floating Trigger Launcher */}
      {!isOpen && (
        <button
          type="button"
          className="copilot-launcher"
          onClick={() => setIsOpen(true)}
          title="Open Synaptech AI Copilot"
        >
          <span style={{ fontSize: '1.3rem' }}>🧠</span>
          <span>Synaptech AI</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="copilot-window">
          {/* Header */}
          <div className="copilot-header">
            <div className="copilot-header-info">
              <span style={{ fontSize: '1.3rem' }}>🧠</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Synaptech Copilot</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#94a3b8' }}>
                  <span className="copilot-status-dot" />
                  <span>Online &bull; Context Aware</span>
                </div>
              </div>
            </div>

            <div className="copilot-controls">
              <button
                type="button"
                className="copilot-btn-icon"
                onClick={() => setMessages([{ role: 'assistant', text: 'Chat history cleared. How can I help you next?' }])}
                title="Clear Chat History"
              >
                🗑️
              </button>
              <button
                type="button"
                className="copilot-btn-icon"
                onClick={() => setIsOpen(false)}
                title="Close Copilot"
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
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
              </div>
            ))}
            {loading && (
              <div className="message-bubble message-ai" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Suggestion Chips */}
          {suggestions.length > 0 && (
            <div className="copilot-suggestions">
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
          )}

          {/* Input Bar */}
          <div className="copilot-input-bar">
            <input
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
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SynaptechCopilot;
