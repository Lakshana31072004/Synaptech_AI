import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [importedNotice, setImportedNotice] = useState(false);

  // Custom standalone prompt state
  const [customPrompt, setCustomPrompt] = useState('');
  const [customLoading, setCustomLoading] = useState(false);
  const [customDiagram, setCustomDiagram] = useState(null);

  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    const pendingCriteria = localStorage.getItem('synaptech_pending_arch_criteria');
    if (pendingCriteria) {
      try {
        const parsed = JSON.parse(pendingCriteria);
        if (parsed.teamSize) setTeamSize(parsed.teamSize);
        if (parsed.scalabilityRequirement) setScalabilityRequirement(parsed.scalabilityRequirement);
        if (parsed.latencyRequirement) setLatencyRequirement(parsed.latencyRequirement);
        if (parsed.projectType) setProjectType(parsed.projectType);
        setImportedNotice(true);
        showSuccess('Pre-filled architecture parameters derived from Sprint Planner (Module 2)!');
      } catch (e) {
        console.error('Error parsing pending arch criteria', e);
      }
      localStorage.removeItem('synaptech_pending_arch_criteria');
    }
  }, [showSuccess]);

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

  const handleRegisterToTraceability = () => {
    if (!report) return;
    const activeProjectId = localStorage.getItem('synaptech_active_project') || '1';
    const components = Object.entries(report.suggestedTechStack || {}).map(([layer, tech]) => ({
      name: `${layer}: ${tech}`,
      layer,
      status: 'Active'
    }));
    localStorage.setItem(`synaptech_registered_arch_${activeProjectId}`, JSON.stringify({
      archName: report.recommendedArchitecture,
      components
    }));
    showSuccess(`Registered ${components.length} architectural components to Traceability Graph (Module 6)!`);
    navigate('/traceability');
  };

  const handleInspectComponentInModule4 = () => {
    if (!report) return;
    const archName = report.recommendedArchitecture || 'Microservices Gateway';
    let codeTemplate = '';
    if (archName.toLowerCase().includes('event') || archName.toLowerCase().includes('kafka') || archName.toLowerCase().includes('iot')) {
      codeTemplate = `// Architecture Component: \${archName}
// Ingested from Synaptech Module 3 Architecture Blueprint
package com.synaptech.telemetry.consumer;

import org.springframework.stereotype.Service;
import java.sql.Connection;
import java.sql.Statement;

@Service
public class TelemetryStreamConsumer {

    // Edge sensor ingestion worker
    public void processSensorPayload(Connection conn, String deviceId, String telemetryPayload) throws Exception {
        Statement stmt = conn.createStatement();
        // Dynamic string concatenation - inspection target for SQLi and resource leak
        String query = "INSERT INTO sensor_logs (device_id, payload) VALUES ('" + deviceId + "', '" + telemetryPayload + "')";
        stmt.executeUpdate(query);
    }
}`;
    } else if (archName.toLowerCase().includes('serverless')) {
      codeTemplate = `// Architecture Component: \${archName}
// Ingested from Synaptech Module 3 Architecture Blueprint
package com.synaptech.serverless.handler;

import java.sql.*;

public class ServerlessOrderHandler {

    public void handleRequest(String orderId, String authHeader) throws Exception {
        // Authenticate request token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new SecurityException("Unauthorized request token");
        }
        
        Connection conn = DriverManager.getConnection("jdbc:postgresql://cloud-db:5432/orders");
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery("SELECT * FROM orders WHERE order_id = '" + orderId + "'");
        while (rs.next()) {
            System.out.println("Processing order: " + rs.getString("order_id"));
        }
    }
}`;
    } else {
      codeTemplate = `// Architecture Component: \${archName}
// Ingested from Synaptech Module 3 Architecture Blueprint
package com.synaptech.gateway.service;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

public class CoreBffGatewayController {

    private String internalApiKey = "sk_live_sec_prod_992147102";

    public void dispatchRoute(Connection conn, String tenantId, String routePath) throws Exception {
        Statement stmt = conn.createStatement();
        // Ingestion path requiring security inspection
        String sql = "SELECT target_service_url FROM route_registry WHERE tenant_id = '" + tenantId + "' AND path = '" + routePath + "'";
        ResultSet rs = stmt.executeQuery(sql);
        if (rs.next()) {
            System.out.println("Routing to: " + rs.getString("target_service_url"));
        }
    }
}`;
    }

    const payload = {
      componentName: archName,
      language: 'java',
      code: codeTemplate,
      source: 'Module 3 Architecture Blueprint',
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('synaptech_pending_code_inspection', JSON.stringify(payload));
    showSuccess(`Scaffolded component "${archName}" code exported to Module 4 (Code Review Inspector)!`);
    navigate('/code-review');
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

      {importedNotice && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.15)',
          border: '1px solid rgba(96, 165, 250, 0.4)',
          borderRadius: '8px',
          padding: '8px 14px',
          color: '#93c5fd',
          fontSize: '0.86rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <span>✨ <strong>Continuous Pipeline Active:</strong> Architecture parameters pre-configured from Sprint Planner.</span>
          <button
            type="button"
            onClick={() => setImportedNotice(false)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            ✕
          </button>
        </div>
      )}

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
            c4={customDiagram.c4DiagramMermaid || customDiagram.c4}
            sequence={customDiagram.sequenceDiagramMermaid || customDiagram.sequence}
            title={customDiagram.title}
          />
        </div>
      )}

      {/* --- Report Output with Visual Diagram Canvas --- */}
      {report && (
        <div className="arch-results">
          {/* Main Recommended Architecture Card */}
          <div className="arch-card">
            <div className="arch-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0' }}>{report.recommendedArchitecture}</h3>
                <span className="confidence-badge">
                  Confidence: {report.confidenceScore}%
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleInspectComponentInModule4}
                  className="primary-btn"
                  style={{
                    fontSize: '0.84rem',
                    padding: '6px 14px',
                    background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  💻 Inspect Component Code (Module 4) &rarr;
                </button>
                <button
                  type="button"
                  onClick={handleRegisterToTraceability}
                  className="primary-btn"
                  style={{
                    fontSize: '0.84rem',
                    padding: '6px 14px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                  }}
                >
                  🕸️ Register to Traceability Graph (Module 6) &rarr;
                </button>
              </div>
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
                {(report.keyBenefits || report.pros || []).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>

            <div className="detail-box">
              <h4>Engineering Trade-offs &amp; Risks</h4>
              <ul className="tradeoffs-list">
                {(report.architecturalTradeOffs || report.cons || []).map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggested Tech Stack */}
          {(report.suggestedTechStack || report.technologyStack) && Object.keys(report.suggestedTechStack || report.technologyStack).length > 0 && (
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
                    {Object.entries(report.suggestedTechStack || report.technologyStack).map(([layer, tech]) => (
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
          {((report.implementationGuidelines || []).length > 0) && (
            <div className="guidelines-box">
              <h4>Key Architectural Implementation Guidelines</h4>
              <ul className="guidelines-list">
                {(report.implementationGuidelines || []).map((g, i) => (
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
