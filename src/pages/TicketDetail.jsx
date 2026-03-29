import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Send, Clock, User, Phone, Mail, MapPin, Tag, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PRIMARY = '#FF1351';
const DARK = '#1a1a2e';
const MUTED = '#7a7a7a';
const WHITE = '#fff';
const BORDER = '#E5E7EB';
const SURFACE = '#F8F9FB';

const priorityColors = {
  low: { bg: '#10b98114', color: '#10b981' },
  medium: { bg: '#f59e0b14', color: '#f59e0b' },
  high: { bg: '#ef444414', color: '#ef4444' },
  urgent: { bg: `${PRIMARY}14`, color: PRIMARY },
};

const statusColors = {
  open: { bg: '#3b82f614', color: '#3b82f6' },
  'in-progress': { bg: '#f59e0b14', color: '#f59e0b' },
  resolved: { bg: '#10b98114', color: '#10b981' },
  closed: { bg: `${MUTED}14`, color: MUTED },
};

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');

  const fetchTicket = async () => {
    try {
      const { data } = await api.get(`/admin/tickets/${id}`);
      setTicket(data.data.ticket);
      setMessages(data.data.messages || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      toast.error('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTicket(); }, [id]);

  const updateStatus = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const { data } = await api.put(`/admin/tickets/${id}/status`, { status: newStatus });
      setTicket(data.data);
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/admin/tickets/${id}/messages`, { text: reply.trim() });
      setMessages(prev => [...prev, data.data]);
      setReply('');
      // If ticket was open, it'll be auto-moved to in-progress on server
      if (ticket?.status === 'open') {
        setTicket(prev => ({ ...prev, status: 'in-progress' }));
      }
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
  const formatDateShort = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '';

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 120 }}>
      <Loader2 size={32} color={PRIMARY} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  if (!ticket) return <p style={{ textAlign: 'center', color: MUTED }}>Ticket not found.</p>;

  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';
  const priority = priorityColors[ticket.priority] || priorityColors.medium;
  const statusStyle = statusColors[ticket.status] || statusColors.open;

  return (
    <div>
      <button
        onClick={() => navigate('/tickets')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none',
          border: 'none', cursor: 'pointer', color: MUTED, fontSize: 13, fontWeight: 500,
          padding: 0, marginBottom: 20,
        }}
      >
        <ArrowLeft size={16} /> Back to Tickets
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left — Ticket info */}
        <div>
          <div style={{
            background: WHITE, borderRadius: 12, padding: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}`,
          }}>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 11, color: MUTED, fontFamily: 'monospace' }}>#{ticket._id?.slice(-6)}</span>
              <h2 style={{ margin: '4px 0 0', fontSize: 17, fontWeight: 700, color: DARK, lineHeight: 1.4 }}>
                {ticket.subject}
              </h2>
            </div>

            {ticket.description && (
              <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.6, margin: '0 0 16px', padding: '12px', background: SURFACE, borderRadius: 8 }}>
                {ticket.description}
              </p>
            )}

            {/* User info */}
            <div style={{
              padding: 14, background: SURFACE, borderRadius: 8, marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>User</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <img
                  src={ticket.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.user?.name || 'U')}&background=FF1351&color=fff&size=36`}
                  alt=""
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: DARK }}>{ticket.user?.name || '-'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <InfoRow icon={Phone} value={ticket.user?.phone || '-'} />
                <InfoRow icon={Mail} value={ticket.user?.email || '-'} />
                <InfoRow icon={MapPin} value={ticket.user?.city || '-'} />
              </div>
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: MUTED, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Tag size={12} /> Category
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                  background: '#6366f114', color: '#6366f1', textTransform: 'capitalize',
                }}>{ticket.category || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: MUTED, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <AlertTriangle size={12} /> Priority
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                  background: priority.bg, color: priority.color, textTransform: 'capitalize',
                }}>{ticket.priority || 'medium'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: MUTED }}>Status</span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                  background: statusStyle.bg, color: statusStyle.color, textTransform: 'capitalize',
                }}>{ticket.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: MUTED, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> Created
                </span>
                <span style={{ fontSize: 12, color: DARK, fontWeight: 500 }}>{formatDate(ticket.createdAt)}</span>
              </div>
              {ticket.resolvedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: MUTED }}>Resolved</span>
                  <span style={{ fontSize: 12, color: '#10b981', fontWeight: 500 }}>{formatDate(ticket.resolvedAt)}</span>
                </div>
              )}
            </div>

            {/* Status actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
              {ticket.status === 'open' && (
                <button
                  onClick={() => updateStatus('in-progress')}
                  disabled={updatingStatus}
                  style={{
                    width: '100%', padding: '10px', fontSize: 13, fontWeight: 600,
                    borderRadius: 8, cursor: 'pointer', border: `1px solid #f59e0b`,
                    background: '#f59e0b10', color: '#f59e0b', transition: 'all 0.15s',
                  }}
                >
                  Mark In-Progress
                </button>
              )}
              {(ticket.status === 'open' || ticket.status === 'in-progress') && (
                <button
                  onClick={() => updateStatus('resolved')}
                  disabled={updatingStatus}
                  style={{
                    width: '100%', padding: '10px', fontSize: 13, fontWeight: 600,
                    borderRadius: 8, cursor: 'pointer', border: `1px solid #10b981`,
                    background: '#10b98110', color: '#10b981', transition: 'all 0.15s',
                  }}
                >
                  Mark Resolved
                </button>
              )}
              {ticket.status !== 'closed' && (
                <button
                  onClick={() => updateStatus('closed')}
                  disabled={updatingStatus}
                  style={{
                    width: '100%', padding: '10px', fontSize: 13, fontWeight: 600,
                    borderRadius: 8, cursor: 'pointer', border: `1px solid ${BORDER}`,
                    background: WHITE, color: MUTED, transition: 'all 0.15s',
                  }}
                >
                  Close Ticket
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right — Chat thread */}
        <div style={{
          background: WHITE, borderRadius: 12, border: `1px solid ${BORDER}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column',
          height: 'calc(100vh - 180px)', overflow: 'hidden',
        }}>
          {/* Chat header */}
          <div style={{
            padding: '14px 20px', borderBottom: `1px solid ${BORDER}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: DARK }}>Messages</span>
            <span style={{ fontSize: 12, color: MUTED }}>{messages.length} messages</span>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: SURFACE }}>
            {messages.length === 0 ? (
              <p style={{ textAlign: 'center', color: MUTED, fontSize: 13, paddingTop: 40 }}>No messages yet. Start the conversation.</p>
            ) : (
              <>
                {messages.map((msg, idx) => {
                  const isAdmin = msg.senderRole === 'admin';
                  const senderName = typeof msg.sender === 'object' ? msg.sender?.name : (isAdmin ? 'Admin' : 'User');

                  // Date separator
                  const prevDate = idx > 0 ? formatDateShort(messages[idx - 1].createdAt) : '';
                  const curDate = formatDateShort(msg.createdAt);
                  const showDate = curDate !== prevDate;

                  return (
                    <div key={msg._id || idx}>
                      {showDate && (
                        <div style={{ textAlign: 'center', margin: '16px 0 12px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 500, color: MUTED, background: WHITE,
                            padding: '4px 12px', borderRadius: 12, border: `1px solid ${BORDER}`,
                          }}>
                            {curDate}
                          </span>
                        </div>
                      )}
                      <div style={{
                        display: 'flex',
                        justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                        marginBottom: 12,
                      }}>
                        <div style={{ maxWidth: '70%' }}>
                          <div style={{
                            fontSize: 11, fontWeight: 600, marginBottom: 3,
                            color: isAdmin ? PRIMARY : MUTED,
                            textAlign: isAdmin ? 'right' : 'left',
                          }}>
                            {senderName}
                          </div>
                          <div style={{
                            padding: '10px 14px',
                            borderRadius: isAdmin ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                            background: isAdmin ? PRIMARY : WHITE,
                            color: isAdmin ? WHITE : DARK,
                            border: isAdmin ? 'none' : `1px solid ${BORDER}`,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                          }}>
                            <div style={{ fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.text}</div>
                          </div>
                          <div style={{
                            fontSize: 10, color: MUTED, marginTop: 3,
                            textAlign: isAdmin ? 'right' : 'left',
                          }}>
                            {formatTime(msg.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Reply input */}
          <div style={{ padding: 16, borderTop: `1px solid ${BORDER}`, background: WHITE }}>
            {isResolved ? (
              <div style={{
                padding: '12px 16px', background: SURFACE, borderRadius: 8,
                textAlign: 'center', fontSize: 13, color: MUTED, fontWeight: 500,
              }}>
                Ticket {ticket.status}. Replies are disabled.
              </div>
            ) : (
              <form onSubmit={sendReply} style={{ display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  placeholder="Type your reply..."
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  style={{
                    flex: 1, border: `1px solid ${BORDER}`, borderRadius: 8,
                    padding: '12px 14px', fontSize: 14, fontFamily: 'inherit',
                    outline: 'none', background: SURFACE,
                  }}
                  onFocus={e => e.target.style.borderColor = PRIMARY}
                  onBlur={e => e.target.style.borderColor = BORDER}
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 44, height: 44, borderRadius: 8, border: 'none',
                    background: sending || !reply.trim() ? MUTED : PRIMARY,
                    color: WHITE, cursor: sending || !reply.trim() ? 'not-allowed' : 'pointer',
                    transition: 'background 0.15s',
                  }}
                >
                  {sending ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function InfoRow({ icon: Icon, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Icon size={13} color="#7a7a7a" />
      <span style={{ fontSize: 13, color: '#1a1a2e', fontWeight: 500 }}>{value}</span>
    </div>
  );
}
