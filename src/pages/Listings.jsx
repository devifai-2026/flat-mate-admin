import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Loader2, EyeOff, Eye, Home, Building, ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PRIMARY = '#FF1351';
const DARK = '#1a1a2e';
const MUTED = '#7a7a7a';
const WHITE = '#fff';
const BORDER = '#E5E7EB';
const SURFACE = '#F8F9FB';

const tabs = [
  { key: 'room', label: 'Rooms', icon: Home },
  { key: 'pg', label: 'PGs', icon: Building },
  { key: 'requirement', label: 'Requirements', icon: ClipboardList },
];

export default function Listings() {
  const [type, setType] = useState('room');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hiddenOnly, setHiddenOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [togglingId, setTogglingId] = useState(null);
  const [counts, setCounts] = useState({ rooms: 0, pgs: 0, requirements: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/listings/counts').then(res => setCounts(res.data.data)).catch(() => {});
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = { type, page, limit: 20 };
      if (search) params.search = search;
      if (hiddenOnly) params.hidden = 'true';
      const { data } = await api.get('/admin/listings', { params });
      setItems(data.data);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [type, page, search, hiddenOnly]);

  useEffect(() => { fetchListings(); }, [fetchListings]);
  useEffect(() => { setPage(1); }, [type, search, hiddenOnly]);

  const toggleHide = async (item) => {
    setTogglingId(item._id);
    try {
      const { data } = await api.put(`/admin/listings/${type}/${item._id}/toggle-hide`);
      toast.success(data.message);
      setItems(prev => prev.map(i => i._id === item._id ? { ...i, isHidden: data.data.isHidden } : i));
    } catch {
      toast.error('Failed to toggle visibility');
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  const getOwner = (item) => {
    const owner = item.postedBy || item.createdBy;
    if (!owner) return { name: '-', image: null };
    if (typeof owner === 'string') return { name: owner, image: null };
    return { name: owner.name || '-', image: owner.profileImage };
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: DARK, margin: '0 0 24px' }}>Listings</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {tabs.map(t => {
          const count = t.key === 'room' ? counts.rooms : t.key === 'pg' ? counts.pgs : counts.requirements;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', fontSize: 13, fontWeight: type === t.key ? 600 : 400,
                color: type === t.key ? WHITE : MUTED,
                background: type === t.key ? PRIMARY : WHITE,
                border: `1px solid ${type === t.key ? PRIMARY : BORDER}`,
                borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <Icon size={14} />
              {t.label}
              <span style={{
                padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                background: type === t.key ? 'rgba(255,255,255,0.2)' : SURFACE,
                color: type === t.key ? WHITE : DARK,
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, flex: 1, maxWidth: 400,
          background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <Search size={16} color={MUTED} />
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', outline: 'none', padding: '12px 0',
              fontSize: 14, fontFamily: 'inherit', background: 'transparent',
            }}
          />
        </div>
        <button
          onClick={() => setHiddenOnly(!hiddenOnly)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
            fontSize: 13, fontWeight: 500, borderRadius: 8, cursor: 'pointer',
            border: `1px solid ${hiddenOnly ? PRIMARY : BORDER}`,
            background: hiddenOnly ? `${PRIMARY}10` : WHITE,
            color: hiddenOnly ? PRIMARY : MUTED, transition: 'all 0.15s',
          }}
        >
          <EyeOff size={14} /> Hidden Only
        </button>
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
                {['', 'Title', 'Location', 'Price', 'Owner', 'Date', 'Status', 'Action'].map(h => (
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
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center' }}>
                    <Loader2 size={24} color={PRIMARY} style={{ animation: 'spin 1s linear infinite' }} />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '60px 40px', textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <Home size={24} color={MUTED} />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: DARK, marginBottom: 4 }}>No listings found</div>
                    <div style={{ fontSize: 13, color: MUTED }}>{search ? 'Try a different search term' : hiddenOnly ? 'No hidden listings in this category' : 'No listings have been posted yet'}</div>
                  </td>
                </tr>
              ) : items.map(item => {
                const owner = getOwner(item);
                const thumb = (item.images || item.photos || [])[0];
                return (
                  <tr key={item._id} onClick={() => navigate(`/listings/${type}/${item._id}`)} style={{ borderBottom: `1px solid ${BORDER}`, cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = SURFACE} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '10px 16px' }}>
                      {thumb ? (
                        <img src={thumb} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 44, height: 44, borderRadius: 8, background: SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: 10, color: MUTED }}>No img</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 500, color: DARK, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title || '-'}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: MUTED }}>{item.location?.address || item.city || item.locality || '-'}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: DARK }}>₹{item.rent || item.price || (item.budget ? `${item.budget.min || 0} - ${item.budget.max || 0}` : '-')}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {owner.image && <img src={owner.image} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />}
                        <span style={{ fontSize: 13, color: DARK }}>{owner.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: MUTED }}>{formatDate(item.createdAt)}</td>
                    <td style={{ padding: '10px 16px' }}>
                      {item.isHidden ? (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: `${PRIMARY}14`, color: PRIMARY }}>Hidden</span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: '#10b98114', color: '#10b981' }}>Visible</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleHide(item); }}
                        disabled={togglingId === item._id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
                          fontSize: 12, fontWeight: 500, borderRadius: 6, cursor: 'pointer',
                          border: `1px solid ${BORDER}`, background: WHITE,
                          color: item.isHidden ? '#10b981' : PRIMARY,
                          opacity: togglingId === item._id ? 0.5 : 1,
                          transition: 'all 0.15s',
                        }}
                      >
                        {item.isHidden ? <Eye size={13} /> : <EyeOff size={13} />}
                        {item.isHidden ? 'Unhide' : 'Hide'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
