import React, { useState } from 'react';
import './AiRequirementAnalyzer.css';
import { apiService } from './apiService';
import { useNotification } from './NotificationContext';

const AiRequirementAnalyzer = () => {
  const [text, setText] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showSuccess, showError } = useNotification();

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setReport(null);

    try {
      const data = await apiService.analyzeRequirements(text);
      showSuccess('Requirements analyzed successfully!');
      setReport(data);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analyzer-container">
      <h2>Module 1: AI Requirement Analyzer</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your Software Requirement Specification (SRS) here..."
        rows="10"
      />
      <button onClick={handleAnalyze} disabled={loading || !text}>
        {loading ? 'Analyzing...' : 'Analyze Requirements'}
      </button>

      {error && <div className="error-message">Error: {error.message}</div>}

      {report && (
        <div className="report-container">
          <h3>Analysis Report</h3>
          <div className="report-grid">
            <div className="report-item">
              <h4>Word Count</h4>
              <p>{report.wordCount}</p>
            </div>
            <div className="report-item">
              <h4>Sentence Count</h4>
              <p>{report.sentenceCount}</p>
            </div>
          </div>
          <h4>Keyword Analysis</h4>
          {Object.keys(report.keywordCount).length > 0 ? (
            <ul>
              {Object.entries(report.keywordCount).map(([key, value]) => (
                <li key={key}><strong>{key}:</strong> {value}</li>
              ))}
            </ul>
          ) : <p>No keywords found.</p>}
        </div>
      )}
    </div>
  );
};

export default AiRequirementAnalyzer;