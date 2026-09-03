import React from 'react';
import ProjectHealthDashboard from '../components/ProjectHealthDashboard';
import AiSprintPlanner from '../components/AiSprintPlanner';
import AiRequirementAnalyzer from '../components/AiRequirementAnalyzer';

const DashboardPage = () => {
    return (
        <>
            <ProjectHealthDashboard />
            <hr className="divider" />
            <AiSprintPlanner />
            <hr className="divider" />
            <AiRequirementAnalyzer />
        </>
    );
};

export default DashboardPage;