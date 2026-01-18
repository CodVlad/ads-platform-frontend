import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getChats } from '../api/chat';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';
import { useAuth } from '../auth/useAuth.js';

const Chats = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const response = await getChats();
        const chatsData = response.data?.chats || response.data?.data || response.data || [];
        setChats(Array.isArray(chatsData) ? chatsData : []);
      } catch (err) {
        const errorMessage = parseError(err);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [showError]);

  const getOtherParticipant = (chat) => {
    if (!chat.participants || !Array.isArray(chat.participants)) return null;
    const other = chat.participants.find(p => p._id !== user?._id);
    return other || chat.participants[0] || null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading conversations...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>My Conversations</h1>
      
      {chats.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          No conversations yet. Start a conversation by contacting a seller!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {chats.map((chat) => {
            const otherParticipant = getOtherParticipant(chat);
            const lastMessage = chat.lastMessage;
            
            return (
              <div
                key={chat._id}
                onClick={() => navigate(`/chats/${chat._id}`)}
                style={{
                  padding: '16px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: '#fff',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '16px', marginBottom: '4px' }}>
                      {otherParticipant?.name || 'Unknown User'}
                    </div>
                    {chat.ad && (
                      <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                        {chat.ad.title}
                      </div>
                    )}
                    {lastMessage && (
                      <div style={{ fontSize: '14px', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lastMessage.text}
                      </div>
                    )}
                  </div>
                  {chat.updatedAt && (
                    <div style={{ fontSize: '12px', color: '#999', marginLeft: '12px', whiteSpace: 'nowrap' }}>
                      {formatDate(chat.updatedAt)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Chats;

