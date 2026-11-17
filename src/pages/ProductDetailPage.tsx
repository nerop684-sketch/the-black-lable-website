import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Product } from '../types/store';
import { fetchProductBySlug } from '../utils/api';
import { CATEGORY_LABELS, formatCurrency } from '../utils/storeLogic';
import { LuxuryImage } from '../components/LuxuryImage';
import { ProductCard } from '../components/ProductCard';

interface ProductDetailPageProps {
  slug: string;
}

export function ProductDetailPage({ slug }: ProductDetailPageProps) {
  const { navigate, addToCart, toggleWishlist, isWishlisted } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchProductBySlug(slug);
        if (!active) return;
        setProduct(res.product);
        setRelated(res.related);
        setActiveImageIdx(0);
        setSelectedSize(res.product.sizes[0] || 'Standard');
        setSelectedColor(res.product.colors[0] || 'Black');
        setQuantity(1);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load product.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="aspect-[4/3] animate-pulse bg-[#EAE6DF]" />
          <div className="space-y-4">
            <div className="h-6 w-32 animate-pulse bg-[#EAE6DF]" />
            <div className="h-12 w-3/4 animate-pulse bg-[#EAE6DF]" />
            <div className="h-24 w-full animate-pulse bg-[#EAE6DF]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="font-display text-4xl text-[#0B0B0C]">Piece Not Found</h1>
        <p className="mt-3 text-sm text-[#6B6A66]">
          {error || 'The requested piece is no longer in our active archive.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="mt-6 inline-flex items-center gap-2 bg-[#0B0B0C] px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Collection</span>
        </button>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;
  const wishlisted = isWishlisted(product.id);
  const currentImage = product.images[activeImageIdx] || product.images[0] || '';

  const handleAddToBag = () => {
    addToCart(product, {
      size: selectedSize,
      color: selectedColor,
      quantity,
      openDrawer: true,
    });
  };

  const handleBuyNow = () => {
    const added = addToCart(product, {
      size: selectedSize,
      color: selectedColor,
      quantity,
      openDrawer: false,
    });
    if (added) {
      navigate('/checkout');
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-xs text-[#6B6A66]">
        <a
          href="/shop"
          onClick={(e) => {
            e.preventDefault();
            navigate('/shop');
          }}
          className="hover:text-[#0B0B0C]"
        >
          Shop
        </a>
        <span aria-hidden="true">/</span>
        <a
          href={`/category/${product.category}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/category/${product.category}`);
          }}
          className="hover:text-[#0B0B0C]"
        >
          {CATEGORY_LABELS[product.category]}
        </a>
        <span aria-hidden="true">/</span>
        <span className="text-[#0B0B0C] font-medium truncate">{product.name}</span>
      </nav>

      {/* Main Contiguous Product Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        {/* Gallery Left */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/3] w-full overflow-hidden bg-[#F2EFEA] border border-black/[0.07]">
            <LuxuryImage
              src={currentImage}
              alt={product.name}
              fallbackTitle={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.map((imgUrl, idx) => (
                <button
                  key={`${imgUrl}-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  aria-label={`View image ${idx + 1} of ${product.name}`}
                  className={`aspect-[4/3] overflow-hidden border transition-colors ${
                    idx === activeImageIdx ? 'border-[#C5A059] ring-1 ring-[#C5A059]' : 'border-black/10'
                  }`}
                >
                  <LuxuryImage src={imgUrl} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Purchase Module Right */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 bg-white border border-black/[0.08] p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#6B6A66]">
            <span>{CATEGORY_LABELS[product.category]}</span>
            <span aria-hidden="true">·</span>
            <span className={outOfStock ? 'text-red-700 font-semibold' : 'text-[#0B0B0C]'}>
              {outOfStock ? 'Sold Out' : `${product.stock} Available`}
            </span>
          </div>

          <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#0B0B0C] leading-tight">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-3 tabular-nums">
            <span className="text-2xl font-semibold text-[#0B0B0C]">
              {formatCurrency(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-sm text-[#8A8882] line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-[#4A4945]">{product.description}</p>

          {/* Colors */}
          {product.colors.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0B0B0C]">
                Color: <span className="font-normal text-[#54534F]">{selectedColor}</span>
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {product.colors.map((color) => {
                  const active = selectedColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`px-3.5 py-2 text-xs font-medium border transition-colors ${
                        active
                          ? 'border-[#0B0B0C] bg-[#0B0B0C] text-white'
                          : 'border-black/15 bg-white text-[#0B0B0C] hover:border-[#0B0B0C]'
                      }`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sizes */}
          {product.sizes.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#0B0B0C]">
                Size: <span className="font-normal text-[#54534F]">{selectedSize}</span>
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {product.sizes.map((size) => {
                  const active = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[48px] px-3 py-2 text-xs font-medium border transition-colors ${
                        active
                          ? 'border-[#0B0B0C] bg-[#0B0B0C] text-white'
                          : 'border-black/15 bg-white text-[#0B0B0C] hover:border-[#0B0B0C]'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & Actions */}
          <div className="mt-7 space-y-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center border border-black/20 bg-[#FAF9F6]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={outOfStock || quantity <= 1}
                  aria-label="Decrease quantity"
                  className="flex h-12 w-11 items-center justify-center text-[#0B0B0C] hover:bg-black/5 disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span
                  data-testid="pdp-quantity"
                  className="w-10 text-center text-sm font-semibold tabular-nums"
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={outOfStock || quantity >= product.stock}
                  aria-label="Increase quantity"
                  className="flex h-12 w-11 items-center justify-center text-[#0B0B0C] hover:bg-black/5 disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <button
                type="button"
                disabled={outOfStock}
                onClick={handleAddToBag}
                className="flex-1 inline-flex h-12 items-center justify-center gap-2 bg-[#0B0B0C] px-6 text-xs font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#C5A059] hover:text-[#0B0B0C] disabled:bg-neutral-200 disabled:text-neutral-500"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                <span>{outOfStock ? 'Sold Out' : 'Add to Cart'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={outOfStock}
                onClick={handleBuyNow}
                className="flex-1 h-12 border border-[#0B0B0C] bg-white text-xs font-semibold uppercase tracking-[0.16em] text-[#0B0B0C] transition-colors hover:bg-[#0B0B0C] hover:text-white disabled:opacity-40"
              >
                Buy Now
              </button>

              <button
                type="button"
                onClick={() => toggleWishlist(product.id, product.name)}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                className="flex h-12 w-12 items-center justify-center border border-black/20 bg-white text-[#0B0B0C] transition-colors hover:border-[#C5A059]"
              >
                <Heart className={`h-4 w-4 ${wishlisted ? 'fill-[#C5A059] text-[#C5A059]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Craftsmanship Details */}
          {product.details.length > 0 && (
            <div className="mt-7 border-t border-black/[0.08] pt-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0B0B0C]">
                Specifications &amp; Craft
              </h2>
              <ul className="mt-3 space-y-2 text-xs text-[#4A4945]">
                {product.details.map((detail) => (
                  <li key={detail} className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-[#9A7835] shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Service Assurances */}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-black/[0.08] pt-5 text-xs text-[#54534F]">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-[#9A7835] shrink-0" aria-hidden="true" />
              <span>Complimentary delivery over $500</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#9A7835] shrink-0" aria-hidden="true" />
              <span>Authenticated atelier piece</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="mt-20 border-t border-black/[0.08] pt-14">
          <p className="text-xs uppercase tracking-[0.2em] text-[#9A7835]">Complete the Wardrobe</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-[#0B0B0C]">
            Related Pieces
          </h2>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {related.slice(0, 3).map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
