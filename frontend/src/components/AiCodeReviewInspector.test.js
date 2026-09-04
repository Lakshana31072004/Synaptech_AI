import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AiCodeReviewInspector from './AiCodeReviewInspector';
import { NotificationProvider } from '../NotificationContext';
import { apiService } from '../apiService';

jest.mock('../apiService');

describe('AiCodeReviewInspector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiService.reviewCode.mockResolvedValue({
      overallQualityScore: 45,
      riskLevel: 'Critical',
      summary: 'Found 1 security vulnerability(ies). Overall security risk is Critical.',
      vulnerabilities: [
        {
          title: 'Potential SQL Injection via Dynamic Query Construction',
          severity: 'Critical',
          category: 'OWASP A03:2021 - Injection (CWE-89)',
          description: 'Raw string concatenation detected in query.',
          snippet: 'SELECT * FROM users WHERE name = ' + 'input',
          remediation: 'Use PreparedStatement with parameter binding.'
        }
      ],
      codeSmells: ['High Cyclomatic Complexity'],
      keyImprovements: ['Replaced concatenated SQL with PreparedStatement.'],
      refactoredCode: 'public class SecureService { ... }'
    });
  });

  test('renders code review inspector and triggers analysis', async () => {
    render(
      <NotificationProvider>
        <AiCodeReviewInspector />
      </NotificationProvider>
    );

    expect(screen.getByText(/Module 5: AI Code Review & Security Vulnerability Inspector/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Run AI Vulnerability & Code Review/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Potential SQL Injection/i)).toBeInTheDocument();
      expect(screen.getByText(/Risk Level: Critical/i)).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText(/Copy Refactored Code/i)).toBeInTheDocument();
    });
  });
});
