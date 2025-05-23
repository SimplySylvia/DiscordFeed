import { render, screen } from '@testing-library/react';
import Home from './page';
import '@testing-library/jest-dom';

describe('Home', () => {
  it('renders the main title', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Discord Feed');
  });

  it('renders the description', () => {
    render(<Home />);
    expect(screen.getByText(/A unified feed interface for Discord/i)).toBeInTheDocument();
  });

  it('renders the Get Started button with correct link', () => {
    render(<Home />);
    const getStarted = screen.getByTestId('get-started');
    expect(getStarted).toBeInTheDocument();
    expect(getStarted).toHaveAttribute('href', '/login');
    expect(getStarted).toHaveTextContent('Get Started');
  });
});
