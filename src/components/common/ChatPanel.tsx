import { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessage, getApiKey, type ChatMessage } from '../../services/claude';
import { ApiKeyInput } from './ApiKeyInput';
import { createPortal } from 'react-dom';

interface Props {
  /** Unique key for localStorage persistence (e.g. "gold", "btc", "danang") */
  chatId: string;
  systemPrompt: string;
  initialQuestion?: string;
}

function loadMessages(chatId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(`chat_${chatId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(chatId: string, messages: ChatMessage[]) {
  localStorage.setItem(`chat_${chatId}`, JSON.stringify(messages));
}

export function ChatPanel({ chatId, systemPrompt, initialQuestion }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(chatId));
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState(!!getApiKey());
  const [maximized, setMaximized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveMessages(chatId, messages);
  }, [chatId, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, maximized]);

  // Lock body scroll when maximized
  useEffect(() => {
    if (maximized) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [maximized]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendMessage(newMessages, systemPrompt);
      const finalMessages = [...newMessages, { role: 'assistant' as const, content: reply }];
      setMessages(finalMessages);
    } catch (e) {
      const finalMessages = [...newMessages, { role: 'assistant' as const, content: `Error: ${(e as Error).message}` }];
      setMessages(finalMessages);
    } finally {
      setLoading(false);
    }
  }, [messages, loading, systemPrompt]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(`chat_${chatId}`);
  }, [chatId]);

  const chatContent = (isMax: boolean) => (
    <>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #2a2a4a',
        gap: 8,
        flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#26a69a' }}>AI Adviser</span>
          {messages.length > 0 && (
            <span style={{ fontSize: 10, color: '#6b7280' }}>({messages.length} messages)</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {messages.length > 0 && (
            <button
              onClick={clearHistory}
              style={{
                padding: '2px 8px', fontSize: 10, border: '1px solid #2a2a4a', borderRadius: 4,
                background: 'transparent', color: '#ef5350', cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setMaximized(!isMax)}
            title={isMax ? 'Minimize' : 'Maximize'}
            style={{
              padding: '2px 8px', fontSize: 11, border: '1px solid #2a2a4a', borderRadius: 4,
              background: 'transparent', color: '#9ca3af', cursor: 'pointer', fontFamily: 'monospace',
            }}
          >
            {isMax ? '↙' : '↗'}
          </button>
          <ApiKeyInput onKeySet={() => setHasKey(true)} />
        </div>
      </div>

      {!hasKey ? (
        <div style={{ padding: 16, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
          Enter your Anthropic API key above to start chatting.
          <br />
          <span style={{ fontSize: 11 }}>Key is stored in localStorage only. Uses Claude Haiku 4.5.</span>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            {messages.length === 0 && (
              <div style={{ fontSize: 11, color: '#6b7280', textAlign: 'center', padding: 12 }}>
                Ask me about this data — should you buy, sell, or wait?
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: isMax ? '70%' : '85%',
                padding: '10px 14px',
                borderRadius: 12,
                fontSize: isMax ? 14 : 12,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                background: m.role === 'user' ? '#1a3a5c' : '#1a1a2e',
                color: m.role === 'user' ? '#e0e0e0' : '#c0c0c0',
                border: `1px solid ${m.role === 'user' ? '#2a4a6c' : '#2a2a4a'}`,
              }}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '10px 14px', borderRadius: 12,
                fontSize: isMax ? 14 : 12,
                background: '#1a1a2e', color: '#6b7280',
                border: '1px solid #2a2a4a',
              }}>
                Thinking...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {messages.length === 0 && initialQuestion && (
            <div style={{ padding: '0 16px 8px', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
              <button
                onClick={() => send(initialQuestion)}
                style={{
                  padding: '6px 14px', fontSize: 12, fontWeight: 600, borderRadius: 8,
                  border: '1px solid #2a2a4a', background: 'rgba(38,166,154,0.08)',
                  color: '#26a69a', cursor: 'pointer', textAlign: 'left',
                }}
              >
                {initialQuestion}
              </button>
            </div>
          )}

          {/* Input */}
          <div style={{
            display: 'flex', gap: 8, padding: '10px 16px',
            borderTop: '1px solid #2a2a4a', flexShrink: 0,
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send(input)}
              placeholder="Ask about investment advice..."
              disabled={loading}
              style={{
                flex: 1, padding: '10px 14px', fontSize: isMax ? 14 : 12, borderRadius: 8,
                border: '1px solid #2a2a4a', background: '#0f0f1a', color: '#e0e0e0',
                outline: 'none',
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              style={{
                padding: '10px 20px', fontSize: isMax ? 14 : 12, fontWeight: 600, borderRadius: 8,
                border: 'none', cursor: 'pointer',
                background: loading || !input.trim() ? '#2a2a4a' : '#26a69a',
                color: loading || !input.trim() ? '#6b7280' : '#0f0f1a',
              }}
            >
              Send
            </button>
          </div>
        </>
      )}
    </>
  );

  return (
    <>
      {/* Inline (embedded in chart) */}
      {!maximized && (
        <div style={{
          borderTop: '1px solid #2a2a4a',
          background: '#12121f',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 400,
        }}>
          {chatContent(false)}
        </div>
      )}

      {/* Maximized (full-screen portal) */}
      {maximized && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.8)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setMaximized(false); }}
        >
          <div style={{
            width: '100%', maxWidth: 800, height: '90vh',
            background: '#12121f', borderRadius: 16,
            border: '1px solid #2a2a4a',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {chatContent(true)}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
