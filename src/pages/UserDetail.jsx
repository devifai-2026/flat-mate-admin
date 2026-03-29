import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BadgeCheck, Phone, Mail, MapPin, Wallet, Calendar, Loader2, ShieldBan, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PRIMARY = '#FF1351';
const DARK = '#1a1a2e';
const MUTED = '#7a7a7a';
const WHITE = '#fff';
const BORDER = '#E5E7EB';
const SURFACE = '#F8F9FB';

const tabList = ['Listings', 'Wishlist', 'Teams', 'Transactions', 'Conversations'];

const cardStyle = {
  background: WHITE, borderRadius: 12, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}`,
};

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('Listings');

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/users/${id}`)
      .then(res => setUserData(res.data.data))
      .catch(() => toast.error('Failed to load user'))
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 120 }}>
      <Loader2 size={32} color={PRIMARY} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  if (!userData || !userData.user) return (
    <div style={{ textAlign: 'center', paddingTop: 80 }}>
      <p style={{ color: MUTED, fontSize: 16, marginBottom: 16 }}>User not found.</p>
      <button onClick={() => navigate('/users')} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${BORDER}`, background: WHITE, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: PRIMARY }}>
        Back to Users
      </button>
    </div>
  );

  const { user, rooms, pgs, requirements, wishlist, teams, transactions, conversations } = userData;
  const allListings = [
    ...(rooms || []).map(r => ({ ...r, _type: 'Room' })),
    ...(pgs || []).map(p => ({ ...p, _type: 'PG' })),
    ...(requirements || []).map(r => ({ ...r, _type: 'Requirement' })),
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button
          onClick={() => navigate('/users')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'none',
            border: 'none', cursor: 'pointer', color: MUTED, fontSize: 13, fontWeight: 500,
            padding: 0,
          }}
        >
          <ArrowLeft size={16} /> Back to Users
        </button>
        {!user.isAdmin && (
          <button
            onClick={async () => {
              try {
                await api.put(`/admin/users/${user._id}/${user.isBlocked ? 'unblock' : 'block'}`);
                toast.success(user.isBlocked ? 'User unblocked' : 'User blocked');
                const res = await api.get(`/admin/users/${id}`);
                setUserData(res.data.data);
              } catch (err) {
                toast.error(err.response?.data?.message || 'Action failed');
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${user.isBlocked ? '#10b981' : '#ef4444'}40`,
              background: user.isBlocked ? '#10b98110' : '#ef444410',
              color: user.isBlocked ? '#10b981' : '#ef4444',
            }}
          >
            {user.isBlocked ? <ShieldCheck size={14} /> : <ShieldBan size={14} />}
            {user.isBlocked ? 'Unblock User' : 'Block User'}
          </button>
        )}
      </div>

      {/* Profile card */}
      <div style={{ ...cardStyle, display: 'flex', gap: 24, marginBottom: 24 }}>
        <img
          src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=FF1351&color=fff&size=80`}
          alt=""
          style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'cover' }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: DARK }}>{user.name || 'Unnamed'}</h2>
            {user.isVerified && <BadgeCheck size={18} color="#10b981" />}
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, marginLeft: 4,
              background: user.isAdmin ? `${PRIMARY}14` : '#6366f114',
              color: user.isAdmin ? PRIMARY : '#6366f1',
            }}>
              {user.isAdmin ? 'Admin' : user.type || 'Free'}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 12 }}>
            <InfoItem icon={Phone} label="Phone" value={user.phone || '-'} />
            <InfoItem icon={Mail} label="Email" value={user.email || '-'} />
            <InfoItem icon={MapPin} label="City" value={user.city || '-'} />
            <InfoItem icon={Wallet} label="Wallet" value={`₹${user.walletBalance || 0}`} />
            <InfoItem icon={Calendar} label="Joined" value={formatDate(user.createdAt)} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${BORDER}`, paddingBottom: 0 }}>
        {tabList.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '10px 18px', fontSize: 13, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? PRIMARY : MUTED, background: 'none', border: 'none',
              borderBottom: tab === t ? `2px solid ${PRIMARY}` : '2px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Listings' && (
        <div style={cardStyle}>
          {allListings.length === 0 ? (
            <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>No listings found.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Type', 'Title', 'Location', 'Price', 'Hidden', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: MUTED, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allListings.map(item => (
                  <tr key={item._id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: `${PRIMARY}10`, color: PRIMARY }}>{item._type}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500, color: DARK }}>{item.title || '-'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: MUTED }}>{item.location?.address || item.city || '-'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: DARK }}>₹{item.rent || item.price || (item.budget ? `${item.budget.min || 0} - ${item.budget.max || 0}` : '-')}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: item.isHidden ? PRIMARY : '#10b981' }}>{item.isHidden ? 'Hidden' : 'Visible'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: MUTED }}>{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'Wishlist' && (
        <div style={cardStyle}>
          {(wishlist || []).length === 0 ? (
            <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>No wishlist items.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {wishlist.map(w => (
                <div key={w._id} style={{ padding: '10px 14px', background: SURFACE, borderRadius: 8, fontSize: 13, color: DARK }}>
                  <span style={{ fontWeight: 500 }}>{w.listingType || 'Listing'}</span>
                  <span style={{ color: MUTED, marginLeft: 8 }}>ID: {w.listing}</span>
                  <span style={{ color: MUTED, marginLeft: 12, fontSize: 12 }}>{formatDate(w.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Teams' && (
        <div style={cardStyle}>
          {(teams || []).length === 0 ? (
            <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>Not in any teams.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {teams.map(t => (
                <div key={t._id} style={{ padding: '12px 14px', background: SURFACE, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: DARK }}>{t.name || 'Team'}</span>
                    <span style={{ fontSize: 12, color: MUTED, marginLeft: 10 }}>{(t.members || []).length} members</span>
                  </div>
                  <span style={{ fontSize: 12, color: MUTED }}>{formatDate(t.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Transactions' && (
        <div style={cardStyle}>
          {(transactions || []).length === 0 ? (
            <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>No transactions.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Type', 'Amount', 'Status', 'Description', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: MUTED, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx._id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                        background: tx.type === 'recharge' ? '#10b98114' : '#f59e0b14',
                        color: tx.type === 'recharge' ? '#10b981' : '#f59e0b',
                        textTransform: 'capitalize',
                      }}>{tx.type}</span>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: tx.type === 'recharge' ? '#10b981' : DARK }}>
                      {tx.type === 'recharge' ? '+' : '-'}₹{tx.amount}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: MUTED, textTransform: 'capitalize' }}>{tx.paymentStatus || tx.status || '-'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 13, color: MUTED }}>{tx.description || '-'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: MUTED }}>{formatDate(tx.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'Conversations' && (
        <div style={cardStyle}>
          {(conversations || []).length === 0 ? (
            <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>No conversations.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {conversations.map(c => (
                <div
                  key={c._id}
                  onClick={() => navigate(`/chats/${c._id}`)}
                  style={{
                    padding: '12px 14px', background: SURFACE, borderRadius: 8, cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = `${PRIMARY}06`}
                  onMouseLeave={e => e.currentTarget.style.background = SURFACE}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ display: 'flex' }}>
                      {(c.participants || []).slice(0, 3).map((p, i) => (
                        <img
                          key={p._id}
                          src={p.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'U')}&background=FF1351&color=fff&size=28`}
                          alt=""
                          style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${WHITE}`, marginLeft: i > 0 ? -8 : 0, objectFit: 'cover' }}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: DARK }}>
                      {(c.participants || []).map(p => p.name).join(', ')}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: MUTED }}>{formatDate(c.updatedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Icon size={14} color={MUTED} />
      <span style={{ fontSize: 12, color: MUTED }}>{label}:</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: DARK }}>{value}</span>
    </div>
  );
}

