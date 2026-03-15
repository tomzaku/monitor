import type { ReactNode } from 'react';
import type { TimeRange } from '../../types/market';
import { TimeRangeSelector } from '../common/TimeRangeSelector';
import { Spinner } from '../common/Spinner';

export interface SourceLink {
  label: string;
  url: string;
}

interface Props {
  title: string;
  subtitle?: string;
  source?: SourceLink;
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
  source,
  footer,
  timeRange,
  onTimeRangeChange,
  isLoading,
  error,
  children,
}: Props) {
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
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#e0e0e0' }}>{title}</h3>
          {subtitle && <span style={{ fontSize: 11, color: '#6b7280' }}>{subtitle}</span>}
          {source && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, color: '#4fc3f7', textDecoration: 'none', display: 'inline-block', marginTop: subtitle ? 0 : 2 }}
            >
              {source.label} ↗
            </a>
          )}
        </div>
        <TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} />
      </div>
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
