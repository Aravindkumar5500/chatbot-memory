import PropTypes from 'prop-types';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock complex UI library dependencies
vi.mock('react-markdown', () => {
  const MockMarkdown = ({ children }) => <div>{children}</div>;
  MockMarkdown.propTypes = { children: PropTypes.node };
  return { default: MockMarkdown };
});

vi.mock('react-syntax-highlighter', () => {
  const MockPrism = ({ children }) => <pre>{children}</pre>;
  MockPrism.propTypes = { children: PropTypes.node };
  return { Prism: MockPrism };
});
vi.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({ vscDarkPlus: {} }));

// Mock axios since App component calls history on mount
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({ data: { id: 1, role: 'bot', text: 'Mock response' } })),
    delete: vi.fn(() => Promise.resolve({ data: { message: 'History cleared' } })),
  }
}));

describe('Cortex Unified Workspace UI', () => {
  it('Elite Shell Check: should display branding and system status', async () => {
    render(<App />);
    
    // Check Brand HUD
    expect(screen.getByText(/Cortex v1.2/i)).toBeInTheDocument();
    
    // Check Network HUD
    expect(screen.getByText(/Network Ready/i)).toBeInTheDocument();
  });

  it('Input Protocol Check: should display high-precision placeholder', async () => {
    render(<App />);
    
    // Check Chat Input Placeholder
    const input = screen.getByPlaceholderText(/How can I assist you today\?/i);
    expect(input).toBeInTheDocument();
  });

  it('Command Sidebar Check: should show major navigation headers', async () => {
    render(<App />);
    
    // Check Intelligence History Header
    expect(screen.getByText(/Intelligence History/i)).toBeInTheDocument();
    
    // Check Premium User Profile Label
    expect(screen.getByText(/Premium User/i)).toBeInTheDocument();
  });
});
