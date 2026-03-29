import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Loader2, Users as UsersIcon, ShieldBan, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PRIMARY = '#FF1351';
const DARK = '#1a1a2e';
const MUTED = '#7a7a7a';
const WHITE = '#fff';
const BORDER = '#E5E7EB';
const SURFACE = '#F8F9FB';

export default function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { page, limit: 20, search: search || undefined } });
      setUsers(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => { setPage(1); }, [search]);

  const handleToggleBlock = async (e, userId, isBlocked) => {
    e.stopPropagation();
    try {
      await api.put(`/admin/users/${userId}/${isBlocked ? 'unblock' : 'block'}`);
      toast.success(isBlocked ? 'User unblocked' : 'User blocked');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: DARK, margin: 0 }}>Users</h1>
        <span style={{ fontSize: 13, color: MUTED }}>{pagination.total} total users</span>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
        background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', maxWidth: 400,
      }}>
        <Search size={16} color={MUTED} />
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, border: 'none', outline: 'none', padding: '12px 0',
            fontSize: 14, fontFamily: 'inherit', background: 'transparent',
          }}
        />
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
                {['User', 'Phone', 'Email', 'City', 'Type', 'Wallet', 'Status', 'Joined', ''].map(h => (
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
                  <td colSpan={9} style={{ padding: 40, textAlign: 'center' }}>
                    <Loader2 size={24} color={PRIMARY} style={{ animation: 'spin 1s linear infinite' }} />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '60px 40px', textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F8F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <UsersIcon size={24} color={MUTED} />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: DARK, marginBottom: 4 }}>No users found</div>
                    <div style={{ fontSize: 13, color: MUTED }}>Try adjusting your search terms</div>
                  </td>
                </tr>
              ) : users.map(user => (
                <tr
                  key={user._id}
                  onClick={() => navigate(`/users/${user._id}`)}
                  style={{ borderBottom: `1px solid ${BORDER}`, cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = SURFACE}
                  onMouseLeave={e => e.currentTarget.style.background = WHITE}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img
                        src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=FF1351&color=fff&size=36`}
                        alt=""
                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span style={{ fontSize: 14, fontWeight: 600, color: DARK }}>{user.name || 'Unnamed'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: DARK, fontWeight: 500 }}>{user.phone || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: MUTED }}>{user.email || '-'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: MUTED }}>{user.city || '-'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                      background: user.type === 'premium' ? `${PRIMARY}14` : `${MUTED}14`,
                      color: user.type === 'premium' ? PRIMARY : MUTED,
                      textTransform: 'capitalize',
                    }}>{user.type || 'free'}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: DARK }}>
                    ₹{user.walletBalance || 0}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {user.isBlocked ? (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: '#ef444420', color: '#ef4444' }}>Blocked</span>
                    ) : user.isAdmin ? (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: `${PRIMARY}14`, color: PRIMARY }}>Admin</span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: '#10b98114', color: '#10b981' }}>Active</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: MUTED }}>{formatDate(user.createdAt)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {!user.isAdmin && (
                      <button
                        onClick={(e) => handleToggleBlock(e, user._id, user.isBlocked)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                          borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          border: `1px solid ${user.isBlocked ? '#10b981' : '#ef4444'}30`,
                          background: user.isBlocked ? '#10b98110' : '#ef444410',
                          color: user.isBlocked ? '#10b981' : '#ef4444',
                        }}
                      >
                        {user.isBlocked ? <ShieldCheck size={12} /> : <ShieldBan size={12} />}
                        {user.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    )}
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
              Page {page} of {pagination.pages}
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
