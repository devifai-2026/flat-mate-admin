import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, Tooltip, CartesianGrid, Cell, ComposedChart, Area,
} from 'recharts';
import { Activity, AlertTriangle, Clock, Zap, Loader2, ShieldAlert } from 'lucide-react';
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

const chartCardStyle = { ...cardStyle, padding: '20px 20px 12px' };

const METHOD_COLORS = { GET: '#10b981', POST: '#6366f1', PUT: '#f59e0b', DELETE: '#ef4444', PATCH: '#8b5cf6' };

const STATUS_COLORS = {
  200: '#10b981', 201: '#10b981', 204: '#10b981',
  301: '#06b6d4', 302: '#06b6d4', 304: '#06b6d4',
  400: '#f59e0b', 401: '#f59e0b', 403: '#f59e0b', 404: '#f59e0b', 409: '#f59e0b', 422: '#f59e0b',
  500: '#ef4444', 502: '#ef4444', 503: '#ef4444',
};

function formatTime(d) {
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function ApiActivity() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [filterMethod, setFilterMethod] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorData, setErrorData] = useState(null);

  useEffect(() => {
    api.get('/admin/api-logs/stats').then(r => setStats(r.data.data)).catch(() => {});
    api.get('/admin/api-logs/errors').then(r => setErrorData(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: 50 });
    if (filterMethod) params.set('method', filterMethod);
    api.get(`/admin/api-logs?${params}`)
      .then(r => { setLogs(r.data.data); setPagination(r.data.pagination); })
      .catch(() => toast.error('Failed to load API logs'))
      .finally(() => setLoading(false));
  }, [page, filterMethod]);

  const hourlyData = (stats?.hourlyTraffic || []).map(d => ({
    hour: `${String(d._id).padStart(2, '0')}:00`, count: d.count,
  }));

  const dailyData = (stats?.dailyRequests || []).map(d => ({
    date: d._id.slice(5), total: d.total, errors: d.errors, avgTime: Math.round(d.avgTime),
  }));

  const scatterData = (stats?.responseTimeDistribution || []).map(d => ({
    time: d.hour + d.minute / 60,
    responseTime: d.responseTime,
    status: d.statusCode,
    method: d.method,
    path: d.path,
  }));

  const statusPieData = (stats?.statusDistribution || []).map(d => ({
    code: String(d._id), count: d.count, color: STATUS_COLORS[d._id] || MUTED,
  }));

  const errorBreakdown = errorData || stats?.errorBreakdown || [];

  const endpointScatter = (stats?.topEndpoints || []).map(ep => ({
    path: `${ep._id.method} ${ep._id.path}`,
    method: ep._id.method,
    count: ep.count,
    avgTime: Math.round(ep.avgTime),
  }));

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: DARK, margin: '0 0 24px' }}>API Activity</h1>

      {/* Stats cards */}
      {stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Requests Today', value: stats.totalToday.toLocaleString(), icon: Activity, color: '#6366f1' },
              { label: 'This Week', value: stats.totalWeek.toLocaleString(), icon: Zap, color: '#10b981' },
              { label: 'Errors Today', value: stats.errorCount, icon: AlertTriangle, color: '#ef4444' },
              { label: 'Avg Response Time', value: `${Math.round(stats.avgResponseTime)}ms`, icon: Clock, color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <s.icon size={16} color={s.color} />
                  </div>
                  <span style={{ fontSize: 13, color: MUTED }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: DARK }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Row 1: Hourly traffic + Daily trend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={chartCardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 16px' }}>Hourly Traffic (Today)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: MUTED }} />
                  <YAxis tick={{ fontSize: 11, fill: MUTED }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13 }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={chartCardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 16px' }}>Daily Requests (7d)</h3>
              {dailyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: MUTED }} />
                    <YAxis tick={{ fontSize: 11, fill: MUTED }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13 }} />
                    <Area type="monotone" dataKey="total" name="Total" fill="#6366f120" stroke="#6366f1" strokeWidth={2} />
                    <Bar dataKey="errors" name="Errors" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                  <Activity size={28} color={BORDER} />
                  <span style={{ fontSize: 13, color: MUTED }}>Collecting data — chart appears after server restart</span>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Response time scatter + Status distribution */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={chartCardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 4px' }}>Response Time Distribution</h3>
              <p style={{ fontSize: 12, color: MUTED, margin: '0 0 12px' }}>Each dot = 1 request (sampled)</p>
              {scatterData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                    <XAxis type="number" dataKey="time" name="Hour" domain={[0, 24]} tick={{ fontSize: 10, fill: MUTED }} tickFormatter={v => `${Math.floor(v)}h`} />
                    <YAxis type="number" dataKey="responseTime" name="Response Time" tick={{ fontSize: 10, fill: MUTED }} unit="ms" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload;
                        return (
                          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                            <div style={{ fontWeight: 600, color: DARK }}>{d?.method} {d?.path}</div>
                            <div style={{ color: MUTED }}>{d?.responseTime}ms | Status: {d?.status}</div>
                          </div>
                        );
                      }}
                    />
                    <Scatter data={scatterData} fill="#6366f1">
                      {scatterData.map((d, i) => (
                        <Cell key={i} fill={d.status >= 400 ? '#ef4444' : d.responseTime > 500 ? '#f59e0b' : '#6366f1'} opacity={0.6} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                  <Activity size={28} color={BORDER} />
                  <span style={{ fontSize: 13, color: MUTED }}>Restart server to enable scatter data</span>
                </div>
              )}
            </div>

            {statusPieData.length > 0 ? (
              <div style={chartCardStyle}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 16px' }}>Status Code Distribution (7d)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {statusPieData.slice(0, 10).map(d => {
                    const maxCount = statusPieData[0]?.count || 1;
                    return (
                      <div key={d.code} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{
                          fontSize: 12, fontWeight: 700, width: 36, textAlign: 'center',
                          padding: '2px 0', borderRadius: 4,
                          background: `${d.color}20`, color: d.color,
                        }}>{d.code}</span>
                        <div style={{ flex: 1, height: 22, background: SURFACE, borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 4, minWidth: 28,
                            width: `${(d.count / maxCount) * 100}%`,
                            background: d.color, opacity: 0.8,
                            display: 'flex', alignItems: 'center', paddingLeft: 6,
                          }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: WHITE }}>{d.count.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={chartCardStyle}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 16px' }}>Status Code Distribution (7d)</h3>
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
                  <Activity size={28} color={BORDER} />
                  <span style={{ fontSize: 13, color: MUTED }}>Restart server to enable status data</span>
                </div>
              </div>
            )}
          </div>

          {/* Row 3: Top endpoints + Error breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 16px' }}>Top Endpoints (7d)</h3>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {(stats.topEndpoints || []).length > 0 ? (stats.topEndpoints || []).map((ep, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', background: i % 2 === 0 ? SURFACE : WHITE, borderRadius: 6,
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      background: `${METHOD_COLORS[ep._id.method] || MUTED}20`,
                      color: METHOD_COLORS[ep._id.method] || MUTED,
                    }}>{ep._id.method}</span>
                    <span style={{ flex: 1, fontSize: 12, color: DARK, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {ep._id.path}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: DARK }}>{ep.count}</span>
                    <span style={{ fontSize: 11, color: MUTED }}>{Math.round(ep.avgTime)}ms</span>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: 30, color: MUTED, fontSize: 13 }}>No endpoint data</div>
                )}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <ShieldAlert size={18} color="#ef4444" />
                <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: 0 }}>Error Breakdown (7d)</h3>
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {errorBreakdown.length > 0 ? errorBreakdown.map((err, i) => (
                  <div key={i} style={{
                    padding: '10px 12px', background: i % 2 === 0 ? '#fef2f208' : WHITE,
                    borderRadius: 6, borderLeft: `3px solid ${STATUS_COLORS[err._id.status] || '#ef4444'}`,
                    marginBottom: 4,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                        background: `${METHOD_COLORS[err._id.method] || MUTED}20`,
                        color: METHOD_COLORS[err._id.method] || MUTED,
                      }}>{err._id.method}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                        background: `${STATUS_COLORS[err._id.status] || '#ef4444'}20`,
                        color: STATUS_COLORS[err._id.status] || '#ef4444',
                      }}>{err._id.status}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: DARK, marginLeft: 'auto' }}>{err.count}x</span>
                    </div>
                    <div style={{ fontSize: 12, color: DARK, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {err._id.path}
                    </div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Last: {formatTime(err.lastSeen)}</div>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: 30 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: '#10b98114', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                      <ShieldAlert size={20} color="#10b981" />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: DARK }}>No errors this week</div>
                    <div style={{ fontSize: 12, color: MUTED }}>All endpoints are healthy</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row 4: Avg response time + Endpoint scatter */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {dailyData.length > 0 && (
              <div style={chartCardStyle}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 16px' }}>Avg Response Time (7d)</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: MUTED }} />
                    <YAxis tick={{ fontSize: 11, fill: MUTED }} unit="ms" />
                    <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13 }} formatter={v => [`${v}ms`, 'Avg Time']} />
                    <Line type="monotone" dataKey="avgTime" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {endpointScatter.length > 0 && (
              <div style={chartCardStyle}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 4px' }}>Endpoint Load vs Speed</h3>
                <p style={{ fontSize: 12, color: MUTED, margin: '0 0 12px' }}>Each dot = 1 endpoint (7d). Higher = slower, right = more traffic</p>
                <ResponsiveContainer width="100%" height={240}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                    <XAxis type="number" dataKey="count" name="Requests" tick={{ fontSize: 10, fill: MUTED }} />
                    <YAxis type="number" dataKey="avgTime" name="Avg Time" tick={{ fontSize: 10, fill: MUTED }} unit="ms" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0]?.payload;
                        return (
                          <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                            <div style={{ fontWeight: 600, color: DARK }}>{d?.path}</div>
                            <div style={{ color: MUTED }}>{d?.count} requests | {d?.avgTime}ms avg</div>
                          </div>
                        );
                      }}
                    />
                    <Scatter data={endpointScatter}>
                      {endpointScatter.map((d, i) => (
                        <Cell key={i} fill={METHOD_COLORS[d.method] || '#6366f1'} opacity={0.7} r={Math.min(6 + d.count / 50, 14)} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Status Code vs Latency scatter */}
          {scatterData.length > 0 && (
            <div style={{ ...chartCardStyle, marginBottom: 24 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 4px' }}>Status Code vs Latency</h3>
              <p style={{ fontSize: 12, color: MUTED, margin: '0 0 12px' }}>Each dot = 1 request (sampled). Spot if errors correlate with slow responses</p>
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                  <XAxis type="number" dataKey="status" name="Status Code" domain={[190, 510]} tick={{ fontSize: 10, fill: MUTED }} />
                  <YAxis type="number" dataKey="responseTime" name="Response Time" tick={{ fontSize: 10, fill: MUTED }} unit="ms" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload;
                      return (
                        <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                          <div style={{ fontWeight: 600, color: DARK }}>{d?.method} {d?.path}</div>
                          <div style={{ color: MUTED }}>Status: {d?.status} | {d?.responseTime}ms</div>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={scatterData}>
                    {scatterData.map((d, i) => (
                      <Cell
                        key={i}
                        fill={d.status >= 500 ? '#ef4444' : d.status >= 400 ? '#f59e0b' : d.status >= 300 ? '#06b6d4' : '#10b981'}
                        opacity={0.65}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 8 }}>
                {[
                  { label: '2xx Success', color: '#10b981' },
                  { label: '3xx Redirect', color: '#06b6d4' },
                  { label: '4xx Client Error', color: '#f59e0b' },
                  { label: '5xx Server Error', color: '#ef4444' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, opacity: 0.65 }} />
                    <span style={{ fontSize: 11, color: MUTED }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Logs table */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: 0 }}>Recent API Logs</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {['', 'GET', 'POST', 'PUT', 'DELETE'].map(m => (
              <button
                key={m}
                onClick={() => { setFilterMethod(m); setPage(1); }}
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  border: `1px solid ${BORDER}`, cursor: 'pointer',
                  background: filterMethod === m ? PRIMARY : WHITE,
                  color: filterMethod === m ? WHITE : MUTED,
                }}
              >{m || 'All'}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Loader2 size={24} color={PRIMARY} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                  {['Method', 'Path', 'Status', 'Time', 'IP', 'Type', 'When'].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: MUTED }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '60px 40px', textAlign: 'center' }}>
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                        <Activity size={24} color={MUTED} />
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: DARK, marginBottom: 4 }}>No API logs yet</div>
                      <div style={{ fontSize: 13, color: MUTED }}>API activity will be recorded here</div>
                    </td>
                  </tr>
                )}
                {logs.map(log => (
                  <tr key={log._id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                        background: `${METHOD_COLORS[log.method] || MUTED}20`,
                        color: METHOD_COLORS[log.method] || MUTED,
                      }}>{log.method}</span>
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 12, color: DARK, fontFamily: 'monospace', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.path}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: log.statusCode < 400 ? '#10b981' : log.statusCode < 500 ? '#f59e0b' : '#ef4444',
                      }}>{log.statusCode}</span>
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 12, color: MUTED }}>{log.responseTime}ms</td>
                    <td style={{ padding: '8px 10px', fontSize: 11, color: MUTED, fontFamily: 'monospace' }}>{log.ip}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span style={{
                        fontSize: 11, padding: '2px 6px', borderRadius: 4,
                        background: log.isGuest ? '#f59e0b20' : log.isAdmin ? `${PRIMARY}20` : '#10b98120',
                        color: log.isGuest ? '#f59e0b' : log.isAdmin ? PRIMARY : '#10b981',
                        fontWeight: 600,
                      }}>{log.isGuest ? 'Guest' : log.isAdmin ? 'Admin' : 'User'}</span>
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 11, color: MUTED }}>
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${BORDER}`, background: WHITE, cursor: 'pointer', fontSize: 13 }}>Prev</button>
            <span style={{ padding: '6px 12px', fontSize: 13, color: MUTED }}>{page} / {pagination.pages}</span>
            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
              style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${BORDER}`, background: WHITE, cursor: 'pointer', fontSize: 13 }}>Next</button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
