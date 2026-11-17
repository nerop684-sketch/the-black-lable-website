import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Product } from '../types/store';
import { fetchProducts } from '../utils/api';
import { CATEGORY_LABELS, formatCurrency } from '../utils/storeLogic';
import { LuxuryImage } from './LuxuryImage';

export function SearchOverlay() {
  const { isSearchOpen, setSearchOpen, navigate } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSearchOpen, setSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const trimmed = query.trim();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const products = await fetchProducts({
          search: trimmed,
          sort: trimmed ? 'popular' : 'featured',
        });
        setResults(products.slice(0, 6));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => window.clearTimeout(timer);
  }, [query, isSearchOpen]);

  if (!isSearchOpen) return null;

  const handleSelectProduct = (slug: string) => {
    setSearchOpen(false);
    navigate(`/product/${slug}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    navigate(query.trim() ? `/shop?search=${encodeURIComponent(query.trim())}` : '/shop');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search THE BLACK LABEL catalog"
      className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="w-full bg-[#FAF9F6] border-b border-black/10 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto max-w-[1100px] px-4 sm:px-6 py-6">
          <form onSubmit={handleSubmit} className="flex items-center gap-3 border-b border-black/20 pb-3">
            <Search className="h-5 w-5 text-[#6B6A66] shrink-0" aria-hidden="true" />
            <label htmlFor="global-catalog-search" className="sr-only">
              Search watches, dresses, sneakers, and accessories
            </label>
            <input
              ref={inputRef}
              id="global-catalog-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search watches, silk dresses, sneakers, leather goods..."
              className="w-full bg-transparent text-base sm:text-lg text-[#0B0B0C] placeholder:text-[#8A8882] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Close search"
              className="flex h-10 w-10 items-center justify-center text-[#0B0B0C] hover:text-[#9A7835]"
            >
              <X className="h-5 w-5" />
            </button>
          </form>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-[#6B6A66]">
              <span>{query.trim() ? 'Matching Pieces' : 'Curated Highlights'}</span>
              {query.trim() && (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="inline-flex items-center gap-1 font-medium text-[#0B0B0C] hover:text-[#9A7835]"
                >
                  <span>View all in Shop</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 animate-pulse bg-black/[0.05]" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <p className="py-8 text-sm text-[#6B6A66]">
                No pieces matched "{query}". Try searching for silk, titanium, calfskin, or sunglasses.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
                {results.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelectProduct(product.slug)}
                    className="flex items-center gap-4 border border-black/[0.08] bg-white p-3 text-left transition-colors hover:border-[#C5A059] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
                  >
                    <LuxuryImage
                      src={product.images[0] || ''}
                      alt={product.name}
                      className="h-16 w-20 shrink-0 object-cover bg-[#F2EFEA]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] uppercase tracking-wider text-[#6B6A66]">
                        {CATEGORY_LABELS[product.category]}
                      </p>
                      <p className="truncate text-sm font-semibold text-[#0B0B0C]">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-sm font-medium tabular-nums text-[#0B0B0C]">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
