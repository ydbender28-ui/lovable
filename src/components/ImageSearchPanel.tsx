"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface ImageResult {
  id: string;
  url: string;
  thumb: string;
  alt: string;
  credit: string;
  creditUrl: string;
}

interface Props {
  onInsert?: (url: string) => void;
  onClose: () => void;
}

export default function ImageSearchPanel({ onInsert, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [images, setImages] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchImages = useCallback(async (q: string, p: number, append = false) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/images/search?q=${encodeURIComponent(q)}&page=${p}`);
      const data = await res.json();
      setImages(prev => append ? [...prev, ...data.images] : data.images);
      setTotalPages(data.total ?? 1);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (query) {
      setPage(1);
      fetchImages(query, 1, false);
    }
  }, [query, fetchImages]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) setQuery(inputValue.trim());
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchImages(query, next, true);
  };

  const handleCopy = async (img: ImageResult) => {
    try {
      await navigator.clipboard.writeText(img.url);
      showToast("URL copied — paste it in your prompt");
    } catch {
      showToast("Copy failed — try the Insert button");
    }
  };

  const handleInsert = (img: ImageResult) => {
    if (onInsert) {
      onInsert(img.url);
      showToast("Inserting image…");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end"
      style={{ pointerEvents: "none" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        style={{ pointerEvents: "auto" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative flex flex-col w-full max-w-sm bg-white border-l border-[#ececf1] shadow-2xl overflow-hidden"
        style={{ pointerEvents: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#ececf1] shrink-0">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 20 20" className="h-4 w-4 text-[#6a1ff7] fill-current">
              <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 0 1 3.25 3h13.5A2.25 2.25 0 0 1 19 5.25v9.5A2.25 2.25 0 0 1 16.75 17H3.25A2.25 2.25 0 0 1 1 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 0 0 .75-.75v-2.69l-2.22-2.219a.75.75 0 0 0-1.06 0l-1.91 1.909-.48-.48a.75.75 0 0 0-1.06 0L6.22 14.53l-1.5-1.5-2.22 2.22v-3.44zm0-1.56 2.47-2.47a.75.75 0 0 1 1.06 0l1.5 1.5 1.91-1.91a.75.75 0 0 1 1.06 0l2.22 2.22V5.25a.75.75 0 0 0-.75-.75H3.25a.75.75 0 0 0-.75.75v4.25zm9.25-3a1.25 1.25 0 1 1 2.5 0 1.25 1.25 0 0 1-2.5 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-semibold text-[#17171c]">Image Search</span>
          </div>
          <button
            onClick={onClose}
            className="text-[#9090a0] hover:text-[#17171c] text-lg leading-none transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2 px-4 py-3 border-b border-[#ececf1] shrink-0">
          <div className="relative flex-1">
            <svg viewBox="0 0 16 16" className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9090a0] fill-current pointer-events-none">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              placeholder="Search images…"
              className="w-full rounded-lg border border-[#ececf1] bg-[#fbfbfc] pl-8 pr-3 py-2 text-sm text-[#17171c] placeholder-[#9090a0] focus:outline-none focus:border-[#6a1ff7]/50"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="rounded-lg bg-gradient-to-r from-[#6a1ff7] to-[#0a8ff0] text-white text-xs font-medium px-3 py-2 hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Search
          </button>
        </form>

        {/* Hint */}
        {!query && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 px-6 text-center">
            <svg viewBox="0 0 48 48" className="h-12 w-12 text-[#d0d0e0] fill-current">
              <path d="M8 12a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V12zm4-1a1 1 0 0 0-1 1v14.5l6.5-6.5a1 1 0 0 1 1.414 0l5.5 5.5 4.086-4.086a1 1 0 0 1 1.414 0L36 27V12a1 1 0 0 0-1-1H12zm23 18.086-5.5-5.5-4.086 4.086a1 1 0 0 1-1.414 0L18.5 22.086 11 29.586V36a1 1 0 0 0 1 1h24a1 1 0 0 0 1-1v-6.914zM29 19a2 2 0 1 1 4 0 2 2 0 0 1-4 0z"/>
            </svg>
            <p className="text-sm text-[#9090a0]">Search for photos to use in your project</p>
            <p className="text-xs text-[#b0b0c0]">Click an image to copy its URL, or use Insert to add it directly</p>
          </div>
        )}

        {/* Grid */}
        {query && (
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {loading && images.length === 0 && (
              <div className="flex items-center justify-center py-12">
                <div className="h-5 w-5 rounded-full border-2 border-[#6a1ff7] border-t-transparent animate-spin" />
              </div>
            )}
            {!loading && images.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <p className="text-sm text-[#9090a0]">No images found</p>
                <p className="text-xs text-[#b0b0c0]">Try a different search term</p>
              </div>
            )}
            <div className="columns-2 gap-2 space-y-2">
              {images.map(img => (
                <div
                  key={img.id}
                  className="relative break-inside-avoid rounded-lg overflow-hidden cursor-pointer group border border-transparent hover:border-[#6a1ff7]/40 transition-all"
                  onMouseEnter={() => setHoveredId(img.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleCopy(img)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.thumb}
                    alt={img.alt}
                    className="w-full object-cover"
                    loading="lazy"
                  />
                  {/* Hover overlay */}
                  {hoveredId === img.id && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1.5 p-1.5">
                      <button
                        onClick={e => { e.stopPropagation(); handleCopy(img); }}
                        className="w-full rounded-md bg-white text-[#17171c] text-xs font-medium py-1 hover:bg-[#f5f5ff] transition-colors"
                      >
                        Copy URL
                      </button>
                      {onInsert && (
                        <button
                          onClick={e => { e.stopPropagation(); handleInsert(img); }}
                          className="w-full rounded-md bg-gradient-to-r from-[#6a1ff7] to-[#0a8ff0] text-white text-xs font-medium py-1 hover:opacity-90 transition-opacity"
                        >
                          Insert
                        </button>
                      )}
                      {/* Credit */}
                      <a
                        href={img.creditUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        onClick={e => e.stopPropagation()}
                        className="text-white/70 text-[10px] hover:text-white truncate w-full text-center transition-colors mt-0.5"
                      >
                        📷 {img.credit}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Load more */}
            {images.length > 0 && page < totalPages && (
              <div className="pt-2 pb-1">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="w-full rounded-xl border border-[#ececf1] bg-[#f7f7fc] text-[#71717f] text-xs font-medium py-2.5 hover:bg-[#f0f0f8] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><div className="h-3.5 w-3.5 rounded-full border-2 border-[#6a1ff7] border-t-transparent animate-spin" /> Loading…</>
                  ) : (
                    "Load more"
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Keyboard hint */}
        <div className="shrink-0 px-4 py-2 border-t border-[#ececf1] bg-[#fbfbfc]">
          <p className="text-[10px] text-[#b0b0c0]">
            Click image to copy URL · Use Insert to auto-prompt · Photos via Unsplash
          </p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#17171c] text-white text-xs rounded-full px-4 py-2 shadow-xl whitespace-nowrap z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
