import { type ReactNode, useState } from 'react';
import type { TimeRange } from '../../types/market';
import { TimeRangeSelector } from '../common/TimeRangeSelector';
import { Spinner } from '../common/Spinner';

export interface ProofStep {
  step: string;
  url: string;
  detail: string;
}

interface Props {
  title: string;
  subtitle?: string;
  proofs?: ProofStep[];
  footer?: ReactNode;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  isLoading?: boolean;
  error?: string | null;
  children: ReactNode;
}

export function ChartContainer({
  title,
  subtitle,
  proofs,
  footer,
  timeRange,
  onTimeRangeChange,
  isLoading,
  error,
  children,
}: Props) {
  const [showProofs, setShowProofs] = useState(false);

  return (
    <div style={{
      background: '#1a1a2e',
      borderRadius: 12,
      border: '1px solid #2a2a4a',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid #2a2a4a',
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#e0e0e0' }}>{title}</h3>
            {subtitle && <span style={{ fontSize: 11, color: '#6b7280' }}>{subtitle}</span>}
          </div>
          {proofs && proofs.length > 0 && (
            <button
              onClick={() => setShowProofs((v) => !v)}
              style={{
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 600,
                border: `1px solid ${showProofs ? '#4fc3f7' : '#2a2a4a'}`,
                borderRadius: 4,
                cursor: 'pointer',
                background: showProofs ? 'rgba(79,195,247,0.12)' : 'transparent',
                color: showProofs ? '#4fc3f7' : '#6b7280',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {showProofs ? '✕ Close' : `Proof (${proofs.length})`}
            </button>
          )}
        </div>
        <TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} />
      </div>

      {showProofs && proofs && (
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #2a2a4a',
          background: 'rgba(79,195,247,0.04)',
          maxHeight: 300,
          overflowY: 'auto',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Data collection steps
          </div>
          {proofs.map((p, i) => (
            <div key={i} style={{
              padding: '8px 10px',
              marginBottom: 6,
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 6,
              border: '1px solid #2a2a4a',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#e0e0e0', marginBottom: 2 }}>
                {i + 1}. {p.step}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
                {p.detail}
              </div>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 11, color: '#4fc3f7', textDecoration: 'none', wordBreak: 'break-all' }}
              >
                {p.url} ↗
              </a>
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, position: 'relative', minHeight: 300 }}>
        {isLoading && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(15,15,26,0.7)' }}>
            <Spinner />
          </div>
        )}
        {error && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(15,15,26,0.7)', color: '#ef5350', fontSize: 13, padding: 20,
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}
        {children}
      </div>
      {footer && (
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid #2a2a4a',
          fontSize: 11,
          lineHeight: 1.6,
          color: '#6b7280',
        }}>
          {footer}
        </div>
      )}
    </div>
  );
}
