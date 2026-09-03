import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AiRequirementAnalyzer from './AiRequirementAnalyzer';
import { NotificationProvider } from '../NotificationContext';
import { apiService } from '../apiService';

jest.mock('../apiService');

describe('AiRequirementAnalyzer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiService.analyzeRequirements.mockResolvedValue({
      wordCount: 45,
      sentenceCount: 4,
      qualityScore: 88,
      qualityRating: 'Excellent',
      analysisSummary: 'Analyzed 4 sentences. Identified 2 functional requirements and 1 non-functional requirement.',
      functionalRequirements: [
        { id: 'FR-1', text: 'The user can export sprint backlogs to CSV', category: 'Functional', priority: 'High' }
      ],
      nonFunctionalRequirements: [
        { id: 'NFR-1', text: 'The system shall encrypt all sensitive database fields', category: 'Security', priority: 'High' }
      ],
      ambiguousTermsFound: [
        { term: 'fast', context: 'The application must be fast', suggestion: 'Quantify with specific latency SLA' }
      ],
      extractedUserStories: [
        'As an end-user, I want to export sprint backlogs to CSV so that business operations run effectively.'
      ]
    });
  });

  test('renders analyzer, triggers analysis, and displays classified requirements', async () => {
    render(
      <NotificationProvider>
        <AiRequirementAnalyzer />
      </NotificationProvider>
    );

    expect(screen.getByText(/Module 1: AI Requirement Analyzer/i)).toBeInTheDocument();

    const analyzeBtn = screen.getByRole('button', { name: /Run AI Requirement Analysis/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(screen.getByText('88%')).toBeInTheDocument();
      expect(screen.getByText('Excellent')).toBeInTheDocument();
      expect(screen.getByText(/Quantify with specific latency SLA/i)).toBeInTheDocument();
      expect(screen.getByText('FR-1')).toBeInTheDocument();
      expect(screen.getByText('NFR-1')).toBeInTheDocument();
      expect(screen.getAllByText(/The system shall encrypt all sensitive database fields/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Synthesized Agile User Stories/i)).toBeInTheDocument();
    });
  });
});
