export function Header() {
  return (
    <header style={{
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottom: '1px solid #2a2a4a',
      background: '#12121f',
    }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#e0e0e0' }}>
        Financial Monitor
      </h1>
      <span style={{ fontSize: 12, color: '#6b7280' }}>
        {new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
      </span>
    </header>
  );
}
