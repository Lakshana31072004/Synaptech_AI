import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../AuthContext';
import { NotificationProvider } from '../NotificationContext';
import LoginForm from './LoginForm';

describe('LoginForm Component', () => {
  test('renders login form with username and password fields and submit button', () => {
    render(
      <BrowserRouter>
        <NotificationProvider>
          <AuthProvider>
            <LoginForm />
          </AuthProvider>
        </NotificationProvider>
      </BrowserRouter>
    );

    // Verify title and labels
    expect(screen.getByText('Login to Synaptech')).toBeInTheDocument();
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();

    // Verify inputs
    const usernameInput = screen.getByPlaceholderText(/Enter your username/i);
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i);
    expect(usernameInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();

    // Test typing in credentials
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    expect(usernameInput.value).toBe('testuser');

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput.value).toBe('password123');

    // Verify login button
    const submitBtn = screen.getByRole('button', { name: /Log In/i });
    expect(submitBtn).toBeInTheDocument();
  });
});
