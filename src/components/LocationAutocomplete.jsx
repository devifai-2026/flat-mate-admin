import { useState, useRef, useEffect } from 'react';
import { MapPin, Search, X } from 'lucide-react';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const PRIMARY = '#FF1351';
const DARK = '#1a1a2e';
const MUTED = '#7a7a7a';
const WHITE = '#fff';
const BORDER = '#E5E7EB';
const SURFACE = '#F8F9FB';

// Mapbox-backed location/pincode search input.
// - Free text (e.g. "Hinjewadi Phase 1") returns Mapbox suggestions
// - 6-digit numeric input is treated as a pincode and emitted as a raw query
// - onChange(text) fires on every keystroke (debounced parent should fetch)
// - onSelect({ label, pincode }) fires when a suggestion is clicked
export default function LocationAutocomplete({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Search by area, city, or 6-digit pincode',
  types = 'address,locality,neighborhood,place,postcode',
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const onClickOut = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOut);
    return () => document.removeEventListener('mousedown', onClickOut);
  }, []);

  const runSearch = (text) => {
    setQuery(text);
    onChange?.(text);

    clearTimeout(debounceRef.current);
    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (!MAPBOX_TOKEN) {
      // No token configured — skip suggestions, parent still gets free-text via onChange.
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(text)}.json?` +
          `access_token=${MAPBOX_TOKEN}&types=${types}&country=in&limit=6`
        );
        const data = await res.json();
        setSuggestions(data.features || []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  };

  const pickSuggestion = (feature) => {
    const isPostcode = feature.place_type?.includes('postcode');
    const ctxPin = feature.context?.find(c => c.id?.startsWith('postcode'))?.text;
    const pincode = isPostcode ? feature.text : ctxPin || null;

    // When the user picks a pincode suggestion, surface the pincode alone —
    // the parent decides how to filter (e.g. send as ?pincode=).
    const label = isPostcode ? feature.text : feature.place_name;

    setQuery(label);
    setOpen(false);
    setSuggestions([]);
    onChange?.(label);
    onSelect?.({ label, pincode, feature, isPostcode });
  };

  const clear = () => {
    setQuery('');
    setSuggestions([]);
    setOpen(false);
    onChange?.('');
    onSelect?.({ label: '', pincode: null });
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1, maxWidth: 480 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8,
        padding: '0 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <Search size={16} color={MUTED} />
        <input
          type="text"
          value={query}
          onChange={(e) => runSearch(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          style={{
            flex: 1, border: 'none', outline: 'none', padding: '12px 0',
            fontSize: 14, fontFamily: 'inherit', background: 'transparent',
          }}
        />
        {query && (
          <button
            onClick={clear}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: MUTED, padding: 4, display: 'flex', alignItems: 'center',
            }}
            aria-label="Clear"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: WHITE, border: `1px solid ${BORDER}`, borderRadius: 8,
          boxShadow: '0 8px 20px rgba(0,0,0,0.08)', overflow: 'hidden',
          listStyle: 'none', padding: 0, margin: 0, zIndex: 50, maxHeight: 320, overflowY: 'auto',
        }}>
          {suggestions.map(s => {
            const isPincode = s.place_type?.includes('postcode');
            const ctxPin = s.context?.find(c => c.id?.startsWith('postcode'))?.text;
            return (
              <li
                key={s.id}
                onClick={() => pickSuggestion(s)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 14px', cursor: 'pointer',
                  borderBottom: `1px solid ${SURFACE}`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = SURFACE}
                onMouseLeave={(e) => e.currentTarget.style.background = WHITE}
              >
                <MapPin size={14} color={MUTED} style={{ marginTop: 3, flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: DARK,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.text}
                    </span>
                    {(isPincode || ctxPin) && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 6px',
                        borderRadius: 4, background: `${PRIMARY}14`, color: PRIMARY,
                      }}>
                        {isPincode ? s.text : ctxPin}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 11, color: MUTED, marginTop: 2,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {s.place_name}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
