import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Eye, EyeOff, Loader2, MapPin, IndianRupee, Calendar,
  Home, User, Phone, Mail, Building, Bed, Bath, Car, Utensils,
  Users, Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PRIMARY = '#FF1351';
const DARK = '#1a1a2e';
const MUTED = '#7a7a7a';
const WHITE = '#fff';
const BORDER = '#E5E7EB';
const SURFACE = '#F8F9FB';

const cardStyle = {
  background: WHITE, borderRadius: 14, padding: 24,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: `1px solid ${BORDER}`,
};

function InfoItem({ label, value, icon: Icon }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ padding: '12px 16px', background: SURFACE, borderRadius: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        {Icon && <Icon size={13} color={MUTED} />}
        <span style={{ fontSize: 11, fontWeight: 500, color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: DARK }}>{value}</div>
    </div>
  );
}

function Badge({ text, color }) {
  return (
    <span style={{
      display: 'inline-block', padding: '4px 10px', borderRadius: 6,
      fontSize: 12, fontWeight: 600, background: `${color}15`, color,
      textTransform: 'capitalize',
    }}>
      {text}
    </span>
  );
}

export default function ListingDetail() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/listings/${type}/${id}`)
      .then(res => setItem(res.data.data))
      .catch(() => toast.error('Failed to load listing'))
      .finally(() => setLoading(false));
  }, [type, id]);

  const toggleHide = async () => {
    setToggling(true);
    try {
      const { data } = await api.put(`/admin/listings/${type}/${id}/toggle-hide`);
      setItem(prev => ({ ...prev, isHidden: data.data.isHidden }));
      toast.success(data.message);
    } catch {
      toast.error('Failed to toggle visibility');
    } finally {
      setToggling(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 120 }}>
      <Loader2 size={32} color={PRIMARY} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  if (!item) return (
    <div style={{ textAlign: 'center', paddingTop: 80 }}>
      <p style={{ color: MUTED, fontSize: 16, marginBottom: 16 }}>Listing not found</p>
      <button onClick={() => navigate('/listings')} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${BORDER}`, background: WHITE, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: PRIMARY }}>
        Back to Listings
      </button>
    </div>
  );

  const owner = item.postedBy || item.createdBy;
  const ownerObj = owner && typeof owner === 'object' ? owner : null;
  const images = item.images || item.photos || [];
  const typeLabel = type === 'room' ? 'Room' : type === 'pg' ? 'PG' : 'Requirement';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button
          onClick={() => navigate('/listings')}
          style={{
            width: 36, height: 36, borderRadius: 10, border: `1px solid ${BORDER}`,
            background: WHITE, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ArrowLeft size={18} color={DARK} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: DARK, margin: 0 }}>{item.title || 'Untitled Listing'}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <Badge text={typeLabel} color="#6366f1" />
            <span style={{ fontSize: 12, color: MUTED }}>ID: {item._id}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8,
            fontSize: 13, fontWeight: 600,
            background: item.isHidden ? `${PRIMARY}12` : '#10b98112',
            color: item.isHidden ? PRIMARY : '#10b981',
          }}>
            {item.isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
            {item.isHidden ? 'Hidden' : 'Visible'}
          </div>
          <button
            onClick={toggleHide}
            disabled={toggling}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px',
              fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer',
              border: 'none', color: WHITE,
              background: item.isHidden ? '#10b981' : PRIMARY,
              opacity: toggling ? 0.6 : 1,
            }}
          >
            {toggling ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : item.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
            {item.isHidden ? 'Unhide' : 'Hide'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Images */}
          {images.length > 0 && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 14px' }}>Photos ({images.length})</h3>
              <div style={{ display: 'grid', gridTemplateColumns: images.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {images.map((img, i) => (
                  <img key={i} src={img} alt={`Photo ${i + 1}`} style={{
                    width: '100%', height: 180, objectFit: 'cover', borderRadius: 10,
                    border: `1px solid ${BORDER}`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {item.description && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 10px' }}>Description</h3>
              <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{item.description}</p>
            </div>
          )}

          {/* Details grid */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 14px' }}>Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10 }}>
              <InfoItem label="Rent" value={item.rent != null ? `₹${item.rent.toLocaleString()}` : null} icon={IndianRupee} />
              <InfoItem label="Deposit" value={item.deposit != null ? `₹${item.deposit.toLocaleString()}` : null} icon={IndianRupee} />
              <InfoItem label="City" value={item.city} icon={MapPin} />
              <InfoItem label="Location" value={typeof item.location === 'string' ? item.location : item.location?.address} icon={MapPin} />
              <InfoItem label="Room Type" value={item.roomType?.toUpperCase()} icon={Home} />
              <InfoItem label="Furnishing" value={item.furnishing} icon={Home} />
              <InfoItem label="Bathrooms" value={item.bathrooms} icon={Bath} />
              <InfoItem label="Floor" value={item.floor} icon={Building} />
              <InfoItem label="Total Area" value={item.totalArea ? `${item.totalArea} sq ft` : null} icon={Building} />
              <InfoItem label="Parking" value={item.parking} icon={Car} />
              <InfoItem label="Preferred Tenant" value={item.preferredTenant} icon={Users} />
              <InfoItem label="Available From" value={item.availableFrom ? formatDate(item.availableFrom) : null} icon={Calendar} />
              {/* PG specific */}
              <InfoItem label="Sharing" value={item.sharing} icon={Bed} />
              <InfoItem label="Gender" value={item.gender} icon={Shield} />
              <InfoItem label="Meals" value={item.meals ? 'Yes' : item.meals === false ? 'No' : null} icon={Utensils} />
              <InfoItem label="Meal Type" value={item.mealType} icon={Utensils} />
              {/* Requirement specific */}
              <InfoItem label="Budget" value={item.budget ? `₹${item.budget.min?.toLocaleString()} - ₹${item.budget.max?.toLocaleString()}` : null} icon={IndianRupee} />
              <InfoItem label="Move-in Date" value={item.moveInDate ? formatDate(item.moveInDate) : null} icon={Calendar} />
              <InfoItem label="Food Preference" value={item.foodPreference} icon={Utensils} />
              <InfoItem label="Contact Phone" value={item.contactPhone} icon={Phone} />
              <InfoItem label="Phone Visibility" value={item.phoneVisibility} icon={Phone} />
              <InfoItem label="Created" value={formatDate(item.createdAt)} icon={Calendar} />
            </div>
          </div>

          {/* Amenities */}
          {item.amenities?.length > 0 && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 14px' }}>Amenities</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {item.amenities.map((a, i) => (
                  <span key={i} style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                    background: SURFACE, color: DARK, border: `1px solid ${BORDER}`,
                    textTransform: 'capitalize',
                  }}>
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lifestyle tags */}
          {item.lifestyleTags?.length > 0 && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 14px' }}>Lifestyle Tags</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {item.lifestyleTags.map((t, i) => (
                  <span key={i} style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                    background: '#6366f110', color: '#6366f1', border: '1px solid #6366f125',
                  }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column - Owner card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Owner info */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 16px' }}>Posted By</h3>
            {ownerObj ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%', background: `${PRIMARY}14`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
                  }}>
                    {ownerObj.profileImage
                      ? <img src={ownerObj.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <User size={22} color={PRIMARY} />
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: DARK }}>{ownerObj.name || '—'}</div>
                    {ownerObj.city && <div style={{ fontSize: 12, color: MUTED }}>{ownerObj.city}</div>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ownerObj.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: SURFACE, borderRadius: 8 }}>
                      <Phone size={14} color={MUTED} />
                      <span style={{ fontSize: 13, color: DARK }}>{ownerObj.phone}</span>
                    </div>
                  )}
                  {ownerObj.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: SURFACE, borderRadius: 8 }}>
                      <Mail size={14} color={MUTED} />
                      <span style={{ fontSize: 13, color: DARK }}>{ownerObj.email}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => navigate(`/users/${ownerObj._id}`)}
                  style={{
                    width: '100%', marginTop: 14, padding: '10px 0', borderRadius: 8,
                    border: `1px solid ${BORDER}`, background: WHITE, cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, color: PRIMARY, textAlign: 'center',
                  }}
                >
                  View User Profile
                </button>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: MUTED }}>Owner info not available</p>
            )}
          </div>

          {/* Requirement preferences */}
          {item.preferredRoommate && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 14px' }}>Roommate Preferences</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {item.preferredRoommate.gender && <InfoItem label="Gender" value={item.preferredRoommate.gender} />}
                {item.preferredRoommate.occupation && <InfoItem label="Occupation" value={item.preferredRoommate.occupation} />}
                {item.preferredRoommate.ageMin && <InfoItem label="Age Range" value={`${item.preferredRoommate.ageMin} - ${item.preferredRoommate.ageMax}`} />}
                {item.preferredRoommate.foodPreference && <InfoItem label="Food" value={item.preferredRoommate.foodPreference} />}
              </div>
            </div>
          )}

          {/* Lifestyle for requirements */}
          {item.lifestyle && (
            <div style={cardStyle}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 14px' }}>Lifestyle</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(item.lifestyle).filter(([, v]) => v != null).map(([k, v]) => (
                  <div key={k} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '8px 14px',
                    background: SURFACE, borderRadius: 8,
                  }}>
                    <span style={{ fontSize: 13, color: MUTED, textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: DARK, textTransform: 'capitalize' }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick meta */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: DARK, margin: '0 0 14px' }}>Meta</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 13, color: MUTED }}>Type</span>
                <Badge text={typeLabel} color="#6366f1" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 13, color: MUTED }}>Status</span>
                <Badge text={item.isHidden ? 'Hidden' : 'Visible'} color={item.isHidden ? PRIMARY : '#10b981'} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${BORDER}` }}>
                <span style={{ fontSize: 13, color: MUTED }}>Created</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{formatDate(item.createdAt)}</span>
              </div>
              {item.updatedAt && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ fontSize: 13, color: MUTED }}>Updated</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: DARK }}>{formatDate(item.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
