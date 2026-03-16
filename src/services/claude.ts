export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const API_URL = 'https://api.anthropic.com/v1/messages';

export function getApiKey(): string | null {
  return localStorage.getItem('anthropic_api_key');
}

export function setApiKey(key: string): void {
  localStorage.setItem('anthropic_api_key', key);
}

export async function sendMessage(
  messages: ChatMessage[],
  systemPrompt: string,
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('API key not set');

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    if (res.status === 401) throw new Error('Invalid API key');
    throw new Error(err?.error?.message || `API error: ${res.status}`);
  }

  const data = await res.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
  return textBlock?.text || 'No response';
}
