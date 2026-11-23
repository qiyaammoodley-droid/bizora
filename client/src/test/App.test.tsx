
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('Bizora App', () => {
  it('displays the Bizora heading', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /bizora/i })
    ).toBeInTheDocument();
  });

  it('displays the frontend ready message', () => {
    render(<App />);

    expect(
      screen.getByText(/frontend environment ready/i)
    ).toBeInTheDocument();
  });
});
