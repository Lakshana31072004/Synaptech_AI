import React, { useState } from 'react';
import './AiArchitectureAdvisor.css';
import { apiService } from '../apiService';
import { useNotification } from '../NotificationContext';
import ArchitectureDiagramCanvas from './ArchitectureDiagramCanvas';

const AiArchitectureAdvisor = () => {
  const [projectType, setProjectType] = useState('Web Application');
  const [scalabilityRequirement, setScalabilityRequirement] = useState('Medium');
  const [latencyRequirement, setLatencyRequirement] = useState('Standard (<500ms)');
  const [teamSize, setTeamSize] = useState(6);
  const [deploymentTarget, setDeploymentTarget] = useState('Cloud (AWS/GCP/Azure)');
  const [budgetConstraint, setBudgetConstraint] = useState('Flexible');

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  // Custom standalone prompt state
  const [customPrompt, setCustomPrompt] = useState('');
  const [customLoading, setCustomLoading] = useState(false);
  const [customDiagram, setCustomDiagram] = useState(null);

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
      showSuccess('Architecture recommendation and interactive diagram synthesized!');
    } catch (err) {
      showError(err.message || 'Failed to generate architecture recommendation');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDiagramGenerate = async (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    setCustomLoading(true);
    try {
      const res = await apiService.generateCustomArchitectureDiagram(customPrompt);
      setCustomDiagram(res);
      showSuccess(`Synthesized custom diagram: ${res.title}`);
    } catch (err) {
      showError('Failed to synthesize custom architecture diagram');
    } finally {
      setCustomLoading(false);
    }
  };

  return (
    <div className="arch-advisor-container">
      <div className="arch-header">
        <h2>Module 3: Software Architecture Recommendation Engine &amp; Live Canvas</h2>
        <p>AI-driven architectural pattern synthesis, interactive diagram topologies, trade-off evaluation, and tailored technology blueprints.</p>
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
              <option value="Data Analytics Platform">Analytics &amp; Reporting Platform</option>
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
          {loading ? 'Synthesizing Architecture & Diagram...' : 'Generate AI Architecture Recommendation & Visual Diagram'}
        </button>
      </form>

      {/* --- Custom Architecture Diagram Prompt Bar --- */}
      <div className="custom-prompt-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>✨</span>
          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>Prompt-to-Architecture:</span>
        </div>
        <form onSubmit={handleCustomDiagramGenerate} style={{ display: 'flex', gap: '10px', flex: 1, flexWrap: 'wrap' }}>
          <input
            type="text"
            className="custom-prompt-input"
            placeholder="e.g. 'Event-driven payment processing with Kafka', 'RAG LLM vector search agent', 'IoT stream pipeline'..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
          />
          <button
            type="submit"
            disabled={customLoading || !customPrompt.trim()}
            className="secondary-btn"
            style={{ background: 'var(--brand-primary)', color: '#fff', border: 'none' }}
          >
            {customLoading ? 'Rendering...' : 'Generate Canvas'}
          </button>
        </form>
      </div>

      {/* Custom Diagram Canvas Display */}
      {customDiagram && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ padding: '12px 18px', background: 'rgba(59, 130, 246, 0.08)', borderRadius: '10px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '14px' }}>
            <h4 style={{ margin: '0 0 4px 0', color: 'var(--brand-primary)' }}>{customDiagram.title}</h4>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{customDiagram.description}</p>
          </div>
          <ArchitectureDiagramCanvas
            topology={customDiagram.diagramMermaid}
            c4={customDiagram.diagramMermaid}
            sequence={customDiagram.diagramMermaid}
            title={customDiagram.title}
          />
        </div>
      )}

      {/* --- Report Output with Visual Diagram Canvas --- */}
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

          {/* --- Interactive Architecture Diagram Canvas --- */}
          {report.diagramMermaid && (
            <ArchitectureDiagramCanvas
              topology={report.diagramMermaid}
              c4={report.c4DiagramMermaid}
              sequence={report.sequenceDiagramMermaid}
              title={`${report.recommendedArchitecture} Canvas`}
            />
          )}

          {/* Benefits & Tradeoffs Grid */}
          <div className="details-grid" style={{ marginTop: '28px' }}>
            <div className="detail-box">
              <h4>Architectural Strengths &amp; Benefits</h4>
              <ul className="benefits-list">
                {report.keyBenefits.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>

            <div className="detail-box">
              <h4>Engineering Trade-offs &amp; Risks</h4>
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
              <div className="tech-stack-table-container">
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
