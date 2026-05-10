import { useState, useEffect, useCallback } from 'react';
import { Gift, Pencil, Plus, Loader2, Users, Sparkles, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PRIMARY = '#FF1351';
const DARK = '#1a1a2e';
const MUTED = '#7a7a7a';
const WHITE = '#fff';
const BORDER = '#E5E7EB';
const SURFACE = '#F8F9FB';

const ROW_DEFS = [
  {
    key: 'signupBonus',
    label: 'Signup Bonus',
    description: 'Auto-credited to every new user on first OTP verification.',
    icon: Sparkles,
  },
  {
    key: 'existingUserBonus',
    label: 'Bonus to All Existing Users',
    description: 'Credit this many tokens to every existing non-admin user.',
    icon: Users,
  },
];

export default function BonusGifting() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { key, value }
  const [saving, setSaving] = useState(false);
  const [crediting, setCrediting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/bonus-config');
      setConfig(data.data);
    } catch {
      toast.error('Failed to load bonus config');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (key) => {
    setEditing({ key, value: String(config?.[key] ?? 0) });
  };

  const saveEdit = async () => {
    const num = Number(editing.value);
    if (!Number.isFinite(num) || num < 0) {
      return toast.error('Enter a valid non-negative number');
    }
    setSaving(true);
    try {
      const { data } = await api.put('/admin/bonus-config', { [editing.key]: num });
      setConfig(data.data);
      toast.success('Updated');
      setEditing(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const creditExisting = async () => {
    if (!config?.existingUserBonus || config.existingUserBonus <= 0) {
      return toast.error('Set "Bonus to all existing users" first');
    }
    if (!window.confirm(`Credit ${config.existingUserBonus} tokens to every existing non-admin user? This cannot be undone.`)) return;
    setCrediting(true);
    try {
      const { data } = await api.post('/admin/bonus-config/credit-existing');
      setConfig(data.data.config);
      toast.success(`Credited ${data.data.amount} tokens to ${data.data.creditedCount} users`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Credit failed');
    } finally {
      setCrediting(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : '—';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: DARK, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Gift size={22} color={PRIMARY} /> Bonus Gifting
          </h1>
          <p style={{ fontSize: 13, color: MUTED, margin: '4px 0 0' }}>
            Configure signup bonuses and bulk-credit existing users.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
          <Loader2 size={28} color={PRIMARY} className="animate-spin" />
        </div>
      ) : (
        <>
          <div style={{
            background: WHITE, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            border: `1px solid ${BORDER}`, overflow: 'hidden', marginBottom: 24,
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
                  {['Field', 'Description', 'Tokens', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600,
                      color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROW_DEFS.map(({ key, label, description, icon: Icon }) => {
                  const value = config?.[key] ?? 0;
                  const isExisting = key === 'existingUserBonus';
                  return (
                    <tr key={key} style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: DARK }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8, background: 'rgba(255,19,81,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Icon size={16} color={PRIMARY} />
                          </div>
                          {label}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: 13, color: MUTED, maxWidth: 360 }}>
                        {description}
                      </td>
                      <td style={{ padding: '16px', fontSize: 16, fontWeight: 700, color: value > 0 ? PRIMARY : MUTED }}>
                        {value > 0 ? `${value} tokens` : '—'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => openEdit(key)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '8px 14px', fontSize: 13, fontWeight: 600,
                              background: WHITE, color: DARK, border: `1px solid ${BORDER}`,
                              borderRadius: 6, cursor: 'pointer',
                            }}
                          >
                            {value > 0 ? <Pencil size={13} /> : <Plus size={13} />}
                            {value > 0 ? 'Edit' : 'Add'}
                          </button>
                          {isExisting && value > 0 && (
                            <button
                              onClick={creditExisting}
                              disabled={crediting}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '8px 14px', fontSize: 13, fontWeight: 600,
                                background: PRIMARY, color: WHITE, border: 'none',
                                borderRadius: 6, cursor: crediting ? 'wait' : 'pointer',
                                opacity: crediting ? 0.7 : 1,
                              }}
                            >
                              {crediting ? <Loader2 size={13} className="animate-spin" /> : <Gift size={13} />}
                              Credit Now
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {config?.lastBulkCreditedAt && (
            <div style={{
              background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: 20, fontSize: 13, color: MUTED,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
                Last Bulk Credit
              </div>
              <div style={{ color: DARK, fontWeight: 500 }}>
                Credited <strong style={{ color: PRIMARY }}>{config.lastBulkCreditedAmount} tokens</strong> to{' '}
                <strong>{config.lastBulkCreditedCount}</strong> users on {formatDate(config.lastBulkCreditedAt)}.
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit modal */}
      {editing && (
        <div
          onClick={() => !saving && setEditing(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: WHITE, borderRadius: 12, padding: 24, width: '90%', maxWidth: 420,
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: DARK, margin: 0 }}>
                {ROW_DEFS.find(r => r.key === editing.key)?.label}
              </h2>
              <button
                onClick={() => !saving && setEditing(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}
              >
                <X size={20} />
              </button>
            </div>
            <label style={{ fontSize: 12, fontWeight: 600, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Tokens
            </label>
            <input
              type="number"
              min={0}
              value={editing.value}
              onChange={(e) => setEditing({ ...editing, value: e.target.value })}
              autoFocus
              style={{
                width: '100%', padding: '12px 14px', fontSize: 16, marginTop: 6,
                border: `1px solid ${BORDER}`, borderRadius: 8, outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <p style={{ fontSize: 12, color: MUTED, marginTop: 8 }}>
              Set to 0 to disable.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEditing(null)}
                disabled={saving}
                style={{
                  padding: '10px 18px', fontSize: 14, fontWeight: 600,
                  background: WHITE, color: DARK, border: `1px solid ${BORDER}`,
                  borderRadius: 8, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                style={{
                  padding: '10px 18px', fontSize: 14, fontWeight: 600,
                  background: PRIMARY, color: WHITE, border: 'none',
                  borderRadius: 8, cursor: saving ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
