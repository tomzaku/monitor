import { useState, useMemo } from 'react';
import { useDamSenListings } from '../../hooks/useDamSenListings';
import type { ChototListing } from '../../services/chotot';
import { getListingSource, type ListingSource } from '../../services/chotot';

type SortKey = 'block' | 'price' | 'pricePerSqm' | 'size' | 'postedAt';
type SortDir = 'asc' | 'desc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'block', label: 'Block' },
  { key: 'price', label: 'Giá' },
  { key: 'pricePerSqm', label: 'Giá/m²' },
  { key: 'size', label: 'DT' },
  { key: 'postedAt', label: 'Ngày đăng' },
];

function formatPrice(price: number): string {
  if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(2)} tỷ`;
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

function blockSortKey(block: string | undefined): string {
  if (!block) return 'ZZZ';
  // Sort B2 before B3, then numerically within each group
  const m = block.match(/B(\d+)-(\d+)/i);
  if (!m) return block;
  return `B${m[1].padStart(2, '0')}-${m[2].padStart(4, '0')}`;
}

const SOURCES: { key: ListingSource; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'chotot', label: 'Chợ Tốt' },
  { key: 'batdongsan', label: 'BatDongSan' },
];

export function DamSenListings() {
  const [sortKey, setSortKey] = useState<SortKey>('block');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [source, setSource] = useState<ListingSource>('all');

  const { data: listings, isLoading, error } = useDamSenListings();

  const sorted = useMemo(() => {
    if (!listings) return [];
    const filtered = source === 'all' ? listings : listings.filter(l => getListingSource(l) === source);
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'block') {
        cmp = blockSortKey(a.block).localeCompare(blockSortKey(b.block));
      } else {
        cmp = (a[sortKey] as number) - (b[sortKey] as number);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [listings, source, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const arrow = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  // Summary stats
  const stats = useMemo(() => {
    if (!listings || listings.length === 0) return null;
    const prices = listings.map(l => l.pricePerSqm);
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length * 10) / 10,
    };
  }, [listings]);

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
          Đầm Sen — Nam Hòa Xuân
        </h3>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span>Chợ Tốt + BatDongSan • {sorted.length} tin</span>
          {stats && (
            <>
              <span>Giá/m²: <span style={{ color: 'var(--text-secondary)' }}>{stats.min}–{stats.max} triệu</span></span>
              <span>Trung bình: <span style={{ color: 'var(--accent)' }}>{stats.avg} triệu/m²</span></span>
            </>
          )}
        </div>
      </div>

      {/* Sort buttons */}
      <div style={{
        padding: '10px 20px',
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
      }}>
        {/* Source filter */}
        {SOURCES.map(s => (
          <button
            key={s.key}
            onClick={() => setSource(s.key)}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              border: `1px solid ${source === s.key ? 'var(--accent)' : 'var(--border)'}`,
              background: source === s.key ? 'rgba(79,195,247,0.12)' : 'transparent',
              color: source === s.key ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 13,
              transition: 'all 0.15s',
            }}
          >
            {s.label}
          </button>
        ))}

        <span style={{ color: 'var(--border)' }}>|</span>

        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sắp xếp:</span>
        {SORT_OPTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => handleSort(s.key)}
            style={{
              padding: '4px 10px',
              borderRadius: 6,
              border: `1px solid ${sortKey === s.key ? 'var(--accent)' : 'var(--border)'}`,
              background: sortKey === s.key ? 'rgba(79,195,247,0.12)' : 'transparent',
              color: sortKey === s.key ? 'var(--accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {s.label}{arrow(s.key)}
          </button>
        ))}
      </div>

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

      {!isLoading && sorted.length === 0 && !error && (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Không tìm thấy tin đăng
        </div>
      )}

      <div style={{ maxHeight: 520, overflowY: 'auto' }}>
        {sorted.map(listing => (
          <DamSenRow key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}

function DamSenRow({ listing }: { listing: ChototListing }) {
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
        alignItems: 'center',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Block badge */}
      <div style={{
        flexShrink: 0,
        width: 64,
        textAlign: 'center',
        padding: '3px 6px',
        borderRadius: 5,
        background: listing.block ? 'rgba(79,195,247,0.12)' : 'transparent',
        border: `1px solid ${listing.block ? 'var(--accent)' : 'var(--border)'}`,
        fontSize: 12,
        fontWeight: 600,
        color: listing.block ? 'var(--accent)' : 'var(--text-muted)',
      }}>
        {listing.block ?? '—'}
      </div>

      {/* Thumbnail */}
      <img
        src={listing.image}
        alt=""
        style={{
          width: 64,
          height: 48,
          objectFit: 'cover',
          borderRadius: 5,
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
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          {listing.ward}{listing.street ? ` • ${listing.street}` : ''} • {listing.size} m²
          {' • '}{formatPostedDate(listing.postedAt)}
        </div>
      </div>

      {/* Price column */}
      <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 100 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#FFD700' }}>
          {formatPrice(listing.price)}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          {listing.pricePerSqm} tr/m²
        </div>
      </div>
    </a>
  );
}
