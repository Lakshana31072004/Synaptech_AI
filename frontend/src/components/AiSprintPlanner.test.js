import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AiSprintPlanner from './AiSprintPlanner';
import { NotificationProvider } from '../NotificationContext';
import { apiService } from '../apiService';

jest.mock('../apiService');

describe('AiSprintPlanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiService.planSprint.mockResolvedValue({
      totalEstimatedStoryPoints: 34,
      recommendedSprintCount: 2,
      estimatedDurationWeeks: 4,
      teamCapacityUtilization: 85,
      riskLevel: 'Moderate',
      sprintBacklog: [
        {
          id: 'US-101',
          title: 'Implement OAuth2 / JWT Authentication',
          storyPoints: 8,
          priority: 'High',
          targetSprint: 1
        },
        {
          id: 'US-102',
          title: 'Build automated sprint backlog generator',
          storyPoints: 13,
          priority: 'Medium',
          targetSprint: 1
        }
      ]
    });
  });

  test('renders sprint planner, triggers plan generation, and displays backlog report', async () => {
    render(
      <MemoryRouter>
        <NotificationProvider>
          <AiSprintPlanner />
        </NotificationProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Module 2: AI Sprint Planner/i)).toBeInTheDocument();

    const planBtn = screen.getByRole('button', { name: /Generate AI Sprint Plan/i });
    fireEvent.click(planBtn);

    await waitFor(() => {
      expect(screen.getByText('Generated Sprint Planning Report')).toBeInTheDocument();
      expect(screen.getByText('34')).toBeInTheDocument();
      expect(screen.getByText(/US-101/i)).toBeInTheDocument();
      expect(screen.getByText(/Implement OAuth2 \/ JWT Authentication/i)).toBeInTheDocument();
      expect(screen.getByText(/Derive Architecture Blueprint/i)).toBeInTheDocument();
    });
  });
});
