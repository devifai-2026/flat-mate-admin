import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Monitor, Smartphone, Globe, Clock, Eye, Loader2 } from 'lucide-react';
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

export default function GuestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/guests/${id}`)
      .then(r => setGuest(r.data.data))
      .catch(() => toast.error('Failed to load guest'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 120 }}>
      <Loader2 size={32} color={PRIMARY} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  if (!guest) return <p style={{ textAlign: 'center', color: MUTED }}>Guest not found.</p>;

  return (
    <div>
      <button
        onClick={() => navigate('/guests')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none',
          border: 'none', cursor: 'pointer', color: PRIMARY, fontSize: 14, fontWeight: 600,
          marginBottom: 20, padding: 0,
        }}
      >
        <ArrowLeft size={16} /> Back to Guests
      </button>

      <h1 style={{ fontSize: 24, fontWeight: 700, color: DARK, margin: '0 0 24px' }}>Guest Detail</h1>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>Fingerprint</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: DARK, fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {guest.fingerprint}
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>Device</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {guest.device?.type === 'mobile' ? <Smartphone size={16} color={PRIMARY} /> : <Monitor size={16} color={PRIMARY} />}
            <span style={{ fontSize: 14, fontWeight: 600, color: DARK }}>
              {guest.device?.browser || 'Unknown'} / {guest.device?.os || 'Unknown'}
            </span>
          </div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>Location</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={16} color={PRIMARY} />
            <span style={{ fontSize: 14, fontWeight: 600, color: DARK }}>
              {guest.city || 'Unknown'}{guest.country ? `, ${guest.country}` : ''}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Visits', value: guest.totalVisits, icon: Eye },
          { label: 'Pages Viewed', value: guest.pages?.length || 0, icon: Globe },
          { label: 'First Seen', value: new Date(guest.firstSeenAt).toLocaleDateString(), icon: Clock },
          { label: 'Last Seen', value: new Date(guest.lastSeenAt).toLocaleDateString(), icon: Clock },
        ].map(s => (
          <div key={s.label} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: `${PRIMARY}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={16} color={PRIMARY} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: MUTED }}>{s.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: DARK }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Page visit timeline */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 16px' }}>Page Visit Timeline</h3>
        <div style={{ maxHeight: 500, overflowY: 'auto' }}>
          {(guest.pages || []).slice().reverse().map((p, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '12px 16px', background: i % 2 === 0 ? SURFACE : WHITE,
              borderRadius: 8, marginBottom: 4,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: PRIMARY, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: DARK }}>{p.path}</div>
                {p.title && <div style={{ fontSize: 12, color: MUTED }}>{p.title}</div>}
              </div>
              {p.duration > 0 && (
                <span style={{ fontSize: 12, color: MUTED, background: `${PRIMARY}10`, padding: '2px 8px', borderRadius: 4 }}>
                  {p.duration}s
                </span>
              )}
              <span style={{ fontSize: 12, color: MUTED, whiteSpace: 'nowrap' }}>
                {new Date(p.visitedAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Extra info */}
      {(guest.ip || guest.userAgent || guest.referrer) && (
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 16px' }}>Technical Info</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {guest.ip && <div style={{ fontSize: 13 }}><strong style={{ color: MUTED }}>IP:</strong> <span style={{ color: DARK }}>{guest.ip}</span></div>}
            {guest.referrer && <div style={{ fontSize: 13 }}><strong style={{ color: MUTED }}>Referrer:</strong> <span style={{ color: DARK }}>{guest.referrer}</span></div>}
            {guest.userAgent && <div style={{ fontSize: 13, wordBreak: 'break-all' }}><strong style={{ color: MUTED }}>User Agent:</strong> <span style={{ color: DARK }}>{guest.userAgent}</span></div>}
          </div>
        </div>
      )}
    </div>
  );
}
