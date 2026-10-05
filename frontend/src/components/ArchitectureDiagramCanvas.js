import React, { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import './ArchitectureDiagramCanvas.css';
import { useNotification } from '../NotificationContext';

// Helper to auto-repair common Mermaid syntax issues
export const sanitizeMermaidCode = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  let code = raw.trim();

  // Strip markdown code fences if present
  code = code.replace(/^```(?:mermaid)?\s*/i, '').replace(/```\s*$/, '').trim();

  // Fix [((text))] -> (("text"))
  code = code.replace(/\[\(\((.*?)\)\)\]/g, '(("$1"))');

  // Fix subgraphs with unquoted complex titles or parentheses
  let subIndex = 0;
  code = code.split('\n').map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('subgraph ')) {
      const content = trimmed.substring(9).trim();
      if (
        content.includes('["') ||
        content.includes("['") ||
        /^"[^"]+"$/.test(content) ||
        /^[A-Za-z0-9_]+$/.test(content)
      ) {
        return line;
      }
      subIndex++;
      const idTitleMatch = content.match(/^([A-Za-z0-9_]+)\s*\[(.+)\]$/);
      const indent = line.substring(0, line.indexOf('subgraph'));
      if (idTitleMatch) {
        const id = idTitleMatch[1];
        const title = idTitleMatch[2].replace(/^"|"$/g, '');
        return `${indent}subgraph ${id} ["${title}"]`;
      }
      const safeTitle = content.replace(/"/g, "'");
      return `${indent}subgraph sub_${subIndex} ["${safeTitle}"]`;
    }
    return line;
  }).join('\n');

  return code;
};

const ArchitectureDiagramCanvas = ({
  topology,
  c4,
  sequence,
  title = 'System Architecture Diagram',
}) => {
  const [activeView, setActiveView] = useState('topology'); // topology | c4 | sequence | editor
  const [zoom, setZoom] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorCode, setEditorCode] = useState('');
  const [renderError, setRenderError] = useState(null);

  const containerRef = useRef(null);
  const editorContainerRef = useRef(null);
  const { showSuccess, showError } = useNotification();

  // Initialize Mermaid configuration
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
      themeVariables: {
        darkMode: true,
        background: '#0f172a',
        primaryColor: '#1e293b',
        primaryTextColor: '#f8fafc',
        primaryBorderColor: '#3b82f6',
        lineColor: '#60a5fa',
        secondaryColor: '#312e81',
        tertiaryColor: '#1e1b4b',
      },
    });
  }, []);

  // Determine current active mermaid code based on active view
  const getCurrentCode = useCallback(() => {
    if (activeView === 'topology') return topology || '';
    if (activeView === 'c4') return c4 || topology || '';
    if (activeView === 'sequence') return sequence || topology || '';
    if (activeView === 'editor') return editorCode;
    return topology || '';
  }, [activeView, topology, c4, sequence, editorCode]);

  // Sync editor code whenever views or props change
  useEffect(() => {
    if (activeView !== 'editor') {
      const code = getCurrentCode();
      setEditorCode(code);
    }
  }, [activeView, getCurrentCode]);

  // Render diagram dynamically into container
  const renderDiagram = useCallback(async (code, targetRef) => {
    if (!code || !targetRef.current) return;
    setRenderError(null);
    const sanitized = sanitizeMermaidCode(code);
    const uniqueId = `mermaid-svg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    try {
      const { svg } = await mermaid.render(uniqueId, sanitized);
      if (targetRef.current) {
        targetRef.current.innerHTML = svg;
      }
    } catch (err) {
      console.error('Mermaid render error:', err);
      // Clean up leftover Mermaid error elements from DOM
      const errorEl = document.getElementById(uniqueId) || document.getElementById('d' + uniqueId);
      if (errorEl) errorEl.remove();
      setRenderError('Invalid diagram syntax. Please review the diagram definition.');
    }
  }, []);

  // Render when activeView or code changes
  useEffect(() => {
    const code = getCurrentCode();
    if (activeView === 'editor') {
      renderDiagram(editorCode, editorContainerRef);
    } else {
      renderDiagram(code, containerRef);
    }
  }, [activeView, editorCode, getCurrentCode, renderDiagram]);

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.15, 2.5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.15, 0.4));
  const handleResetZoom = () => setZoom(1.0);

  // Copy Mermaid Code
  const handleCopyCode = () => {
    const code = getCurrentCode();
    navigator.clipboard.writeText(code).then(
      () => showSuccess('Mermaid diagram code copied to clipboard!'),
      () => showError('Failed to copy diagram code')
    );
  };

  // Export as SVG
  const handleExportSVG = () => {
    const target = activeView === 'editor' ? editorContainerRef.current : containerRef.current;
    if (!target) return;
    const svgElement = target.querySelector('svg');
    if (!svgElement) {
      showError('No SVG diagram found to export');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = `synaptech-${activeView}-architecture.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
    showSuccess('Architecture diagram exported as SVG!');
  };

  // Export as PNG
  const handleExportPNG = () => {
    const target = activeView === 'editor' ? editorContainerRef.current : containerRef.current;
    if (!target) return;
    const svgElement = target.querySelector('svg');
    if (!svgElement) {
      showError('No SVG diagram found to export');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width * 2 || 1600;
      canvas.height = img.height * 2 || 1200;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `synaptech-${activeView}-architecture.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      showSuccess('Architecture diagram exported as high-res PNG!');
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className={`arch-canvas-card ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Header with Title and View Switcher */}
      <div className="canvas-header">
        <div className="canvas-title-group">
          <span style={{ fontSize: '1.4rem' }}>🎨</span>
          <div>
            <h3>{title}</h3>
            <span className="canvas-badge">AI Live Canvas</span>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="canvas-view-switcher">
          <button
            type="button"
            className={`view-btn ${activeView === 'topology' ? 'active' : ''}`}
            onClick={() => setActiveView('topology')}
          >
            🌐 System Topology
          </button>
          <button
            type="button"
            className={`view-btn ${activeView === 'c4' ? 'active' : ''}`}
            onClick={() => setActiveView('c4')}
          >
            📦 C4 Container View
          </button>
          <button
            type="button"
            className={`view-btn ${activeView === 'sequence' ? 'active' : ''}`}
            onClick={() => setActiveView('sequence')}
          >
            ⚡ Data Flow Sequence
          </button>
          <button
            type="button"
            className={`view-btn ${activeView === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveView('editor')}
          >
            ✏️ Live Editor
          </button>
        </div>
      </div>

      {/* Toolbar with Zoom & Export Controls */}
      <div className="canvas-toolbar">
        <div className="toolbar-group">
          <button type="button" className="tool-btn" onClick={handleZoomOut} title="Zoom Out">
            ➖
          </button>
          <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
          <button type="button" className="tool-btn" onClick={handleZoomIn} title="Zoom In">
            ➕
          </button>
          <button type="button" className="tool-btn" onClick={handleResetZoom} title="Reset Zoom">
            🔄 Reset
          </button>
        </div>

        <div className="toolbar-group">
          <button type="button" className="tool-btn" onClick={handleCopyCode} title="Copy Mermaid Code">
            📋 Copy Code
          </button>
          <button type="button" className="tool-btn" onClick={handleExportSVG} title="Download SVG">
            📐 Export SVG
          </button>
          <button type="button" className="tool-btn" onClick={handleExportPNG} title="Download PNG">
            🖼️ Export PNG
          </button>
          <button
            type="button"
            className="tool-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? '🔲 Exit Fullscreen' : '🔳 Fullscreen'}
          </button>
        </div>
      </div>

      {/* Main Diagram Viewport */}
      {activeView !== 'editor' ? (
        <div className="canvas-viewport">
          {renderError ? (
            <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '16px 22px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
              <div style={{ marginBottom: '10px', fontWeight: 500 }}>⚠️ {renderError}</div>
              <button
                type="button"
                className="tool-btn"
                onClick={() => setActiveView('editor')}
                style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
              >
                ✏️ Open in Live Editor to Inspect / Fix
              </button>
            </div>
          ) : (
            <div
              className="diagram-render-box"
              style={{ transform: `scale(${zoom})` }}
              ref={containerRef}
            />
          )}
        </div>
      ) : (
        /* Live Editor View */
        <div className="editor-container">
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
              Mermaid Diagram Markdown (Edit in real-time)
            </div>
            <textarea
              className="editor-textarea"
              value={editorCode}
              onChange={(e) => setEditorCode(e.target.value)}
              placeholder="Enter Mermaid diagram code..."
            />
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
              Live Visual Preview
            </div>
            <div className="editor-preview" ref={editorContainerRef} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchitectureDiagramCanvas;
