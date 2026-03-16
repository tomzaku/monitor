import { useState, useRef, useEffect } from 'react';
import { sendMessage, getApiKey, type ChatMessage } from '../../services/claude';
import { ApiKeyInput } from './ApiKeyInput';

interface Props {
  systemPrompt: string;
  initialQuestion?: string;
}

export function ChatPanel({ systemPrompt, initialQuestion }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState(!!getApiKey());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const reply = await sendMessage(newMessages, systemPrompt);
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages([...newMessages, { role: 'assistant', content: `Error: ${(e as Error).message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      borderTop: '1px solid #2a2a4a',
      background: '#12121f',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #2a2a4a',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#4fc3f7' }}>AI Adviser</span>
        <ApiKeyInput onKeySet={() => setHasKey(true)} />
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
            maxHeight: 300,
            overflowY: 'auto',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            {messages.length === 0 && (
              <div style={{ fontSize: 11, color: '#6b7280', textAlign: 'center', padding: 8 }}>
                Ask me about this data — should you buy, sell, or wait?
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                padding: '8px 12px',
                borderRadius: 10,
                fontSize: 12,
                lineHeight: 1.5,
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
                padding: '8px 12px',
                borderRadius: 10,
                fontSize: 12,
                background: '#1a1a2e',
                color: '#6b7280',
                border: '1px solid #2a2a4a',
              }}>
                Thinking...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick questions */}
          {messages.length === 0 && initialQuestion && (
            <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                onClick={() => send(initialQuestion)}
                style={{
                  padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6,
                  border: '1px solid #2a2a4a', background: 'rgba(79,195,247,0.08)',
                  color: '#4fc3f7', cursor: 'pointer',
                }}
              >
                {initialQuestion.length > 60 ? initialQuestion.slice(0, 60) + '...' : initialQuestion}
              </button>
            </div>
          )}

          {/* Input */}
          <div style={{
            display: 'flex',
            gap: 6,
            padding: '8px 12px',
            borderTop: '1px solid #2a2a4a',
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send(input)}
              placeholder="Ask about investment advice..."
              disabled={loading}
              style={{
                flex: 1, padding: '8px 12px', fontSize: 12, borderRadius: 8,
                border: '1px solid #2a2a4a', background: '#0f0f1a', color: '#e0e0e0',
                outline: 'none',
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              style={{
                padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8,
                border: 'none', cursor: 'pointer',
                background: loading || !input.trim() ? '#2a2a4a' : '#4fc3f7',
                color: loading || !input.trim() ? '#6b7280' : '#0f0f1a',
              }}
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}
