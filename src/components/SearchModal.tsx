'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface ProjectResult {
  id: string;
  name: string;
  publishSlug: string | null;
  updatedAt: string;
  thumbnail: string | null;
  _count: { versions: number };
}

interface Props {
  onClose: () => void;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function SearchModal({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProjectResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/projects/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
      setSelectedIndex(0);
      setLoading(false);
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[selectedIndex]) {
      router.push(`/projects/${results[selectedIndex].id}`);
      onClose();
    }
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ width: '100%', maxWidth: 560, background: '#fff', borderRadius: 16, border: '1px solid #ececf1', boxShadow: '0 24px 80px rgba(0,0,0,0.18)', overflow: 'hidden', margin: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #ececf1', gap: 10 }}>
          <span style={{ fontSize: 18, color: '#71717f' }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search your projects..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 16, color: '#17171c' }}
          />
          {loading && <span style={{ fontSize: 12, color: '#71717f' }}>...</span>}
          <kbd style={{ fontSize: 11, padding: '2px 6px', border: '1px solid #ececf1', borderRadius: 4, color: '#71717f', fontFamily: 'inherit' }}>Esc</kbd>
        </div>
        {results.length > 0 && (
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {results.map((p, i) => (
              <div
                key={p.id}
                onClick={() => { router.push(`/projects/${p.id}`); onClose(); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  cursor: 'pointer',
                  background: i === selectedIndex ? 'rgba(106,31,247,0.06)' : 'transparent',
                  borderLeft: `3px solid ${i === selectedIndex ? '#6a1ff7' : 'transparent'}`,
                  transition: 'all 0.1s',
                }}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <div style={{ width: 40, height: 30, borderRadius: 6, overflow: 'hidden', background: '#f6f6f8', flexShrink: 0 }}>
                  {p.thumbnail
                    ? <img src={p.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', background: `hsl(${p.id.charCodeAt(0) * 20 % 360}, 60%, 50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700 }}>{p.name[0]}</div>
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: '#17171c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#71717f' }}>{p._count.versions} builds · {timeAgo(p.updatedAt)}</div>
                </div>
                {p.publishSlug && <span style={{ fontSize: 11, background: '#10b98120', color: '#10b981', borderRadius: 4, padding: '2px 6px' }}>Live</span>}
              </div>
            ))}
          </div>
        )}
        {query.length >= 2 && results.length === 0 && !loading && (
          <div style={{ padding: '24px', textAlign: 'center', color: '#71717f', fontSize: 14 }}>No projects found for &ldquo;{query}&rdquo;</div>
        )}
        <div style={{ padding: '8px 16px', borderTop: '1px solid #ececf1', display: 'flex', gap: 16, fontSize: 11, color: '#a0a0ab' }}>
          <span>↑↓ navigate</span><span>↵ open</span><span>esc close</span>
        </div>
      </div>
    </div>
  );
}
