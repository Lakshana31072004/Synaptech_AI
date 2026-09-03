import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ProjectHealthDashboard from './ProjectHealthDashboard';
import { NotificationProvider } from './NotificationContext';
import { apiService } from './apiService';

jest.mock('./apiService');

describe('ProjectHealthDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiService.getProjects.mockResolvedValue([
      { id: 1, name: 'Project Alpha' },
      { id: 2, name: 'Project Beta' }
    ]);
    apiService.getProjectHealth.mockResolvedValue({
      id: 1,
      riskScore: 35,
      sprintVelocity: 42,
      bugTrend: 'stable',
      codeQualityIndex: 85,
      technicalDebt: 'low',
      projectProgress: 65
    });
    apiService.getProjectHealthHistory.mockResolvedValue([]);
    apiService.predictRisk.mockResolvedValue({
      riskScore: 45,
      riskLevel: 'Moderate',
      failureProbabilityPercent: 41.4,
      factorAnalysis: { 'Velocity Throughput': 'Stable' },
      recommendations: ['Maintain current cadence']
    });
  });

  test('renders Project Health Dashboard title and metrics', async () => {
    render(
      <NotificationProvider>
        <ProjectHealthDashboard />
      </NotificationProvider>
    );

    expect(screen.getByText(/Module 8: Project Health Dashboard/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('35')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getAllByText(/low/i).length).toBeGreaterThan(0);
    });
  });

  test('runs AI risk simulator and displays prediction result', async () => {
    render(
      <NotificationProvider>
        <ProjectHealthDashboard />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Module 5: AI Risk Simulator/i)).toBeInTheDocument();
    });

    const simulateBtn = screen.getByRole('button', { name: /Run AI Risk Simulation/i });
    fireEvent.click(simulateBtn);

    await waitFor(() => {
      expect(screen.getByText(/Predicted Risk:/i)).toBeInTheDocument();
      expect(screen.getByText(/45\/100/i)).toBeInTheDocument();
      expect(screen.getByText(/Maintain current cadence/i)).toBeInTheDocument();
    });
  });
});
