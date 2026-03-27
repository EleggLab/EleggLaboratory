import type { JSX } from 'react';
import type { ElementCount } from '@saju/core';

const colors: Record<keyof ElementCount, string> = {
  목: '#3aa66f',
  화: '#e4572e',
  토: '#c69c5d',
  금: '#a8b0bf',
  수: '#3a6ea5',
};

interface ElementLegendProps {
  counts: ElementCount;
}

export function ElementLegend({ counts }: ElementLegendProps): JSX.Element {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 8 }}>
      {(Object.keys(counts) as Array<keyof ElementCount>).map((key) => (
        <div
          key={key}
          style={{
            borderRadius: 12,
            padding: '0.5rem',
            border: `1px solid ${colors[key]}`,
            background: 'rgba(255,255,255,0.7)',
          }}
        >
          <div style={{ fontSize: 12, color: '#334155' }}>{key}</div>
          <div style={{ fontWeight: 700 }}>{counts[key]}</div>
        </div>
      ))}
    </div>
  );
}
