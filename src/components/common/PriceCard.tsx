interface Props {
  label: string;
  value: string;
  change?: string;
  isPositive?: boolean;
}

export function PriceCard({ label, value, change, isPositive }: Props) {
  return (
    <div style={{
      background: '#1a1a2e',
      borderRadius: 10,
      border: '1px solid #2a2a4a',
      padding: '14px 18px',
      minWidth: 160,
      flex: 1,
    }}>
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#e0e0e0' }}>
        {value}
      </div>
      {change && (
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: isPositive ? '#26a69a' : '#ef5350',
          marginTop: 2,
        }}>
          {change}
        </div>
      )}
    </div>
  );
}
