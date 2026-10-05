import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AiCodeReviewInspector.css';
import { apiService } from '../apiService';
import { useNotification } from '../NotificationContext';

const SAMPLES = {
  vulnerable_sql: {
    label: '🚨 SQLi & Hardcoded Secret',
    lang: 'java',
    code: `public class UserService {
    private String apiKey = "sk_live_98374928374923";

    public User getUser(Connection conn, String username) throws Exception {
        Statement stmt = conn.createStatement();
        // Dynamic string concatenation vulnerable to SQL injection
        String query = "SELECT * FROM users WHERE username = '" + username + "'";
        ResultSet rs = stmt.executeQuery(query);
        if (rs.next()) {
            return new User(rs.getString("username"));
        }
        return null;
    }
}`
  },
  resource_leak: {
    label: '🔓 Resource & Stream Leak',
    lang: 'java',
    code: `public class LogExporter {
    public void dumpLogs(String path) {
        try {
            // Resource opened without try-with-resources or deterministic close
            FileInputStream fis = new FileInputStream(path);
            BufferedReader reader = new BufferedReader(new InputStreamReader(fis));
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
        } catch (Exception e) {
            e.printStackTrace(); // Empty handling
        }
    }
}`
  },
  clean_service: {
    label: '🛡️ Clean Service Pattern',
    lang: 'java',
    code: `public class OrderService {
    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
            .orElseThrow(() -> new OrderNotFoundException(id));
    }
}`
  }
};

const AiCodeReviewInspector = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(SAMPLES.vulnerable_sql.code);
  const [language, setLanguage] = useState('java');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [pipelineNotice, setPipelineNotice] = useState(null);

  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    try {
      const pendingCode = localStorage.getItem('synaptech_pending_code_inspection');
      if (pendingCode) {
        const parsed = JSON.parse(pendingCode);
        if (parsed.code) {
          setCode(parsed.code);
          if (parsed.language) setLanguage(parsed.language);
          setPipelineNotice(parsed.componentName || 'Architecture Blueprint Component');
          showSuccess(`Ingested "${parsed.componentName}" code from Module 3 Architecture Canvas!`);
          localStorage.removeItem('synaptech_pending_code_inspection');
        }
      }
    } catch {}
  }, [showSuccess]);

  const handleLoadSample = (sampleKey) => {
    const sample = SAMPLES[sampleKey];
    if (sample) {
      setCode(sample.code);
      setLanguage(sample.lang);
      showSuccess(`Loaded sample: ${sample.label}`);
    }
  };

  const handleRunReview = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      showError('Please provide a code snippet to analyze.');
      return;
    }
    setLoading(true);
    try {
      const data = await apiService.reviewCode({
        codeSnippet: code,
        language,
        context: 'Enterprise Service'
      });
      setReport(data);
      showSuccess('AI Code Review completed successfully!');
    } catch (err) {
      showError(err.message || 'Failed to complete code review');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRefactored = () => {
    if (!report?.refactoredCode) return;
    navigator.clipboard.writeText(report.refactoredCode).then(
      () => showSuccess('Refactored code copied to clipboard!'),
      () => showError('Failed to copy code')
    );
  };

  const handleFeedToHealthAndRisk = () => {
    if (!report) return;
    const activeProjectId = localStorage.getItem('synaptech_active_project') || '1';
    const qualityScore = report.overallQualityScore ?? report.codeQualityScore ?? 75;
    const vulnCount = (report.vulnerabilities || []).length;
    const bugTrend = vulnCount >= 2 ? 'increasing' : (vulnCount === 1 ? 'stable' : 'decreasing');
    const technicalDebt = qualityScore < 70 ? 'high' : (qualityScore < 85 ? 'medium' : 'low');

    const metricsData = {
      codeQualityIndex: qualityScore,
      bugTrend,
      technicalDebt,
      vulnerabilitiesCount: vulnCount,
      riskLevel: report.riskLevel || 'Medium',
      source: 'Module 4 AI Code Review Inspector',
      timestamp: new Date().toISOString()
    };

    localStorage.setItem(`synaptech_pending_risk_metrics_${activeProjectId}`, JSON.stringify(metricsData));
    showSuccess(`Exported Code Quality (${qualityScore}/100) & Defect Influx to Module 5 (Health & Risk)!`);
    navigate('/risk');
  };

  const handleSyncToTraceabilityAndRisk = () => {
    if (!report) return;
    const activeProjectId = localStorage.getItem('synaptech_active_project') || '1';
    const vulnData = {
      issues: report.vulnerabilities || [],
      riskLevel: report.riskLevel || 'Medium',
      qualityScore: report.overallQualityScore ?? report.codeQualityScore ?? 75,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(`synaptech_code_vulnerabilities_${activeProjectId}`, JSON.stringify(vulnData));
    showSuccess(`Security telemetry & ${(report.vulnerabilities || []).length} vulnerability flags synced to Risk & Traceability!`);
    navigate('/traceability');
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="code-review-container">
      <div className="code-review-header">
        <h2>Module 4: AI Code Review &amp; Security Vulnerability Inspector</h2>
        <p>Automated static analysis for OWASP Top 10 vulnerabilities, resource management leaks, architectural anti-patterns, and secure refactoring.</p>
      </div>

      {pipelineNotice && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(52, 211, 153, 0.4)',
          borderRadius: '8px',
          padding: '8px 14px',
          color: '#6ee7b7',
          fontSize: '0.86rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}>
          <span>✨ <strong>Continuous Pipeline Active:</strong> Ingested component code for <strong>"{pipelineNotice}"</strong> from Module 3 Architecture Blueprint. Ready for AST inspection.</span>
          <button
            type="button"
            onClick={() => setPipelineNotice(null)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Language & Samples Bar */}
      <div className="review-controls-bar">
        <div className="lang-selector-group">
          <label>Language:</label>
          <select className="lang-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="java">Java 21 / Spring</option>
            <option value="javascript">JavaScript / Node.js</option>
            <option value="python">Python 3</option>
            <option value="sql">SQL Query</option>
          </select>
        </div>

        <div className="sample-chips">
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', alignSelf: 'center' }}>
            Quick Samples:
          </span>
          <button type="button" className="sample-chip-btn" onClick={() => handleLoadSample('vulnerable_sql')}>
            {SAMPLES.vulnerable_sql.label}
          </button>
          <button type="button" className="sample-chip-btn" onClick={() => handleLoadSample('resource_leak')}>
            {SAMPLES.resource_leak.label}
          </button>
          <button type="button" className="sample-chip-btn" onClick={() => handleLoadSample('clean_service')}>
            {SAMPLES.clean_service.label}
          </button>
        </div>
      </div>

      {/* Code Textarea Editor */}
      <form onSubmit={handleRunReview}>
        <div className="code-editor-box">
          <div className="code-editor-topbar">
            <span>Editor &bull; {language.toUpperCase()}</span>
            <span>{lineCount} lines &bull; {code.length} characters</span>
          </div>
          <textarea
            className="code-textarea"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste code or diff here to inspect for vulnerabilities..."
            spellCheck="false"
          />
        </div>

        <div className="review-actions">
          <button type="submit" disabled={loading || !code.trim()} className="primary-btn">
            {loading ? 'Inspecting Code for OWASP & Quality...' : 'Run AI Security & Quality Review'}
          </button>
        </div>
      </form>

      {/* Results Section */}
      {report && (
        <div className="review-results">
          {/* Top Score & Summary Banner */}
          <div className="review-hero-card">
            <div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.45rem', fontFamily: 'var(--font-heading)' }}>
                Code Review Verdict &bull; {report.targetModule || 'Service Component'}
              </h3>
              <p style={{ margin: '0 0 14px 0', color: '#cbd5e1', fontSize: '0.94rem' }}>
                {report.summary}
              </p>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={`status-pill score-badge-${(report.riskLevel || 'low').toLowerCase()}`}>
                  Risk Level: {report.riskLevel || 'Low'}
                </span>
                <span style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>
                  &bull; {(report.vulnerabilities || []).length} Security Issue(s) &bull; {(report.codeSmells || []).length} Smell(s)
                </span>
                <button
                  type="button"
                  onClick={handleFeedToHealthAndRisk}
                  className="primary-btn"
                  style={{
                    fontSize: '0.8rem',
                    padding: '5px 12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                    color: '#ffffff',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    cursor: 'pointer'
                  }}
                >
                  📊 Feed Quality to Health Telemetry (Module 5) &rarr;
                </button>
                <button
                  type="button"
                  onClick={handleSyncToTraceabilityAndRisk}
                  className="primary-btn"
                  style={{
                    fontSize: '0.8rem',
                    padding: '5px 12px',
                    background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
                    color: '#ffffff',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                    cursor: 'pointer'
                  }}
                >
                  🛡️ Sync to Traceability &amp; Risk &rarr;
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>Quality Index</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: (report.overallQualityScore ?? report.codeQualityScore ?? 80) >= 80 ? '#4ade80' : (report.overallQualityScore ?? report.codeQualityScore ?? 80) >= 60 ? '#facc15' : '#f87171', fontFamily: 'var(--font-heading)' }}>
                {report.overallQualityScore ?? report.codeQualityScore ?? 80}<span style={{ fontSize: '1.2rem' }}>/100</span>
              </div>
            </div>
          </div>

          {/* Vulnerabilities List */}
          {(report.vulnerabilities || []).length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                Detected Security Vulnerabilities ({(report.vulnerabilities || []).length})
              </h4>
              <div className="vulnerabilities-grid">
                {(report.vulnerabilities || []).map((v, idx) => (
                  <div key={idx} className={`vulnerability-card sev-${(v.severity || 'medium').toLowerCase()}`}>
                    <div className="vuln-header">
                      <div className="vuln-title">{v.title}</div>
                      <span className="vuln-category">{v.category}</span>
                    </div>
                    <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>
                      {v.description}
                    </p>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Recommended Remediation:
                    </div>
                    <div className="remediation-box">
                      {v.remediation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Code Smells & Improvements */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            {(report.codeSmells || []).length > 0 && (
              <div style={{ background: 'var(--bg-muted)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#b45309', fontFamily: 'var(--font-heading)' }}>
                  Architectural Code Smells
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {(report.codeSmells || []).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {(report.keyImprovements || []).length > 0 && (
              <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid #bbf7d0' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#15803d', fontFamily: 'var(--font-heading)' }}>
                  Applied Security Enhancements
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#166534', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {(report.keyImprovements || []).map((imp, i) => (
                    <li key={i}>{imp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Refactored Code Comparison Box */}
          {report.refactoredCode && (
            <div className="code-diff-section">
              <div className="code-diff-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>✨</span>
                  <span style={{ fontWeight: 700 }}>AI Secure Refactored Code</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRefactored}
                  style={{
                    background: 'var(--brand-primary)',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.82rem'
                  }}
                >
                  📋 Copy Refactored Code
                </button>
              </div>
              <pre className="refactored-pre">{report.refactoredCode}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiCodeReviewInspector;
