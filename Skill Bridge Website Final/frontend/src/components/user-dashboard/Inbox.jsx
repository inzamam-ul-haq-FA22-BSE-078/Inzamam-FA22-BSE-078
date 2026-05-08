import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Inbox.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getMediaUrl = (pathOrData) => {
  if (!pathOrData) return null;
  if (typeof pathOrData === 'string' && (pathOrData.startsWith('http') || pathOrData.startsWith('data:'))) return pathOrData;
  if (typeof pathOrData === 'string' && pathOrData.startsWith('/')) return `${API_BASE}${pathOrData}`;
  return pathOrData;
};

function Inbox() {
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  // Count of users (conversations) with at least one unread message
  const totalUnreadUsers = useMemo(() => conversations.filter(c => c.unreadCount > 0).length, [conversations]);

  async function handleRefresh() {
    try {
      setRefreshing(true);
      await fetchConversations();
      if (activeConversation && activeConversation._id) await fetchMessages(activeConversation._id);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  }
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [uploadPreview, setUploadPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const attachBtnRef = useRef(null);
  const attachMenuRef = useRef(null);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);

  const token = localStorage.getItem('token');
  const _storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = _storedUser._id || _storedUser.id;

  // Returns the participant object (populated or not) who is NOT the current user.
  function getOtherParticipant(conv) {
    if (!conv || !conv.participants || conv.participants.length === 0) return null;
    const parts = conv.participants;
    // try to find a participant that doesn't match currentUserId (handle both strings and objects)
    const other = parts.find(p => {
      const pid = p && (p._id || p.id || p);
      return pid != null && String(pid) !== String(currentUserId);
    });
    if (other) return other;
    // fallback: if nothing found, return the first participant that is an object
    return parts.find(p => typeof p === 'object') || (typeof parts[0] === 'string' ? { _id: parts[0] } : parts[0]);
  }

  const [newChatOpen, setNewChatOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [modalUsers, setModalUsers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const modalSearchTimeout = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchConversations();
    // socket listener
    const socket = window.__SB_SOCKET;
    if (socket) {
      socket.on('message:new', (data) => {
        // naive update when new message arrives
        if (!data || !data.message) return;
        const message = data.message;
        // if same conversation, append
        if (activeConversation && message.conversation === activeConversation._id) {
          setMessages((prev) => [...prev, message]);
        }
        // refresh conversation list (to get updated lastMessage order)
        fetchConversations();
      });
    }

    return () => {
      if (socket) {
        socket.off('message:new');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation]);

  // close attach menu when clicking outside or press Escape
  useEffect(() => {
    if (!attachMenuOpen) return;
    function onDocClick(e) {
      if (!attachMenuRef.current || !attachBtnRef.current) return;
      if (attachMenuRef.current.contains(e.target) || attachBtnRef.current.contains(e.target)) return;
      setAttachMenuOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setAttachMenuOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [attachMenuOpen]);

  // Modal search with debounce
  useEffect(() => {
    if (!newChatOpen) return;
    setModalUsers([]);
    if (!modalSearch) return;
    if (modalSearchTimeout.current) clearTimeout(modalSearchTimeout.current);
    modalSearchTimeout.current = setTimeout(async () => {
      try {
        setModalLoading(true);
        const res = await axios.get(`${API_BASE}/api/users`, { params: { search: modalSearch }, headers: { Authorization: `Bearer ${token}` } });
        if (res.data.success) setModalUsers(res.data.users || []);
      } catch (e) {
        console.error(e);
      } finally {
        setModalLoading(false);
      }
    }, 300);
    return () => clearTimeout(modalSearchTimeout.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalSearch, newChatOpen]);

  // open modal
  const openNewChatModal = () => {
    setNewChatOpen(true);
    setModalSearch('');
    setModalUsers([]);
  };

  const closeNewChatModal = () => {
    setNewChatOpen(false);
  };

  // Auto-open via query string ?conv=<id>
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const convId = q.get('conv');
    if (convId) {
      setActiveConversation({ _id: convId });
      fetchMessages(convId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  useEffect(() => {
    if (!search) return setUsers([]);
    const t = setTimeout(() => {
      searchUsers(search);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (activeConversation) fetchMessages(activeConversation._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation]);

  // Auto-refresh messages every 1 second while a conversation is open
  useEffect(() => {
    if (!activeConversation) return;
    const intervalId = setInterval(() => {
      // avoid polling when the tab is not visible
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      fetchMessages(activeConversation._id);
    }, 1000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation]);

  useEffect(() => {
    // scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function fetchConversations() {
    try {
      const res = await axios.get(`${API_BASE}/api/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setConversations(res.data.conversations || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function searchUsers(q) {
    try {
      const res = await axios.get(`${API_BASE}/api/users`, { params: { search: q }, headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setUsers(res.data.users || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function startChatWith(userId) {
    try {
      const res = await axios.post(`${API_BASE}/api/chat/conversations`, { participantId: userId }, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setActiveConversation(res.data.conversation);
        await fetchConversations();
        // keep user on the same page (don't navigate away). update URL query for shareability
        try {
          const convId = res.data.conversation._id;
          const sp = new URLSearchParams(window.location.search || '');
          sp.set('conv', convId);
          window.history.replaceState({}, '', window.location.pathname + '?' + sp.toString());
        } catch (e) {}
        setNewChatOpen(false);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function openConversation(conv) {
    setActiveConversation(conv);
    try {
      const sp = new URLSearchParams(window.location.search || '');
      sp.set('conv', conv._id);
      window.history.replaceState({}, '', window.location.pathname + '?' + sp.toString());
    } catch (e) {}
    fetchMessages(conv._id);
  }

  async function fetchMessages(conversationId) {
    try {
      const res = await axios.get(`${API_BASE}/api/chat/conversations/${conversationId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setMessages(res.data.messages || []);
        // Do NOT mark as read here. Marking should happen only when the user actually views the messages
        // (see useEffect below that marks as read after messages render)
      }
    } catch (e) {
      console.error(e);
    }
  }

  function handleFileChange(e) {
    const f = Array.from(e.target.files || []);
    // only images and videos allowed via accept attr, but double-check
    const valid = f.filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
    setFiles(valid);

    const previews = valid.map(file => ({ url: URL.createObjectURL(file), name: file.name, type: file.type }));
    setUploadPreview(previews);
  }

  function handleCloseConversation() {
    try {
      const sp = new URLSearchParams(window.location.search || '');
      sp.delete('conv');
      window.history.replaceState({}, '', window.location.pathname + (sp.toString() ? '?' + sp.toString() : ''));
    } catch (e) {}
    setActiveConversation(null);
    setMessages([]);
    setFiles([]);
    setUploadPreview([]);
    setText('');
    setAttachMenuOpen(false);
  }

  // When messages are rendered in an open conversation, mark them as read for current user.
  useEffect(() => {
    if (!activeConversation) return;
    // messages must be loaded
    if (!messages || messages.length === 0) return;

    const hasUnread = messages.some(m => {
      const senderId = m.sender && m.sender._id ? m.sender._id : m.sender;
      const readBy = Array.isArray(m.readBy) ? m.readBy : (m.readBy ? [m.readBy] : []);
      return String(senderId) !== String(currentUserId) && !readBy.some(r => String(r) === String(currentUserId));
    });

    if (!hasUnread) return;

    // mark as read after short delay to ensure user sees the messages
    const timer = setTimeout(async () => {
      try {
        await axios.post(`${API_BASE}/api/chat/conversations/${activeConversation._id}/read`, null, { headers: { Authorization: `Bearer ${token}` } });
        // optimistically update local UI: clear unread count for this conversation and update messages.readBy
        setConversations((prev) => prev.map(c => c._id === activeConversation._id ? { ...c, unreadCount: 0 } : c));
        setMessages((prev) => prev.map(m => {
          const senderId = m.sender && m.sender._id ? m.sender._id : m.sender;
          if (String(senderId) === String(currentUserId)) return m;
          const readBy = Array.isArray(m.readBy) ? m.readBy : (m.readBy ? [m.readBy] : []);
          if (readBy.some(r => String(r) === String(currentUserId))) return m;
          return { ...m, readBy: [...readBy, currentUserId] };
        }));
        // refresh conversations to be in sync with server
        fetchConversations();
      } catch (err) {
        console.error('markRead failed', err);
      }
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversation, messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!activeConversation) return;
    if (!text.trim() && files.length === 0) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('conversationId', activeConversation._id);
      formData.append('content', text);
      files.forEach(f => formData.append('attachments', f));

      const res = await axios.post(`${API_BASE}/api/chat/messages`, formData, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) {
        setMessages(prev => [...prev, res.data.message]);
        setText('');
        setFiles([]);
        setUploadPreview([]);
        // refresh conversations list
        fetchConversations();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inbox-page">
      <div className="inbox-left">
        <div className="left-header">
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div className="left-title">Chats</div>
            {totalUnreadUsers > 0 && <div className="total-unread">{totalUnreadUsers}</div>}
          </div>
          <button className={`refresh-btn ${refreshing ? 'refreshing' : ''}`} onClick={handleRefresh} title="Refresh conversations">⟳</button>
        </div>
        <div className="search-area">
          <div className="search-row">
            <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="new-chat-btn" type="button" onClick={openNewChatModal}> Find </button>
          </div>
        </div>

        {search ? (
          <div className="search-results">
            {users.map(u => (
              <div key={u._id} className="search-item" onClick={() => startChatWith(u._id)}>
                <div className="avatar">{u.name?.[0]?.toUpperCase()}</div>
                <div className="meta">
                  <div className="name">{u.name}</div>
                  <div className="email">{u.email}</div>
                </div>
              </div>
            ))}
            {users.length === 0 && <div className="empty">No users found</div>}
          </div>
        ) : (
          <div className="conversations-list">
            {conversations.map(c => (
              <div key={c._id} className={`conversation-item ${activeConversation && activeConversation._id === c._id ? 'active' : ''} ${c.unreadCount > 0 ? 'unread' : ''}`} onClick={() => openConversation(c)}>
                {(() => {
                  const lm = c.lastMessage;
                  const lastPreview = (() => {
                    if (!lm) return '';
                    if (typeof lm === 'string') return lm;
                    if (lm.content) return lm.content;
                    if (Array.isArray(lm.attachments) && lm.attachments.length) return 'Attachment';
                    return '';
                  })();
                  
                  // Check if it's a group chat
                  if (c.isGroupChat || c.name) {
                    return (
                      <>
                        <div className="avatar"><div className="avatar-letter">👥</div></div>
                        <div className="meta">
                          <div className="name">{c.name || 'Group Chat'}</div>
                          <div className="last">{lastPreview}</div>
                        </div>
                        {c.unreadCount > 0 && (
                          <div className="unread-count">{c.unreadCount}</div>
                        )}
                      </>
                    );
                  }
                  
                  // Otherwise, show the other participant
                  const other = getOtherParticipant(c);
                  return (
                    <>
                      <div className="avatar">{other ? (other.profilePicture ? <img src={getMediaUrl(other.profilePicture)} alt={other.name} /> : (other.name ? other.name[0]?.toUpperCase() : '?')) : '?'}</div>
                      <div className="meta">
                        <div className="name">{other ? (other.name || other.email || other._id) : c.participants.map(p => p.name).filter(Boolean).join(', ')}</div>
                        <div className="last">{lastPreview}</div>
                      </div>
                      {c.unreadCount > 0 && (
                        <div className="unread-count">{c.unreadCount}</div>
                      )}
                    </>
                  );
                })()} 
              </div>
            ))}
            {conversations.length === 0 && <div className="empty">No conversations yet. Search users to start a chat.</div>}
          </div>
        )}
      </div>

      <div className="inbox-right">
        {activeConversation ? (
          <>
            <div className="chat-header">
              <button type="button" className="back-btn" onClick={handleCloseConversation}>←</button>
              <div className="header-meta">
                {(() => {
                  const conv = activeConversation.participants ? activeConversation : (conversations.find(c => c._id === activeConversation._id) || {});
                  
                  // Check if it's a group chat
                  if (conv.isGroupChat || conv.name) {
                    return (
                      <>
                        <div className="avatar"><div className="avatar-letter">👥</div></div>
                        <div className="name">{conv.name || 'Group Chat'}</div>
                      </>
                    );
                  }
                  
                  // Otherwise, show the other participant
                  const other = getOtherParticipant(conv);
                  return (
                    <>
                      <div className="avatar">{other ? (other.profilePicture ? <img src={getMediaUrl(other.profilePicture)} alt={other.name || other.email} /> : <div className="avatar-letter">{other.name ? other.name[0]?.toUpperCase() : '?'}</div>) : <div className="avatar-letter">?</div>}</div>
                      <div className="name">{other ? (other.name || other.email || 'Conversation') : 'Conversation'}</div>
                    </>
                  );
                })()}
              </div>
            </div> 


            <div className="message-list" ref={scrollRef}>
              {messages.map((m) => {
                const senderId = m.sender && m.sender._id ? m.sender._id : m.sender;
                return (
                  <div key={m._id || m.createdAt} className={`message ${String(senderId) === String(currentUserId) ? 'mine' : ''}`}>
                    <div className="bubble">
                      {m.content && <div className="text">{m.content}</div>}
                      {m.attachments && m.attachments.length > 0 && (
                        <div className="attachments">
                          {m.attachments.map((a, idx) => (
                            <div key={idx} className="attach-item">
                              {a.mimeType && a.mimeType.startsWith('image/') ? (
                                <img src={`${API_BASE}${a.url}`} alt="img" />
                              ) : (
                                <video src={`${API_BASE}${a.url}`} controls />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="meta">{new Date(m.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <form className="composer bottom-composer" onSubmit={handleSend}>
              <div className="left-controls">
                <button ref={attachBtnRef} type="button" className="attach-button" onClick={() => setAttachMenuOpen(v => !v)}>📎</button>

                <div ref={attachMenuRef} className={`attach-menu ${attachMenuOpen ? 'open' : ''}`}>
                  <button type="button" onClick={() => { setAttachMenuOpen(false); imageInputRef.current && imageInputRef.current.click(); }}>📷 Image</button>
                  <button type="button" onClick={() => { setAttachMenuOpen(false); videoInputRef.current && videoInputRef.current.click(); }}>🎬 Video</button>
                </div>

                <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} multiple onChange={handleFileChange} />
                <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} multiple onChange={handleFileChange} />

                <div className="previews">
                  {uploadPreview.map((p, i) => (
                    <div key={i} className="preview">
                      {p.type.startsWith('image/') ? (
                        <img src={p.url} alt={p.name} />
                      ) : (
                        <video src={p.url} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <input className="text-input" value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." />
              <button type="submit" className="send-btn" disabled={loading}>{loading ? 'Sending...' : 'Send'}</button>
            </form> 
          </>
        ) : (
          <div className="empty-right">
            <div >
              <div className="empty-icon">✉️</div>
              {/* <h3>Welcome to your Inbox</h3>
              <p>Select a conversation or start a new chat to begin messaging.</p>
              <button type="button" className="new-chat-cta" onClick={openNewChatModal}>Start a Chat</button> */}
            </div>
          </div>
        )}
      </div> 

      {/* New Chat Modal */}
      {newChatOpen && (
        <div className="modal-overlay" onClick={closeNewChatModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Start a new chat</h3>
              <button className="modal-close" onClick={closeNewChatModal}>✕</button>
            </div>
            <div className="modal-body">
              <input placeholder="Search users by name or email" value={modalSearch} onChange={e => setModalSearch(e.target.value)} />
              <div className="modal-results">
                {modalLoading && <div className="modal-loading">Searching...</div>}
                {!modalLoading && modalUsers.length === 0 && <div className="modal-empty">No users found. Try a different name or email.</div>}
                {!modalLoading && modalUsers.map(u => (
                  <div key={u._id} className="modal-item" onClick={() => startChatWith(u._id)}>
                    <div className="avatar">{u.name?.[0]?.toUpperCase()}</div>
                    <div className="meta">
                      <div className="name">{u.name}</div>
                      <div className="email">{u.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Inbox;