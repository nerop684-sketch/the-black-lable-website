import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatCurrency, FREE_SHIPPING_THRESHOLD } from '../utils/storeLogic';
import { LuxuryImage } from './LuxuryImage';

export function CartDrawer() {
  const {
    cart,
    cartTotals,
    isCartOpen,
    setCartOpen,
    updateCartQuantity,
    removeFromCart,
    navigate,
  } = useStore();

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[2px]"
      onClick={() => setCartOpen(false)}
    >
      <div
        className="flex h-full w-full max-w-md flex-col bg-[#FAF9F6] text-[#0B0B0C] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.08] px-6 py-5">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-wide">Your Bag</h2>
            <p className="text-xs text-[#6B6A66] tabular-nums">
              {cartTotals.itemCount} {cartTotals.itemCount === 1 ? 'piece' : 'pieces'} selected
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            aria-label="Close shopping bag"
            className="flex h-10 w-10 items-center justify-center text-[#0B0B0C] hover:text-[#9A7835] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Complimentary shipping notice */}
        {cart.length > 0 && (
          <div className="border-b border-black/[0.06] bg-[#F2EFEA] px-6 py-3 text-xs text-[#3C3B38]">
            {cartTotals.amountToFreeShipping > 0 ? (
              <span>
                Add{' '}
                <strong className="font-semibold tabular-nums">
                  {formatCurrency(cartTotals.amountToFreeShipping)}
                </strong>{' '}
                more for complimentary insured courier delivery (orders over{' '}
                {formatCurrency(FREE_SHIPPING_THRESHOLD)}).
              </span>
            ) : (
              <span className="font-medium text-[#0B0B0C]">
                Your order qualifies for complimentary insured courier delivery.
              </span>
            )}
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="h-10 w-10 text-[#9A7835] mb-4" aria-hidden="true" />
              <p className="font-display text-2xl text-[#0B0B0C]">Your bag is empty</p>
              <p className="mt-2 max-w-[28ch] text-sm text-[#6B6A66]">
                Explore our signature watches, sculpted dresses, leather sneakers, and accessories.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCartOpen(false);
                  navigate('/shop');
                }}
                className="mt-6 bg-[#0B0B0C] px-6 py-3 text-xs font-medium tracking-[0.14em] uppercase text-white transition-colors hover:bg-[#C5A059] hover:text-[#0B0B0C]"
              >
                Explore Collection
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-black/[0.08]">
              {cart.map((item) => (
                <li
                  key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`}
                  className="flex gap-4 py-4 first:pt-0"
                >
                  <LuxuryImage
                    src={item.image}
                    alt={item.name}
                    className="h-24 w-24 shrink-0 object-cover bg-[#F2EFEA]"
                  />
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <a
                          href={`/product/${item.slug}`}
                          onClick={(e) => {
                            e.preventDefault();
                            setCartOpen(false);
                            navigate(`/product/${item.slug}`);
                          }}
                          className="block truncate text-sm font-semibold text-[#0B0B0C] hover:text-[#9A7835]"
                        >
                          {item.name}
                        </a>
                        <p className="mt-0.5 text-xs text-[#6B6A66]">
                          {item.selectedSize} · {item.selectedColor}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          removeFromCart(item.productId, item.selectedSize, item.selectedColor)
                        }
                        aria-label={`Remove ${item.name} from bag`}
                        className="flex h-8 w-8 items-center justify-center text-[#6B6A66] hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center border border-black/15 bg-white">
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(
                              item.productId,
                              item.selectedSize,
                              item.selectedColor,
                              item.quantity - 1,
                            )
                          }
                          aria-label={`Decrease quantity of ${item.name}`}
                          className="flex h-8 w-8 items-center justify-center text-[#0B0B0C] hover:bg-black/5"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateCartQuantity(
                              item.productId,
                              item.selectedSize,
                              item.selectedColor,
                              item.quantity + 1,
                            )
                          }
                          disabled={item.quantity >= item.maxStock}
                          aria-label={`Increase quantity of ${item.name}`}
                          className="flex h-8 w-8 items-center justify-center text-[#0B0B0C] hover:bg-black/5 disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <span className="text-sm font-semibold tabular-nums text-[#0B0B0C]">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer totals */}
        {cart.length > 0 && (
          <div className="border-t border-black/[0.08] bg-white px-6 py-5 space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#54534F]">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium text-[#0B0B0C]">
                  {formatCurrency(cartTotals.subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-[#54534F]">
                <span>Insured Courier Delivery</span>
                <span className="tabular-nums font-medium text-[#0B0B0C]">
                  {cartTotals.shippingFee === 0 ? 'Complimentary' : formatCurrency(cartTotals.shippingFee)}
                </span>
              </div>
              <div className="flex justify-between border-t border-black/[0.06] pt-2.5 text-base font-semibold text-[#0B0B0C]">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(cartTotals.total)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full bg-[#0B0B0C] py-3.5 text-xs font-semibold tracking-[0.16em] uppercase text-white transition-colors hover:bg-[#C5A059] hover:text-[#0B0B0C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
