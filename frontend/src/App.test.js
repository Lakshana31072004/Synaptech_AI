import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import App from './App';

test('renders ASEOS header and login navigation', () => {
  render(
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  );
  const headingElement = screen.getByText(/Autonomous Software Engineering OS/i);
  expect(headingElement).not.toBeNull();
});
