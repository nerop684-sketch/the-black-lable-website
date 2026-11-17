import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Product } from '../types/store';
import { fetchProducts } from '../utils/api';
import { ProductCard } from '../components/ProductCard';

export function WishlistPage() {
  const { wishlistIds, navigate } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then((all) => setProducts(all))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const savedProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="border-b border-black/[0.08] pb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9A7835]">Personal Archive</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-[#0B0B0C]">Saved Wishlist</h1>
      </div>

      {loading ? (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[360px] animate-pulse bg-[#EAE6DF]" />
          ))}
        </div>
      ) : savedProducts.length === 0 ? (
        <div className="mt-10 border border-black/[0.08] bg-white p-12 text-center">
          <Heart className="mx-auto h-9 w-9 text-[#9A7835]" aria-hidden="true" />
          <h2 className="mt-4 font-display text-2xl text-[#0B0B0C]">Your wishlist is empty</h2>
          <p className="mt-2 text-sm text-[#6B6A66]">
            Select the heart icon on any watch, dress, sneaker, or accessory to curate your private list.
          </p>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="mt-6 bg-[#0B0B0C] px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#C5A059] hover:text-[#0B0B0C]"
          >
            Browse Collection
          </button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {savedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
