import React from 'react';
import ProjectHealthDashboard from './ProjectHealthDashboard';
import AiSprintPlanner from './components/AiSprintPlanner';
import AiRequirementAnalyzer from './components/AiRequirementAnalyzer';
import AiArchitectureAdvisor from './components/AiArchitectureAdvisor';

const DashboardPage = () => {
    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <ProjectHealthDashboard />
            <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #e1e4e8' }} />
            <AiRequirementAnalyzer />
            <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #e1e4e8' }} />
            <AiSprintPlanner />
            <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #e1e4e8' }} />
            <AiArchitectureAdvisor />
        </div>
    );
};

export default DashboardPage;
