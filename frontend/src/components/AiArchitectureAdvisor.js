import React, { useState } from 'react';
import './AiArchitectureAdvisor.css';
import { apiService } from '../apiService';
import { useNotification } from '../NotificationContext';

const AiArchitectureAdvisor = () => {
  const [projectType, setProjectType] = useState('Web Application');
  const [scalabilityRequirement, setScalabilityRequirement] = useState('Medium');
  const [latencyRequirement, setLatencyRequirement] = useState('Standard (<500ms)');
  const [teamSize, setTeamSize] = useState(6);
  const [deploymentTarget, setDeploymentTarget] = useState('Cloud (AWS/GCP/Azure)');
  const [budgetConstraint, setBudgetConstraint] = useState('Flexible');

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  const handleRecommend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiService.recommendArchitecture({
        projectType,
        scalabilityRequirement,
        latencyRequirement,
        teamSize: Number(teamSize),
        deploymentTarget,
        budgetConstraint,
      });
      setReport(data);
      showSuccess('Architecture recommendation generated!');
    } catch (err) {
      showError(err.message || 'Failed to generate architecture recommendation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="arch-advisor-container">
      <div className="arch-header">
        <h2>Module 3: Software Architecture Recommendation Engine</h2>
        <p>AI-driven architectural pattern synthesis, trade-off matrix evaluation, and tailored technology stack design.</p>
      </div>

      <form onSubmit={handleRecommend} className="arch-form">
        <div className="arch-form-grid">
          <div className="arch-field">
            <label>Project / System Domain:</label>
            <select value={projectType} onChange={(e) => setProjectType(e.target.value)}>
              <option value="Web Application">Enterprise Web Platform</option>
              <option value="Mobile App Backend">Mobile Application Backend</option>
              <option value="IoT / High-Throughput Streaming">IoT / Real-time Event Streaming</option>
              <option value="Enterprise System">Complex ERP / Enterprise System</option>
              <option value="Data Analytics Platform">Analytics & Reporting Platform</option>
            </select>
          </div>

          <div className="arch-field">
            <label>Expected Scalability Target:</label>
            <select value={scalabilityRequirement} onChange={(e) => setScalabilityRequirement(e.target.value)}>
              <option value="High (Millions of users)">High (&gt; 1M monthly active users)</option>
              <option value="Medium (Tens of thousands)">Medium (10k - 500k users)</option>
              <option value="Low (Internal tool)">Low (Internal enterprise tool)</option>
            </select>
          </div>

          <div className="arch-field">
            <label>Latency Sensitivity:</label>
            <select value={latencyRequirement} onChange={(e) => setLatencyRequirement(e.target.value)}>
              <option value="Low Latency (<100ms)">Ultra-low Latency (&lt; 100ms)</option>
              <option value="Standard (<500ms)">Standard Web Latency (&lt; 500ms)</option>
              <option value="Flexible">Flexible / Asynchronous Batch</option>
            </select>
          </div>

          <div className="arch-field">
            <label>Engineering Team Size:</label>
            <input
              type="number"
              min="1"
              max="100"
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
            />
          </div>

          <div className="arch-field">
            <label>Target Deployment Topology:</label>
            <select value={deploymentTarget} onChange={(e) => setDeploymentTarget(e.target.value)}>
              <option value="Cloud (AWS/GCP/Azure)">Cloud (AWS / GCP / Azure Managed)</option>
              <option value="Kubernetes / Containers">Kubernetes / Microservices Mesh</option>
              <option value="Serverless">Serverless (Lambda / Cloud Functions)</option>
              <option value="Traditional VM / On-Premise">Traditional VM / On-Premise</option>
            </select>
          </div>

          <div className="arch-field">
            <label>Budget / Operational Complexity:</label>
            <select value={budgetConstraint} onChange={(e) => setBudgetConstraint(e.target.value)}>
              <option value="Flexible">Balanced / Standard</option>
              <option value="Constrained">Cost-Constrained (Lean OpEx)</option>
              <option value="High">High (Performance-First)</option>
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} className="primary-btn">
          {loading ? 'Synthesizing Architecture...' : 'Generate AI Architecture Recommendation'}
        </button>
      </form>

      {report && (
        <div className="arch-results">
          {/* Main Recommended Architecture Card */}
          <div className="arch-card">
            <div className="arch-card-header">
              <h3>{report.recommendedArchitecture}</h3>
              <span className="confidence-badge">
                Confidence: {report.confidenceScore}%
              </span>
            </div>
            <p className="arch-summary">{report.summary}</p>
            {report.alternativeArchitecture && (
              <p style={{ marginTop: '12px', fontSize: '0.9rem', color: '#94a3b8' }}>
                <em>Secondary Alternative Evaluated: <strong>{report.alternativeArchitecture}</strong></em>
              </p>
            )}
          </div>

          {/* Benefits & Tradeoffs Grid */}
          <div className="details-grid">
            <div className="detail-box">
              <h4>Architectural Strengths & Benefits</h4>
              <ul className="benefits-list">
                {report.keyBenefits.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>

            <div className="detail-box">
              <h4>Engineering Trade-offs & Risks</h4>
              <ul className="tradeoffs-list">
                {report.architecturalTradeOffs.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggested Tech Stack */}
          {report.suggestedTechStack && Object.keys(report.suggestedTechStack).length > 0 && (
            <div className="detail-box" style={{ marginBottom: '24px' }}>
              <h4>Recommended Technology Stack Blueprint</h4>
              <table className="tech-stack-table">
                <thead>
                  <tr>
                    <th>Architecture Layer</th>
                    <th>Recommended Technology / Tooling</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(report.suggestedTechStack).map(([layer, tech]) => (
                    <tr key={layer}>
                      <td className="tech-component">{layer}</td>
                      <td><strong>{tech}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Implementation Guidelines */}
          {report.implementationGuidelines && report.implementationGuidelines.length > 0 && (
            <div className="guidelines-box">
              <h4>Key Architectural Implementation Guidelines</h4>
              <ul className="guidelines-list">
                {report.implementationGuidelines.map((g, i) => (
                  <li key={i}>{g}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiArchitectureAdvisor;
