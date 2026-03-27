import type { JSX } from 'react';

interface LabelBadgeProps {
  label: string;
  tone?: 'calculation' | 'rule' | 'ai';
}

const toneMap: Record<NonNullable<LabelBadgeProps['tone']>, string> = {
  calculation: 'var(--tone-calc)',
  rule: 'var(--tone-rule)',
  ai: 'var(--tone-ai)',
};

export function LabelBadge({ label, tone = 'calculation' }: LabelBadgeProps): JSX.Element {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.6rem',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        color: '#0f172a',
        background: toneMap[tone],
      }}
    >
      {label}
    </span>
  );
}
