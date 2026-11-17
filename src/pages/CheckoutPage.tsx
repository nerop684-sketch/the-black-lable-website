import { useEffect, useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { CheckoutFormInput } from '../types/store';
import { createOrder, initializePaystack } from '../utils/api';
import { formatCurrency, validateCheckoutForm } from '../utils/storeLogic';
import { LuxuryImage } from '../components/LuxuryImage';

export function CheckoutPage() {
  const { cart, cartTotals, user, clearCart, navigate, showToast } = useStore();

  const [form, setForm] = useState<CheckoutFormInput>({
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: user?.phone || '',
    deliveryAddress: user?.address || '',
    city: '',
    country: '',
    notes: '',
    paymentMethod: 'paystack',
  });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || user.name,
        customerEmail: prev.customerEmail || user.email,
        customerPhone: prev.customerPhone || user.phone || '',
        deliveryAddress: prev.deliveryAddress || user.address || '',
      }));
    }
  }, [user]);

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CheckoutFormInput, string>>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-[900px] px-4 sm:px-6 py-20 text-center">
        <h1 className="font-display text-4xl font-semibold text-[#0B0B0C]">Checkout</h1>
        <p className="mt-3 text-sm text-[#6B6A66]">
          Your shopping bag is currently empty. Add pieces before proceeding to checkout.
        </p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="mt-6 bg-[#0B0B0C] px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#C5A059] hover:text-[#0B0B0C]"
        >
          Explore Collection
        </button>
      </div>
    );
  }

  const updateField = <K extends keyof CheckoutFormInput>(
    key: K,
    value: CheckoutFormInput[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const check = validateCheckoutForm(form);
    if (!check.valid) {
      setFieldErrors(check.errors);
      setSubmitError('Please review the highlighted fields below.');
      return;
    }

    setSubmitting(true);
    try {
      const { order } = await createOrder(
        form,
        cart.map((item) => ({
          productId: item.productId,
          selectedSize: item.selectedSize,
          selectedColor: item.selectedColor,
          quantity: item.quantity,
        })),
      );

      // Persist order receipt briefly so confirmation screen renders immediately
      window.sessionStorage.setItem(`tbl_order_${order.orderNumber}`, JSON.stringify(order));

      if (form.paymentMethod === 'paystack') {
        const ps = await initializePaystack(order.orderNumber, order.customerEmail);
        clearCart();

        if (ps.configured && ps.authorizationUrl) {
          window.location.href = ps.authorizationUrl;
          return;
        }

        // Gateway key is not configured: honestly show Pending Payment receipt
        window.sessionStorage.setItem(`tbl_order_${order.orderNumber}`, JSON.stringify(ps.order));
        showToast('Order saved. Paystack gateway requires server key configuration.');
        navigate(`/order/${order.orderNumber}?gateway=unconfigured`);
        return;
      }

      clearCart();
      showToast(`Order ${order.orderNumber} placed.`);
      navigate(`/order/${order.orderNumber}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to place order.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="border-b border-black/[0.08] pb-6">
        <p className="text-xs uppercase tracking-[0.22em] text-[#9A7835]">Insured Dispatch</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-[#0B0B0C]">Checkout</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start"
      >
        {/* Left: Customer & Payment Form */}
        <div className="lg:col-span-7 space-y-8">
          {submitError && (
            <div
              role="alert"
              className="border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {submitError}
            </div>
          )}

          {/* Customer Information */}
          <section className="bg-white border border-black/[0.08] p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-2xl font-semibold text-[#0B0B0C]">
              1. Client &amp; Delivery Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="checkout-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
                >
                  Full Name
                </label>
                <input
                  id="checkout-name"
                  type="text"
                  required
                  value={form.customerName}
                  onChange={(e) => updateField('customerName', e.target.value)}
                  placeholder="Amara Okafor"
                  className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#0B0B0C] focus:border-[#C5A059] focus:outline-none"
                />
                {fieldErrors.customerName && (
                  <p className="mt-1 text-xs text-red-700">{fieldErrors.customerName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="checkout-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
                >
                  Email Address
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  required
                  value={form.customerEmail}
                  onChange={(e) => updateField('customerEmail', e.target.value)}
                  placeholder="amara@example.com"
                  className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#0B0B0C] focus:border-[#C5A059] focus:outline-none"
                />
                {fieldErrors.customerEmail && (
                  <p className="mt-1 text-xs text-red-700">{fieldErrors.customerEmail}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="checkout-phone"
                className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
              >
                Phone Number
              </label>
              <input
                id="checkout-phone"
                type="tel"
                required
                value={form.customerPhone}
                onChange={(e) => updateField('customerPhone', e.target.value)}
                placeholder="+234 803 555 0199"
                className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#0B0B0C] focus:border-[#C5A059] focus:outline-none"
              />
              {fieldErrors.customerPhone && (
                <p className="mt-1 text-xs text-red-700">{fieldErrors.customerPhone}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="checkout-address"
                className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
              >
                Delivery Street Address
              </label>
              <input
                id="checkout-address"
                type="text"
                required
                value={form.deliveryAddress}
                onChange={(e) => updateField('deliveryAddress', e.target.value)}
                placeholder="14 Bourdillon Road, Ikoyi"
                className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#0B0B0C] focus:border-[#C5A059] focus:outline-none"
              />
              {fieldErrors.deliveryAddress && (
                <p className="mt-1 text-xs text-red-700">{fieldErrors.deliveryAddress}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="checkout-city"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
                >
                  City
                </label>
                <input
                  id="checkout-city"
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="Lagos"
                  className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#0B0B0C] focus:border-[#C5A059] focus:outline-none"
                />
                {fieldErrors.city && <p className="mt-1 text-xs text-red-700">{fieldErrors.city}</p>}
              </div>

              <div>
                <label
                  htmlFor="checkout-country"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
                >
                  Country
                </label>
                <input
                  id="checkout-country"
                  type="text"
                  required
                  value={form.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  placeholder="Nigeria"
                  className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#0B0B0C] focus:border-[#C5A059] focus:outline-none"
                />
                {fieldErrors.country && (
                  <p className="mt-1 text-xs text-red-700">{fieldErrors.country}</p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="checkout-notes"
                className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
              >
                Courier Instructions (Optional)
              </label>
              <textarea
                id="checkout-notes"
                rows={2}
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Concierge desk, preferred delivery window, or gift note..."
                className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm text-[#0B0B0C] focus:border-[#C5A059] focus:outline-none"
              />
            </div>
          </section>

          {/* Payment Method */}
          <section className="bg-white border border-black/[0.08] p-6 sm:p-8 space-y-4">
            <h2 className="font-display text-2xl font-semibold text-[#0B0B0C]">
              2. Payment Method
            </h2>

            <div className="space-y-3">
              <label
                className={`flex items-start gap-3.5 border p-4 cursor-pointer transition-colors ${
                  form.paymentMethod === 'paystack'
                    ? 'border-[#0B0B0C] bg-[#FAF9F6]'
                    : 'border-black/15 bg-white hover:border-black/30'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="paystack"
                  checked={form.paymentMethod === 'paystack'}
                  onChange={() => updateField('paymentMethod', 'paystack')}
                  className="mt-1 h-4 w-4 accent-[#0B0B0C]"
                />
                <div>
                  <p className="text-sm font-semibold text-[#0B0B0C]">
                    Paystack Secure Checkout (Card, Bank Transfer &amp; USSD)
                  </p>
                  <p className="mt-1 text-xs text-[#54534F]">
                    Server-verified encrypted checkout via Paystack. Transactions are only marked Paid once confirmed by Paystack.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3.5 border p-4 cursor-pointer transition-colors ${
                  form.paymentMethod === 'pay_on_delivery'
                    ? 'border-[#0B0B0C] bg-[#FAF9F6]'
                    : 'border-black/15 bg-white hover:border-black/30'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="pay_on_delivery"
                  checked={form.paymentMethod === 'pay_on_delivery'}
                  onChange={() => updateField('paymentMethod', 'pay_on_delivery')}
                  className="mt-1 h-4 w-4 accent-[#0B0B0C]"
                />
                <div>
                  <p className="text-sm font-semibold text-[#0B0B0C]">
                    Pay on Delivery (Cash or Mobile POS)
                  </p>
                  <p className="mt-1 text-xs text-[#54534F]">
                    Settle payment directly with our insured white-glove courier upon inspection at your delivery address.
                  </p>
                </div>
              </label>
            </div>
          </section>
        </div>

        {/* Right: Order Summary */}
        <aside className="lg:col-span-5 lg:sticky lg:top-24 bg-white border border-black/[0.08] p-6 sm:p-8 space-y-6">
          <h2 className="font-display text-2xl font-semibold text-[#0B0B0C]">Order Summary</h2>

          <ul className="divide-y divide-black/[0.07]">
            {cart.map((item) => (
              <li
                key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`}
                className="flex items-center gap-3.5 py-3.5 first:pt-0"
              >
                <LuxuryImage
                  src={item.image}
                  alt={item.name}
                  className="h-16 w-16 shrink-0 object-cover bg-[#F2EFEA]"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#0B0B0C]">{item.name}</p>
                  <p className="text-xs text-[#6B6A66]">
                    {item.selectedSize} · {item.selectedColor} · Qty {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-[#0B0B0C]">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="space-y-2 border-t border-black/[0.08] pt-4 text-sm">
            <div className="flex justify-between text-[#54534F]">
              <span>Subtotal</span>
              <span className="tabular-nums font-medium text-[#0B0B0C]">
                {formatCurrency(cartTotals.subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-[#54534F]">
              <span>Insured Delivery</span>
              <span className="tabular-nums font-medium text-[#0B0B0C]">
                {cartTotals.shippingFee === 0
                  ? 'Complimentary'
                  : formatCurrency(cartTotals.shippingFee)}
              </span>
            </div>
            <div className="flex justify-between border-t border-black/[0.08] pt-3 text-base font-semibold text-[#0B0B0C]">
              <span>Order Total</span>
              <span className="tabular-nums">{formatCurrency(cartTotals.total)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-[#0B0B0C] py-4 text-xs font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#C5A059] hover:text-[#0B0B0C] disabled:opacity-60"
          >
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {submitting
                ? 'Processing Order...'
                : form.paymentMethod === 'paystack'
                  ? `Proceed to Paystack · ${formatCurrency(cartTotals.total)}`
                  : `Place Delivery Order · ${formatCurrency(cartTotals.total)}`}
            </span>
          </button>

          <p className="flex items-center justify-center gap-2 text-xs text-[#6B6A66]">
            <ShieldCheck className="h-4 w-4 text-[#9A7835] shrink-0" aria-hidden="true" />
            <span>Stock is reserved and verified server-side upon order creation.</span>
          </p>
        </aside>
      </form>
    </div>
  );
}
