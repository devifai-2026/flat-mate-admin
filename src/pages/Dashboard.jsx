import { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie,
  XAxis, YAxis, Tooltip, CartesianGrid, Cell, Legend,
  ComposedChart, Line,
} from 'recharts';
import {
  Users, Home, IndianRupee, Ticket, MessageSquare, Users2, Loader2,
  TrendingUp, TrendingDown, Eye, EyeOff, ArrowRight,
  Building, ClipboardList, ShieldCheck,
  Unlock, MapPin,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const PRIMARY = '#FF1351';
const DARK = '#1a1a2e';
const MUTED = '#7a7a7a';
const WHITE = '#fff';
const BORDER = '#E5E7EB';
const SURFACE = '#F8F9FB';

const PIE_COLORS = [PRIMARY, '#6366f1', '#f59e0b', '#10b981', '#8b5cf6', '#06b6d4'];
const CHART_COLORS = { signup: '#6366f1', revenue: PRIMARY, rooms: '#10b981', pgs: '#f59e0b', requirements: '#8b5cf6' };

const PERIODS = [
  { key: '1m', label: '1 Month' },
  { key: '3m', label: '3 Months' },
  { key: '6m', label: '6 Months' },
  { key: 'year', label: 'This Year' },
];

const cardStyle = {
  background: WHITE, borderRadius: 14, padding: 24,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}`,
};

const chartCardStyle = {
  ...cardStyle, padding: '20px 20px 12px',
};

const sectionTitle = {
  fontSize: 18, fontWeight: 700, color: DARK, margin: '0 0 16px',
  display: 'flex', alignItems: 'center', gap: 8,
};

const USER_TYPE_LABELS = { seeker: 'Seekers', 'pg-owner': 'PG Owners', 'flat-owner': 'Flat Owners' };
const USER_TYPE_COLORS = { seeker: '#6366f1', 'pg-owner': '#f59e0b', 'flat-owner': '#10b981' };

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
}

function StatCard({ label, value, sub, icon: Icon, color, trend }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: `${color}14`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={18} color={color} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: MUTED }}>{label}</span>
        </div>
        {trend !== undefined && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 2,
            fontSize: 12, fontWeight: 600,
            color: trend >= 0 ? '#10b981' : PRIMARY,
          }}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: DARK, letterSpacing: -0.5 }}>{value}</div>
      <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function PeriodSelector({ period, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: SURFACE, borderRadius: 10, padding: 4 }}>
      {PERIODS.map(p => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
            background: period === p.key ? WHITE : 'transparent',
            color: period === p.key ? PRIMARY : MUTED,
            boxShadow: period === p.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function CustomTooltip({ active, payload, label, prefix = '', suffix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    }}>
      <div style={{ fontSize: 12, color: MUTED, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ fontSize: 14, fontWeight: 600, color: p.color || DARK }}>
          {prefix}{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{suffix}
          <span style={{ fontSize: 11, fontWeight: 400, color: MUTED, marginLeft: 4 }}>{p.name}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('1m');
  const [recentListings, setRecentListings] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback((p) => {
    setLoading(true);
    api.get(`/admin/analytics?period=${p}`)
      .then(res => setData(res.data.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(period); }, [period, fetchData]);

  useEffect(() => {
    api.get('/admin/listings/recent?limit=5')
      .then(res => setRecentListings(res.data.data))
      .catch(() => {});
  }, []);

  if (loading && !data) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 120 }}>
      <Loader2 size={32} color={PRIMARY} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  if (!data) return <p style={{ textAlign: 'center', color: MUTED }}>Failed to load data.</p>;

  const dailySignups = (data.charts.dailySignups || []).map(d => ({
    date: d._id.length > 7 ? d._id.slice(5) : `W${d._id.split('-')[1]}`,
    count: d.count,
  }));

  const dailyRevenue = (data.charts.dailyRevenue || []).map(d => ({
    date: d._id.length > 7 ? d._id.slice(5) : `W${d._id.split('-')[1]}`,
    amount: d.amount,
    count: d.count,
  }));

  const monthlySignups = (data.charts.monthlySignups || []).map(d => {
    const [y, m] = d._id.split('-');
    return { month: `${MONTH_NAMES[parseInt(m) - 1]} ${y.slice(2)}`, count: d.count };
  });

  const monthlyRevenue = (data.charts.monthlyRevenue || []).map(d => {
    const [y, m] = d._id.split('-');
    return { month: `${MONTH_NAMES[parseInt(m) - 1]} ${y.slice(2)}`, amount: d.amount, count: d.count };
  });

  const pieData = [
    { name: 'Rooms', value: data.listings.rooms },
    { name: 'PGs', value: data.listings.pgs },
    { name: 'Requirements', value: data.listings.requirements },
  ];

  const userTypePie = (data.userTypeBreakdown || []).map(d => ({
    name: USER_TYPE_LABELS[d._id] || d._id || 'Unknown',
    value: d.count,
    color: USER_TYPE_COLORS[d._id] || '#94a3b8',
  }));

  const ticketPie = [
    { name: 'Open', value: data.tickets.open || 0, color: '#f59e0b' },
    { name: 'In Progress', value: data.tickets.inProgress || 0, color: '#6366f1' },
    { name: 'Resolved', value: data.tickets.resolved || 0, color: '#10b981' },
  ].filter(d => d.value > 0);

  const ticketCatData = (data.ticketsByCategory || []).map(d => ({
    name: d._id || 'other', count: d.count,
  })).sort((a, b) => b.count - a.count);

  const periodLabel = PERIODS.find(p => p.key === period)?.label;

  return (
    <div>
      {/* Header with period selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: DARK, margin: 0 }}>Dashboard</h1>
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: MUTED, fontSize: 13 }}>
          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Updating...
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION 1: Revenue + KPI Cards             */}
      {/* ═══════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {/* Revenue card */}
        <div style={{
          background: `linear-gradient(135deg, ${DARK}, #16213e)`,
          borderRadius: 14, padding: 24, color: WHITE,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          gridColumn: 'span 1',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `${PRIMARY}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={18} color={PRIMARY} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>Total Revenue</span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>
            ₹{(data.revenue.totalRevenue || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
            {data.revenue.totalRecharges} recharges total
          </div>
          <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 13 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>{periodLabel}: </span>
            <span style={{ fontWeight: 700 }}>₹{(data.revenue.periodRevenue || 0).toLocaleString()}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>({data.revenue.periodRecharges || 0} recharges)</span>
          </div>
        </div>

        <StatCard label="Total Users" value={data.users.total.toLocaleString()} sub={`+${data.users.periodNew || 0} in ${periodLabel}`} icon={Users} color="#6366f1" />
        <StatCard label="Total Listings" value={data.listings.total.toLocaleString()} sub={`${data.listings.rooms} rooms, ${data.listings.pgs} PGs, ${data.listings.requirements} req`} icon={Home} color="#10b981" />
        <StatCard label="Open Tickets" value={data.tickets.open} sub={`${data.tickets.inProgress || 0} in progress, ${data.tickets.total} total`} icon={Ticket} color="#f59e0b" />
        <StatCard label="Messages" value={data.engagement.messages.toLocaleString()} sub={`${data.engagement.conversations} conversations`} icon={MessageSquare} color="#8b5cf6" />
        <StatCard label="Teams" value={data.engagement.teams} sub={`${data.engagement.unlocks} unlocks`} icon={Users2} color="#06b6d4" />
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION 2: Latest Posts                      */}
      {/* ═══════════════════════════════════════════ */}
      {recentListings && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={sectionTitle}>
              <Home size={20} color="#10b981" /> Latest Posts
            </div>
            <button
              onClick={() => navigate('/listings')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 8,
                border: `1px solid ${BORDER}`, background: WHITE, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, color: PRIMARY,
              }}
            >
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
            {[
              { title: 'Recent Rooms', items: recentListings.rooms, type: 'room', color: '#10b981', icon: Home },
              { title: 'Recent PGs', items: recentListings.pgs, type: 'pg', color: '#f59e0b', icon: Building },
              { title: 'Recent Requirements', items: recentListings.requirements, type: 'requirement', color: '#8b5cf6', icon: ClipboardList },
            ].map(section => (
              <div key={section.title} style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${section.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <section.icon size={15} color={section.color} />
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: DARK, margin: 0 }}>{section.title}</h3>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${section.color}12`, color: section.color, marginLeft: 'auto' }}>
                    {section.items?.length || 0}
                  </span>
                </div>
                {section.items?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {section.items.map(item => {
                      const owner = item.postedBy || item.createdBy;
                      const thumb = (item.images || [])[0];
                      return (
                        <div
                          key={item._id}
                          onClick={() => navigate(`/listings/${section.type}/${item._id}`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                            background: SURFACE, borderRadius: 8, cursor: 'pointer', transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = `${BORDER}`}
                          onMouseLeave={e => e.currentTarget.style.background = SURFACE}
                        >
                          <div style={{
                            width: 38, height: 38, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                            background: `${section.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {thumb
                              ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <section.icon size={16} color={section.color} />
                            }
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: DARK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.title || 'Untitled'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: MUTED }}>
                              {item.city || item.location || '—'}
                              {(item.rent || item.budget) && (
                                <span style={{ marginLeft: 'auto', fontWeight: 600, color: DARK }}>
                                  ₹{(item.rent || item.budget?.min || 0).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <section.icon size={24} color={BORDER} style={{ marginBottom: 6 }} />
                    <div style={{ fontSize: 13, color: MUTED }}>No {section.title.toLowerCase()} yet</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION 3: Signup & Revenue Trends          */}
      {/* ═══════════════════════════════════════════ */}
      <div style={sectionTitle}>
        <TrendingUp size={20} color={PRIMARY} /> Growth Trends
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        {/* Signup area chart */}
        <div style={chartCardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 4px' }}>User Signups</h3>
          <p style={{ fontSize: 12, color: MUTED, margin: '0 0 12px' }}>{periodLabel} trend</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dailySignups}>
              <defs>
                <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.signup} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={CHART_COLORS.signup} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: MUTED }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: MUTED }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="Signups" stroke={CHART_COLORS.signup} strokeWidth={2.5} fill="url(#signupGrad)" dot={false} activeDot={{ r: 5, fill: CHART_COLORS.signup }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue composed chart */}
        <div style={chartCardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 4px' }}>Revenue</h3>
          <p style={{ fontSize: 12, color: MUTED, margin: '0 0 12px' }}>{periodLabel} trend</p>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={dailyRevenue}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_COLORS.revenue} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={CHART_COLORS.revenue} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: MUTED }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11, fill: MUTED }} />
              <Tooltip content={<CustomTooltip prefix="₹" />} />
              <Bar dataKey="amount" name="Revenue" fill={CHART_COLORS.revenue} radius={[4, 4, 0, 0]} opacity={0.8} />
              <Line type="monotone" dataKey="count" name="Recharges" stroke="#6366f1" strokeWidth={2} dot={false} yAxisId={0} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION 3: Monthly Comparison               */}
      {/* ═══════════════════════════════════════════ */}
      {monthlySignups.length > 1 && (
        <>
          <div style={sectionTitle}>
            <ClipboardList size={20} color="#6366f1" /> Monthly Comparison
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
            <div style={chartCardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 12px' }}>Monthly Signups</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlySignups}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: MUTED }} />
                  <YAxis tick={{ fontSize: 11, fill: MUTED }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Signups" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={chartCardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 12px' }}>Monthly Revenue</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: MUTED }} />
                  <YAxis tick={{ fontSize: 11, fill: MUTED }} />
                  <Tooltip content={<CustomTooltip prefix="₹" />} />
                  <Bar dataKey="amount" name="Revenue" fill={PRIMARY} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION 4: Breakdown Charts                 */}
      {/* ═══════════════════════════════════════════ */}
      <div style={sectionTitle}>
        <Building size={20} color="#10b981" /> Breakdown
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 28 }}>
        {/* Listing breakdown donut */}
        <div style={chartCardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 8px' }}>Listings</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3} strokeWidth={0}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {pieData.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: PIE_COLORS[i] }} />
                <span style={{ fontSize: 12, color: MUTED }}>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
          {data.listings.periodNew && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: SURFACE, borderRadius: 8, fontSize: 12, color: MUTED }}>
              <span style={{ fontWeight: 600, color: DARK }}>New in {periodLabel}:</span>{' '}
              {data.listings.periodNew.rooms} rooms, {data.listings.periodNew.pgs} PGs, {data.listings.periodNew.requirements} req
            </div>
          )}
        </div>

        {/* User type breakdown */}
        <div style={chartCardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 8px' }}>User Types</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={userTypePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3} strokeWidth={0}>
                {userTypePie.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            {userTypePie.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                <span style={{ fontSize: 12, color: MUTED }}>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket breakdown */}
        <div style={chartCardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 8px' }}>Tickets Status</h3>
          {ticketPie.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={ticketPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={3} strokeWidth={0}>
                    {ticketPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                {ticketPie.map(d => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                    <span style={{ fontSize: 12, color: MUTED }}>{d.name} ({d.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: MUTED, fontSize: 14 }}>
              No tickets yet
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION 5: Ticket Categories + Moderation   */}
      {/* ═══════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        {/* Ticket categories */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 16px' }}>Ticket Categories</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ticketCatData.length > 0 ? ticketCatData.map(item => {
              const maxCount = ticketCatData[0]?.count || 1;
              return (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 13, color: DARK, fontWeight: 500, width: 90, textTransform: 'capitalize' }}>{item.name}</span>
                  <div style={{ flex: 1, height: 24, background: SURFACE, borderRadius: 6, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 6,
                      width: `${(item.count / maxCount) * 100}%`,
                      background: `linear-gradient(90deg, ${PRIMARY}, #ff6b8a)`,
                      display: 'flex', alignItems: 'center', paddingLeft: 8,
                      minWidth: 32,
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: WHITE }}>{item.count}</span>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <p style={{ color: MUTED, fontSize: 13 }}>No tickets</p>
            )}
          </div>
        </div>

        {/* Moderation summary */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 16px' }}>Moderation Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Hidden Rooms', value: data.listings.hidden.rooms, total: data.listings.rooms, icon: EyeOff },
              { label: 'Hidden PGs', value: data.listings.hidden.pgs, total: data.listings.pgs, icon: EyeOff },
              { label: 'Hidden Requirements', value: data.listings.hidden.requirements, total: data.listings.requirements, icon: EyeOff },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', background: SURFACE, borderRadius: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <item.icon size={14} color={item.value > 0 ? PRIMARY : '#10b981'} />
                  <span style={{ fontSize: 14, color: DARK, fontWeight: 500 }}>{item.label}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: item.value > 0 ? PRIMARY : '#10b981' }}>
                  {item.value} / {item.total}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
            <div style={{ padding: 14, background: `${PRIMARY}08`, borderRadius: 8, border: `1px solid ${PRIMARY}20` }}>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 2 }}>New this week</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: DARK }}>{data.users.thisWeek}</div>
            </div>
            <div style={{ padding: 14, background: '#6366f108', borderRadius: 8, border: '1px solid #6366f120' }}>
              <div style={{ fontSize: 12, color: MUTED, marginBottom: 2 }}>New this month</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: DARK }}>{data.users.thisMonth}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* SECTION 6: Quick Stats Grid                 */}
      {/* ═══════════════════════════════════════════ */}
      <div style={sectionTitle}>
        <ShieldCheck size={20} color={PRIMARY} /> Platform Health
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total Users', value: data.users.total, icon: Users, color: '#6366f1' },
          { label: 'Active Listings', value: data.listings.total - (data.listings.hidden.rooms + data.listings.hidden.pgs + data.listings.hidden.requirements), icon: Eye, color: '#10b981' },
          { label: 'Hidden Listings', value: data.listings.hidden.rooms + data.listings.hidden.pgs + data.listings.hidden.requirements, icon: EyeOff, color: PRIMARY },
          { label: 'Total Conversations', value: data.engagement.conversations, icon: MessageSquare, color: '#8b5cf6' },
          { label: 'Total Messages', value: data.engagement.messages, icon: MessageSquare, color: '#06b6d4' },
          { label: 'Total Teams', value: data.engagement.teams, icon: Users2, color: '#f59e0b' },
          { label: 'Listing Unlocks', value: data.engagement.unlocks, icon: Unlock, color: '#10b981' },
          { label: 'Total Tickets', value: data.tickets.total, icon: Ticket, color: PRIMARY },
        ].map(item => (
          <div key={item.label} style={{
            background: WHITE, borderRadius: 10, padding: '16px 14px',
            border: `1px solid ${BORDER}`, textAlign: 'center',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: `${item.color}14`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px',
            }}>
              <item.icon size={16} color={item.color} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: DARK }}>{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{item.label}</div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
