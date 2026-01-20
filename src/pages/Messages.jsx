const Messages = () => {
  return (
    <div className="page-container">
      <div className="container">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              color: '#1a1a1a',
              marginBottom: '8px',
            }}>
              💬 Messages
            </h1>
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#666',
              margin: 0,
            }}>
              Your messages and conversations
            </p>
          </div>
        </div>

        <div className="card" style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <h3 style={{ 
            color: '#1a1a1a', 
            marginBottom: '8px',
            fontSize: '1.5rem',
            fontWeight: '600',
          }}>
            Messages Page
          </h3>
          <p style={{ color: '#666', fontSize: '16px' }}>
            This page will be implemented soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Messages;

