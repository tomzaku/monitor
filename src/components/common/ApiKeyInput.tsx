import { useState } from 'react';
import { getApiKey, setApiKey } from '../../services/claude';

interface Props {
  onKeySet: () => void;
}

export function ApiKeyInput({ onKeySet }: Props) {
  const [key, setKey] = useState(getApiKey() || '');
  const [saved, setSaved] = useState(!!getApiKey());

  const handleSave = () => {
    if (key.trim()) {
      setApiKey(key.trim());
      setSaved(true);
      onKeySet();
    }
  };

  if (saved) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#6b7280' }}>
        <span>API key: ****{key.slice(-4)}</span>
        <button
          onClick={() => { setSaved(false); }}
          style={{
            fontSize: 11, color: '#ef5350', background: 'none', border: 'none',
            cursor: 'pointer', textDecoration: 'underline',
          }}
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="sk-ant-..."
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        style={{
          flex: 1, padding: '6px 10px', fontSize: 12, borderRadius: 6,
          border: '1px solid #2a2a4a', background: '#12121f', color: '#e0e0e0',
          outline: 'none',
        }}
      />
      <button
        onClick={handleSave}
        style={{
          padding: '6px 12px', fontSize: 11, fontWeight: 600, borderRadius: 6,
          border: 'none', background: '#4fc3f7', color: '#0f0f1a', cursor: 'pointer',
        }}
      >
        Save
      </button>
    </div>
  );
}
