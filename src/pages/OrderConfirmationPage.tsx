import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Package } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Order } from '../types/store';
import { verifyPaystackPayment } from '../utils/api';
import { formatCurrency, ORDER_STATUS_LABELS } from '../utils/storeLogic';
import { LuxuryImage } from '../components/LuxuryImage';

interface OrderConfirmationPageProps {
  orderNumber?: string;
  verifyReference?: string | null;
}

export function OrderConfirmationPage({
  orderNumber,
  verifyReference,
}: OrderConfirmationPageProps) {
  const { currentPath, navigate } = useStore();
  const [order, setOrder] = useState<Order | null>(() => {
    if (!orderNumber) return null;
    try {
      const cached = window.sessionStorage.getItem(`tbl_order_${orderNumber}`);
      return cached ? (JSON.parse(cached) as Order) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(Boolean(verifyReference));
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isGatewayUnconfigured = currentPath.includes('gateway=unconfigured');

  useEffect(() => {
    if (!verifyReference) return;
    let active = true;
    setLoading(true);
    verifyPaystackPayment(verifyReference)
      .then((res) => {
        if (!active) return;
        setOrder(res.order);
        setStatusMessage(res.message);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to verify Paystack transaction.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [verifyReference]);

  if (loading) {
    return (
      <div className="mx-auto max-w-[820px] px-4 py-20 text-center">
        <p className="font-display text-3xl text-[#0B0B0C]">Verifying Payment with Paystack...</p>
        <p className="mt-2 text-sm text-[#6B6A66]">
          Please wait while we confirm your transaction status with the gateway.
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-[820px] px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-700" aria-hidden="true" />
        <h1 className="mt-4 font-display text-3xl font-semibold text-[#0B0B0C]">
          Order Receipt Unavailable
        </h1>
        <p className="mt-2 text-sm text-[#6B6A66]">
          {error || 'You can look up any placed order anytime using your Order Number and Email in your Account.'}
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/account')}
            className="bg-[#0B0B0C] px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white"
          >
            Track an Order
          </button>
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="border border-black/20 px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#0B0B0C]"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid';
  const isPayOnDelivery = order.paymentMethod === 'pay_on_delivery';
  const isPendingGateway =
    order.paymentMethod === 'paystack' && !isPaid;

  return (
    <div className="mx-auto max-w-[900px] px-4 sm:px-6 py-12 lg:py-16">
      <div className="bg-white border border-black/[0.08] p-6 sm:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.08] pb-6">
          <div className="flex items-start gap-3.5">
            {isPaid ? (
              <CheckCircle2 className="h-7 w-7 text-emerald-700 shrink-0 mt-1" aria-hidden="true" />
            ) : isPayOnDelivery ? (
              <Package className="h-7 w-7 text-[#9A7835] shrink-0 mt-1" aria-hidden="true" />
            ) : (
              <Clock className="h-7 w-7 text-amber-700 shrink-0 mt-1" aria-hidden="true" />
            )}
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#6B6A66]">
                Order Reference · {order.orderNumber}
              </p>
              <h1 className="mt-1 font-display text-3xl sm:text-4xl font-semibold text-[#0B0B0C]">
                {isPaid
                  ? 'Order Confirmed & Paid'
                  : isPayOnDelivery
                    ? 'Order Recorded — Pay on Delivery'
                    : 'Order Recorded — Awaiting Payment'}
              </h1>
            </div>
          </div>
          <div className="text-left sm:text-right text-xs text-[#54534F]">
            <p className="uppercase tracking-wider">Status</p>
            <p className="mt-0.5 text-sm font-semibold text-[#0B0B0C]">
              {ORDER_STATUS_LABELS[order.orderStatus]}
            </p>
          </div>
        </div>

        {/* Honest gateway notice when Paystack key is not configured */}
        {(isPendingGateway || isGatewayUnconfigured) && (
          <div className="mt-6 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">Paystack Gateway Pending Configuration</p>
            <p className="mt-1 text-xs leading-relaxed">
              {statusMessage ||
                'Your order has been safely saved in our database with Pending Payment status. Live card/bank authorization requires PAYSTACK_SECRET_KEY to be configured in the server environment—this store never simulates or fakes completed online payments.'}
            </p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div className="border border-black/[0.06] bg-[#FAF9F6] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6B6A66]">
              Delivery Destination
            </p>
            <p className="mt-2 font-semibold text-[#0B0B0C]">{order.customerName}</p>
            <p className="mt-1 text-[#4A4945]">{order.deliveryAddress}</p>
            <p className="text-[#4A4945]">
              {order.city}, {order.country}
            </p>
            <p className="mt-2 text-xs text-[#6B6A66]">
              {order.customerEmail} · {order.customerPhone}
            </p>
          </div>

          <div className="border border-black/[0.06] bg-[#FAF9F6] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6B6A66]">
              Payment Details
            </p>
            <p className="mt-2 font-semibold text-[#0B0B0C]">
              {order.paymentMethod === 'paystack'
                ? 'Paystack (Online Gateway)'
                : 'Pay on Delivery (Cash / Mobile POS)'}
            </p>
            <p className="mt-1 text-xs text-[#4A4945] capitalize">
              Payment Status: <strong className="text-[#0B0B0C]">{order.paymentStatus.replace(/_/g, ' ')}</strong>
            </p>
            {order.paystackReference && (
              <p className="mt-1 text-xs text-[#6B6A66] tabular-nums">
                Ref: {order.paystackReference}
              </p>
            )}
          </div>
        </div>

        {/* Itemized Receipt */}
        <div className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B6A66]">
            Pieces Ordered
          </h2>
          <ul className="mt-3 divide-y divide-black/[0.07] border-y border-black/[0.08]">
            {order.items.map((item, idx) => (
              <li key={idx} className="flex items-center gap-4 py-4">
                <LuxuryImage
                  src={item.productImage}
                  alt={item.productName}
                  className="h-16 w-16 shrink-0 object-cover bg-[#F2EFEA]"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-[#0B0B0C]">{item.productName}</p>
                  <p className="text-xs text-[#6B6A66]">
                    {item.selectedSize} · {item.selectedColor} · Qty {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums text-[#0B0B0C]">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-[#54534F]">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#54534F]">
              <span>Insured Delivery</span>
              <span className="tabular-nums">
                {order.shippingFee === 0 ? 'Complimentary' : formatCurrency(order.shippingFee)}
              </span>
            </div>
            <div className="flex justify-between border-t border-black/10 pt-2 text-base font-semibold text-[#0B0B0C]">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 pt-6 border-t border-black/[0.08]">
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="bg-[#0B0B0C] px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#C5A059] hover:text-[#0B0B0C]"
          >
            Continue Shopping
          </button>
          <button
            type="button"
            onClick={() => navigate('/account')}
            className="border border-black/20 px-7 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#0B0B0C] hover:border-[#0B0B0C]"
          >
            Account &amp; Order Lookup
          </button>
        </div>
      </div>
    </div>
  );
}
