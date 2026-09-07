import type { ResolutionStatus } from '../api/types.ts';
import { Badge } from './ui.tsx';

/**
 * Human-readable resolution state — "we know what this is" vs "not identified
 * yet". No internal terminology (no method / confidence) surfaced here.
 */
export function ResolutionBadge({ status }: { status: ResolutionStatus | null | undefined }) {
  switch (status) {
    case 'RESOLVED':
      return <Badge tone="emerald">Produto identificado</Badge>;
    case 'PROBABLE':
      return <Badge tone="amber">Provável</Badge>;
    case 'AMBIGUOUS':
      return <Badge tone="amber">Ambíguo</Badge>;
    default:
      return <Badge tone="slate">Não identificado</Badge>;
  }
}
