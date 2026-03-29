import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Loader2, Ticket } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PRIMARY = '#FF1351';
const DARK = '#1a1a2e';
const MUTED = '#7a7a7a';
const WHITE = '#fff';
const BORDER = '#E5E7EB';
const SURFACE = '#F8F9FB';

const statusFilters = [
  { key: '', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in-progress', label: 'In-Progress' },
  { key: 'resolved', label: 'Resolved' },
];

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

export default function Tickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (status) params.status = status;
      const { data } = await api.get('/admin/tickets', { params });
      setTickets(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);
  useEffect(() => { setPage(1); }, [status]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: DARK, margin: 0 }}>Tickets</h1>
        <span style={{ fontSize: 13, color: MUTED }}>{pagination.total} total tickets</span>
      </div>

      {/* Status filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {statusFilters.map(f => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            style={{
              padding: '8px 18px', fontSize: 13, fontWeight: status === f.key ? 600 : 400,
              borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
              border: status === f.key ? `1px solid ${PRIMARY}` : `1px solid ${BORDER}`,
              background: status === f.key ? `${PRIMARY}10` : WHITE,
              color: status === f.key ? PRIMARY : MUTED,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: WHITE, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        border: `1px solid ${BORDER}`, overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['ID', 'Subject', 'User', 'Category', 'Priority', 'Status', 'Created'].map(h => (
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
                  <td colSpan={7} style={{ padding: 40, textAlign: 'center' }}>
                    <Loader2 size={24} color={PRIMARY} style={{ animation: 'spin 1s linear infinite' }} />
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '60px 40px', textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F8F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <Ticket size={24} color={MUTED} />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: DARK, marginBottom: 4 }}>No tickets found</div>
                    <div style={{ fontSize: 13, color: MUTED }}>No support tickets match the current filters</div>
                  </td>
                </tr>
              ) : tickets.map(ticket => {
                const priority = priorityColors[ticket.priority] || priorityColors.medium;
                const statusStyle = statusColors[ticket.status] || statusColors.open;
                return (
                  <tr
                    key={ticket._id}
                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                    style={{ borderBottom: `1px solid ${BORDER}`, cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = SURFACE}
                    onMouseLeave={e => e.currentTarget.style.background = WHITE}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 12, color: MUTED, fontFamily: 'monospace' }}>
                      #{ticket._id?.slice(-6)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500, color: DARK, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ticket.subject || '-'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img
                          src={ticket.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(ticket.user?.name || 'U')}&background=FF1351&color=fff&size=28`}
                          alt=""
                          style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: DARK }}>{ticket.user?.name || '-'}</div>
                          <div style={{ fontSize: 11, color: MUTED }}>{ticket.user?.phone || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                        background: '#6366f114', color: '#6366f1', textTransform: 'capitalize',
                      }}>
                        {ticket.category || '-'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                        background: priority.bg, color: priority.color, textTransform: 'capitalize',
                      }}>
                        {ticket.priority || 'medium'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                        background: statusStyle.bg, color: statusStyle.color, textTransform: 'capitalize',
                      }}>
                        {ticket.status || 'open'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: MUTED }}>{formatDate(ticket.createdAt)}</td>
                  </tr>
                );
              })}
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
