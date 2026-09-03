import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AiArchitectureAdvisor from './AiArchitectureAdvisor';
import { NotificationProvider } from '../NotificationContext';
import { apiService } from '../apiService';

jest.mock('../apiService');

describe('AiArchitectureAdvisor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiService.recommendArchitecture.mockResolvedValue({
      recommendedArchitecture: 'Domain-Driven Microservices Architecture',
      confidenceScore: 91,
      summary: 'Well-suited for large teams and autonomous deployment cycles.',
      keyBenefits: ['Autonomous continuous delivery pipelines'],
      architecturalTradeOffs: ['Distributed data management complexity'],
      suggestedTechStack: {
        'Microservices': 'Spring Boot REST / gRPC',
        'API Gateway': 'Spring Cloud Gateway'
      },
      alternativeArchitecture: 'Modular Monolith',
      implementationGuidelines: ['Strictly align service boundaries with DDD contexts']
    });
  });

  test('renders architecture advisor form and triggers recommendation', async () => {
    render(
      <NotificationProvider>
        <AiArchitectureAdvisor />
      </NotificationProvider>
    );

    expect(screen.getByText(/Module 3: Software Architecture Recommendation Engine/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Generate AI Architecture Recommendation/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Domain-Driven Microservices Architecture')).toBeInTheDocument();
      expect(screen.getByText(/Confidence: 91%/i)).toBeInTheDocument();
      expect(screen.getByText(/Autonomous continuous delivery pipelines/i)).toBeInTheDocument();
      expect(screen.getByText(/Spring Cloud Gateway/i)).toBeInTheDocument();
    });
  });
});
