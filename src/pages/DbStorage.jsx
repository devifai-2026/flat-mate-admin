import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ScatterChart, Scatter,
} from 'recharts';
import { Database, HardDrive, Layers, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PRIMARY = '#FF1351';
const DARK = '#1a1a2e';
const MUTED = '#7a7a7a';
const WHITE = '#fff';
const BORDER = '#E5E7EB';
const SURFACE = '#F8F9FB';

const COLORS = ['#FF1351', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

const cardStyle = {
  background: WHITE, borderRadius: 12, padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}`,
};

const chartCardStyle = { ...cardStyle, padding: '20px 20px 12px' };

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

export default function DbStorage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/db-stats')
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load DB stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 120 }}>
      <Loader2 size={32} color={PRIMARY} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  if (!data) return (
    <div style={{ textAlign: 'center', paddingTop: 100 }}>
      <div style={{ width: 64, height: 64, borderRadius: 16, background: SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Database size={28} color={MUTED} />
      </div>
      <div style={{ fontSize: 18, fontWeight: 600, color: DARK, marginBottom: 6 }}>Failed to load database stats</div>
      <div style={{ fontSize: 13, color: MUTED }}>Check your connection and try again</div>
    </div>
  );

  const pieData = (data.collectionStats || []).slice(0, 8).map(c => ({
    name: c.name, value: c.size,
  }));

  // Document count bar chart data
  const docCountData = (data.collectionStats || [])
    .filter(c => c.count > 0)
    .slice(0, 12)
    .map(c => ({ name: c.name.length > 14 ? c.name.slice(0, 12) + '..' : c.name, fullName: c.name, count: c.count, size: c.size }));

  // Scatter: doc count vs size
  const scatterData = (data.collectionStats || [])
    .filter(c => c.count > 0 && c.size > 0)
    .map(c => ({ name: c.name, count: c.count, size: c.size, avgSize: c.avgObjSize }));

  // Index size bar data
  const indexData = (data.collectionStats || [])
    .filter(c => c.indexSize > 0)
    .slice(0, 12)
    .map(c => ({ name: c.name.length > 14 ? c.name.slice(0, 12) + '..' : c.name, fullName: c.name, indexSize: c.indexSize, indexes: c.indexes }));

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: DARK, margin: '0 0 24px' }}>Database Storage</h1>

      {/* Overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Database', value: data.dbName, icon: Database, color: '#6366f1' },
          { label: 'Data Size', value: formatBytes(data.dataSize), icon: HardDrive, color: '#10b981' },
          { label: 'Collections', value: data.collections, icon: Layers, color: '#f59e0b' },
          { label: 'Total Documents', value: data.totalDocuments?.toLocaleString(), icon: FileText, color: PRIMARY },
        ].map(s => (
          <div key={s.label} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={16} color={s.color} />
              </div>
              <span style={{ fontSize: 13, color: MUTED }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: DARK }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Row 1: Storage pie + Size bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={chartCardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: 0 }}>Storage Breakdown</h3>
            <div style={{ fontSize: 12, color: MUTED }}>
              Storage: {formatBytes(data.storageSize)} | Index: {formatBytes(data.indexSize)}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={2} strokeWidth={0}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 13 }} formatter={(val) => formatBytes(val)} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 8 }}>
            {pieData.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                <span style={{ fontSize: 11, color: MUTED }}>{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Size bars */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 16px' }}>Storage by Size</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(data.collectionStats || []).map((col, i) => {
              const maxSize = data.collectionStats[0]?.size || 1;
              const pct = Math.max((col.size / maxSize) * 100, 2);
              return (
                <div key={col.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                  <span style={{ fontSize: 12, color: DARK, width: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.name}</span>
                  <div style={{ flex: 1, height: 16, background: SURFACE, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: COLORS[i % COLORS.length], borderRadius: 4, transition: 'width 0.3s' }} />
                  </div>
                  <span style={{ fontSize: 11, color: MUTED, width: 60, textAlign: 'right' }}>{formatBytes(col.size)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Document count bar + Scatter (docs vs size) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {docCountData.length > 0 && (
          <div style={chartCardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 16px' }}>Documents per Collection</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={docCountData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                <XAxis type="number" tick={{ fontSize: 10, fill: MUTED }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: MUTED }} width={100} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 12 }}
                  formatter={(val, name, props) => [val.toLocaleString(), props.payload.fullName]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {docCountData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {scatterData.length > 0 && (
          <div style={chartCardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 4px' }}>Documents vs Storage Size</h3>
            <p style={{ fontSize: 12, color: MUTED, margin: '0 0 12px' }}>Each dot = 1 collection</p>
            <ResponsiveContainer width="100%" height={270}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                <XAxis type="number" dataKey="count" name="Documents" tick={{ fontSize: 10, fill: MUTED }} />
                <YAxis type="number" dataKey="size" name="Size" tick={{ fontSize: 10, fill: MUTED }} tickFormatter={v => formatBytes(v)} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 12 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div style={{ background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                        <div style={{ fontWeight: 600, color: DARK }}>{d?.name}</div>
                        <div style={{ color: MUTED }}>Docs: {d?.count?.toLocaleString()} | Size: {formatBytes(d?.size)}</div>
                        <div style={{ color: MUTED }}>Avg doc: {formatBytes(d?.avgSize)}</div>
                      </div>
                    );
                  }}
                />
                <Scatter data={scatterData}>
                  {scatterData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} r={8} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Row 3: Index size chart */}
      {indexData.length > 0 && (
        <div style={{ ...chartCardStyle, marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 16px' }}>Index Size by Collection</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={indexData}>
              <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: MUTED }} />
              <YAxis tick={{ fontSize: 10, fill: MUTED }} tickFormatter={v => formatBytes(v)} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: `1px solid ${BORDER}`, fontSize: 12 }}
                formatter={(val, name, props) => [formatBytes(val), `${props.payload.fullName} (${props.payload.indexes} indexes)`]}
              />
              <Bar dataKey="indexSize" name="Index Size" radius={[4, 4, 0, 0]}>
                {indexData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Collections table */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 16px' }}>All Collections</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Collection', 'Documents', 'Data Size', 'Avg Doc Size', 'Storage Size', 'Indexes', 'Index Size'].map(h => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: MUTED }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data.collectionStats || []).length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '60px 40px', textAlign: 'center' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                      <Database size={24} color={MUTED} />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: DARK, marginBottom: 4 }}>No collections found</div>
                    <div style={{ fontSize: 13, color: MUTED }}>Database appears to be empty</div>
                  </td>
                </tr>
              ) : (data.collectionStats || []).map(col => (
                <tr key={col.name} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: DARK }}>{col.name}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: DARK }}>{col.count?.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: MUTED }}>{formatBytes(col.size)}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: MUTED }}>{formatBytes(col.avgObjSize)}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: MUTED }}>{formatBytes(col.storageSize)}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: DARK }}>{col.indexes}</td>
                  <td style={{ padding: '10px 12px', fontSize: 13, color: MUTED }}>{formatBytes(col.indexSize)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
