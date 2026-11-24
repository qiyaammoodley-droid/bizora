
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const {
  getSessionMock,
  onAuthStateChangeMock,
  unsubscribeMock,
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
  unsubscribeMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
    },
  },
}));

describe('Bizora App', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getSessionMock.mockReturnValue(
      new Promise(() => {}),
    );

    onAuthStateChangeMock.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: unsubscribeMock,
        },
      },
    });
  });

  it('displays the loading screen while checking authentication', () => {
    render(<App />);

    expect(screen.getByText('Loading Bizora...')).toBeInTheDocument();
  });

  it('checks the current Supabase authentication session', () => {
    render(<App />);

    expect(getSessionMock).toHaveBeenCalledTimes(1);
  });

  it('subscribes to Supabase authentication changes', () => {
    render(<App />);

    expect(onAuthStateChangeMock).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes from authentication changes when unmounted', () => {
    const { unmount } = render(<App />);

    unmount();

    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });
});
