import { useState, useMemo } from 'react';
import { useDanangListings } from '../../hooks/useDanangListings';
import type { ChototListing } from '../../services/chotot';

type SortKey = 'price' | 'pricePerSqm' | 'size' | 'district' | 'postedAt';
type SortDir = 'asc' | 'desc';
type Category = 'all' | 'house' | 'land';

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'house', label: 'Nhà ở' },
  { key: 'land', label: 'Đất' },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'price', label: 'Giá' },
  { key: 'pricePerSqm', label: 'Giá/m²' },
  { key: 'size', label: 'Diện tích' },
  { key: 'district', label: 'Quận' },
  { key: 'postedAt', label: 'Ngày đăng' },
];

function formatPrice(price: number): string {
  if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1)} tỷ`;
  return `${(price / 1_000_000).toFixed(0)} triệu`;
}

function formatPostedDate(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  const d = new Date(ts);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export function DanangListings() {
  const [category, setCategory] = useState<Category>('all');
  const [sortKey, setSortKey] = useState<SortKey>('price');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  const { data: listings, isLoading, error } = useDanangListings(category);

  // Ward-level areas shown alongside districts in the dropdown
  const WARD_AREAS: { label: string; wardNames: string[] }[] = [
    { label: 'Hòa Xuân', wardNames: ['Phường Hòa Xuân'] },
    { label: 'Hòa Cường', wardNames: ['Phường Hòa Cường Bắc', 'Phường Hòa Cường Nam'] },
  ];

  const districts = useMemo(() => {
    if (!listings) return [];
    const set = new Set(listings.map(l => l.district));
    return Array.from(set).sort();
  }, [listings]);

  const sorted = useMemo(() => {
    if (!listings) return [];
    let filtered = listings;
    if (locationFilter !== 'all') {
      const wardArea = WARD_AREAS.find(a => a.label === locationFilter);
      if (wardArea) {
        filtered = filtered.filter(l => wardArea.wardNames.includes(l.ward));
      } else {
        filtered = filtered.filter(l => l.district === locationFilter);
      }
    }
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'district') {
        cmp = a.district.localeCompare(b.district);
      } else {
        cmp = a[sortKey] - b[sortKey];
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [listings, sortKey, sortDir, locationFilter]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'district' ? 'asc' : 'asc');
    }
  }

  const arrow = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 10,
      border: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: '1px solid var(--border)',
      }}>
        <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)' }}>
          BĐS Đà Nẵng — Đang bán
        </h3>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          Nguồn: Chợ Tốt (nhatot.com) • {sorted.length} tin
        </div>
      </div>

      {/* Filters */}
      <div style={{
        padding: '10px 20px',
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Category tabs */}
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              border: `1px solid ${category === c.key ? 'var(--accent)' : 'var(--border)'}`,
              background: category === c.key ? 'rgba(79,195,247,0.12)' : 'transparent',
              color: category === c.key ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 13,
              transition: 'all 0.15s',
            }}
          >
            {c.label}
          </button>
        ))}

        <span style={{ color: 'var(--border)' }}>|</span>

        {/* District filter */}
        <select
          value={locationFilter}
          onChange={e => setLocationFilter(e.target.value)}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          <option value="all">Tất cả khu vực</option>
          <optgroup label="Quận">
            {districts.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </optgroup>
          <optgroup label="Phường">
            {WARD_AREAS.map(a => (
              <option key={a.label} value={a.label}>{a.label}</option>
            ))}
          </optgroup>
        </select>

        <span style={{ color: 'var(--border)' }}>|</span>

        {/* Sort buttons */}
        {SORT_OPTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => handleSort(s.key)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: `1px solid ${sortKey === s.key ? '#FFD700' : 'var(--border)'}`,
              background: sortKey === s.key ? 'rgba(255,215,0,0.1)' : 'transparent',
              color: sortKey === s.key ? '#FFD700' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 12,
              transition: 'all 0.15s',
            }}
          >
            {s.label}{arrow(s.key)}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Đang tải...
        </div>
      )}

      {error && (
        <div style={{ padding: 20, color: 'var(--red)', fontSize: 13 }}>
          Lỗi tải dữ liệu: {(error as Error).message}
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Không tìm thấy tin đăng
        </div>
      )}

      {/* Listings */}
      <div style={{ maxHeight: 520, overflowY: 'auto' }}>
        {sorted.map(listing => (
          <ListingRow key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}

function ListingRow({ listing }: { listing: ChototListing }) {
  return (
    <a
      href={listing.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        gap: 12,
        padding: '10px 20px',
        borderBottom: '1px solid var(--border)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Thumbnail */}
      <img
        src={listing.image}
        alt=""
        style={{
          width: 72,
          height: 54,
          objectFit: 'cover',
          borderRadius: 6,
          flexShrink: 0,
          background: 'var(--bg-secondary)',
        }}
        loading="lazy"
      />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.3,
        }}>
          {listing.title}
        </div>
        <div style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          marginTop: 2,
        }}>
          {listing.district} • {listing.ward}
          {listing.street ? ` • ${listing.street}` : ''}
        </div>
        <div style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          marginTop: 2,
          display: 'flex',
          gap: 12,
        }}>
          <span style={{ color: 'var(--text-muted)' }}>{listing.category}</span>
          {listing.floors && <span>{listing.floors} tầng</span>}
          {listing.rooms && <span>{listing.rooms} PN</span>}
          <span style={{ color: 'var(--text-muted)' }}>{formatPostedDate(listing.postedAt)}</span>
        </div>
      </div>

      {/* Price column */}
      <div style={{
        textAlign: 'right',
        flexShrink: 0,
        minWidth: 90,
      }}>
        <div style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#FFD700',
        }}>
          {formatPrice(listing.price)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          {listing.size} m²
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
          {listing.pricePerSqm} tr/m²
        </div>
      </div>
    </a>
  );
}
