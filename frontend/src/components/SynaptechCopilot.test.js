import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SynaptechCopilot from './SynaptechCopilot';
import { NotificationProvider } from '../NotificationContext';
import { apiService } from '../apiService';

jest.mock('../apiService');

describe('SynaptechCopilot Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiService.chatWithCopilot.mockResolvedValue({
      reply: 'A modular monolith works best for small teams.',
      suggestedPrompts: ['Compare with microservices', 'Database migration strategies']
    });
  });

  test('renders closed launcher button initially and opens on click', () => {
    render(
      <NotificationProvider>
        <SynaptechCopilot />
      </NotificationProvider>
    );

    const launcher = screen.getByRole('button', { name: /Open AI Copilot/i });
    expect(launcher).toBeInTheDocument();

    fireEvent.click(launcher);

    expect(screen.getByText('Synaptech Copilot')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask about architecture, velocity, security/i)).toBeInTheDocument();
  });

  test('supports minimize to compact glance bar and expand back', () => {
    render(
      <NotificationProvider>
        <SynaptechCopilot isOpen={true} />
      </NotificationProvider>
    );

    // Click minimize
    const minimizeBtn = screen.getByRole('button', { name: /Minimize Copilot/i });
    fireEvent.click(minimizeBtn);

    // Should now show compact glance bar with "Click to expand"
    expect(screen.getByText('Click to expand')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Ask about architecture, velocity, security/i)).toBeNull();

    // Click expand
    const expandBtn = screen.getByRole('button', { name: /Expand Copilot/i });
    fireEvent.click(expandBtn);

    // Restored to full view
    expect(screen.getByPlaceholderText(/Ask about architecture, velocity, security/i)).toBeInTheDocument();
  });

  test('sends inquiry and receives assistant response with suggestions', async () => {
    render(
      <NotificationProvider>
        <SynaptechCopilot isOpen={true} />
      </NotificationProvider>
    );

    const input = screen.getByPlaceholderText(/Ask about architecture, velocity, security/i);
    const sendBtn = screen.getByRole('button', { name: /Send/i });

    fireEvent.change(input, { target: { value: 'Should I use microservices?' } });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('A modular monolith works best for small teams.')).toBeInTheDocument();
      expect(screen.getByText('Compare with microservices')).toBeInTheDocument();
    });
  });

  test('triggers onClose when close button is clicked in controlled mode', () => {
    const handleClose = jest.fn();
    render(
      <NotificationProvider>
        <SynaptechCopilot isOpen={true} onClose={handleClose} />
      </NotificationProvider>
    );

    const closeBtn = screen.getByRole('button', { name: /Close Copilot/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
