import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AiSprintPlanner.css';
import { apiService } from '../apiService';
import { useNotification } from '../NotificationContext';

const AiSprintPlanner = () => {
  const [projectRequirements, setProjectRequirements] = useState(
    'Implement user authentication with JWT\nBuild real-time project health dashboard\nImplement NLP requirement parser and analyzer\nBuild automated sprint backlog generator\nCreate developer workload optimization algorithm'
  );
  const [teamCapacity, setTeamCapacity] = useState(30);
  const [developerCount, setDeveloperCount] = useState(4);
  const [sprintDurationWeeks, setSprintDurationWeeks] = useState(2);
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importedNotice, setImportedNotice] = useState(false);
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    const pendingStories = localStorage.getItem('synaptech_pending_sprint_stories');
    if (pendingStories && pendingStories.trim()) {
      setProjectRequirements(pendingStories);
      setImportedNotice(true);
      showSuccess('Automatically imported user stories from Module 1 (Requirement Analyzer)!');
      localStorage.removeItem('synaptech_pending_sprint_stories');
    }
  }, [showSuccess]);

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const data = await apiService.planSprint({
        projectRequirements,
        teamCapacity: Number(teamCapacity),
        developerCount: Number(developerCount),
        sprintDurationWeeks: Number(sprintDurationWeeks)
      });
      setPlan(data);
      showSuccess('Sprint plan generated successfully!');
    } catch (err) {
      showError(err.message || 'Failed to generate sprint plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDeriveArchitecture = () => {
    const points = plan?.totalEstimatedStoryPoints || 30;
    const archCriteria = {
      teamSize: Number(developerCount),
      scalabilityRequirement: points > 50 ? 'High (Millions of users)' : 'Medium (Tens of thousands)',
      latencyRequirement: 'Standard (<500ms)',
      projectType: 'Web Application'
    };
    localStorage.setItem('synaptech_pending_arch_criteria', JSON.stringify(archCriteria));
    showSuccess('Exported sprint capacity constraints to Module 3 (Architecture Advisor)!');
    navigate('/architecture');
  };

  return (
    <div className="sprint-planner-container">
      <h2>Module 2: AI Sprint Planner</h2>
      <p className="subtitle">Automatically generate story point estimations, sprint timelines, and sprint backlogs using AI.</p>

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
          marginBottom: '14px'
        }}>
          <span>✨ <strong>Continuous Pipeline Active:</strong> Pre-populated with user stories exported from Module 1.</span>
          <button
            type="button"
            onClick={() => setImportedNotice(false)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="planner-form">
        <label>
          <strong>User Stories / Requirements (one per line):</strong>
          <textarea
            value={projectRequirements}
            onChange={(e) => setProjectRequirements(e.target.value)}
            rows="6"
            placeholder="Enter requirements or user stories..."
          />
        </label>

        <div className="form-row">
          <label>
            Team Capacity (pts/sprint):
            <input
              type="number"
              value={teamCapacity}
              onChange={(e) => setTeamCapacity(e.target.value)}
              min="5"
              max="200"
            />
          </label>

          <label>
            Developers Count:
            <input
              type="number"
              value={developerCount}
              onChange={(e) => setDeveloperCount(e.target.value)}
              min="1"
              max="50"
            />
          </label>

          <label>
            Sprint Duration (weeks):
            <input
              type="number"
              value={sprintDurationWeeks}
              onChange={(e) => setSprintDurationWeeks(e.target.value)}
              min="1"
              max="4"
            />
          </label>
        </div>

        <button onClick={handleGeneratePlan} disabled={loading || !projectRequirements} className="primary-btn">
          {loading ? 'Generating Sprint Plan...' : 'Generate AI Sprint Plan'}
        </button>
      </div>

      {plan && (
        <div className="plan-results">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
            <h3 style={{ margin: 0 }}>Generated Sprint Planning Report</h3>
            <button
              type="button"
              onClick={handleDeriveArchitecture}
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
              🏛️ Derive Architecture Blueprint (Module 3) &rarr;
            </button>
          </div>
          
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="metric-label">Total Story Points</span>
              <span className="metric-value">{plan.totalEstimatedStoryPoints}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Recommended Sprints</span>
              <span className="metric-value">{plan.recommendedSprintCount}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Timeline Forecast</span>
              <span className="metric-value">{plan.estimatedDurationWeeks || plan.estimatedWeeks || 2} wks</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Capacity Utilization</span>
              <span className="metric-value">{plan.teamCapacityUtilization || 85}%</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Risk Level</span>
              <span className={`risk-badge risk-${(plan.riskLevel || 'low').toLowerCase()}`}>{plan.riskLevel || 'Low'}</span>
            </div>
          </div>

          <h4>Recommended Sprint Backlog</h4>
          <table className="backlog-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Story Title</th>
                <th>Story Points</th>
                <th>Priority</th>
                <th>Target Sprint</th>
              </tr>
            </thead>
            <tbody>
              {(plan.sprintBacklog || []).map((story) => (
                <tr key={story.id}>
                  <td><code>{story.id}</code></td>
                  <td>{story.title}</td>
                  <td><strong>{story.storyPoints}</strong> pts</td>
                  <td><span className={`priority-badge priority-${(story.priority || 'medium').toLowerCase()}`}>{story.priority || 'Medium'}</span></td>
                  <td>Sprint {story.targetSprint || 1}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AiSprintPlanner;
