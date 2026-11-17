import { useEffect, useState } from 'react';
import { Heart, LogOut, PackageSearch, Shield } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type { Order } from '../types/store';
import {
  fetchMyOrders,
  loginUser,
  lookupOrder,
  registerUser,
} from '../utils/api';
import { formatCurrency, ORDER_STATUS_LABELS } from '../utils/storeLogic';

export function AccountPage() {
  const { user, setUser, signOut, navigate, showToast, wishlistIds } = useStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Guest Order Lookup
  const [lookupNumber, setLookupNumber] = useState('');
  const [lookupEmail, setLookupEmail] = useState('');
  const [lookedUpOrder, setLookedUpOrder] = useState<Order | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setMyOrders([]);
      return;
    }
    setOrdersLoading(true);
    fetchMyOrders()
      .then((orders) => setMyOrders(orders))
      .catch(() => setMyOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSubmitting(true);
    try {
      const loggedIn =
        mode === 'login'
          ? await loginUser(email, password)
          : await registerUser({ name, email, password, phone, address });
      setUser(loggedIn);
      showToast(`Welcome, ${loggedIn.name}.`);
      setPassword('');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleOrderLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookedUpOrder(null);
    if (!lookupNumber.trim() || !lookupEmail.trim()) {
      setLookupError('Please enter both your order number and email address.');
      return;
    }
    setLookupLoading(true);
    try {
      const order = await lookupOrder(lookupNumber, lookupEmail);
      setLookedUpOrder(order);
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Order not found.');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <div className="border-b border-black/[0.08] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#9A7835]">Client Account</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-[#0B0B0C]">
            {user ? `Welcome, ${user.name}` : 'Account & Order Tracking'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/wishlist')}
            className="inline-flex items-center gap-2 border border-black/20 bg-white px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#0B0B0C] hover:border-[#0B0B0C]"
          >
            <Heart className="h-3.5 w-3.5 text-[#9A7835]" aria-hidden="true" />
            <span>Wishlist ({wishlistIds.length})</span>
          </button>
          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-2 bg-[#0B0B0C] px-4 py-2 text-xs font-medium uppercase tracking-wider text-white hover:bg-[#C5A059] hover:text-[#0B0B0C]"
            >
              <Shield className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Admin Portal</span>
            </button>
          )}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Profile or Sign In / Register */}
        <div className="lg:col-span-7 bg-white border border-black/[0.08] p-6 sm:p-8">
          {user ? (
            <div>
              <div className="flex items-start justify-between gap-4 border-b border-black/[0.07] pb-6">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-[#0B0B0C]">
                    Client Profile
                  </h2>
                  <p className="mt-1 text-sm text-[#54534F]">{user.email}</p>
                  {user.phone && <p className="text-xs text-[#6B6A66] mt-1">{user.phone}</p>}
                  {user.address && <p className="text-xs text-[#6B6A66]">{user.address}</p>}
                </div>
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex items-center gap-1.5 border border-black/20 px-4 py-2 text-xs font-medium uppercase tracking-wider text-[#0B0B0C] hover:bg-[#0B0B0C] hover:text-white"
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </div>

              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6B6A66]">
                  Order History
                </h3>
                {ordersLoading ? (
                  <div className="mt-4 h-28 animate-pulse bg-[#F2EFEA]" />
                ) : myOrders.length === 0 ? (
                  <p className="mt-4 text-sm text-[#6B6A66]">
                    You have not placed an order while signed in yet.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-black/[0.07]">
                    {myOrders.map((ord) => (
                      <li key={ord.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#0B0B0C]">
                            {ord.orderNumber}
                          </p>
                          <p className="text-xs text-[#6B6A66]">
                            {ORDER_STATUS_LABELS[ord.orderStatus]} · {ord.items.length} piece(s)
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold tabular-nums text-[#0B0B0C]">
                            {formatCurrency(ord.total)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              window.sessionStorage.setItem(
                                `tbl_order_${ord.orderNumber}`,
                                JSON.stringify(ord),
                              );
                              navigate(`/order/${ord.orderNumber}`);
                            }}
                            className="text-xs font-semibold uppercase tracking-wider text-[#9A7835] hover:text-[#0B0B0C]"
                          >
                            View Receipt
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex gap-4 border-b border-black/[0.08] pb-4">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setAuthError(null);
                  }}
                  className={`text-xs font-semibold uppercase tracking-[0.16em] pb-1 border-b-2 ${
                    mode === 'login'
                      ? 'border-[#0B0B0C] text-[#0B0B0C]'
                      : 'border-transparent text-[#6B6A66]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setAuthError(null);
                  }}
                  className={`text-xs font-semibold uppercase tracking-[0.16em] pb-1 border-b-2 ${
                    mode === 'register'
                      ? 'border-[#0B0B0C] text-[#0B0B0C]'
                      : 'border-transparent text-[#6B6A66]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              {authError && (
                <div className="mt-4 border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-800">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
                {mode === 'register' && (
                  <div>
                    <label
                      htmlFor="account-name"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
                    >
                      Full Name
                    </label>
                    <input
                      id="account-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="account-email"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
                  >
                    Email Address
                  </label>
                  <input
                    id="account-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="account-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
                  >
                    Password
                  </label>
                  <input
                    id="account-password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
                  />
                </div>

                {mode === 'register' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="account-phone"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
                      >
                        Phone (Optional)
                      </label>
                      <input
                        id="account-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="account-address"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
                      >
                        Address (Optional)
                      </label>
                      <input
                        id="account-address"
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full bg-[#0B0B0C] py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#C5A059] hover:text-[#0B0B0C] disabled:opacity-60"
                >
                  {authSubmitting
                    ? 'Authenticating...'
                    : mode === 'login'
                      ? 'Sign In'
                      : 'Create Account'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right: Guest Order Tracker */}
        <aside className="lg:col-span-5 bg-white border border-black/[0.08] p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <PackageSearch className="h-5 w-5 text-[#9A7835]" aria-hidden="true" />
            <h2 className="font-display text-2xl font-semibold text-[#0B0B0C]">Track an Order</h2>
          </div>
          <p className="mt-2 text-xs text-[#6B6A66]">
            Check real-time fulfillment and payment status using your Order Reference and email address.
          </p>

          <form onSubmit={handleOrderLookup} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="lookup-order-number"
                className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
              >
                Order Number
              </label>
              <input
                id="lookup-order-number"
                type="text"
                value={lookupNumber}
                onChange={(e) => setLookupNumber(e.target.value)}
                placeholder="e.g. TBL-2026-1041"
                className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="lookup-order-email"
                className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
              >
                Order Email
              </label>
              <input
                id="lookup-order-email"
                type="email"
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                placeholder="claire@example.com"
                className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
              />
            </div>

            {lookupError && <p className="text-xs text-red-700">{lookupError}</p>}

            <button
              type="submit"
              disabled={lookupLoading}
              className="w-full border border-[#0B0B0C] bg-white py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#0B0B0C] hover:bg-[#0B0B0C] hover:text-white"
            >
              {lookupLoading ? 'Searching...' : 'Look Up Order'}
            </button>
          </form>

          {lookedUpOrder && (
            <div className="mt-6 border-t border-black/[0.08] pt-5 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-[#6B6A66]">Order</span>
                <span className="font-semibold text-[#0B0B0C]">{lookedUpOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6A66]">Fulfillment</span>
                <span className="font-semibold text-[#0B0B0C]">
                  {ORDER_STATUS_LABELS[lookedUpOrder.orderStatus]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6A66]">Total</span>
                <span className="font-semibold tabular-nums text-[#0B0B0C]">
                  {formatCurrency(lookedUpOrder.total)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.sessionStorage.setItem(
                    `tbl_order_${lookedUpOrder.orderNumber}`,
                    JSON.stringify(lookedUpOrder),
                  );
                  navigate(`/order/${lookedUpOrder.orderNumber}`);
                }}
                className="mt-2 text-xs font-semibold uppercase tracking-wider text-[#9A7835] hover:text-[#0B0B0C]"
              >
                Open Full Receipt
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
