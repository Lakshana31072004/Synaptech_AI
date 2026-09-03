import React, { useState, useEffect, useCallback } from 'react';
import './ProjectHealthDashboard.css';
import { apiService } from './apiService';
import { useNotification } from './NotificationContext';

function ProjectHealthDashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [health, setHealth] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);

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
    }
  }, [selectedProjectId, loadProjectHealth]);

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
          <h2>Module 8: Project Health Dashboard</h2>
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

          <button
            onClick={() => setShowAddProject(!showAddProject)}
            className="secondary-btn"
          >
            {showAddProject ? 'Cancel' : '+ New Project'}
          </button>
        </div>
      </div>

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
              <h3>⚡ Module 5: AI Risk Simulator & Optimization Engine</h3>
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
                    Failure Probability: <strong>{simResult.failureProbabilityPercent}%</strong>
                  </span>
                </div>

                <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                  <strong>Factor Impact Analysis:</strong>
                  <ul style={{ margin: '4px 0 10px 0', paddingLeft: '20px', color: '#475569' }}>
                    {Object.entries(simResult.factorAnalysis).map(([k, v]) => (
                      <li key={k}>
                        <strong>{k}:</strong> {v}
                      </li>
                    ))}
                  </ul>
                </div>

                <strong>AI Mitigation Recommendations:</strong>
                <ul className="recommendations-list">
                  {simResult.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Historical Snapshots Section */}
          {history.length > 0 && (
            <div className="history-section">
              <h3>Telemetry Snapshot History</h3>
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