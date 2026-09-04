import React, { useState } from 'react';
import './CyberneticTelemetryDashboard.css';
import { useNotification } from '../NotificationContext';

const CyberneticTelemetryDashboard = ({ onNavigate }) => {
  const notifications = useNotification();

  const [activeFilter, setActiveFilter] = useState('ALL NODES');
  const [promptText, setPromptText] = useState('');
  const [diffAccepted, setDiffAccepted] = useState(false);
  const [patchSynthesized, setPatchSynthesized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [selectedNode, setSelectedNode] = useState(null);

  // SVG Gauge calculations (radius = 48, circumference = ~301.6)
  const radius = 48;
  const circumference = 2 * Math.PI * radius;

  const archPercent = 98.4;
  const covPercent = 94.2;
  const guardPercent = 99.1;

  const archOffset = circumference - (archPercent / 100) * circumference;
  const covOffset = circumference - (covPercent / 100) * circumference;
  const guardOffset = circumference - (guardPercent / 100) * circumference;

  const handleDeployAgent = () => {
    if (notifications?.addNotification) {
      notifications.addNotification({
        type: 'success',
        message: '⚡ Agent Synapse-v4.2 deployed autonomously to cluster [us-east-neural]!'
      });
    } else {
      alert('⚡ Agent Synapse-v4.2 deployed autonomously to cluster [us-east-neural]!');
    }
  };

  const handleFullScan = () => {
    setIsScanning(true);
    if (notifications?.addNotification) {
      notifications.addNotification({
        type: 'info',
        message: '🔍 Initializing full synthetic AST & architecture heuristic scan...'
      });
    }
    setTimeout(() => {
      setIsScanning(false);
      if (notifications?.addNotification) {
        notifications.addNotification({
          type: 'success',
          message: '✓ Full scan complete. Architecture Score: 98.4% | Guardrails: 99.1%'
        });
      }
    }, 1400);
  };

  const handleAcceptDiff = () => {
    setDiffAccepted(true);
    if (notifications?.addNotification) {
      notifications.addNotification({
        type: 'success',
        message: '✓ NeuralTelemetryRouter diff accepted & staged to jit=True pipeline!'
      });
    }
  };

  const handleSynthesizePatch = () => {
    setPatchSynthesized(true);
    if (notifications?.addNotification) {
      notifications.addNotification({
        type: 'success',
        message: '✦ Automated spec patch generated for API-042 backward compatibility.'
      });
    }
  };

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    const query = promptText;
    setPromptText('');
    if (notifications?.addNotification) {
      notifications.addNotification({
        type: 'info',
        message: `🤖 Synaptech AI synthesizing request: "${query}"`
      });
    }
  };

  const handleNavClick = (key) => {
    setActiveNav(key);
    if (onNavigate) {
      onNavigate(key);
    }
  };

  return (
    <div className="cyber-telemetry-container">
      {/* SVG Gradient Definitions for Circular Meters */}
      <svg style={{ height: 0, width: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="100%" stopColor="#0099ff" />
          </linearGradient>
          <linearGradient id="violetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ddb7ff" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#65f2b5" />
            <stop offset="100%" stopColor="#00f0ff" />
          </linearGradient>
        </defs>
      </svg>

      {/* --- Operational Sub-header --- */}
      <div className="cyber-operational-bar">
        <div className="cyber-badge-group">
          <div className="cyber-meta-badge cluster">
            <span>CLUSTER</span>
            <span className="val">us-east-neural</span>
          </div>
          <div className="cyber-meta-badge model">
            <span>MODEL</span>
            <span className="val">Synapse-v4.2-Turbo</span>
          </div>
        </div>

        <div className="cyber-action-group">
          <button className="cyber-btn-deploy" onClick={handleDeployAgent}>
            <span>⚡</span> Deploy Agent
          </button>
          <button className="cyber-btn-ghost" onClick={handleFullScan} disabled={isScanning}>
            <span>{isScanning ? '⏳' : '◎'}</span> {isScanning ? 'Scanning...' : 'Full Scan'}
          </button>
          <button className="cyber-btn-ghost" onClick={() => handleNavClick('branches')}>
            <span>⑂</span> main
          </button>
        </div>
      </div>

      {/* --- Card 1: System Health --- */}
      <div className="cyber-card">
        <div className="cyber-card-header">
          <div className="cyber-card-title-wrap">
            <div>
              <h2 className="cyber-card-title">System Health</h2>
              <div className="cyber-card-subtitle">Real-time Synthetic Inference</div>
            </div>
          </div>
          <div className="cyber-pill-status synapse">
            <span className="pulse-dot"></span>
            SYNAPSE 99.8%
          </div>
        </div>

        {/* 3 Circular Gauges */}
        <div className="cyber-gauges-row">
          {/* Gauge 1: Architecture */}
          <div className="cyber-gauge-item">
            <svg className="cyber-gauge-svg" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={radius} className="cyber-gauge-track" />
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="cyber-gauge-fill cyan"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: archOffset
                }}
              />
            </svg>
            <div className="cyber-gauge-val">{archPercent}%</div>
            <div className="cyber-gauge-label">ARCHITECTURE</div>
          </div>

          {/* Gauge 2: Coverage */}
          <div className="cyber-gauge-item">
            <svg className="cyber-gauge-svg" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={radius} className="cyber-gauge-track" />
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="cyber-gauge-fill violet"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: covOffset
                }}
              />
            </svg>
            <div className="cyber-gauge-val">{covPercent}%</div>
            <div className="cyber-gauge-label">COVERAGE</div>
          </div>

          {/* Gauge 3: Guardrails */}
          <div className="cyber-gauge-item">
            <svg className="cyber-gauge-svg" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={radius} className="cyber-gauge-track" />
              <circle
                cx="60"
                cy="60"
                r={radius}
                className="cyber-gauge-fill emerald"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset: guardOffset
                }}
              />
            </svg>
            <div className="cyber-gauge-val">{guardPercent}%</div>
            <div className="cyber-gauge-label">GUARDRAILS</div>
          </div>
        </div>

        {/* Telemetry Pills Row */}
        <div className="cyber-metrics-row">
          <div className="cyber-metric-pill cyan">
            <span>⚡</span>
            <span>18ms</span>
            <span style={{ color: '#849495', fontSize: '0.72rem' }}>p99</span>
          </div>
          <div className="cyber-metric-pill violet">
            <span>⬡</span>
            <span>64.2 / 128GB</span>
          </div>
          <div className="cyber-metric-pill emerald">
            <span>🛡</span>
            <span>0 Drift</span>
          </div>
        </div>
      </div>

      {/* --- Card 2: Code Inspection --- */}
      <div className="cyber-card">
        <div className="cyber-card-header">
          <div className="cyber-card-title-wrap">
            <span style={{ color: '#00f0ff', fontSize: '1.2rem' }}>&lt;/&gt;</span>
            <h2 className="cyber-card-title">Code Inspection</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{
              fontFamily: 'JetBrains Mono',
              fontSize: '0.72rem',
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'rgba(255,255,255,0.06)',
              color: '#b9cacb'
            }}>
              DIFF VIEW
            </span>
            <div className="cyber-pill-status stream">
              <span className="pulse-dot"></span>
              STREAM
            </div>
          </div>
        </div>

        {/* Code Diff Box */}
        <div className="cyber-code-box">
          <div className="cyber-code-topbar">
            <div className="filepath">
              <span>📄</span> src/services/neural_router.py
            </div>
            <span>UTF-8</span>
          </div>
          <div className="cyber-code-content">
            <div className="cyber-diff-line normal">
              <span className="line-num">142</span>
              <span>class NeuralTelemetryRouter:</span>
            </div>
            <div className="cyber-diff-line normal">
              <span className="line-num">143</span>
              <span>    @synapse_kernel(jit=True)</span>
            </div>
            <div className="cyber-diff-line del">
              <span className="line-num">144</span>
              <span>-   def legacy_vector_lookup(batch, dim=512):</span>
            </div>
            <div className="cyber-diff-line add">
              <span className="line-num">145</span>
              <span>+   def parallel_neural_dispatch(ctx, tensor):</span>
            </div>
            <div className="cyber-diff-line add">
              <span className="line-num">146</span>
              <span>+       simd_weights = ctx.vector_bus.prefetch()</span>
            </div>
            <div className="cyber-diff-line add">
              <span className="line-num">147</span>
              <span>+       return ctx.quantized_kernel.matmul(simd_weights)</span>
            </div>
            <div className="cyber-diff-line normal">
              <span className="line-num">148</span>
              <span style={{ color: '#64748b' }}>    # Awaiting execution cycle hook...</span>
            </div>
          </div>
        </div>

        {/* AI Synthesizer Callout Banner */}
        <div className="cyber-ai-callout">
          <div className="cyber-ai-callout-header">
            <span style={{ color: '#00f0ff' }}>✦</span>
            <span className="cyber-ai-callout-title">AI SYNTHESIZER V4</span>
            <span className="cyber-ast-badge">AST Verified</span>
          </div>
          <p className="cyber-ai-callout-desc">
            <strong style={{ color: '#ffffff' }}>3.8x throughput speedup</strong> via AVX-512 SIMD tensor prefetch. Zero heap allocation overhead detected.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="cyber-btn-row">
          <button
            className="cyber-btn-cyan-solid"
            onClick={handleAcceptDiff}
            style={diffAccepted ? { background: '#10b981', color: '#ffffff' } : {}}
          >
            {diffAccepted ? '✓ Diff Staged' : 'Accept Diff'}
          </button>
          <button className="cyber-btn-ghost" onClick={() => handleNavClick('inspector')}>
            Inspect AST
          </button>
          <button
            className="cyber-btn-ghost"
            onClick={() => {
              if (notifications?.addNotification) {
                notifications.addNotification({ type: 'info', message: 'Re-prompting Synapse kernel for alternate vector optimization...' });
              }
            }}
          >
            Re-prompt
          </button>
        </div>
      </div>

      {/* --- Card 3: Spec Drift Analyzer --- */}
      <div className="cyber-card">
        <div className="cyber-card-header">
          <div className="cyber-card-title-wrap">
            <span style={{ color: '#ddb7ff', fontSize: '1.2rem' }}>☑</span>
            <h2 className="cyber-card-title">Spec Drift Analyzer</h2>
          </div>
          <div className="cyber-pill-status sync">
            PRD-SYNC
          </div>
        </div>

        {/* Requirement Alignment Progress */}
        <div className="cyber-progress-section">
          <div className="cyber-progress-header">
            <span>Requirement Alignment</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="val">{patchSynthesized ? '99.4%' : '96.8%'}</span>
              <span className="target">(Target ≥95%)</span>
            </div>
          </div>
          <div className="cyber-progress-bar-track">
            <div
              className="cyber-progress-bar-fill"
              style={{ width: patchSynthesized ? '99.4%' : '96.8%' }}
            ></div>
          </div>
        </div>

        {/* Spec Items List */}
        <div className="cyber-spec-items">
          <div className="cyber-spec-item">
            <div className="cyber-spec-item-top">
              <span className="title">
                <span style={{ color: '#10b981' }}>✓</span> PRD-204: Zero-copy streaming latency
              </span>
              <span className="cyber-spec-tag pass">18.4ms</span>
            </div>
            <p className="cyber-spec-desc">Verified against synthetic stress payload stream</p>
          </div>

          <div className="cyber-spec-item">
            <div className="cyber-spec-item-top">
              <span className="title">
                <span style={{ color: '#10b981' }}>✓</span> SEC-109: FIPS-140-3 token encryption
              </span>
              <span className="cyber-spec-tag pass">PASSED</span>
            </div>
            <p className="cyber-spec-desc">Hardware AES-GCM-256 state certified in transit</p>
          </div>

          <div className="cyber-spec-item">
            <div className="cyber-spec-item-top">
              <span className="title">
                <span style={{ color: patchSynthesized ? '#10b981' : '#f59e0b' }}>
                  {patchSynthesized ? '✓' : '⚠'}
                </span>{' '}
                API-042: Schema backward compatibility
              </span>
              <span className={`cyber-spec-tag ${patchSynthesized ? 'pass' : 'warn'}`}>
                {patchSynthesized ? 'RESOLVED' : '1 WARNING'}
              </span>
            </div>
            <p className="cyber-spec-desc">
              {patchSynthesized
                ? 'Synthesized patch v4.2.1 active; fallback route updated to JSON v4 format.'
                : 'Deprecated JSON v3 payload structure in fallback route'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button className="cyber-btn-patch" onClick={handleSynthesizePatch}>
          <span>✦</span> {patchSynthesized ? 'Spec Patched & Certified' : 'Synthesize Automated Spec Patch'}
        </button>
      </div>

      {/* --- Card 4: Neural Topology --- */}
      <div className="cyber-card">
        <div className="cyber-card-header">
          <div className="cyber-card-title-wrap">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#00f0ff' }}>⑂</span>
                <h2 className="cyber-card-title">Neural Topology</h2>
              </div>
              <div className="cyber-card-subtitle">Active Service Mesh Connectivity</div>
            </div>
          </div>
          <button
            className="cyber-btn-ghost"
            style={{ padding: '4px 8px', fontSize: '0.8rem' }}
            title="Full Topology View"
            onClick={() => handleNavClick('topology')}
          >
            ⛶
          </button>
        </div>

        {/* Filter Chips */}
        <div className="cyber-chip-filter-row">
          {['ALL NODES', 'CRITICAL PATH', 'DEPENDENCIES', 'LATENCY'].map((chip) => (
            <button
              key={chip}
              className={`cyber-filter-chip ${activeFilter === chip ? 'active' : ''}`}
              onClick={() => setActiveFilter(chip)}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Mesh Visualizer with Animated Connections */}
        <div className="cyber-topology-mesh">
          <svg className="cyber-topology-svg" viewBox="0 0 700 240" preserveAspectRatio="none">
            {/* Line: API Gateway -> Neural Router */}
            <path
              d="M 120 140 Q 230 70 340 70"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="2"
              className="cyber-flow-line"
              opacity="0.75"
            />
            {/* Line: Neural Router -> Tensor Sink */}
            <path
              d="M 340 70 Q 450 70 560 140"
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              className="cyber-flow-line"
              opacity="0.75"
            />
            {/* Line: Neural Router -> Telemetry Sink */}
            <path
              d="M 340 70 Q 340 140 340 180"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity="0.6"
            />
            {/* Line: API Gateway -> Telemetry Sink */}
            <path
              d="M 120 140 Q 220 200 340 180"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          </svg>

          {/* Node 1: API Gateway */}
          <div
            className="cyber-node-box"
            style={{ left: '5%', top: '48%' }}
            onClick={() => setSelectedNode('API Gateway: 1.2k rps, 99.99% uptime')}
          >
            <div className="cyber-node-top">
              <span className="cyber-node-dot emerald"></span>
              <span>API Gateway</span>
            </div>
            <div className="cyber-node-sub">1.2k rps</div>
          </div>

          {/* Node 2: Neural Router (Center Top) */}
          <div
            className="cyber-node-box"
            style={{ left: '42%', top: '15%', borderColor: '#00f0ff' }}
            onClick={() => setSelectedNode('Neural Router: p99 14ms latency, 8 replicas active')}
          >
            <div className="cyber-node-top">
              <span>Neural Router</span>
              <span className="cyber-node-dot cyan"></span>
            </div>
            <div className="cyber-node-sub">p99: 14ms &nbsp; 8x Rep</div>
          </div>

          {/* Node 3: Tensor Sink */}
          <div
            className="cyber-node-box"
            style={{ right: '5%', top: '48%' }}
            onClick={() => setSelectedNode('Tensor Sink: 48 TFLOPs dedicated GPU compute cluster')}
          >
            <div className="cyber-node-top">
              <span className="cyber-node-dot violet"></span>
              <span>Tensor Sink</span>
            </div>
            <div className="cyber-node-sub">48 TFLOPs</div>
          </div>

          {/* Node 4: Telemetry Sink (Bottom Center) */}
          <div
            className="cyber-node-box"
            style={{ left: '38%', top: '68%' }}
            onClick={() => setSelectedNode('Telemetry Sink: Real-time event ingestion, Kafka 0-lag')}
          >
            <div className="cyber-node-top">
              <span className="cyber-node-dot emerald"></span>
              <span>Telemetry Sink</span>
            </div>
            <div className="cyber-node-sub">Kafka 0-Lag</div>
          </div>
        </div>

        {selectedNode && (
          <div style={{
            marginTop: '10px',
            fontSize: '0.8rem',
            fontFamily: 'JetBrains Mono',
            color: '#00f0ff',
            background: 'rgba(0, 240, 255, 0.08)',
            padding: '6px 12px',
            borderRadius: '6px'
          }}>
            ℹ {selectedNode}
          </div>
        )}
      </div>

      {/* --- Floating Bottom Prompt Bar --- */}
      <form className="cyber-prompt-dock" onSubmit={handlePromptSubmit}>
        <span className="cyber-prompt-icon">⌨</span>
        <input
          type="text"
          className="cyber-prompt-input"
          placeholder="Ask Synaptech AI to inspect, refactor, deploy..."
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
        />
        <button type="submit" className="cyber-prompt-send-btn" title="Send Request">
          ↑
        </button>
      </form>

      {/* --- Bottom Navigation Dock --- */}
      <div className="cyber-nav-dock">
        <button
          className={`cyber-nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavClick('dashboard')}
        >
          <span className="nav-icon">⊞</span>
          <span>Dashboard</span>
        </button>
        <button
          className={`cyber-nav-item ${activeNav === 'inspector' ? 'active' : ''}`}
          onClick={() => handleNavClick('inspector')}
        >
          <span className="nav-icon">&lt;/&gt;</span>
          <span>Inspector</span>
        </button>
        <button
          className={`cyber-nav-item ${activeNav === 'topology' ? 'active' : ''}`}
          onClick={() => handleNavClick('topology')}
        >
          <span className="nav-icon">⑂</span>
          <span>Topology</span>
        </button>
        <button
          className={`cyber-nav-item ${activeNav === 'analyzer' ? 'active' : ''}`}
          onClick={() => handleNavClick('analyzer')}
        >
          <span className="nav-icon">📈</span>
          <span>Analyzer</span>
        </button>
        <button
          className={`cyber-nav-item ${activeNav === 'settings' ? 'active' : ''}`}
          onClick={() => handleNavClick('settings')}
        >
          <span className="nav-icon">⚙</span>
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default CyberneticTelemetryDashboard;
