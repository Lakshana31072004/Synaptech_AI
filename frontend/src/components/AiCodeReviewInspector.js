import React, { useState } from 'react';
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
  const [code, setCode] = useState(SAMPLES.vulnerable_sql.code);
  const [language, setLanguage] = useState('java');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const { showSuccess, showError } = useNotification();

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

  const lineCount = code.split('\n').length;

  return (
    <div className="code-review-container">
      <div className="code-review-header">
        <h2>Module 5: AI Code Review &amp; Security Vulnerability Inspector</h2>
        <p>Automated static analysis for OWASP Top 10 vulnerabilities, resource management leaks, architectural anti-patterns, and secure refactoring.</p>
      </div>

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

        <button type="submit" disabled={loading} className="primary-btn">
          {loading ? 'Analyzing Code & Checking OWASP Vulnerabilities...' : '🛡️ Run AI Vulnerability & Code Review'}
        </button>
      </form>

      {/* Results Section */}
      {report && (
        <div className="review-results-container">
          {/* Score Hero Banner */}
          <div className="review-score-hero">
            <div>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8', fontWeight: 700 }}>
                Code Security Evaluation
              </span>
              <h3 style={{ margin: '4px 0 8px 0', fontSize: '1.4rem', color: '#f8fafc', fontFamily: 'var(--font-heading)' }}>
                {report.summary}
              </h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span className={`status-pill score-badge-${report.riskLevel.toLowerCase()}`}>
                  Risk Level: {report.riskLevel}
                </span>
                <span style={{ color: '#cbd5e1', fontSize: '0.88rem' }}>
                  &bull; {report.vulnerabilities.length} Security Issue(s) &bull; {report.codeSmells.length} Smell(s)
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700 }}>Quality Index</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: report.overallQualityScore >= 80 ? '#4ade80' : report.overallQualityScore >= 60 ? '#facc15' : '#f87171', fontFamily: 'var(--font-heading)' }}>
                {report.overallQualityScore}<span style={{ fontSize: '1.2rem' }}>/100</span>
              </div>
            </div>
          </div>

          {/* Vulnerabilities List */}
          {report.vulnerabilities.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                Detected Security Vulnerabilities ({report.vulnerabilities.length})
              </h4>
              <div className="vulnerabilities-grid">
                {report.vulnerabilities.map((v, idx) => (
                  <div key={idx} className={`vulnerability-card sev-${v.severity.toLowerCase()}`}>
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
            {report.codeSmells.length > 0 && (
              <div style={{ background: 'var(--bg-muted)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#b45309', fontFamily: 'var(--font-heading)' }}>
                  Architectural Code Smells
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {report.codeSmells.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {report.keyImprovements.length > 0 && (
              <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid #bbf7d0' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#15803d', fontFamily: 'var(--font-heading)' }}>
                  Applied Security Enhancements
                </h4>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#166534', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {report.keyImprovements.map((imp, i) => (
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
