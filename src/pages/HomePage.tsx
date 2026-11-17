import { useEffect, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { CategorySlug, Product } from '../types/store';
import { fetchProducts, subscribeNewsletter } from '../utils/api';
import { LuxuryImage } from '../components/LuxuryImage';
import { ProductCard } from '../components/ProductCard';

const FEATURED_CATEGORIES: {
  slug: CategorySlug;
  title: string;
  subtitle: string;
  image: string;
}[] = [
  {
    slug: 'watches',
    title: 'Watches',
    subtitle: 'Swiss & automatic horology',
    image: '/src/assets/images/watch_obsidian_chrono_1794839037427.jpg',
  },
  {
    slug: 'dresses',
    title: 'Dresses',
    subtitle: 'Mulberry silk & wool tailoring',
    image: '/src/assets/images/dress_tailored_blazer_1794839038757.jpg',
  },
  {
    slug: 'sneakers',
    title: 'Sneakers',
    subtitle: 'Hand-lasted Italian calfskin',
    image: '/src/assets/images/sneaker_obsidian_leather_1794839039289.jpg',
  },
  {
    slug: 'accessories',
    title: 'Accessories',
    subtitle: 'Leather goods & Japanese acetate',
    image: '/src/assets/images/accessory_calfskin_tote_1794839040149.jpg',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'The Chronographe Noir Obsidian has become my daily timepiece. The matte finish and subtle champagne-gold hands balance presence with restraint.',
    author: 'Julian Mercer',
    meta: 'Architect, London · Chronographe Noir Obsidian',
  },
  {
    quote:
      'Cutting on the true bias makes all the difference. The Nocturne Silk Gown arrived pressed in garment linen and moved effortlessly all evening.',
    author: 'Amara Okafor',
    meta: 'Gallery Director, Lagos · Nocturne Bias Silk Gown',
  },
  {
    quote:
      'From the Margom cupsole on the Corso sneakers to the pebbled grain of the Palazzo tote, the material quality rivals heritage European houses.',
    author: 'Elena Rostova',
    meta: 'Creative Consultant, Milan · Palazzo Leather Tote',
  },
];

export function HomePage() {
  const { navigate } = useStore();
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterState, setNewsletterState] = useState<{
    status: 'idle' | 'submitting' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

  const loadHomepageProducts = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [arrivals, sellers] = await Promise.all([
        fetchProducts({ newArrival: true, sort: 'newest' }),
        fetchProducts({ bestSeller: true, sort: 'popular' }),
      ]);
      setNewArrivals(arrivals.slice(0, 3));
      setBestSellers(sellers.slice(0, 3));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load collection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomepageProducts();
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      setNewsletterState({ status: 'error', message: 'Please enter your email address.' });
      return;
    }
    setNewsletterState({ status: 'submitting' });
    try {
      const res = await subscribeNewsletter(newsletterEmail);
      setNewsletterState({ status: 'success', message: res.message });
      setNewsletterEmail('');
    } catch (err) {
      setNewsletterState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Subscription failed.',
      });
    }
  };

  return (
    <div>
      {/* 1. Cinematic Hero */}
      <section className="relative min-h-[540px] lg:min-h-[680px] flex items-center bg-[#0B0B0C] overflow-hidden">
        <LuxuryImage
          src="/src/assets/images/hero_black_label_editorial_1794839035963.jpg"
          alt="THE BLACK LABEL architectural wool coat and champagne timepiece editorial"
          className="absolute inset-0 h-full w-full object-cover object-[72%_center] lg:object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/65 to-black/40 lg:bg-gradient-to-r lg:from-black/85 lg:via-black/55 lg:to-black/20"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.26em] text-[#C5A059]">
              Autumn / Winter Atelier Collection
            </p>
            <h1 className="mt-4 font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[0.04em] text-white leading-[1.06] [text-wrap:balance]">
              STYLE BEYOND ORDINARY.
            </h1>
            <p className="mt-5 max-w-lg text-base sm:text-lg leading-relaxed text-neutral-200">
              Discover a collection designed for those who appreciate the finer things.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="inline-flex items-center gap-3 bg-[#C5A059] px-8 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#0B0B0C] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span>SHOP NOW</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/category/watches')}
                className="inline-flex items-center border border-white/40 px-7 py-4 text-xs font-medium uppercase tracking-[0.18em] text-white transition-colors hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Explore Horology
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Categories */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-black/[0.08]">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#9A7835]">Curated Departments</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#0B0B0C]">
              Featured Categories
            </h2>
          </div>
          <a
            href="/shop"
            onClick={(e) => {
              e.preventDefault();
              navigate('/shop');
            }}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0B0B0C] hover:text-[#9A7835]"
          >
            <span>View Full Catalog</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_CATEGORIES.map((cat) => (
            <a
              key={cat.slug}
              href={`/category/${cat.slug}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/category/${cat.slug}`);
              }}
              className="group relative block overflow-hidden bg-[#1C1C1F] border border-black/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
            >
              <div className="aspect-[4/3] w-full overflow-hidden">
                <LuxuryImage
                  src={cat.image}
                  alt={cat.title}
                  className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                />
              </div>
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
                aria-hidden="true"
              />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#DFC48B]">
                  {cat.subtitle}
                </p>
                <div className="mt-1 flex items-center justify-between">
                  <h3 className="font-display text-2xl font-semibold tracking-wide">{cat.title}</h3>
                  <ArrowRight
                    className="h-4 w-4 text-[#C5A059] transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* 3. New Arrivals */}
      <section className="bg-white border-y border-black/[0.06] py-16 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-black/[0.08]">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[#9A7835]">Latest Releases</p>
              <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#0B0B0C]">
                New Arrivals
              </h2>
            </div>
            <a
              href="/shop?sort=newest"
              onClick={(e) => {
                e.preventDefault();
                navigate('/shop?sort=newest');
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0B0B0C] hover:text-[#9A7835]"
            >
              <span>Shop New Arrivals</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          {loadError ? (
            <div className="mt-8 border border-red-200 bg-red-50 p-6 text-sm text-red-800 flex items-center justify-between gap-4">
              <span>{loadError}</span>
              <button
                type="button"
                onClick={loadHomepageProducts}
                className="px-4 py-2 bg-[#0B0B0C] text-white text-xs uppercase tracking-wider"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-7">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-[360px] animate-pulse bg-[#F2EFEA]" />
              ))}
            </div>
          ) : (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-7">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Promotional Banner */}
      <section className="relative bg-[#0B0B0C] text-white overflow-hidden">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 lg:grid-cols-2 items-stretch">
          <div className="flex flex-col justify-center px-6 sm:px-10 lg:px-14 py-16 lg:py-24">
            <p className="text-xs uppercase tracking-[0.22em] text-[#C5A059]">
              Private Atelier Privilege
            </p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight [text-wrap:balance]">
              Crafted for Permanence. Delivered With Care.
            </h2>
            <p className="mt-4 max-w-md text-sm sm:text-base leading-relaxed text-neutral-300">
              Every timepiece, silk garment, and Italian leather piece ships in signature presentation packaging with complimentary insured courier service on orders above $500.
            </p>
            <div className="mt-8">
              <button
                type="button"
                onClick={() => navigate('/shop')}
                className="inline-flex items-center gap-3 bg-white px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#0B0B0C] transition-colors hover:bg-[#C5A059]"
              >
                <span>Explore the Edit</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="relative min-h-[320px] lg:min-h-full">
            <LuxuryImage
              src="/src/assets/images/promo_atelier_campaign_1794839035889.jpg"
              alt="THE BLACK LABEL gold mechanical watch and leather presentation case"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 5. Best Sellers */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-black/[0.08]">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#9A7835]">Client Favorites</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#0B0B0C]">
              Best Sellers
            </h2>
          </div>
          <a
            href="/shop?sort=popular"
            onClick={(e) => {
              e.preventDefault();
              navigate('/shop?sort=popular');
            }}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0B0B0C] hover:text-[#9A7835]"
          >
            <span>Explore Best Sellers</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>

        {!loading && !loadError && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-7">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 6. Customer Testimonials */}
      <section className="bg-[#F2EFEA] border-y border-black/[0.07] py-16 lg:py-20">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <p className="text-xs uppercase tracking-[0.2em] text-[#9A7835]">Client Perspectives</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#0B0B0C]">
              Worn Around the World
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-7">
            {TESTIMONIALS.map((item) => (
              <blockquote
                key={item.author}
                className="flex flex-col justify-between bg-white border border-black/[0.06] p-7"
              >
                <p className="text-sm leading-relaxed text-[#2C2B29]">“{item.quote}”</p>
                <footer className="mt-6 pt-4 border-t border-black/[0.06]">
                  <p className="text-sm font-semibold text-[#0B0B0C]">{item.author}</p>
                  <p className="mt-0.5 text-xs text-[#6B6A66]">{item.meta}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Newsletter Subscription */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-[#9A7835]">Private Client List</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#0B0B0C]">
            Receive Seasonal Releases First
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#54534F]">
            Join THE BLACK LABEL registry for private trunk-show invitations, numbered timepiece releases, and seasonal atelier lookbooks.
          </p>

          <form
            onSubmit={handleNewsletterSubmit}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address for newsletter
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 border border-black/20 bg-white px-4 py-3.5 text-sm text-[#0B0B0C] placeholder:text-[#8A8882] focus:border-[#C5A059] focus:outline-none"
            />
            <button
              type="submit"
              disabled={newsletterState.status === 'submitting'}
              className="bg-[#0B0B0C] px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#C5A059] hover:text-[#0B0B0C] disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {newsletterState.status === 'submitting' ? 'Joining...' : 'Subscribe'}
            </button>
          </form>

          {newsletterState.status === 'success' && (
            <p className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800">
              <Check className="h-4 w-4" aria-hidden="true" />
              <span>{newsletterState.message}</span>
            </p>
          )}
          {newsletterState.status === 'error' && (
            <p className="mt-4 text-xs font-medium text-red-700">{newsletterState.message}</p>
          )}
        </div>
      </section>
    </div>
  );
}
