import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader2, Phone, CheckCircle2, UserPlus, Upload, X, ImageIcon,
  Home, Building, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import LocationAutocomplete from '../components/LocationAutocomplete';

const PRIMARY = '#FF1351';
const DARK = '#1a1a2e';
const MUTED = '#7a7a7a';
const WHITE = '#fff';
const BORDER = '#E5E7EB';
const SURFACE = '#F8F9FB';
const GREEN = '#10b981';

// ── Listing types (mirrors flatmate-web: room / pg / requirement) ──
const TYPES = [
  { key: 'room', label: 'Post Room', icon: Home },
  { key: 'pg', label: 'Post PG', icon: Building },
  { key: 'requirement', label: 'Find Flatmate', icon: FileText },
];

// ── Option lists (verbatim from flatmate-web) ──
const AMENITIES = ['wifi', 'ac', 'parking', 'laundry', 'kitchen', 'gym', 'power-backup', 'water-supply', 'security', 'cctv', 'lift', 'fridge', 'geyser', 'tv', 'wardrobe', 'attached-bathroom'];
const ROOM_TYPE_OPTS = ['1rk', '1bhk', '2bhk', '3bhk', '4bhk+', 'single-room', 'shared-room'];
const FURNISH_OPTS = ['fully-furnished', 'semi-furnished', 'unfurnished'];
const PARKING_OPTS = ['none', 'bike', 'car', 'both'];
const TENANT_OPTS = ['any', 'male', 'female', 'family', 'students', 'working-professionals'];
const SHARING_OPTS = ['single', 'double', 'triple', 'any'];
const PG_GENDER_OPTS = ['male', 'female', 'unisex'];
const MEAL_TYPE_OPTS = ['veg', 'non-veg', 'both'];
const REQ_GENDER_OPTS = ['male', 'female', 'non-binary'];
const OCCUPATION_OPTS = ['student', 'working-professional', 'freelancer', 'business', 'other'];
const RELIGION_OPTS = ['no-preference', 'hindu', 'muslim', 'christian', 'sikh', 'jain', 'buddhist', 'other'];
const FOOD_OPTS = [{ id: 'veg', label: '🟢 Veg' }, { id: 'non-veg', label: '🔴 Non-Veg' }, { id: 'no-preference', label: 'Any' }];
const REQ_ROOM_TYPE_OPTS = ['single', 'shared', 'any'];
const PREF_GENDER_OPTS = ['any', 'male', 'female'];
const SLEEP_OPTS = ['early-bird', 'night-owl', 'flexible'];
const CLEAN_OPTS = ['very-clean', 'moderate', 'relaxed'];
const LIFESTYLE_TAGS = [
  { id: 'night-owl', label: 'Night Owl', emoji: '🦉' },
  { id: 'early-bird', label: 'Early Bird', emoji: '🐦' },
  { id: 'studious', label: 'Studious', emoji: '📚' },
  { id: 'fitness-freak', label: 'Fitness Freak', emoji: '🏋️' },
  { id: 'sporty', label: 'Sporty', emoji: '⚽' },
  { id: 'wanderer', label: 'Wanderer', emoji: '🚐' },
  { id: 'party-lover', label: 'Party Lover', emoji: '🎉' },
  { id: 'pet-lover', label: 'Pet Lover', emoji: '🐾' },
  { id: 'vegan', label: 'Vegan', emoji: '🌿' },
  { id: 'non-alcoholic', label: 'Non Alcoholic', emoji: '🚫' },
  { id: 'music-lover', label: 'Music Lover', emoji: '🎸' },
  { id: 'non-smoker', label: 'Non Smoker', emoji: '🚭' },
  { id: 'foodie', label: 'Foodie', emoji: '🍕' },
  { id: 'gamer', label: 'Gamer', emoji: '🎮' },
  { id: 'workaholic', label: 'Workaholic', emoji: '💻' },
  { id: 'spiritual', label: 'Spiritual', emoji: '🧘' },
];

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: DARK, marginBottom: 6 };
const inputStyle = {
  width: '100%', padding: '10px 12px', fontSize: 14, fontFamily: 'inherit',
  border: `1px solid ${BORDER}`, borderRadius: 8, outline: 'none', background: WHITE,
  boxSizing: 'border-box', color: DARK,
};
const sectionStyle = {
  background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 12,
  padding: 24, marginBottom: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};
const sectionTitleStyle = { fontSize: 15, fontWeight: 700, color: DARK, margin: '0 0 18px' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 };

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function Select({ value, onChange, options, placeholder = '— Select —' }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
      {placeholder !== null && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o} value={o}>{o.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
      ))}
    </select>
  );
}

// Chip row — single-select (value is a string) or multi-select (value is an array).
function Chips({ options, value, onToggle, multi = false }) {
  const isOn = (o) => (multi ? value.includes(o) : value === o);
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const on = isOn(o);
        return (
          <button
            type="button"
            key={o}
            onClick={() => onToggle(o)}
            style={{
              padding: '7px 14px', fontSize: 12, fontWeight: 500, borderRadius: 999, cursor: 'pointer',
              border: `1px solid ${on ? PRIMARY : BORDER}`,
              background: on ? `${PRIMARY}10` : WHITE, color: on ? PRIMARY : MUTED,
              textTransform: 'capitalize', transition: 'all 0.15s',
            }}
          >
            {o.replace(/-/g, ' ')}
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        padding: '8px 16px', fontSize: 13, fontWeight: 500, borderRadius: 8, cursor: 'pointer',
        border: `1px solid ${value ? PRIMARY : BORDER}`,
        background: value ? `${PRIMARY}10` : WHITE, color: value ? PRIMARY : MUTED, transition: 'all 0.15s',
      }}
    >
      {label}: {value ? 'Yes' : 'No'}
    </button>
  );
}

export default function AddListing() {
  const navigate = useNavigate();

  const [listingType, setListingType] = useState('room');

  // ── Target user (by phone) ──
  const [phone, setPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [nameLocked, setNameLocked] = useState(false); // existing user already has a name
  const [lookup, setLookup] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const lookupTimer = useRef(null);

  // ── Room ──
  const [room, setRoom] = useState({
    title: '', description: '', location: '', rent: '', deposit: '', availableFrom: '',
    preferredTenant: 'any', roomType: '', furnishing: '', bathrooms: '', floor: '', totalArea: '', parking: 'none',
  });
  const [roomAmenities, setRoomAmenities] = useState([]);

  // ── PG ──
  const [pg, setPg] = useState({
    title: '', description: '', location: '', city: '', rent: '', deposit: '',
    sharing: 'any', gender: 'unisex', meals: false, mealType: '',
  });
  const [pgAmenities, setPgAmenities] = useState([]);

  // ── Requirement ──
  const [req, setReq] = useState({
    title: '', description: '', budgetMin: '', budgetMax: '', location: '', moveInDate: '', notes: '',
    gender: '', age: '', occupation: '', religion: 'no-preference', foodPreference: 'no-preference',
    languages: '', roomType: 'any',
    prefGender: 'any', prefAgeMin: '', prefAgeMax: '',
    smoking: false, drinking: false, pets: false, sleepSchedule: 'flexible', cleanliness: 'moderate', guests: 'sometimes',
  });
  const [reqTags, setReqTags] = useState([]);

  // ── Photos (shared) ──
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);

  const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '');
  const maxImages = listingType === 'requirement' ? 3 : 8;

  // Debounced lookup so admin sees if the number maps to an existing account.
  useEffect(() => {
    clearTimeout(lookupTimer.current);
    setLookup(null);
    if (!/^\d{10}$/.test(cleanPhone)) { setNameLocked(false); return; }
    setLookingUp(true);
    lookupTimer.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/admin/users/lookup', { params: { phone: cleanPhone } });
        setLookup(data.data);
        // If the existing user already has a name, prefill + lock it (we never overwrite).
        const existingName = data.data?.user?.name;
        if (data.data?.exists && existingName) {
          setUserName(existingName);
          setNameLocked(true);
        } else {
          setNameLocked(false);
        }
      } catch {
        setLookup(null);
        setNameLocked(false);
      } finally {
        setLookingUp(false);
      }
    }, 400);
    return () => clearTimeout(lookupTimer.current);
  }, [cleanPhone]);

  // Reset photos when switching type (max differs).
  useEffect(() => { setImages([]); }, [listingType]);

  const handleFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList || []).slice(0, maxImages - images.length);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const form = new FormData();
        form.append('file', file);
        const { data } = await api.post('/chat/upload', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (data?.data?.url) uploaded.push(data.data.url);
      }
      setImages((prev) => [...prev, ...uploaded].slice(0, maxImages));
      if (uploaded.length) toast.success(`${uploaded.length} photo(s) uploaded`);
    } catch {
      toast.error('Photo upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [images.length, maxImages]);

  const removeImage = (url) => setImages((prev) => prev.filter((u) => u !== url));

  const toggleAmenity = (set) => (a) =>
    set((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(cleanPhone)) return toast.error('Enter a valid 10-digit phone number');
    // Name is required for a new account (or an existing one that has no name yet).
    const isNewAccount = !lookup?.exists;
    if (!nameLocked && !userName.trim()) {
      return toast.error(isNewAccount ? 'Enter the user’s name (required for new accounts)' : 'Enter the user’s name');
    }
    const namePart = nameLocked ? {} : { name: userName.trim() };

    let payload;

    if (listingType === 'room') {
      if (!room.title) return toast.error('Enter a title');
      if (!room.description) return toast.error('Enter a description');
      if (!room.location) return toast.error('Enter location');
      if (!room.rent) return toast.error('Enter rent');
      if (!room.availableFrom) return toast.error('Enter available-from date');
      if (!room.roomType) return toast.error('Select a room type');
      if (!room.furnishing) return toast.error('Select furnishing');
      payload = {
        phone: cleanPhone, ...namePart,
        title: room.title, description: room.description, location: room.location,
        rent: Number(room.rent), deposit: Number(room.deposit) || 0,
        availableFrom: new Date(room.availableFrom).toISOString(),
        preferredTenant: room.preferredTenant, roomType: room.roomType, furnishing: room.furnishing,
        bathrooms: room.bathrooms ? Number(room.bathrooms) : undefined,
        floor: room.floor || undefined, totalArea: room.totalArea || undefined, parking: room.parking,
        amenities: roomAmenities,
        images: images.length ? images : undefined,
      };
    } else if (listingType === 'pg') {
      if (!pg.title) return toast.error('Enter PG name');
      if (!pg.rent) return toast.error('Enter rent');
      if (!pg.location) return toast.error('Enter location');
      if (!pg.city) return toast.error('Enter city');
      payload = {
        phone: cleanPhone, ...namePart,
        title: pg.title, description: pg.description || undefined, location: pg.location, city: pg.city,
        rent: Number(pg.rent), deposit: Number(pg.deposit) || 0,
        sharing: pg.sharing, gender: pg.gender,
        meals: pg.meals, mealType: pg.meals ? (pg.mealType || undefined) : undefined,
        amenities: pgAmenities,
        images: images.length ? images : undefined,
      };
    } else {
      // requirement
      if (!req.title) return toast.error('Enter a title');
      if (!req.location) return toast.error('Enter location');
      if (!req.budgetMin || !req.budgetMax) return toast.error('Enter budget range');
      if (Number(req.budgetMax) < Number(req.budgetMin)) return toast.error('Budget max must be ≥ min');
      if (reqTags.length < 5) return toast.error('Select at least 5 lifestyle preferences');
      payload = {
        phone: cleanPhone, ...namePart,
        type: 'flatmate', title: req.title, description: req.description || undefined,
        budget: { min: Number(req.budgetMin), max: Number(req.budgetMax) },
        location: req.location, moveInDate: req.moveInDate || undefined, notes: req.notes || undefined,
        gender: req.gender || undefined, age: req.age ? Number(req.age) : undefined,
        occupation: req.occupation || undefined,
        religion: req.religion, foodPreference: req.foodPreference,
        languages: req.languages ? req.languages.split(',').map((l) => l.trim()).filter(Boolean) : [],
        roomType: req.roomType,
        preferredRoommate: {
          gender: req.prefGender,
          ageMin: req.prefAgeMin ? Number(req.prefAgeMin) : undefined,
          ageMax: req.prefAgeMax ? Number(req.prefAgeMax) : undefined,
        },
        lifestyle: { smoking: req.smoking, drinking: req.drinking, pets: req.pets, sleepSchedule: req.sleepSchedule, cleanliness: req.cleanliness, guests: req.guests },
        lifestyleTags: reqTags,
        images: images.length ? images : undefined,
      };
    }

    setSubmitting(true);
    try {
      const { data } = await api.post(`/admin/listings/${listingType}`, payload);
      toast.success(data.message || 'Listing created');
      const userId = data.data?.user?._id;
      navigate(userId ? `/users/${userId}` : '/listings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const ActiveIcon = TYPES.find((t) => t.key === listingType)?.icon || Home;

  return (
    <div style={{ maxWidth: 920 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 6px' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${PRIMARY}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ActiveIcon size={20} color={PRIMARY} />
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: DARK, margin: 0 }}>Add Listing</h1>
      </div>
      <p style={{ fontSize: 13, color: MUTED, margin: '0 0 24px' }}>
        Create a listing on behalf of a user. It goes live immediately and the user can log in with their
        phone number (via OTP) to see and manage it.
      </p>

      <form onSubmit={handleSubmit}>
        {/* ── Type selector ── */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Listing type</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TYPES.map((t) => {
              const Icon = t.icon;
              const active = listingType === t.key;
              return (
                <button
                  type="button"
                  key={t.key}
                  onClick={() => setListingType(t.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                    fontSize: 13, fontWeight: active ? 600 : 400,
                    color: active ? WHITE : MUTED, background: active ? PRIMARY : WHITE,
                    border: `1px solid ${active ? PRIMARY : BORDER}`, borderRadius: 8,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── User by phone + name ── */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>User</h2>
          <div style={gridStyle}>
            <Field label="Phone number *">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '0 12px', background: WHITE }}>
                <Phone size={16} color={MUTED} />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  style={{ flex: 1, border: 'none', outline: 'none', padding: '11px 0', fontSize: 14, fontFamily: 'inherit', background: 'transparent' }}
                />
              </div>
            </Field>
            <Field label={nameLocked ? 'User name (existing)' : 'User name *'}>
              <input
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                disabled={nameLocked}
                placeholder="e.g. Shreeraj Mane"
                maxLength={100}
                style={{ ...inputStyle, background: nameLocked ? SURFACE : WHITE, color: nameLocked ? MUTED : DARK, cursor: nameLocked ? 'not-allowed' : 'text' }}
              />
            </Field>
          </div>
          <div style={{ marginTop: 12, minHeight: 22 }}>
            {lookingUp && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: MUTED }}>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Checking number…
              </span>
            )}
            {!lookingUp && lookup?.exists && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: GREEN, fontWeight: 600 }}>
                <CheckCircle2 size={15} /> Existing user{lookup.user?.name ? `: ${lookup.user.name}` : ''} — listing will be attached to their account
              </span>
            )}
            {!lookingUp && lookup && !lookup.exists && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: PRIMARY, fontWeight: 600 }}>
                <UserPlus size={15} /> New account will be created for this number
              </span>
            )}
          </div>
        </div>

        {/* ════════ ROOM ════════ */}
        {listingType === 'room' && (
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>Room details</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              <Field label="Title *"><input value={room.title} onChange={(e) => setRoom({ ...room, title: e.target.value })} placeholder="Spacious room near tech park" maxLength={200} style={inputStyle} /></Field>
              <Field label="Description *"><textarea value={room.description} onChange={(e) => setRoom({ ...room, description: e.target.value })} placeholder="Describe the room, neighborhood, nearby facilities…" rows={3} maxLength={2000} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
              <Field label="Location *">
                <LocationAutocomplete value={room.location} onChange={(v) => setRoom({ ...room, location: v })} onSelect={({ label }) => setRoom({ ...room, location: label })} placeholder="Area, city, or 6-digit pincode" />
              </Field>
              <div style={gridStyle}>
                <Field label="Rent (₹/month) *"><input type="number" min={0} value={room.rent} onChange={(e) => setRoom({ ...room, rent: e.target.value })} placeholder="12000" style={inputStyle} /></Field>
                <Field label="Deposit (₹)"><input type="number" min={0} value={room.deposit} onChange={(e) => setRoom({ ...room, deposit: e.target.value })} placeholder="24000" style={inputStyle} /></Field>
                <Field label="Available from *"><input type="date" value={room.availableFrom} onChange={(e) => setRoom({ ...room, availableFrom: e.target.value })} style={inputStyle} /></Field>
              </div>
              <Field label="Room type *"><Chips options={ROOM_TYPE_OPTS} value={room.roomType} onToggle={(o) => setRoom({ ...room, roomType: o })} /></Field>
              <Field label="Furnishing *"><Chips options={FURNISH_OPTS} value={room.furnishing} onToggle={(o) => setRoom({ ...room, furnishing: o })} /></Field>
              <div style={gridStyle}>
                <Field label="Bathrooms"><input type="number" min={1} value={room.bathrooms} onChange={(e) => setRoom({ ...room, bathrooms: e.target.value })} placeholder="1" style={inputStyle} /></Field>
                <Field label="Floor"><input value={room.floor} onChange={(e) => setRoom({ ...room, floor: e.target.value })} placeholder="3rd" style={inputStyle} /></Field>
                <Field label="Area (sq ft)"><input value={room.totalArea} onChange={(e) => setRoom({ ...room, totalArea: e.target.value })} placeholder="650" style={inputStyle} /></Field>
              </div>
              <Field label="Parking"><Chips options={PARKING_OPTS} value={room.parking} onToggle={(o) => setRoom({ ...room, parking: o })} /></Field>
              <Field label="Preferred tenant"><Chips options={TENANT_OPTS} value={room.preferredTenant} onToggle={(o) => setRoom({ ...room, preferredTenant: o })} /></Field>
              <Field label="Amenities"><Chips options={AMENITIES} value={roomAmenities} onToggle={toggleAmenity(setRoomAmenities)} multi /></Field>
            </div>
          </div>
        )}

        {/* ════════ PG ════════ */}
        {listingType === 'pg' && (
          <div style={sectionStyle}>
            <h2 style={sectionTitleStyle}>PG details</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              <Field label="PG name *"><input value={pg.title} onChange={(e) => setPg({ ...pg, title: e.target.value })} placeholder="Sunshine PG for Girls" maxLength={200} style={inputStyle} /></Field>
              <Field label="Description"><textarea value={pg.description} onChange={(e) => setPg({ ...pg, description: e.target.value })} placeholder="Describe your PG, rules, facilities…" rows={3} maxLength={2000} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
              <Field label="Full address *">
                <LocationAutocomplete value={pg.location} onChange={(v) => setPg({ ...pg, location: v })} onSelect={({ label }) => setPg({ ...pg, location: label })} placeholder="Area, city, or 6-digit pincode" />
              </Field>
              <div style={gridStyle}>
                <Field label="City *"><input value={pg.city} onChange={(e) => setPg({ ...pg, city: e.target.value })} placeholder="Bangalore" style={inputStyle} /></Field>
                <Field label="Rent (₹/month) *"><input type="number" min={0} value={pg.rent} onChange={(e) => setPg({ ...pg, rent: e.target.value })} placeholder="9000" style={inputStyle} /></Field>
                <Field label="Deposit (₹)"><input type="number" min={0} value={pg.deposit} onChange={(e) => setPg({ ...pg, deposit: e.target.value })} placeholder="18000" style={inputStyle} /></Field>
              </div>
              <Field label="Sharing type"><Chips options={SHARING_OPTS} value={pg.sharing} onToggle={(o) => setPg({ ...pg, sharing: o })} /></Field>
              <Field label="Gender"><Chips options={PG_GENDER_OPTS} value={pg.gender} onToggle={(o) => setPg({ ...pg, gender: o })} /></Field>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <Toggle label="Meals included" value={pg.meals} onChange={(v) => setPg({ ...pg, meals: v })} />
                {pg.meals && (
                  <div style={{ flex: 1, minWidth: 220 }}>
                    <Field label="Meal type"><Chips options={MEAL_TYPE_OPTS} value={pg.mealType} onToggle={(o) => setPg({ ...pg, mealType: o })} /></Field>
                  </div>
                )}
              </div>
              <Field label="Amenities"><Chips options={AMENITIES} value={pgAmenities} onToggle={toggleAmenity(setPgAmenities)} multi /></Field>
            </div>
          </div>
        )}

        {/* ════════ REQUIREMENT ════════ */}
        {listingType === 'requirement' && (
          <>
            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>👤 About the user</h2>
              <div style={{ display: 'grid', gap: 16 }}>
                <Field label="Headline *"><input value={req.title} onChange={(e) => setReq({ ...req, title: e.target.value })} placeholder="26M, Software Engineer looking for flatmate in Koramangala" maxLength={200} style={inputStyle} /></Field>
                <Field label="About yourself"><textarea value={req.description} onChange={(e) => setReq({ ...req, description: e.target.value })} placeholder="Tell potential flatmates about yourself, your routine, hobbies…" rows={3} maxLength={2000} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
                <div style={gridStyle}>
                  <Field label="Gender"><Select value={req.gender} onChange={(v) => setReq({ ...req, gender: v })} options={REQ_GENDER_OPTS} placeholder="Select" /></Field>
                  <Field label="Age"><input type="number" min={18} max={120} value={req.age} onChange={(e) => setReq({ ...req, age: e.target.value })} placeholder="25" style={inputStyle} /></Field>
                  <Field label="Occupation"><Select value={req.occupation} onChange={(v) => setReq({ ...req, occupation: v })} options={OCCUPATION_OPTS} placeholder="Select" /></Field>
                  <Field label="Religion"><Select value={req.religion} onChange={(v) => setReq({ ...req, religion: v })} options={RELIGION_OPTS} placeholder={null} /></Field>
                  <Field label="Languages"><input value={req.languages} onChange={(e) => setReq({ ...req, languages: e.target.value })} placeholder="Hindi, English, Tamil" style={inputStyle} /></Field>
                </div>
                <Field label="Food preference">
                  <div style={{ display: 'flex', gap: 8 }}>
                    {FOOD_OPTS.map((f) => {
                      const on = req.foodPreference === f.id;
                      return (
                        <button type="button" key={f.id} onClick={() => setReq({ ...req, foodPreference: f.id })}
                          style={{ flex: 1, padding: '9px 0', fontSize: 12, fontWeight: 500, borderRadius: 8, cursor: 'pointer', border: `1px solid ${on ? PRIMARY : BORDER}`, background: on ? `${PRIMARY}10` : WHITE, color: on ? PRIMARY : MUTED }}>
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            </div>

            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>📍 Location & Budget</h2>
              <div style={{ display: 'grid', gap: 16 }}>
                <Field label="Preferred location *">
                  <LocationAutocomplete value={req.location} onChange={(v) => setReq({ ...req, location: v })} onSelect={({ label }) => setReq({ ...req, location: label })} placeholder="Area, city, or 6-digit pincode" />
                </Field>
                <div style={gridStyle}>
                  <Field label="Budget min (₹) *"><input type="number" min={0} value={req.budgetMin} onChange={(e) => setReq({ ...req, budgetMin: e.target.value })} placeholder="5000" style={inputStyle} /></Field>
                  <Field label="Budget max (₹) *"><input type="number" min={0} value={req.budgetMax} onChange={(e) => setReq({ ...req, budgetMax: e.target.value })} placeholder="15000" style={inputStyle} /></Field>
                  <Field label="Move-in date"><input type="date" value={req.moveInDate} onChange={(e) => setReq({ ...req, moveInDate: e.target.value })} style={inputStyle} /></Field>
                </div>
                <Field label="Room type"><Chips options={REQ_ROOM_TYPE_OPTS} value={req.roomType} onToggle={(o) => setReq({ ...req, roomType: o })} /></Field>
              </div>
            </div>

            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>🏠 Lifestyle</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
                <Toggle label="🚬 Smoking" value={req.smoking} onChange={(v) => setReq({ ...req, smoking: v })} />
                <Toggle label="🍷 Drinking" value={req.drinking} onChange={(v) => setReq({ ...req, drinking: v })} />
                <Toggle label="🐾 Pets" value={req.pets} onChange={(v) => setReq({ ...req, pets: v })} />
              </div>
              <div style={gridStyle}>
                <Field label="Sleep schedule"><Select value={req.sleepSchedule} onChange={(v) => setReq({ ...req, sleepSchedule: v })} options={SLEEP_OPTS} placeholder={null} /></Field>
                <Field label="Cleanliness"><Select value={req.cleanliness} onChange={(v) => setReq({ ...req, cleanliness: v })} options={CLEAN_OPTS} placeholder={null} /></Field>
              </div>
            </div>

            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>🎯 Preferred flatmate</h2>
              <div style={gridStyle}>
                <Field label="Gender"><Select value={req.prefGender} onChange={(v) => setReq({ ...req, prefGender: v })} options={PREF_GENDER_OPTS} placeholder={null} /></Field>
                <Field label="Age min"><input type="number" min={18} max={120} value={req.prefAgeMin} onChange={(e) => setReq({ ...req, prefAgeMin: e.target.value })} placeholder="20" style={inputStyle} /></Field>
                <Field label="Age max"><input type="number" min={18} max={120} value={req.prefAgeMax} onChange={(e) => setReq({ ...req, prefAgeMax: e.target.value })} placeholder="35" style={inputStyle} /></Field>
              </div>
            </div>

            <div style={sectionStyle}>
              <h2 style={{ ...sectionTitleStyle, display: 'flex', alignItems: 'center', gap: 10 }}>
                ✨ Lifestyle preferences
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 999, background: reqTags.length >= 5 ? `${PRIMARY}14` : SURFACE, color: reqTags.length >= 5 ? PRIMARY : MUTED }}>
                  {reqTags.length}/5
                </span>
              </h2>
              <p style={{ fontSize: 12, color: MUTED, margin: '-10px 0 16px' }}>Select at least 5 that describe the user</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
                {LIFESTYLE_TAGS.map((tag) => {
                  const on = reqTags.includes(tag.id);
                  return (
                    <button
                      type="button"
                      key={tag.id}
                      onClick={() => setReqTags((p) => p.includes(tag.id) ? p.filter((t) => t !== tag.id) : [...p, tag.id])}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        padding: '10px 4px', borderRadius: 10, cursor: 'pointer',
                        border: `1px solid ${on ? PRIMARY : BORDER}`, background: on ? `${PRIMARY}08` : WHITE,
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{tag.emoji}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, textAlign: 'center', lineHeight: 1.2, color: on ? PRIMARY : MUTED }}>{tag.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={sectionStyle}>
              <h2 style={sectionTitleStyle}>Additional notes</h2>
              <textarea value={req.notes} onChange={(e) => setReq({ ...req, notes: e.target.value })} placeholder="Any other preferences or info…" rows={2} maxLength={1000} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </>
        )}

        {/* ── Photos ── */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>
            Photos <span style={{ fontWeight: 400, color: MUTED, fontSize: 12 }}>(optional, up to {maxImages} — a fallback image is used if none added)</span>
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            {images.map((url) => (
              <div key={url} style={{ position: 'relative', width: 96, height: 96, borderRadius: 10, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.6)', color: WHITE, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  aria-label="Remove"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            {images.length < maxImages && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{
                  width: 96, height: 96, borderRadius: 10, border: `1.5px dashed ${BORDER}`,
                  background: SURFACE, color: MUTED, cursor: uploading ? 'wait' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                {uploading ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={20} />}
                <span style={{ fontSize: 11 }}>{uploading ? 'Uploading' : 'Upload'}</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
          </div>
          {images.length === 0 && !uploading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12, color: MUTED }}>
              <ImageIcon size={13} /> No photos — a default placeholder will be shown until the user uploads their own.
            </div>
          )}
        </div>

        {/* ── Submit ── */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            disabled={submitting}
            style={{ padding: '11px 22px', fontSize: 14, fontWeight: 500, borderRadius: 8, border: `1px solid ${BORDER}`, background: WHITE, color: DARK, cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || uploading}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '11px 26px', fontSize: 14, fontWeight: 600,
              borderRadius: 8, border: 'none', background: PRIMARY, color: WHITE,
              cursor: submitting || uploading ? 'not-allowed' : 'pointer', opacity: submitting || uploading ? 0.6 : 1,
            }}
          >
            {submitting && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            {submitting ? 'Creating…' : 'Create Listing'}
          </button>
        </div>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
