import { Heart, ShoppingBag } from 'lucide-react';
import type { Product } from '../types/store';
import { CATEGORY_LABELS, formatCurrency } from '../utils/storeLogic';
import { useStore } from '../context/StoreContext';
import { LuxuryImage } from './LuxuryImage';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { navigate, addToCart, toggleWishlist, isWishlisted } = useStore();
  const wishlisted = isWishlisted(product.id);
  const outOfStock = product.stock <= 0;
  const stockLabel = outOfStock
    ? 'Sold Out'
    : product.stock <= 4
      ? `Low Stock (${product.stock})`
      : 'In Stock';

  return (
    <article className="group flex flex-col bg-white border border-black/[0.07] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-14px_rgba(11,11,12,0.16)]">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F2EFEA]">
        <a
          href={`/product/${product.slug}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/product/${product.slug}`);
          }}
          className="block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
        >
          <LuxuryImage
            src={product.images[0] || ''}
            alt={product.name}
            fallbackTitle={product.name}
            className="h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
          />
        </a>

        <button
          type="button"
          onClick={() => toggleWishlist(product.id, product.name)}
          aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center bg-white/90 text-[#0B0B0C] backdrop-blur-sm transition-colors hover:bg-[#0B0B0C] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
        >
          <Heart className={`h-4 w-4 ${wishlisted ? 'fill-[#C5A059] text-[#C5A059]' : ''}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-center gap-2 text-xs tracking-wide text-[#6B6A66]">
            <span>{CATEGORY_LABELS[product.category]}</span>
            <span aria-hidden="true">·</span>
            <span className={outOfStock ? 'text-red-700 font-medium' : ''}>{stockLabel}</span>
          </div>

          <h3 className="mt-1.5 text-base font-semibold text-[#0B0B0C] leading-snug">
            <a
              href={`/product/${product.slug}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/product/${product.slug}`);
              }}
              className="hover:text-[#9A7835] transition-colors focus-visible:outline-none focus-visible:underline"
            >
              {product.name}
            </a>
          </h3>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-black/[0.06]">
          <div className="flex items-baseline gap-2 tabular-nums">
            <span className="text-[15px] font-semibold text-[#0B0B0C]">
              {formatCurrency(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-xs text-[#8A8882] line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={outOfStock}
            onClick={() => addToCart(product, { quantity: 1, openDrawer: true })}
            aria-label={outOfStock ? `${product.name} is sold out` : `Add ${product.name} to bag`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium tracking-wider uppercase whitespace-nowrap shrink-0 bg-[#0B0B0C] text-white transition-colors hover:bg-[#C5A059] hover:text-[#0B0B0C] disabled:bg-neutral-200 disabled:text-neutral-500 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
          >
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{outOfStock ? 'Sold Out' : 'Add to Bag'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
