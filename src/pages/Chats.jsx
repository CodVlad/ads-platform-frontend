import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getChats } from '../api/chat';
import { deleteChat } from '../api/chatApi';
import { useToast } from '../hooks/useToast';
import { parseError } from '../utils/errorParser';
import { useAuth } from '../auth/useAuth.js';
import { useUnread } from '../context/UnreadContext.jsx';

const Chats = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const { setTotalUnread } = useUnread();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [deletingChatId, setDeletingChatId] = useState(null);

  useEffect(() => {
    // Redirect to login if no token
    const token = localStorage.getItem('token');
    if (!token || !user) {
      navigate('/login');
      return;
    }

    const fetchChats = async () => {
      try {
        setLoading(true);
        const response = await getChats();
        
        // Check if request was skipped (no token)
        if (response.data?.skipped) {
          navigate('/login');
          return;
        }
        
        // API returns: { success, chats: [...], totalUnread }
        const chatsData = response.data?.chats || [];
        const totalUnreadCount = response.data?.totalUnread || 0;
        
        setChats(Array.isArray(chatsData) ? chatsData : []);
        
        // Update totalUnread in context
        setTotalUnread(totalUnreadCount);
      } catch (err) {
        // Never log 429 errors
        if (err?.response?.status === 429) {
          setLoading(false);
          return;
        }
        // Handle 401 - redirect to login
        if (err?.response?.status === 401) {
          navigate('/login');
          return;
        }
        const errorMessage = parseError(err);
        showError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [showError, setTotalUnread, user, navigate]);

  // Refetch when navigating back to /chats (e.g., from ChatDetail)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) {
      return;
    }

    if (location.pathname === '/chats' || location.hash === '#/chats') {
      const fetchChats = async () => {
        try {
          const response = await getChats();
          if (response.data?.skipped) {
            return;
          }
          const chatsData = response.data?.chats || [];
          const totalUnreadCount = response.data?.totalUnread || 0;
          
          setChats(Array.isArray(chatsData) ? chatsData : []);
          setTotalUnread(totalUnreadCount);
        } catch (err) {
          // Silent fail - never log 429
          if (err?.response?.status === 429) {
            return;
          }
          // Handle 401 silently
          if (err?.response?.status === 401) {
            return;
          }
        }
      };
      fetchChats();
    }
  }, [location.pathname, location.hash, setTotalUnread, user]);

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
    } catch {
      return dateString;
    }
  };

  // Get unread count for a specific chat
  const getChatUnreadCount = (chat) => {
    return chat.unreadCount || 0;
  };

  // Format badge text for chat unread count
  const formatChatBadge = (count) => {
    if (!count || count === 0) return null;
    return count > 99 ? '99+' : String(count);
  };

  // Handle delete chat
  const handleDeleteChat = async (e, chatId) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!window.confirm('Delete conversation?')) {
      return;
    }

    setDeletingChatId(chatId);
    try {
      await deleteChat(chatId);
      // Remove chat from state immediately without refetch
      setChats(prev => prev.filter(c => c._id !== chatId));
      showSuccess('Conversation deleted');
    } catch (err) {
      // Handle specific error cases
      if (err?.response?.status === 401) {
        navigate('/login');
        return;
      }
      if (err?.response?.status === 404) {
        // Chat already deleted - remove from state and show message
        setChats(prev => prev.filter(c => c._id !== chatId));
        showError('Chat already deleted');
        return;
      }
      // Other errors
      const msg = parseError(err);
      showError(msg);
    } finally {
      setDeletingChatId(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ padding: 0 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '60vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)',
        }}>
          <div style={{ 
            textAlign: 'center',
            padding: '40px',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            <div style={{ 
              fontSize: '32px', 
              marginBottom: '16px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}>💬</div>
            <div style={{ fontSize: '16px', color: '#666', fontWeight: '500' }}>
              Loading conversations...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: 0, background: 'linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%)', minHeight: '100vh' }}>
      <div style={{ 
        maxWidth: '1000px', 
        margin: '0 auto',
        padding: '32px 20px',
      }}>
        {/* Header Section */}
        <div style={{ 
          marginBottom: '32px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '20px',
          padding: '32px',
          color: '#fff',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative background pattern */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '300px',
            height: '300px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            filter: 'blur(60px)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30%',
            left: '-5%',
            width: '200px',
            height: '200px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '50%',
            filter: 'blur(40px)',
          }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              color: '#fff',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                backdropFilter: 'blur(10px)',
              }}>💬</span>
              My Conversations
            </h1>
            <p style={{ 
              fontSize: '1.1rem', 
              color: 'rgba(255,255,255,0.9)',
              margin: 0,
              fontWeight: '400',
            }}>
              {chats.length > 0 
                ? `${chats.length} ${chats.length === 1 ? 'conversation' : 'conversations'}`
                : 'Your conversations will appear here'
              }
            </p>
          </div>
        </div>
        
        {chats.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '80px 20px',
            background: '#fff',
            borderRadius: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}>
            <div style={{ 
              fontSize: '80px', 
              marginBottom: '24px',
              opacity: 0.2,
            }}>💬</div>
            <h3 style={{ 
              color: '#1a1a1a', 
              marginBottom: '12px',
              fontSize: '1.75rem',
              fontWeight: '600',
            }}>
              No conversations yet
            </h3>
            <p style={{ color: '#666', fontSize: '16px', maxWidth: '400px', margin: '0 auto' }}>
              Start a conversation by contacting a seller from an ad
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {chats.map((chat) => {
              const otherParticipant = getOtherParticipant(chat);
              const lastMessage = chat.lastMessage;
              const chatUnreadCount = getChatUnreadCount(chat);
              const unreadDisplay = formatChatBadge(chatUnreadCount);
              const hasUnread = chatUnreadCount > 0;
              
              return (
                <div
                  key={chat._id}
                  onClick={() => navigate(`/chats/${chat._id}`)}
                  style={{
                    cursor: 'pointer',
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '20px',
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: hasUnread 
                      ? '0 4px 16px rgba(102, 126, 234, 0.15)' 
                      : '0 2px 8px rgba(0,0,0,0.06)',
                    border: hasUnread 
                      ? '2px solid rgba(102, 126, 234, 0.2)' 
                      : '2px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = hasUnread 
                      ? '0 4px 16px rgba(102, 126, 234, 0.15)' 
                      : '0 2px 8px rgba(0,0,0,0.06)';
                    e.currentTarget.style.borderColor = hasUnread 
                      ? 'rgba(102, 126, 234, 0.2)' 
                      : 'transparent';
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    gap: '16px',
                    alignItems: 'flex-start',
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      fontWeight: '600',
                      color: '#fff',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                      position: 'relative',
                    }}>
                      {otherParticipant?.name?.[0]?.toUpperCase() || 'U'}
                      {hasUnread && (
                        <div style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: '#ef4444',
                          border: '3px solid #fff',
                          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                        }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        gap: '12px',
                      }}>
                        <div style={{ 
                          fontWeight: '600', 
                          fontSize: '18px', 
                          color: '#1a1a1a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          {otherParticipant?.name || 'Unknown User'}
                          {unreadDisplay && (
                            <span style={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: '#fff',
                              borderRadius: '12px',
                              padding: '4px 10px',
                              fontSize: '12px',
                              fontWeight: '700',
                              minWidth: '24px',
                              textAlign: 'center',
                              lineHeight: '1.4',
                              boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                            }}>
                              {unreadDisplay}
                            </span>
                          )}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          {chat.updatedAt && (
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#999', 
                              whiteSpace: 'nowrap',
                              fontWeight: '500',
                            }}>
                              {formatDate(chat.updatedAt)}
                            </div>
                          )}
                          <button
                            onClick={(e) => handleDeleteChat(e, chat._id)}
                            disabled={deletingChatId === chat._id}
                            style={{
                              background: 'transparent',
                              border: '1px solid #e8ecf1',
                              borderRadius: '8px',
                              padding: '8px',
                              cursor: deletingChatId === chat._id ? 'not-allowed' : 'pointer',
                              fontSize: '16px',
                              color: '#999',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '36px',
                              height: '36px',
                            }}
                            onMouseEnter={(e) => {
                              if (deletingChatId !== chat._id) {
                                e.currentTarget.style.borderColor = '#ef4444';
                                e.currentTarget.style.color = '#ef4444';
                                e.currentTarget.style.background = '#fef2f2';
                                e.currentTarget.style.transform = 'scale(1.1)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (deletingChatId !== chat._id) {
                                e.currentTarget.style.borderColor = '#e8ecf1';
                                e.currentTarget.style.color = '#999';
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.transform = 'scale(1)';
                              }
                            }}
                            title="Delete conversation"
                          >
                            {deletingChatId === chat._id ? '...' : '🗑️'}
                          </button>
                        </div>
                      </div>
                      
                      {chat.ad && (
                        <div style={{ 
                          fontSize: '14px', 
                          color: '#667eea', 
                          marginBottom: '8px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}>
                          <span>📋</span>
                          <span style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {chat.ad.title}
                          </span>
                        </div>
                      )}
                      
                      {lastMessage && (
                        <div style={{ 
                          fontSize: '15px', 
                          color: hasUnread ? '#1a1a1a' : '#666',
                          fontWeight: hasUnread ? '500' : '400',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: '1.5',
                        }}>
                          {lastMessage.text}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default Chats;

