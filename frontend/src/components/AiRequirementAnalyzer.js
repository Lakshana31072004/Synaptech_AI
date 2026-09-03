import React, { useState } from 'react';
import './AiRequirementAnalyzer.css';
import { apiService } from '../apiService';
import { useNotification } from '../NotificationContext';

const SAMPLE_SRS = `1. The user must be able to securely authenticate using JWT tokens and multi-factor authentication.
2. The system shall encrypt all sensitive database fields using AES-256 encryption.
3. The application must be fast and provide a user-friendly dashboard for project health monitoring.
4. The system shall maintain 99.9% uptime and provide automated database failover.
5. Users can export sprint backlogs to CSV and PDF formats.
6. The API response time must be under 200ms for 95% of requests under concurrent load.
7. The interface should be responsive across desktop and tablet screen sizes.`;

const AiRequirementAnalyzer = () => {
  const [text, setText] = useState(SAMPLE_SRS);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

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

  const copyStoriesToClipboard = () => {
    if (report && report.extractedUserStories) {
      navigator.clipboard.writeText(report.extractedUserStories.join('\n'));
      showSuccess('User stories copied to clipboard!');
    }
  };

  return (
    <div className="analyzer-container">
      <h2>Module 1: AI Requirement Analyzer & SRS Validator</h2>
      <p className="analyzer-subtitle">
        Automated natural language requirement extraction, functional classification, ambiguity detection, and completeness scoring.
      </p>

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
          onClick={() => setText(SAMPLE_SRS)}
          className="sample-btn"
        >
          Load Sample SRS
        </button>
      </div>

      {report && (
        <div className="report-container">
          {/* Quality Score Hero Card */}
          <div className="score-hero">
            <div className="score-left">
              <h3>SRS Quality & Completeness Index</h3>
              <p>{report.analysisSummary}</p>
            </div>
            <div className="score-badge-group">
              <span className="quality-num">{report.qualityScore}%</span>
              <span className={`rating-badge ${getRatingBadgeClass(report.qualityRating)}`}>
                {report.qualityRating}
              </span>
            </div>
          </div>

          {/* Ambiguity Warning Box */}
          {report.ambiguousTermsFound && report.ambiguousTermsFound.length > 0 && (
            <div className="ambiguity-box">
              <h4>⚠️ Ambiguous / Untestable Language Detected ({report.ambiguousTermsFound.length})</h4>
              {report.ambiguousTermsFound.map((amb, i) => (
                <div key={i} className="ambiguity-item">
                  <span>
                    Detected vague term <span className="ambiguity-term">"{amb.term}"</span> in: <em>"{amb.context}"</em>
                  </span>
                  <div style={{ marginTop: '3px', fontWeight: 600 }}>
                    💡 Recommendation: {amb.suggestion}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Requirements Classification Columns */}
          <div className="req-columns">
            {/* Functional Requirements */}
            <div className="req-card">
              <h4>Functional Requirements ({report.functionalRequirements ? report.functionalRequirements.length : 0})</h4>
              {report.functionalRequirements && report.functionalRequirements.length > 0 ? (
                <ul className="req-list">
                  {report.functionalRequirements.map((fr) => (
                    <li key={fr.id} className="req-list-item">
                      <div className="req-meta">
                        <code>{fr.id}</code>
                        <span className="badge-tag">Functional</span>
                      </div>
                      <span>{fr.text}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No explicit functional requirements isolated.</p>
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
              <div className="stories-header">
                <h4>Synthesized Agile User Stories ({report.extractedUserStories.length})</h4>
                <button
                  type="button"
                  onClick={copyStoriesToClipboard}
                  className="secondary-btn"
                  style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                >
                  📋 Copy Stories for Sprint Planner
                </button>
              </div>
              <ul className="stories-list">
                {report.extractedUserStories.map((story, i) => (
                  <li key={i}>{story}</li>
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