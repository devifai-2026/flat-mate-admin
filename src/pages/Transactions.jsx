import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { IndianRupee, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, XCircle, Search, ChevronLeft, ChevronRight, Loader2, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PRIMARY = '#FF1351';
const DARK = '#1a1a2e';
const MUTED = '#7a7a7a';
const WHITE = '#fff';
const BORDER = '#E5E7EB';
const SURFACE = '#F8F9FB';

const cardStyle = {
  background: WHITE, borderRadius: 12, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}`,
};

const STATUS_COLORS = { paid: '#10b981', failed: '#ef4444', pending: '#f59e0b' };

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (filterType) params.type = filterType;
      if (filterStatus) params.paymentStatus = filterStatus;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const { data } = await api.get('/admin/transactions', { params });
      setTransactions(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType, filterStatus, dateFrom, dateTo]);

  const fetchStats = useCallback(async () => {
    try {
      const params = {};
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const { data } = await api.get('/admin/transactions/stats', { params });
      setStats(data.data);
    } catch {}
  }, [dateFrom, dateTo]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { setPage(1); }, [search, filterType, filterStatus, dateFrom, dateTo]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: DARK, margin: '0 0 24px' }}>Transactions</h1>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Revenue', value: `₹${stats.rechargeAmount.toLocaleString()}`, sub: `${stats.totalRecharges} recharges`, icon: IndianRupee, color: '#10b981' },
            { label: 'Total Debits', value: `₹${stats.debitAmount.toLocaleString()}`, sub: `${stats.totalDebits} debits`, icon: ArrowDownCircle, color: '#f59e0b' },
            { label: 'Paid', value: stats.paidCount, sub: 'successful', icon: CheckCircle, color: '#10b981' },
            { label: 'Failed', value: stats.failedCount, sub: 'transactions', icon: XCircle, color: '#ef4444' },
            { label: 'Pending', value: stats.pendingCount, sub: 'awaiting', icon: Clock, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <s.icon size={16} color={s.color} />
                </div>
                <span style={{ fontSize: 13, color: MUTED }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: DARK }}>{s.value}</div>
              <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ ...cardStyle, marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Filter size={16} color={MUTED} />

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: SURFACE, borderRadius: 8, padding: '0 12px', border: `1px solid ${BORDER}`,
          }}>
            <Search size={14} color={MUTED} />
            <input
              type="text"
              placeholder="Search user name, phone, email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', padding: '8px 0', fontSize: 13, background: 'transparent', fontFamily: 'inherit', width: 220 }}
            />
          </div>

          {/* Type */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13, background: SURFACE, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <option value="">All Types</option>
            <option value="recharge">Recharge</option>
            <option value="debit">Debit</option>
          </select>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13, background: SURFACE, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>

          {/* Date range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: MUTED }}>From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13, background: SURFACE, fontFamily: 'inherit' }}
            />
            <span style={{ fontSize: 12, color: MUTED }}>To</span>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13, background: SURFACE, fontFamily: 'inherit' }}
            />
          </div>

          {/* Clear */}
          {(search || filterType || filterStatus || dateFrom || dateTo) && (
            <button
              onClick={() => { setSearch(''); setFilterType(''); setFilterStatus(''); setDateFrom(''); setDateTo(''); }}
              style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 12, fontWeight: 600, background: WHITE, cursor: 'pointer', color: PRIMARY }}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['User', 'Type', 'Amount', 'Tokens', 'Status', 'Description', 'Date'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 60, textAlign: 'center' }}>
                    <Loader2 size={24} color={PRIMARY} style={{ animation: 'spin 1s linear infinite' }} />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '60px 40px', textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <IndianRupee size={24} color={MUTED} />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: DARK, marginBottom: 4 }}>No transactions found</div>
                    <div style={{ fontSize: 13, color: MUTED }}>Try adjusting your filters</div>
                  </td>
                </tr>
              ) : transactions.map(tx => (
                <tr
                  key={tx._id}
                  style={{ borderBottom: `1px solid ${BORDER}`, transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = SURFACE}
                  onMouseLeave={e => e.currentTarget.style.background = WHITE}
                >
                  {/* User */}
                  <td style={{ padding: '12px 16px' }}>
                    {tx.user ? (
                      <div
                        onClick={() => navigate(`/users/${tx.user._id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                      >
                        <img
                          src={tx.user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(tx.user.name || 'U')}&background=FF1351&color=fff&size=32`}
                          alt=""
                          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{tx.user.name || 'Unnamed'}</div>
                          <div style={{ fontSize: 11, color: MUTED }}>{tx.user.phone || tx.user.email || ''}</div>
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: MUTED }}>Deleted user</span>
                    )}
                  </td>

                  {/* Type */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {tx.type === 'recharge'
                        ? <ArrowUpCircle size={14} color="#10b981" />
                        : <ArrowDownCircle size={14} color="#f59e0b" />
                      }
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                        background: tx.type === 'recharge' ? '#10b98114' : '#f59e0b14',
                        color: tx.type === 'recharge' ? '#10b981' : '#f59e0b',
                        textTransform: 'capitalize',
                      }}>{tx.type}</span>
                    </div>
                  </td>

                  {/* Amount */}
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: tx.type === 'recharge' ? '#10b981' : DARK }}>
                    {tx.type === 'recharge' ? '+' : '-'}₹{tx.amount}
                  </td>

                  {/* Tokens */}
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: DARK }}>
                    {tx.type === 'recharge' ? '+' : '-'}{tx.tokens}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    {tx.paymentStatus ? (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                        background: `${STATUS_COLORS[tx.paymentStatus] || MUTED}14`,
                        color: STATUS_COLORS[tx.paymentStatus] || MUTED,
                        textTransform: 'capitalize',
                      }}>{tx.paymentStatus}</span>
                    ) : (
                      <span style={{ fontSize: 12, color: MUTED }}>-</span>
                    )}
                  </td>

                  {/* Description */}
                  <td style={{ padding: '12px 16px', fontSize: 13, color: MUTED, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.description || '-'}
                  </td>

                  {/* Date */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontSize: 12, color: DARK }}>{formatDate(tx.createdAt)}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>{formatTime(tx.createdAt)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderTop: `1px solid ${BORDER}`,
          }}>
            <span style={{ fontSize: 13, color: MUTED }}>
              Page {page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
                  fontSize: 13, fontWeight: 500, borderRadius: 8,
                  border: `1px solid ${BORDER}`, background: WHITE, cursor: page === 1 ? 'not-allowed' : 'pointer',
                  color: page === 1 ? MUTED : DARK, opacity: page === 1 ? 0.5 : 1,
                }}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
                  fontSize: 13, fontWeight: 500, borderRadius: 8,
                  border: `1px solid ${BORDER}`, background: WHITE, cursor: page === pagination.pages ? 'not-allowed' : 'pointer',
                  color: page === pagination.pages ? MUTED : DARK, opacity: page === pagination.pages ? 0.5 : 1,
                }}
              >
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
