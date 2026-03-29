import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ChevronUp, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PRIMARY = '#FF1351';
const DARK = '#1a1a2e';
const MUTED = '#7a7a7a';
const WHITE = '#fff';
const BORDER = '#E5E7EB';
const SURFACE = '#F8F9FB';

export default function ChatView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    // Fetch conversation details for header
    api.get('/admin/chats', { params: { page: 1, limit: 100 } })
      .then(res => {
        const convo = (res.data.data || []).find(c => c._id === id);
        if (convo) setParticipants(convo.participants || []);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/chats/${id}/messages`, { params: { page: 1, limit: 50 } })
      .then(res => {
        setMessages(res.data.data || []);
        setPagination(res.data.pagination);
        setPage(1);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      })
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoading(false));
  }, [id]);

  const loadOlder = async () => {
    if (page >= pagination.pages) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { data } = await api.get(`/admin/chats/${id}/messages`, { params: { page: nextPage, limit: 50 } });
      setMessages(prev => [...(data.data || []), ...prev]);
      setPagination(data.pagination);
      setPage(nextPage);
    } catch {
      toast.error('Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  };

  const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
  const formatDateHeader = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  // Group messages by date
  const groupedMessages = [];
  let lastDate = '';
  messages.forEach(msg => {
    const msgDate = formatDateHeader(msg.createdAt);
    if (msgDate !== lastDate) {
      groupedMessages.push({ type: 'date', date: msgDate });
      lastDate = msgDate;
    }
    groupedMessages.push({ type: 'msg', data: msg });
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 128px)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
        background: WHITE, borderRadius: 12, border: `1px solid ${BORDER}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', marginBottom: 16,
      }}>
        <button
          onClick={() => navigate('/chats')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: MUTED, display: 'flex' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ display: 'flex' }}>
          {participants.slice(0, 4).map((p, i) => (
            <img
              key={p._id}
              src={p.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'U')}&background=FF1351&color=fff&size=36`}
              alt=""
              style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${WHITE}`, marginLeft: i > 0 ? -8 : 0, objectFit: 'cover' }}
            />
          ))}
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: DARK }}>
            {participants.map(p => p.name).join(', ') || 'Conversation'}
          </div>
          <div style={{ fontSize: 12, color: MUTED }}>{participants.length} participants - Readonly view</div>
        </div>
      </div>

      {/* Messages area */}
      <div style={{
        flex: 1, background: SURFACE, borderRadius: 12, border: `1px solid ${BORDER}`,
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* Load older button */}
          {page < pagination.pages && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <button
                onClick={loadOlder}
                disabled={loadingMore}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', fontSize: 12, fontWeight: 500, borderRadius: 20,
                  border: `1px solid ${BORDER}`, background: WHITE, color: MUTED,
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                }}
              >
                {loadingMore ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <ChevronUp size={13} />}
                Load older messages
              </button>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
              <Loader2 size={28} color={PRIMARY} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : messages.length === 0 ? (
            <p style={{ textAlign: 'center', color: MUTED, fontSize: 14, paddingTop: 60 }}>No messages in this conversation.</p>
          ) : (
            groupedMessages.map((item, idx) => {
              if (item.type === 'date') {
                return (
                  <div key={`date-${idx}`} style={{ textAlign: 'center', margin: '16px 0 12px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 500, color: MUTED, background: WHITE,
                      padding: '4px 12px', borderRadius: 12, border: `1px solid ${BORDER}`,
                    }}>
                      {item.date}
                    </span>
                  </div>
                );
              }

              const msg = item.data;
              const sender = msg.sender;
              const senderName = typeof sender === 'object' ? sender?.name : 'Unknown';
              const senderImage = typeof sender === 'object' ? sender?.profileImage : null;

              return (
                <div key={msg._id || idx} style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <img
                    src={senderImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName || 'U')}&background=FF1351&color=fff&size=28`}
                    alt=""
                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', marginTop: 2 }}
                  />
                  <div style={{ maxWidth: '70%' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, marginBottom: 3 }}>{senderName}</div>
                    <div style={{
                      background: WHITE, padding: '10px 14px', borderRadius: '4px 12px 12px 12px',
                      border: `1px solid ${BORDER}`, boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    }}>
                      {msg.text && <div style={{ fontSize: 14, color: DARK, lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.text}</div>}
                      {msg.media && (
                        <div style={{ marginTop: msg.text ? 8 : 0 }}>
                          {msg.mediaType === 'image' || msg.media?.match(/\.(jpg|jpeg|png|gif|webp)/i) ? (
                            <img src={msg.media} alt="" style={{ maxWidth: 240, borderRadius: 8 }} />
                          ) : (
                            <a href={msg.media} target="_blank" rel="noopener noreferrer" style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4, color: PRIMARY, fontSize: 13,
                            }}>
                              <Image size={14} /> View media
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: MUTED, marginTop: 3 }}>{formatTime(msg.createdAt)}</div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
