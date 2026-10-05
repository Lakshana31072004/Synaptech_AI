import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './AiRequirementAnalyzer.css';
import { apiService } from '../apiService';
import { useNotification } from '../NotificationContext';

const SRS_TEMPLATES = [
  {
    name: 'FinTech & Cloud Security',
    content: `1. The user must be able to securely authenticate using JWT tokens and multi-factor authentication.
2. The system shall encrypt all sensitive database fields using AES-256 encryption.
3. The application must be fast and provide a user-friendly dashboard for project health monitoring.
4. The system shall maintain 99.9% uptime and provide automated database failover.
5. Users can export sprint backlogs to CSV and PDF formats.
6. The API response time must be under 200ms for 95% of requests under concurrent load.
7. The interface should be responsive across desktop and tablet screen sizes.`
  },
  {
    name: 'E-Commerce & Order Fulfillment',
    content: `1. Customers must be able to add catalog items to their shopping cart and checkout within 3 steps.
2. The payment gateway shall process credit card transactions securely with PCI-DSS compliance.
3. The inventory service shall automatically decrement warehouse stock counts in real-time upon order confirmation.
4. The web storefront must be extremely responsive and support 10,000 concurrent shopper sessions.
5. The system shall dispatch automated dispatch notification emails with tracking links within 5 minutes.
6. The database shall replicate customer order history across multi-region read replicas.
7. Order cancellation requests can be submitted by users prior to warehouse shipment.`
  },
  {
    name: 'Healthcare & Telemedicine (HIPAA)',
    content: `1. The telemedicine platform shall comply with HIPAA and encrypt patient health records in transit and at rest.
2. Doctors must be able to conduct live encrypted video consultations with streaming latency under 150ms.
3. The system shall provide automated appointment scheduling with calendar synchronization and SMS reminders.
4. Patients can download lab results and clinical diagnostic summaries in secure encrypted PDF format.
5. The mobile interface should be seamless and provide an intuitive user experience for elderly patients.
6. Electronic prescription orders must be digitally signed using asymmetric cryptographic keys.
7. Audit trails shall be preserved for 7 years with immutable database access logs.`
  },
  {
    name: 'IoT Fleet & Telemetry Pipeline',
    content: `1. Edge telemetry sensors must stream ambient temperature and vibration metrics every 500 milliseconds.
2. The ingestion pipeline shall ingest up to 50,000 telemetry messages per second via MQTT broker.
3. The streaming analytics engine shall detect anomalous sensor deviations within 2 seconds of arrival.
4. Critical maintenance alerts must be dispatched to on-call technicians via webhook and SMS notifications.
5. The real-time operations dashboard must be robust and visualize time-series metrics with sub-second queries.
6. Historical device telemetry can be archived into cloud cold storage after 30 days.
7. Device firmware update binaries shall be verified with SHA-256 checksums before installation.`
  }
];

const SAMPLE_SRS = SRS_TEMPLATES[0].content;

const AiRequirementAnalyzer = () => {
  const [templateIndex, setTemplateIndex] = useState(0);
  const [text, setText] = useState(SAMPLE_SRS);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const handleLoadSample = (indexToLoad) => {
    const nextIdx = typeof indexToLoad === 'number' ? indexToLoad : (templateIndex + 1) % SRS_TEMPLATES.length;
    setTemplateIndex(nextIdx);
    const selected = SRS_TEMPLATES[nextIdx];
    setText(selected.content);
    setReport(null);
    showSuccess(`Loaded Sample SRS: "${selected.name}". Click 'Run AI Requirement Analysis' to inspect.`);
  };

  const processFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      let content = event.target.result || '';
      if (file.name.endsWith('.pdf') || file.name.endsWith('.docx')) {
        const matches = content.match(/([A-Z0-9][a-zA-Z0-9\s.,;:'"()\-]{10,})/g);
        if (matches && matches.length > 5) {
          content = matches.slice(0, 80).join('\n');
        }
      }
      setText(content);
      setReport(null);
      showSuccess(`Ingested document "${file.name}" (${(file.size / 1024).toFixed(1)} KB) into analyzer!`);
    };
    reader.onerror = () => showError('Failed to read uploaded document');
    reader.readAsText(file);
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);

    try {
      const data = await apiService.analyzeRequirements(text);
      showSuccess('Requirements analyzed successfully!');
      setReport(data);
    } catch (err) {
      showError(err.message || 'Failed to analyze requirements');
    } finally {
      setLoading(false);
    }
  };

  const getRatingBadgeClass = (rating) => {
    if (!rating) return '';
    const r = rating.toLowerCase().replace(/\s+/g, '-');
    return `rating-${r}`;
  };

  const getCategoryBadgeClass = (category) => {
    if (!category) return 'badge-tag';
    return `badge-tag badge-${category.toLowerCase()}`;
  };

  const formatStoryText = (story) => {
    if (typeof story === 'string') return story;
    if (story && typeof story === 'object') {
      return story.title || story.text || `${story.id || 'US'}: ${story.title || 'Story'}`;
    }
    return String(story);
  };

  const copyStoriesToClipboard = () => {
    if (report && report.extractedUserStories) {
      const textToCopy = report.extractedUserStories.map(formatStoryText).join('\n');
      navigator.clipboard.writeText(textToCopy);
      showSuccess('User stories copied to clipboard!');
    }
  };

  const handleExportToSprintPlanner = () => {
    if (report && report.extractedUserStories && report.extractedUserStories.length > 0) {
      const formatted = report.extractedUserStories.map(formatStoryText).join('\n');
      localStorage.setItem('synaptech_pending_sprint_stories', formatted);
      showSuccess(`Exported ${report.extractedUserStories.length} stories to Sprint Backlog (Module 2)!`);
      navigate('/planner');
    }
  };

  return (
    <div className="analyzer-container">
      <h2>Module 1: AI Requirement Analyzer &amp; SRS Validator</h2>
      <p className="analyzer-subtitle">
        Automated natural language requirement extraction, functional classification, ambiguity detection, and completeness scoring.
      </p>

      {/* Quick Domain Template Selector Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Sample SRS Domain:</span>
        {SRS_TEMPLATES.map((tmpl, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleLoadSample(idx)}
            style={{
              padding: '4px 12px',
              fontSize: '0.8rem',
              borderRadius: '16px',
              border: templateIndex === idx ? '1px solid var(--brand-primary)' : '1px solid rgba(148, 163, 184, 0.3)',
              background: templateIndex === idx ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: templateIndex === idx ? 'var(--brand-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: templateIndex === idx ? 700 : 500,
              transition: 'all 0.15s ease'
            }}
          >
            {tmpl.name}
          </button>
        ))}
      </div>

      {/* Document Ingestion Drag & Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleFileDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDragging ? '2px dashed var(--brand-primary)' : '1px dashed rgba(148, 163, 184, 0.35)',
          background: isDragging ? 'rgba(59, 130, 246, 0.1)' : 'rgba(15, 23, 42, 0.3)',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.4rem' }}>📁</span>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Drop SRS document here or click to browse
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Supports .pdf, .docx, .md, .txt specifications
            </div>
          </div>
        </div>
        <button
          type="button"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: 'var(--text-primary)',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '0.78rem',
            cursor: 'pointer'
          }}
        >
          Choose File
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => processFile(e.target.files?.[0])}
          style={{ display: 'none' }}
          accept=".txt,.md,.pdf,.docx,.json,.csv"
        />
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your Software Requirement Specification (SRS) or user stories here..."
        rows="8"
      />

      <div className="analyzer-actions">
        <button
          onClick={handleAnalyze}
          disabled={loading || !text.trim()}
          className="primary-btn"
        >
          {loading ? 'Analyzing SRS with NLP...' : 'Run AI Requirement Analysis'}
        </button>
        <button
          type="button"
          onClick={() => handleLoadSample()}
          className="sample-btn"
          title="Click to cycle to the next sample SRS template"
        >
          Load Next Sample SRS
        </button>
      </div>

      {report && (
        <div className="report-container">
          {/* Quality & Completeness Header Card */}
          <div className="completeness-card">
            <div className="score-badge">
              <span className="score-value">{report.overallCompletenessScore || report.completenessScore || report.qualityScore || 85}%</span>
              <span className="score-label">ISO 25010 Score</span>
            </div>
            <div className="score-details">
              <h3>SRS Quality Rating: <span className={getRatingBadgeClass(report.qualityRating)}>{report.qualityRating || 'High'}</span></h3>
              <p>
                Parsed <strong>{report.functionalRequirements ? report.functionalRequirements.length : 0}</strong> functional criteria,{' '}
                <strong>{report.nonFunctionalRequirements ? report.nonFunctionalRequirements.length : 0}</strong> quality attributes, and detected{' '}
                <strong>{report.ambiguityIssues ? report.ambiguityIssues.length : (report.ambiguousTermsFound ? report.ambiguousTermsFound.length : 0)}</strong> ambiguities.
              </p>
            </div>
          </div>

          {/* Ambiguities & Actionable Recommendations */}
          {((report.ambiguityIssues && report.ambiguityIssues.length > 0) || (report.ambiguousTermsFound && report.ambiguousTermsFound.length > 0)) && (
            <div className="ambiguity-box">
              <h4>Detected Ambiguities &amp; ISO 25010 Deficiencies</h4>
              <ul className="ambiguity-list">
                {(report.ambiguityIssues || report.ambiguousTermsFound).map((issue, idx) => (
                  <li key={idx} className="ambiguity-item">
                    <span className="issue-icon">⚠️</span>
                    <div>
                      <strong>{issue.requirementId || issue.term || `REQ-${idx + 1}`}:</strong> {issue.text || issue.issue || (issue.term ? `Detected vague term "${issue.term}" in: "${issue.context}"` : issue)}
                      {(issue.recommendation || issue.suggestion) && (
                        <div className="recommendation-text">
                          <em>Suggested Fix:</em> {issue.recommendation || issue.suggestion}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements Classification Grid */}
          <div className="req-grid">
            {/* Functional Requirements */}
            <div className="req-card">
              <h4>Functional Specifications ({report.functionalRequirements ? report.functionalRequirements.length : 0})</h4>
              {report.functionalRequirements && report.functionalRequirements.length > 0 ? (
                <ul className="req-list">
                  {report.functionalRequirements.map((fr) => (
                    <li key={fr.id} className="req-list-item">
                      <div className="req-meta">
                        <code>{fr.id}</code>
                        <span className="badge-tag badge-functional">Functional</span>
                      </div>
                      <span>{fr.text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No functional criteria identified.</p>
              )}
            </div>

            {/* Non-Functional Requirements */}
            <div className="req-card">
              <h4>Non-Functional Requirements ({report.nonFunctionalRequirements ? report.nonFunctionalRequirements.length : 0})</h4>
              {report.nonFunctionalRequirements && report.nonFunctionalRequirements.length > 0 ? (
                <ul className="req-list">
                  {report.nonFunctionalRequirements.map((nfr) => (
                    <li key={nfr.id} className="req-list-item">
                      <div className="req-meta">
                        <code>{nfr.id}</code>
                        <span className={getCategoryBadgeClass(nfr.category)}>{nfr.category}</span>
                      </div>
                      <span>{nfr.text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No non-functional criteria identified.</p>
              )}
            </div>
          </div>

          {/* User Stories Extraction Box */}
          {report.extractedUserStories && report.extractedUserStories.length > 0 && (
            <div className="stories-box">
              <div className="stories-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h4>Synthesized Agile User Stories ({report.extractedUserStories.length})</h4>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={copyStoriesToClipboard}
                    className="secondary-btn"
                    style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                  >
                    📋 Copy Stories
                  </button>
                  <button
                    type="button"
                    onClick={handleExportToSprintPlanner}
                    className="primary-btn"
                    style={{
                      fontSize: '0.85rem',
                      padding: '6px 14px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                      color: '#ffffff',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    ⚡ Export to Sprint Backlog (Module 2) &rarr;
                  </button>
                </div>
              </div>
              <ul className="stories-list">
                {report.extractedUserStories.map((story, i) => (
                  <li key={i}>{formatStoryText(story)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiRequirementAnalyzer;