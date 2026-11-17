import { useEffect, useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { CategorySlug, Product, SortOption } from '../types/store';
import { fetchProducts } from '../utils/api';
import { CATEGORY_LABELS, filterAndSortProducts } from '../utils/storeLogic';
import { ProductCard } from '../components/ProductCard';

interface CatalogPageProps {
  initialCategory?: CategorySlug | 'all';
}

const CATEGORY_COPY: Record<
  CategorySlug | 'all',
  { title: string; subtitle: string; eyebrow: string }
> = {
  all: {
    eyebrow: 'Complete Atelier Collection',
    title: 'All Pieces',
    subtitle: 'Explore horology, sculpted eveningwear, Italian leather sneakers, and architectural accessories.',
  },
  watches: {
    eyebrow: 'Swiss & Mechanical Horology',
    title: 'Watches',
    subtitle: 'Sapphire-crystal chronographs, Grade 5 titanium automatics, and ultra-thin dress timepieces.',
  },
  dresses: {
    eyebrow: 'Evening & Tailored Silhouettes',
    title: 'Dresses',
    subtitle: '22-momme mulberry silk bias gowns and double-breasted Italian virgin wool tailoring.',
  },
  sneakers: {
    eyebrow: 'Artisanal Footwear',
    title: 'Sneakers',
    subtitle: 'Hand-lasted full-grain calfskin and water-repellent Tuscan suede on Margom soles.',
  },
  accessories: {
    eyebrow: 'Leather Goods & Eyewear',
    title: 'Accessories',
    subtitle: 'Architectural pebbled calfskin bags, watch travel rolls, and Japanese acetate frames.',
  },
};

type PriceBand = 'all' | 'under-500' | '500-1000' | 'over-1000';

export function CatalogPage({ initialCategory = 'all' }: CatalogPageProps) {
  const { currentPath, navigate } = useStore();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useMemo(() => {
    const idx = currentPath.indexOf('?');
    return new URLSearchParams(idx >= 0 ? currentPath.slice(idx) : '');
  }, [currentPath]);

  const [category, setCategory] = useState<CategorySlug | 'all'>(initialCategory);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [priceBand, setPriceBand] = useState<PriceBand>('all');
  const [sort, setSort] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'featured',
  );
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    setCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) setSearch(q);
    const s = searchParams.get('sort') as SortOption | null;
    if (s) setSort(s);
  }, [searchParams]);

  const loadCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const products = await fetchProducts();
      setAllProducts(products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const { minPrice, maxPrice } = useMemo(() => {
    switch (priceBand) {
      case 'under-500':
        return { minPrice: null, maxPrice: 499 };
      case '500-1000':
        return { minPrice: 500, maxPrice: 1000 };
      case 'over-1000':
        return { minPrice: 1001, maxPrice: null };
      default:
        return { minPrice: null, maxPrice: null };
    }
  }, [priceBand]);

  const visibleProducts = useMemo(
    () =>
      filterAndSortProducts(allProducts, {
        category,
        search,
        minPrice,
        maxPrice,
        sort,
        inStockOnly,
      }),
    [allProducts, category, search, minPrice, maxPrice, sort, inStockOnly],
  );

  const header = CATEGORY_COPY[category];

  const handleCategoryChange = (nextCat: CategorySlug | 'all') => {
    setCategory(nextCat);
    navigate(nextCat === 'all' ? '/shop' : `/category/${nextCat}`);
  };

  const resetFilters = () => {
    setSearch('');
    setPriceBand('all');
    setSort('featured');
    setInStockOnly(false);
    handleCategoryChange('all');
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      {/* Category Editorial Header */}
      <div className="border-b border-black/[0.08] pb-8">
        <p className="text-xs uppercase tracking-[0.22em] text-[#9A7835]">{header.eyebrow}</p>
        <div className="mt-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold text-[#0B0B0C]">
              {header.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#54534F]">{header.subtitle}</p>
          </div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#6B6A66] tabular-nums">
            {visibleProducts.length} {visibleProducts.length === 1 ? 'Piece' : 'Pieces'}
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter by product category"
          className="mt-8 flex flex-wrap items-center gap-2"
        >
          {(['all', 'watches', 'dresses', 'sneakers', 'accessories'] as const).map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-2 text-xs font-medium uppercase tracking-[0.14em] whitespace-nowrap shrink-0 transition-colors border ${
                  active
                    ? 'bg-[#0B0B0C] text-white border-[#0B0B0C]'
                    : 'bg-white text-[#54534F] border-black/15 hover:border-[#0B0B0C] hover:text-[#0B0B0C]'
                }`}
              >
                {cat === 'all' ? 'All Pieces' : CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Sort Toolbar */}
      <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-black/[0.07] p-4">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6A66]"
              aria-hidden="true"
            />
            <label htmlFor="catalog-search-input" className="sr-only">
              Filter products by keyword
            </label>
            <input
              id="catalog-search-input"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search within collection..."
              className="w-full border border-black/15 bg-[#FAF9F6] pl-9 pr-3 py-2 text-sm text-[#0B0B0C] placeholder:text-[#8A8882] focus:border-[#C5A059] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[#6B6A66] shrink-0" aria-hidden="true" />
            <label htmlFor="price-band-select" className="sr-only">
              Filter by price range
            </label>
            <select
              id="price-band-select"
              value={priceBand}
              onChange={(e) => setPriceBand(e.target.value as PriceBand)}
              className="border border-black/15 bg-[#FAF9F6] px-3 py-2 text-xs font-medium text-[#0B0B0C] focus:border-[#C5A059] focus:outline-none"
            >
              <option value="all">All Prices</option>
              <option value="under-500">Under $500</option>
              <option value="500-1000">$500 – $1,000</option>
              <option value="over-1000">Over $1,000</option>
            </select>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-[#3C3B38] cursor-pointer select-none px-1">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="h-4 w-4 accent-[#0B0B0C]"
            />
            <span>In Stock Only</span>
          </label>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <label htmlFor="catalog-sort-select" className="text-xs uppercase tracking-wider text-[#6B6A66]">
            Sort
          </label>
          <select
            id="catalog-sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="border border-black/15 bg-[#FAF9F6] px-3 py-2 text-xs font-medium text-[#0B0B0C] focus:border-[#C5A059] focus:outline-none"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest Arrivals</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Product Grid / States */}
      {error ? (
        <div className="mt-10 border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm text-red-800">{error}</p>
          <button
            type="button"
            onClick={loadCatalog}
            className="mt-4 bg-[#0B0B0C] px-6 py-2.5 text-xs uppercase tracking-widest text-white"
          >
            Retry Loading
          </button>
        </div>
      ) : loading ? (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-[380px] animate-pulse bg-[#EAE6DF]" />
          ))}
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="mt-10 border border-black/[0.08] bg-white p-12 text-center">
          <p className="font-display text-2xl text-[#0B0B0C]">No matching pieces found</p>
          <p className="mt-2 text-sm text-[#6B6A66]">
            Try broadening your price filter or search keyword to view more pieces.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-6 inline-flex items-center gap-2 bg-[#0B0B0C] px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#C5A059] hover:text-[#0B0B0C]"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
