import { type ReactNode, useState } from 'react';
import type { TimeRange } from '../../types/market';
import { TimeRangeSelector } from '../common/TimeRangeSelector';
import { Spinner } from '../common/Spinner';
import { ChatPanel } from '../common/ChatPanel';

export interface ProofStep {
  step: string;
  url: string;
  detail: string;
}

export interface RelatedEvent {
  date: string;
  title: string;
  impact: 'positive' | 'negative' | 'neutral';
  detail: string;
  url?: string;
}

type BottomTab = 'analyze' | 'ai' | 'related' | null;
type RelatedPeriod = '1W' | '1M' | '1Y';

interface Props {
  title: string;
  subtitle?: string;
  proofs?: ProofStep[];
  footer?: ReactNode;
  relatedEvents?: RelatedEvent[];
  chatId?: string;
  aiContext?: string;
  aiQuestion?: string;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
  isLoading?: boolean;
  error?: string | null;
  children: ReactNode;
}

const tabStyle = (active: boolean, color: string) => ({
  padding: '6px 14px',
  fontSize: 11,
  fontWeight: 600 as const,
  borderRadius: '6px 6px 0 0',
  cursor: 'pointer' as const,
  border: 'none',
  borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
  background: active ? `${color}12` : 'transparent',
  color: active ? color : '#6b7280',
  transition: 'all 0.15s',
});

function filterByPeriod(events: RelatedEvent[], period: RelatedPeriod): RelatedEvent[] {
  const now = new Date();
  let cutoff: Date;
  switch (period) {
    case '1W': cutoff = new Date(now.getTime() - 7 * 86400000); break;
    case '1M': cutoff = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
    case '1Y': cutoff = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
  }
  return events.filter((e) => new Date(e.date) >= cutoff);
}

const impactColors = { positive: '#26a69a', negative: '#ef5350', neutral: '#6b7280' };
const impactLabels = { positive: '▲', negative: '▼', neutral: '●' };

export function ChartContainer({
  title, subtitle, proofs, footer, relatedEvents,
  chatId, aiContext, aiQuestion,
  timeRange, onTimeRangeChange, isLoading, error, children,
}: Props) {
  const [activeTab, setActiveTab] = useState<BottomTab>(footer ? 'analyze' : null);
  const [relatedPeriod, setRelatedPeriod] = useState<RelatedPeriod>('1M');
  const [showProofs, setShowProofs] = useState(false);

  const systemPrompt = aiContext
    ? `Bạn là một chuyên gia tư vấn đầu tư tài chính tại Việt Nam. Bạn phân tích dữ liệu thị trường và đưa ra lời khuyên cụ thể, thực tế.

Quy tắc:
- Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu
- Luôn đề cập đến dữ liệu cụ thể (giá, %, thời gian) khi phân tích
- Đưa ra khuyến nghị rõ ràng: NÊN MUA, NÊN BÁN, hay NÊN CHỜ
- Giải thích lý do dựa trên xu hướng lịch sử và tình hình hiện tại
- Cảnh báo rủi ro cụ thể
- So sánh với các kênh đầu tư khác khi phù hợp (vàng vs BĐS vs gửi tiết kiệm)
- Disclaimer: "Đây là phân tích tham khảo, không phải lời khuyên tài chính chính thức."

Dữ liệu biểu đồ "${title}":
${aiContext}`
    : '';

  const toggleTab = (tab: BottomTab) => {
    setActiveTab((prev) => prev === tab ? null : tab);
    setShowProofs(false);
  };

  const filteredEvents = relatedEvents ? filterByPeriod(relatedEvents, relatedPeriod) : [];

  return (
    <div style={{
      background: '#1a1a2e', borderRadius: 12, border: '1px solid #2a2a4a',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', borderBottom: '1px solid #2a2a4a', flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: '#e0e0e0' }}>{title}</h3>
            {subtitle && <span style={{ fontSize: 11, color: '#6b7280' }}>{subtitle}</span>}
          </div>
          {proofs && proofs.length > 0 && (
            <button
              onClick={() => { setShowProofs((v) => !v); setActiveTab(null); }}
              style={{
                padding: '3px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4, cursor: 'pointer',
                border: `1px solid ${showProofs ? '#4fc3f7' : '#2a2a4a'}`,
                background: showProofs ? 'rgba(79,195,247,0.12)' : 'transparent',
                color: showProofs ? '#4fc3f7' : '#6b7280',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {showProofs ? '✕ Close' : `Proof (${proofs.length})`}
            </button>
          )}
        </div>
        <TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} />
      </div>

      {/* Proof panel */}
      {showProofs && proofs && (
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid #2a2a4a',
          background: 'rgba(79,195,247,0.04)', maxHeight: 300, overflowY: 'auto',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Data collection steps
          </div>
          {proofs.map((p, i) => (
            <div key={i} style={{
              padding: '8px 10px', marginBottom: 6, background: 'rgba(255,255,255,0.03)',
              borderRadius: 6, border: '1px solid #2a2a4a',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#e0e0e0', marginBottom: 2 }}>{i + 1}. {p.step}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>{p.detail}</div>
              <a href={p.url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: '#4fc3f7', textDecoration: 'none', wordBreak: 'break-all' }}>
                {p.url} ↗
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Chart area */}
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
            background: 'rgba(15,15,26,0.7)', color: '#ef5350', fontSize: 13, padding: 20, textAlign: 'center',
          }}>
            {error}
          </div>
        )}
        {children}
      </div>

      {/* Bottom tab bar */}
      <div style={{
        display: 'flex', gap: 2, padding: '0 12px',
        borderTop: '1px solid #2a2a4a', background: '#12121f',
      }}>
        {footer && (
          <button onClick={() => toggleTab('analyze')} style={tabStyle(activeTab === 'analyze', '#ff9800')}>
            Analyze
          </button>
        )}
        {aiContext && (
          <button onClick={() => toggleTab('ai')} style={tabStyle(activeTab === 'ai', '#26a69a')}>
            AI Adviser
          </button>
        )}
        {relatedEvents && relatedEvents.length > 0 && (
          <button onClick={() => toggleTab('related')} style={tabStyle(activeTab === 'related', '#ab47bc')}>
            Related Data
          </button>
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'analyze' && footer && (
        <div style={{
          padding: '12px 16px', fontSize: 11, lineHeight: 1.6, color: '#6b7280',
          maxHeight: 400, overflowY: 'auto', background: '#0f0f1a',
        }}>
          {footer}
        </div>
      )}

      {activeTab === 'ai' && aiContext && (
        <div style={{ background: '#0f0f1a' }}>
          <ChatPanel chatId={chatId || title} systemPrompt={systemPrompt} initialQuestion={aiQuestion} />
        </div>
      )}

      {activeTab === 'related' && relatedEvents && (
        <div style={{ background: '#0f0f1a', maxHeight: 400, overflowY: 'auto' }}>
          {/* Period selector */}
          <div style={{ display: 'flex', gap: 4, padding: '10px 12px', borderBottom: '1px solid #2a2a4a' }}>
            {(['1W', '1M', '1Y'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setRelatedPeriod(p)}
                style={{
                  padding: '3px 10px', fontSize: 11, fontWeight: 600, borderRadius: 4,
                  border: 'none', cursor: 'pointer',
                  background: relatedPeriod === p ? '#ab47bc' : 'rgba(255,255,255,0.06)',
                  color: relatedPeriod === p ? '#0f0f1a' : '#9ca3af',
                }}
              >
                {p === '1W' ? '1 tuần' : p === '1M' ? '1 tháng' : '1 năm'}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#6b7280', alignSelf: 'center' }}>
              {filteredEvents.length} events
            </span>
          </div>

          {/* Event list */}
          <div style={{ padding: '8px 12px' }}>
            {filteredEvents.length === 0 ? (
              <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: '#6b7280' }}>
                Không có sự kiện nào trong khoảng thời gian này.
              </div>
            ) : (
              filteredEvents.map((evt, i) => (
                <div key={i} style={{
                  padding: '8px 10px', marginBottom: 6, borderRadius: 6,
                  border: '1px solid #2a2a4a', background: 'rgba(255,255,255,0.02)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ color: impactColors[evt.impact], fontSize: 11, fontWeight: 700 }}>
                      {impactLabels[evt.impact]}
                    </span>
                    <span style={{ fontSize: 10, color: '#6b7280' }}>{evt.date}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#e0e0e0' }}>{evt.title}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.5 }}>{evt.detail}</div>
                  {evt.url && (
                    <a href={evt.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 10, color: '#4fc3f7', textDecoration: 'none' }}>
                      Source ↗
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
