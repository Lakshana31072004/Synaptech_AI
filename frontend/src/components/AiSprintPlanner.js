import React, { useState } from 'react';
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
  const { showSuccess, showError } = useNotification();

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

  return (
    <div className="sprint-planner-container">
      <h2>Module 2: AI Sprint Planner</h2>
      <p className="subtitle">Automatically generate story point estimations, sprint timelines, and sprint backlogs using AI.</p>

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
            Developer Count:
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
              max="6"
            />
          </label>
        </div>

        <button onClick={handleGeneratePlan} disabled={loading || !projectRequirements} className="primary-btn">
          {loading ? 'Generating Sprint Plan...' : 'Generate AI Sprint Plan'}
        </button>
      </div>

      {plan && (
        <div className="plan-results">
          <h3>Generated Sprint Planning Report</h3>
          
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
              <span className="metric-value">{plan.estimatedDurationWeeks} wks</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Capacity Utilization</span>
              <span className="metric-value">{plan.teamCapacityUtilization}%</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Risk Level</span>
              <span className={`risk-badge risk-${plan.riskLevel.toLowerCase()}`}>{plan.riskLevel}</span>
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
              {plan.sprintBacklog.map((story) => (
                <tr key={story.id}>
                  <td><code>{story.id}</code></td>
                  <td>{story.title}</td>
                  <td><strong>{story.storyPoints}</strong> pts</td>
                  <td><span className={`priority-badge priority-${story.priority.toLowerCase()}`}>{story.priority}</span></td>
                  <td>Sprint {story.targetSprint}</td>
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
