import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TraceabilityWhatIfDashboard from './TraceabilityWhatIfDashboard';
import { NotificationProvider } from '../NotificationContext';
import { apiService } from '../apiService';

jest.mock('mermaid', () => ({
  initialize: jest.fn(),
  render: jest.fn().mockResolvedValue({ svg: '<svg data-testid="mermaid-mock"></svg>' })
}));

jest.mock('../apiService');

describe('TraceabilityWhatIfDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiService.getTraceabilityGraph.mockResolvedValue({
      nodes: [
        { id: 'REQ-1', name: 'User Authentication', type: 'Requirement' },
        { id: 'US-101', name: 'JWT Auth Story', type: 'Story' },
        { id: 'ARCH-1', name: 'Spring Security Gateway', type: 'Architecture' }
      ],
      edges: [
        { source: 'REQ-1', target: 'US-101' },
        { source: 'US-101', target: 'ARCH-1' }
      ],
      mermaidDiagram: 'graph TD\n  REQ1["REQ-1"] --> US101["US-101"]'
    });

    apiService.getProjectSimulations.mockResolvedValue([
      {
        id: 'SIM-1',
        scenarioName: 'High Technical Debt Surge',
        projectedRiskLevel: 'High',
        healthScore: 68,
        createdAt: '2026-08-20T10:00:00Z'
      }
    ]);

    apiService.calculateTraceabilityImpact.mockResolvedValue({
      root_artifact_id: 'REQ-1',
      total_impacted_count: 3,
      blast_radius: 'Moderate',
      mean_impact_score: '0.64',
      gamma_attenuation: '0.75',
      impacted_artifacts: [
        { id: 'REQ-1', distance: 0, attenuated_impact: 1.0 },
        { id: 'US-101', distance: 1, attenuated_impact: 0.75 }
      ]
    });
  });

  test('renders traceability graph, audits impact, and displays blast radius results', async () => {
    render(
      <MemoryRouter>
        <NotificationProvider>
          <TraceabilityWhatIfDashboard projectId={1} />
        </NotificationProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Artifact Dependency Topology & Counterfactual Sandbox/i)).toBeInTheDocument();
    expect(screen.getByText(/Cross-Artifact Dependency Graph/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/\[Requirement\] User Authentication/i)).toBeInTheDocument();
    });

    const impactBtn = screen.getByRole('button', { name: /Audit Change Impact/i });
    fireEvent.click(impactBtn);

    await waitFor(() => {
      expect(screen.getByText(/Blast Radius: Moderate/i)).toBeInTheDocument();
      expect(screen.getByText(/Mean Attenuated Impact/i)).toBeInTheDocument();
    });
  });
});
