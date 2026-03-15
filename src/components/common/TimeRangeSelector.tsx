import type { TimeRange } from '../../types/market';

const ranges: TimeRange[] = ['1M', '3M', '6M', '1Y', '5Y', 'ALL'];

interface Props {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {ranges.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          style={{
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 600,
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            background: r === value ? '#4fc3f7' : 'rgba(255,255,255,0.08)',
            color: r === value ? '#0f0f1a' : '#9ca3af',
            transition: 'all 0.15s',
          }}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
