import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProjectHealthDashboard.css';
import { apiService } from './apiService';
import { useNotification } from './NotificationContext';

function ProjectHealthDashboard() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [health, setHealth] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);
  const [incomingModule4Notice, setIncomingModule4Notice] = useState(null);

  // AI Simulator state
  const [simVelocity, setSimVelocity] = useState(35);
  const [simBugTrend, setSimBugTrend] = useState('stable');
  const [simTechDebt, setSimTechDebt] = useState('medium');
  const [simQuality, setSimQuality] = useState(75);
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const { showSuccess, showError } = useNotification();

  const loadProjects = useCallback(async () => {
    try {
      const data = await apiService.getProjects();
      if (Array.isArray(data) && data.length > 0) {
        setProjects(data);
        setSelectedProjectId((prev) => prev || data[0].id);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }, []);

  const loadProjectHealth = useCallback(async (projectId) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [healthData, historyData] = await Promise.all([
        apiService.getProjectHealth(projectId).catch(() => null),
        apiService.getProjectHealthHistory(projectId).catch(() => []),
      ]);
      setHealth(healthData);
      setHistory(Array.isArray(historyData) ? historyData : []);

      // Synchronize simulation sliders with current active metrics
      if (healthData) {
        setSimVelocity(healthData.sprintVelocity || 30);
        setSimBugTrend(healthData.bugTrend || 'stable');
        setSimTechDebt(healthData.technicalDebt || 'medium');
        setSimQuality(healthData.codeQualityIndex || 75);
      }
    } catch (err) {
      showError('Failed to load project health telemetry');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectHealth(selectedProjectId);
      setSimResult(null);

      try {
        const stored = localStorage.getItem(`synaptech_pending_risk_metrics_${selectedProjectId}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          setIncomingModule4Notice(parsed);
          if (parsed.codeQualityIndex) setSimQuality(parsed.codeQualityIndex);
          if (parsed.bugTrend) setSimBugTrend(parsed.bugTrend);
          if (parsed.technicalDebt) setSimTechDebt(parsed.technicalDebt);
          showSuccess(`Ingested Code Quality (${parsed.codeQualityIndex}/100) & Defect Trends from Module 4!`);
        } else {
          setIncomingModule4Notice(null);
        }
      } catch {}
    }
  }, [selectedProjectId, loadProjectHealth, showSuccess]);

  const handleSimulateWhatIfInModule6 = () => {
    if (!health) return;
    const whatIfPayload = {
      baseRiskScore: health.riskScore,
      sprintVelocity: health.sprintVelocity,
      codeQualityIndex: health.codeQualityIndex,
      technicalDebt: health.technicalDebt,
      bugTrend: health.bugTrend,
      projectId: selectedProjectId,
      source: 'Module 5 Project Health & Risk Telemetry',
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(`synaptech_pending_whatif_baseline_${selectedProjectId}`, JSON.stringify(whatIfPayload));
    showSuccess(`Exported Health Telemetry baseline to Module 6 What-If Simulation Sandbox!`);
    if (typeof navigate === 'function') {
      navigate('/traceability');
    } else {
      window.location.href = '/traceability';
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      const created = await apiService.createProject({ name: newProjectName.trim() });
      showSuccess(`Project "${created.name}" created successfully`);
      setNewProjectName('');
      setShowAddProject(false);
      await loadProjects();
      setSelectedProjectId(created.id);
    } catch (err) {
      showError('Failed to create project');
    }
  };

  const handleSimulateRisk = async () => {
    setSimulating(true);
    try {
      const result = await apiService.predictRisk({
        bugTrend: simBugTrend,
        sprintVelocity: Number(simVelocity),
        technicalDebt: simTechDebt,
        codeQualityIndex: Number(simQuality),
      });
      setSimResult(result);
      showSuccess('AI Risk Simulation complete');
    } catch (err) {
      showError('AI risk simulation calculation failed');
    } finally {
      setSimulating(false);
    }
  };

  const handleApplySimulation = async () => {
    if (!selectedProjectId) return;
    setSimulating(true);
    try {
      const updated = await apiService.evaluateProjectRisk(selectedProjectId, {
        bugTrend: simBugTrend,
        sprintVelocity: Number(simVelocity),
        technicalDebt: simTechDebt,
        codeQualityIndex: Number(simQuality),
      });
      setHealth(updated);
      showSuccess('AI Evaluated Risk saved to project telemetry!');
      loadProjectHealth(selectedProjectId);
    } catch (err) {
      showError('Failed to apply health evaluation');
    } finally {
      setSimulating(false);
    }
  };

  const getRiskClass = (score) => {
    if (score >= 80) return 'pill-critical';
    if (score >= 65) return 'pill-high';
    if (score >= 40) return 'pill-moderate';
    return 'pill-low';
  };

  return (
    <div className="phd-container">
      {/* Header & Controls */}
      <div className="phd-header">
        <div className="phd-title">
          <h2>Module 5: Project Health &amp; Telemetry Dashboard</h2>
          <p>Real-time engineering KPIs, automated defect trends, and predictive risk telemetry</p>
        </div>

        <div className="phd-controls">
          {projects.length > 0 && (
            <select
              className="project-select"
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  📁 {p.name}
                </option>
              ))}
            </select>
          )}

          {health && (
            <button
              type="button"
              onClick={handleSimulateWhatIfInModule6}
              className="primary-btn"
              style={{
                fontSize: '0.84rem',
                padding: '6px 14px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
                color: '#ffffff',
                border: 'none',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                cursor: 'pointer'
              }}
            >
              🔮 Simulate What-If Scenarios (Module 6) &rarr;
            </button>
          )}

          <button
            onClick={() => setShowAddProject(!showAddProject)}
            className="secondary-btn"
          >
            {showAddProject ? 'Cancel' : '+ New Project'}
          </button>
        </div>
      </div>

      {/* Incoming Module 4 Telemetry Banner */}
      {incomingModule4Notice && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(52, 211, 153, 0.4)',
          borderRadius: '8px',
          padding: '10px 14px',
          color: '#6ee7b7',
          fontSize: '0.86rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <span>
            🚨 <strong>Continuous Pipeline Active:</strong> Ingested AST Code Quality Index ({incomingModule4Notice.codeQualityIndex}/100) and defect influx ({incomingModule4Notice.bugTrend}) from <strong>Module 4 Code Review Inspector</strong>.
          </span>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem(`synaptech_pending_risk_metrics_${selectedProjectId}`);
              setIncomingModule4Notice(null);
            }}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Add Project Inline Form */}
      {showAddProject && (
        <form onSubmit={handleCreateProject} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Enter new project name..."
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
          <button type="submit" className="primary-btn">Create</button>
        </form>
      )}

      {loading && <p style={{ color: '#64748b' }}>Loading project health telemetry...</p>}

      {health ? (
        <>
          {/* Main Metrics Grid */}
          <div className="metrics-grid">
            <div className="metric-card hero-card">
              <span className="metric-label">Project Risk Score (AI)</span>
              <div className="metric-value-row">
                <span className="metric-value">{health.riskScore}</span>
                <span className={`status-pill ${getRiskClass(health.riskScore)}`}>
                  {health.riskScore >= 75 ? 'Critical' : health.riskScore >= 50 ? 'Moderate' : 'Healthy'}
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '6px' }}>
                Forecasted schedule/defect risk
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Sprint Velocity</span>
              <div className="metric-value-row">
                <span className="metric-value">{health.sprintVelocity}</span>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>pts / sprint</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px' }}>
                Team throughput rate
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Bug Influx Trend</span>
              <div className="metric-value-row">
                <span className="metric-value" style={{ textTransform: 'capitalize', fontSize: '1.4rem' }}>
                  {health.bugTrend}
                </span>
                <span className={`status-pill ${health.bugTrend === 'decreasing' ? 'pill-low' : health.bugTrend === 'increasing' ? 'pill-critical' : 'pill-moderate'}`}>
                  {health.bugTrend === 'decreasing' ? '↓ Improving' : health.bugTrend === 'increasing' ? '↑ Rising' : '→ Steady'}
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px' }}>
                Defect accumulation rate
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Code Quality Index</span>
              <div className="metric-value-row">
                <span className="metric-value">{health.codeQualityIndex}</span>
                <span style={{ fontSize: '0.9rem', color: '#64748b' }}>/ 100</span>
              </div>
              <div className="progress-container">
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${health.codeQualityIndex}%`,
                      backgroundColor: health.codeQualityIndex >= 80 ? '#16a34a' : health.codeQualityIndex >= 60 ? '#eab308' : '#dc2626'
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="metric-card">
              <span className="metric-label">Technical Debt</span>
              <div className="metric-value-row">
                <span className="metric-value" style={{ textTransform: 'capitalize', fontSize: '1.4rem' }}>
                  {health.technicalDebt}
                </span>
                <span className={`status-pill ${health.technicalDebt === 'low' ? 'pill-low' : health.technicalDebt === 'high' ? 'pill-critical' : 'pill-moderate'}`}>
                  {health.technicalDebt}
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '6px' }}>
                Architectural coupling & debt
              </span>
            </div>

            <div className="metric-card">
              <span className="metric-label">Milestone Progress</span>
              <div className="metric-value-row">
                <span className="metric-value">{health.projectProgress}%</span>
              </div>
              <div className="progress-container">
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${health.projectProgress}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Module 5: Interactive AI Risk Prediction & Simulator Panel */}
          <div className="simulator-panel">
            <div className="simulator-header">
              <h3>⚡ AI Risk Simulator & Optimization Engine</h3>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Adjust project parameters to simulate real-time AI risk evaluation
              </span>
            </div>

            <div className="sim-grid">
              <div className="sim-field">
                <label>
                  <span>Sprint Velocity:</span>
                  <strong>{simVelocity} pts</strong>
                </label>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={simVelocity}
                  onChange={(e) => setSimVelocity(Number(e.target.value))}
                />
              </div>

              <div className="sim-field">
                <label>
                  <span>Code Quality Index:</span>
                  <strong>{simQuality} / 100</strong>
                </label>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={simQuality}
                  onChange={(e) => setSimQuality(Number(e.target.value))}
                />
              </div>

              <div className="sim-field">
                <label>Bug Influx Trend:</label>
                <select
                  value={simBugTrend}
                  onChange={(e) => setSimBugTrend(e.target.value)}
                >
                  <option value="decreasing">Decreasing (Improving)</option>
                  <option value="stable">Stable</option>
                  <option value="increasing">Increasing (Defect Accumulation)</option>
                </select>
              </div>

              <div className="sim-field">
                <label>Technical Debt Level:</label>
                <select
                  value={simTechDebt}
                  onChange={(e) => setSimTechDebt(e.target.value)}
                >
                  <option value="low">Low (Clean Architecture)</option>
                  <option value="medium">Medium</option>
                  <option value="high">High (Legacy / High Coupling)</option>
                </select>
              </div>
            </div>

            <div className="sim-actions">
              <button
                onClick={handleSimulateRisk}
                disabled={simulating}
                className="primary-btn"
              >
                {simulating ? 'Calculating...' : 'Run AI Risk Simulation'}
              </button>
              <button
                onClick={handleApplySimulation}
                disabled={simulating}
                className="secondary-btn"
              >
                Apply & Save to Project
              </button>
            </div>

            {/* Simulated AI Results */}
            {simResult && (
              <div className="ai-results-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4>
                    Predicted Risk: <strong>{simResult.riskScore}/100</strong>
                    <span className={`status-pill ${getRiskClass(simResult.riskScore)}`} style={{ marginLeft: '10px' }}>
                      {simResult.riskLevel} Risk
                    </span>
                  </h4>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Failure Probability: <strong>{simResult.failureProbabilityPercent ?? ((simResult.riskScore || 0) * 0.92).toFixed(1)}%</strong>
                  </span>
                </div>

                {/* TreeSHAP Exact Waterfall Attribution (Section 42 & 43) */}
                <div style={{ background: '#0f172a', borderRadius: '10px', padding: '16px', color: '#f8fafc', marginBottom: '16px', border: '1px solid #334155' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#60a5fa' }}>Game-Theoretic TreeSHAP Waterfall Attribution</span>
                    <span style={{ fontSize: '0.75rem', background: '#1e293b', padding: '2px 8px', borderRadius: '4px', border: '1px solid #475569', color: '#94a3b8' }}>
                      Model: {simResult.model_version || 'risk-lightgbm-v1.0'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#1e293b', borderRadius: '6px', marginBottom: '6px', fontSize: '0.85rem' }}>
                    <span>Base Expected Value E[f(x)]:</span>
                    <strong>{simResult.base_value !== undefined ? simResult.base_value : 45.0} risk units</strong>
                  </div>

                  {Array.isArray(simResult.shap_waterfall) && simResult.shap_waterfall.length > 0 ? (
                    simResult.shap_waterfall.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderBottom: '1px solid #1e293b', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: '#cbd5e1', fontWeight: '500' }}>{item.feature.replace(/_/g, ' ').toUpperCase()}:</span>
                          <span style={{ color: '#64748b', marginLeft: '6px', fontSize: '0.78rem' }}>({item.raw_value !== undefined ? item.raw_value : ''})</span>
                        </div>
                        <span style={{
                          fontWeight: '700',
                          color: item.direction === 'positive' ? '#f87171' : '#4ade80',
                          background: item.direction === 'positive' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                          padding: '2px 8px',
                          borderRadius: '4px'
                        }}>
                          {item.shap_value >= 0 ? `+${Number(item.shap_value).toFixed(3)}` : Number(item.shap_value).toFixed(3)}
                        </span>
                      </div>
                    ))
                  ) : (
                    Array.isArray(simResult.factorAnalysis) ? (
                      simResult.factorAnalysis.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 10px', fontSize: '0.85rem' }}>
                          <span>{item.factor || `Factor ${idx + 1}`}</span>
                          <span style={{ color: '#f87171' }}>{item.impact}</span>
                        </div>
                      ))
                    ) : null
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '6px', marginTop: '10px', fontWeight: '700' }}>
                    <span>Final Predicted Delivery Risk f(x):</span>
                    <span style={{ color: '#93c5fd' }}>{simResult.predictedRiskScore ?? simResult.riskScore} / 100</span>
                  </div>

                  <p style={{ fontStyle: 'italic', fontSize: '0.75rem', color: '#94a3b8', marginTop: '10px', marginBottom: 0 }}>
                    ℹ️ {simResult.scientific_disclaimer || "SHAP values represent model contributions and should not be interpreted as causal effects."}
                  </p>
                </div>

                <strong>AI Mitigation Recommendations:</strong>
                <ul className="recommendations-list">
                  {(simResult.recommendedMitigations || simResult.recommendations || []).map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Historical Snapshots Section */}
          {history.length > 0 && (
            <div className="history-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                <h3 style={{ margin: 0 }}>Telemetry Snapshot History</h3>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#64748b' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
                    Risk Index
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }}></span>
                    Sprint Velocity
                  </span>
                </div>
              </div>

              {/* Visual Telemetry Trend Sparkline */}
              {history.length > 1 && (
                <div style={{
                  background: 'rgba(15, 23, 42, 0.03)',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '16px'
                }}>
                  <svg viewBox="0 0 500 100" style={{ width: '100%', height: '110px', overflow: 'visible' }}>
                    <defs>
                      <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="velGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Risk Line */}
                    {(() => {
                      const list = history.slice(0, 6).reverse();
                      const step = 500 / Math.max(1, list.length - 1);
                      const points = list.map((d, i) => `${i * step},${100 - (Math.min(100, Math.max(0, d.riskScore || 0)) * 0.8 + 10)}`).join(' ');
                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke="#ef4444"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={points}
                          />
                          {list.map((d, i) => (
                            <g key={`risk-${i}`}>
                              <circle
                                cx={i * step}
                                cy={100 - (Math.min(100, Math.max(0, d.riskScore || 0)) * 0.8 + 10)}
                                r="4"
                                fill="#ef4444"
                                stroke="#ffffff"
                                strokeWidth="2"
                              />
                              <text
                                x={i * step}
                                y={100 - (Math.min(100, Math.max(0, d.riskScore || 0)) * 0.8 + 10) - 8}
                                fontSize="9"
                                fill="#ef4444"
                                textAnchor="middle"
                                fontWeight="bold"
                              >
                                {d.riskScore}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}

                    {/* Velocity Line */}
                    {(() => {
                      const list = history.slice(0, 6).reverse();
                      const step = 500 / Math.max(1, list.length - 1);
                      const points = list.map((d, i) => `${i * step},${100 - (Math.min(60, Math.max(0, d.sprintVelocity || 0)) * 1.3 + 10)}`).join(' ');
                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2.5"
                            strokeDasharray="4 4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={points}
                          />
                          {list.map((d, i) => (
                            <g key={`vel-${i}`}>
                              <circle
                                cx={i * step}
                                cy={100 - (Math.min(60, Math.max(0, d.sprintVelocity || 0)) * 1.3 + 10)}
                                r="3.5"
                                fill="#3b82f6"
                                stroke="#ffffff"
                                strokeWidth="2"
                              />
                              <text
                                x={i * step}
                                y={100 - (Math.min(60, Math.max(0, d.sprintVelocity || 0)) * 1.3 + 10) + 14}
                                fontSize="9"
                                fill="#3b82f6"
                                textAnchor="middle"
                              >
                                {d.sprintVelocity}v
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>
              )}

              <table className="history-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Risk Score</th>
                    <th>Velocity</th>
                    <th>Bug Trend</th>
                    <th>Code Quality</th>
                    <th>Tech Debt</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 5).map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.timestamp ? new Date(rec.timestamp).toLocaleString() : 'Recent'}</td>
                      <td>
                        <span className={`status-pill ${getRiskClass(rec.riskScore)}`}>
                          {rec.riskScore}
                        </span>
                      </td>
                      <td>{rec.sprintVelocity} pts</td>
                      <td style={{ textTransform: 'capitalize' }}>{rec.bugTrend}</td>
                      <td>{rec.codeQualityIndex}/100</td>
                      <td style={{ textTransform: 'capitalize' }}>{rec.technicalDebt}</td>
                      <td>{rec.projectProgress}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <p>No project health telemetry available for this project yet.</p>
          <button onClick={handleApplySimulation} className="primary-btn">Initialize Project Telemetry</button>
        </div>
      )}
    </div>
  );
}

export default ProjectHealthDashboard;