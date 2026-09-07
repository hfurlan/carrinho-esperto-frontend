import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ResolutionBadge } from './ResolutionBadge.tsx';

describe('ResolutionBadge', () => {
  it('shows an "identified" label for a resolved item', () => {
    render(<ResolutionBadge status="RESOLVED" />);
    expect(screen.getByText('Produto identificado')).toBeInTheDocument();
  });

  it('shows a "not identified" label for unresolved or unknown', () => {
    const { rerender } = render(<ResolutionBadge status="UNRESOLVED" />);
    expect(screen.getByText('Não identificado')).toBeInTheDocument();
    rerender(<ResolutionBadge status={null} />);
    expect(screen.getByText('Não identificado')).toBeInTheDocument();
  });
});
