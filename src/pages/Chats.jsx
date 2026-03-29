import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, Users, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PRIMARY = '#FF1351';
const DARK = '#1a1a2e';
const MUTED = '#7a7a7a';
const WHITE = '#fff';
const BORDER = '#E5E7EB';
const SURFACE = '#F8F9FB';

export default function Chats() {
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchChats = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/chats', { params: { page, limit: 20 } });
      setChats(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchChats(); }, [fetchChats]);

  const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: DARK, margin: 0 }}>Chats</h1>
        <span style={{ fontSize: 13, color: MUTED }}>{pagination.total} conversations</span>
      </div>

      <div style={{
        background: WHITE, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        border: `1px solid ${BORDER}`, overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Participants', 'Last Message', 'Type', 'Updated'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                    color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: 40, textAlign: 'center' }}>
                    <Loader2 size={24} color={PRIMARY} style={{ animation: 'spin 1s linear infinite' }} />
                  </td>
                </tr>
              ) : chats.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '60px 40px', textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F8F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <MessageSquare size={24} color="#7a7a7a" />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 4 }}>No conversations yet</div>
                    <div style={{ fontSize: 13, color: '#7a7a7a' }}>Conversations will appear here when users start chatting</div>
                  </td>
                </tr>
              ) : chats.map(chat => (
                <tr
                  key={chat._id}
                  onClick={() => navigate(`/chats/${chat._id}`)}
                  style={{ borderBottom: `1px solid ${BORDER}`, cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = SURFACE}
                  onMouseLeave={e => e.currentTarget.style.background = WHITE}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ display: 'flex' }}>
                        {(chat.participants || []).slice(0, 3).map((p, i) => (
                          <img
                            key={p._id}
                            src={p.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'U')}&background=FF1351&color=fff&size=32`}
                            alt=""
                            style={{
                              width: 32, height: 32, borderRadius: '50%', objectFit: 'cover',
                              border: `2px solid ${WHITE}`, marginLeft: i > 0 ? -10 : 0,
                            }}
                          />
                        ))}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>
                          {(chat.participants || []).map(p => p.name).join(', ') || 'Unknown'}
                        </div>
                        <div style={{ fontSize: 11, color: MUTED }}>
                          {(chat.participants || []).map(p => p.phone).filter(Boolean).join(', ')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: MUTED, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {chat.lastMessage?.text || chat.lastMessage || '-'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {(chat.isGroup || chat.team) ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                        background: '#6366f114', color: '#6366f1',
                      }}>
                        <Users size={11} /> Group
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 500, color: MUTED }}>Direct</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: MUTED }}>{formatDate(chat.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderTop: `1px solid ${BORDER}`,
          }}>
            <span style={{ fontSize: 13, color: MUTED }}>Page {page} of {pagination.pages}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: 13, fontWeight: 500,
                borderRadius: 8, border: `1px solid ${BORDER}`, background: WHITE,
                cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? MUTED : DARK, opacity: page === 1 ? 0.5 : 1,
              }}>
                <ChevronLeft size={14} /> Prev
              </button>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: 13, fontWeight: 500,
                borderRadius: 8, border: `1px solid ${BORDER}`, background: WHITE,
                cursor: page === pagination.pages ? 'not-allowed' : 'pointer', color: page === pagination.pages ? MUTED : DARK, opacity: page === pagination.pages ? 0.5 : 1,
              }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
