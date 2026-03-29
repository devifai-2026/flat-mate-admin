import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { Eye, Monitor, Smartphone, Globe, Loader2, ArrowUpRight } from 'lucide-react';
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

export default function Guests() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [guests, setGuests] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/guests/stats').then(r => setStats(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/guests?page=${page}&limit=20`)
      .then(r => { setGuests(r.data.data); setPagination(r.data.pagination); })
      .catch(() => toast.error('Failed to load guests'))
      .finally(() => setLoading(false));
  }, [page]);

  const dailyData = (stats?.dailyGuests || []).map(d => ({ date: d._id.slice(5), count: d.count }));
  const topPages = (stats?.topPages || []).map(d => ({ path: d._id, visits: d.visits }));

  const formatTime = (d) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now - date;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const getDeviceIcon = (device) => {
    if (device?.type === 'mobile') return <Smartphone size={14} color={MUTED} />;
    return <Monitor size={14} color={MUTED} />;
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: DARK, margin: '0 0 24px' }}>Guest Visitors</h1>

      {/* Stats cards */}
      {stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Guests', value: stats.totalGuests, color: '#6366f1' },
              { label: 'Today', value: stats.todayGuests, color: '#10b981' },
              { label: 'This Week', value: stats.weekGuests, color: '#f59e0b' },
              { label: 'Converted to Users', value: stats.converted, color: PRIMARY },
            ].map(s => (
              <div key={s.label} style={cardStyle}>
                <div style={{ fontSize: 13, color: MUTED, marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: DARK }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ ...cardStyle, padding: '20px 20px 12px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 16px' }}>New Guests (30d)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: MUTED }} />
                  <YAxis tick={{ fontSize: 11, fill: MUTED }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13 }} />
                  <Line type="monotone" dataKey="count" stroke={PRIMARY} strokeWidth={2} dot={{ r: 3, fill: PRIMARY }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ ...cardStyle, padding: '20px 20px 12px' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 16px' }}>Top Pages Visited</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topPages} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: MUTED }} />
                  <YAxis dataKey="path" type="category" width={120} tick={{ fontSize: 11, fill: MUTED }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13 }} />
                  <Bar dataKey="visits" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Guest list */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 16px' }}>Recent Guest Visitors</h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Loader2 size={24} color={PRIMARY} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Fingerprint', 'Device', 'Pages', 'Visits', 'First Seen', 'Last Seen', ''].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: MUTED }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {guests.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '60px 40px', textAlign: 'center' }}>
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: '#F8F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                        <Globe size={24} color="#7a7a7a" />
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: DARK, marginBottom: 4 }}>No guest visitors yet</div>
                      <div style={{ fontSize: 13, color: '#7a7a7a' }}>Guest activity will appear here once visitors browse the platform</div>
                    </td>
                  </tr>
                ) : null}
                {guests.map(g => (
                  <tr key={g._id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '12px', fontSize: 13, color: DARK, fontFamily: 'monospace' }}>
                      {g.fingerprint?.slice(0, 12)}...
                    </td>
                    <td style={{ padding: '12px', fontSize: 13, color: MUTED }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {getDeviceIcon(g.device)}
                        <span>{g.device?.browser || 'Unknown'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: 13, color: DARK, fontWeight: 600 }}>{g.pages?.length || 0}</td>
                    <td style={{ padding: '12px', fontSize: 13, color: DARK, fontWeight: 600 }}>{g.totalVisits}</td>
                    <td style={{ padding: '12px', fontSize: 13, color: MUTED }}>{formatTime(g.firstSeenAt)}</td>
                    <td style={{ padding: '12px', fontSize: 13, color: MUTED }}>{formatTime(g.lastSeenAt)}</td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => navigate(`/guests/${g._id}`)}
                        style={{
                          background: 'none', border: `1px solid ${BORDER}`, borderRadius: 6,
                          padding: '4px 10px', cursor: 'pointer', fontSize: 12, color: PRIMARY,
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        View <ArrowUpRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map(p => (
                  <button
                    key={p} onClick={() => setPage(p)}
                    style={{
                      padding: '6px 12px', borderRadius: 6, border: `1px solid ${BORDER}`,
                      background: p === page ? PRIMARY : WHITE, color: p === page ? WHITE : DARK,
                      cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    }}
                  >{p}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
