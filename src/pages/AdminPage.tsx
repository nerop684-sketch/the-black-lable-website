import { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Edit3,
  ImagePlus,
  Lock,
  LogOut,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import type {
  AdminOverview,
  CategorySlug,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
} from '../types/store';
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminOrders,
  fetchAdminOverview,
  fetchAdminProducts,
  loginUser,
  updateAdminOrderStatus,
  updateAdminProduct,
  uploadProductImage,
} from '../utils/api';
import { CATEGORY_LABELS, formatCurrency, ORDER_STATUS_LABELS } from '../utils/storeLogic';
import { LuxuryImage } from '../components/LuxuryImage';

interface ProductDraft {
  id?: number;
  name: string;
  category: CategorySlug;
  price: string;
  compareAtPrice: string;
  stock: string;
  description: string;
  detailsText: string;
  sizesText: string;
  colorsText: string;
  imageUrl: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
}

const EMPTY_DRAFT: ProductDraft = {
  name: '',
  category: 'watches',
  price: '',
  compareAtPrice: '',
  stock: '10',
  description: '',
  detailsText: '',
  sizesText: 'Standard',
  colorsText: 'Obsidian Black',
  imageUrl: '',
  isFeatured: false,
  isNewArrival: true,
  isBestSeller: false,
};

export function AdminPage() {
  const { user, authLoading, setUser, signOut, showToast } = useStore();

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Admin workspace state
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Product editor drawer/modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<ProductDraft>(EMPTY_DRAFT);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const isAdmin = Boolean(user && user.role === 'admin');

  const loadAdminData = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingData(true);
    setDataError(null);
    try {
      const [ov, prods, ords] = await Promise.all([
        fetchAdminOverview(),
        fetchAdminProducts(),
        fetchAdminOrders(),
      ]);
      setOverview(ov);
      setProducts(prods);
      setOrders(ords);
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Unable to load store administration data.');
    } finally {
      setLoadingData(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginSubmitting(true);
    try {
      const loggedIn = await loginUser(loginEmail, loginPassword);
      if (loggedIn.role !== 'admin') {
        setLoginError('This account does not have administrator privileges.');
        return;
      }
      setUser(loggedIn);
      setLoginPassword('');
      showToast('Signed in to Store Administration.');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Invalid administrator credentials.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setDraft(EMPTY_DRAFT);
    setEditorError(null);
    setEditorOpen(true);
  };

  const openEditModal = (p: Product) => {
    setDraft({
      id: p.id,
      name: p.name,
      category: p.category,
      price: String(p.price),
      compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : '',
      stock: String(p.stock),
      description: p.description,
      detailsText: p.details.join('\n'),
      sizesText: p.sizes.join(', '),
      colorsText: p.colors.join(', '),
      imageUrl: p.images[0] || '',
      isFeatured: p.isFeatured,
      isNewArrival: p.isNewArrival,
      isBestSeller: p.isBestSeller,
    });
    setEditorError(null);
    setEditorOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setEditorError('Please upload a PNG, JPEG, or WEBP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setEditorError('Image file size must be 5 MB or less.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== 'string') return;
      setUploadingImage(true);
      setEditorError(null);
      try {
        const res = await uploadProductImage(file.name, reader.result);
        setDraft((prev) => ({ ...prev, imageUrl: res.url }));
        showToast('Product image uploaded.');
      } catch (err) {
        setEditorError(err instanceof Error ? err.message : 'Image upload failed.');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditorError(null);

    const price = Number(draft.price);
    const stock = Number(draft.stock);
    if (!draft.name.trim() || !Number.isFinite(price) || price <= 0) {
      setEditorError('Enter a valid product name and positive price.');
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setEditorError('Stock must be a whole number of 0 or greater.');
      return;
    }
    if (!draft.imageUrl.trim()) {
      setEditorError('Upload a product image or provide an image URL.');
      return;
    }

    const payload = {
      name: draft.name.trim(),
      category: draft.category,
      price,
      compareAtPrice: draft.compareAtPrice ? Number(draft.compareAtPrice) : null,
      description: draft.description.trim(),
      details: draft.detailsText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      images: [draft.imageUrl.trim()],
      sizes: draft.sizesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      colors: draft.colorsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      stock,
      isFeatured: draft.isFeatured,
      isNewArrival: draft.isNewArrival,
      isBestSeller: draft.isBestSeller,
    };

    setSavingProduct(true);
    try {
      if (draft.id) {
        const updated = await updateAdminProduct(draft.id, payload);
        setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showToast(`Updated ${updated.name}.`);
      } else {
        const created = await createAdminProduct(payload);
        setProducts((prev) => [created, ...prev]);
        showToast(`Added ${created.name} to catalog.`);
      }
      setEditorOpen(false);
      loadAdminData();
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : 'Unable to save product.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleToggleFeatured = async (p: Product) => {
    try {
      const updated = await updateAdminProduct(p.id, { isFeatured: !p.isFeatured });
      setProducts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      showToast(
        updated.isFeatured
          ? `${updated.name} marked as Featured.`
          : `${updated.name} removed from Featured.`,
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed.', 'error');
    }
  };

  const handleQuickStockDelta = async (p: Product, delta: number) => {
    const nextStock = Math.max(0, p.stock + delta);
    try {
      const updated = await updateAdminProduct(p.id, { stock: nextStock });
      setProducts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      loadAdminData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update stock.', 'error');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    try {
      await deleteAdminProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setConfirmDeleteId(null);
      showToast('Product removed from catalog.');
      loadAdminData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to delete product.', 'error');
    }
  };

  const handleOrderStatusChange = async (orderId: number, orderStatus: OrderStatus) => {
    try {
      const updated = await updateAdminOrderStatus(orderId, { orderStatus });
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      showToast(`Order ${updated.orderNumber} updated to ${ORDER_STATUS_LABELS[orderStatus]}.`);
      loadAdminData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update order.', 'error');
    }
  };

  const handlePaymentStatusChange = async (orderId: number, paymentStatus: PaymentStatus) => {
    try {
      const updated = await updateAdminOrderStatus(orderId, { paymentStatus });
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      showToast(`Payment status updated for ${updated.orderNumber}.`);
      loadAdminData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update payment status.', 'error');
    }
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-20 text-center text-sm text-[#6B6A66]">
        Verifying administration session...
      </div>
    );
  }

  // Protected Admin Gate
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-[460px] px-4 py-20">
        <div className="bg-white border border-black/[0.08] p-8 shadow-sm">
          <div className="flex items-center gap-2.5 text-[#9A7835]">
            <Lock className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">
              Restricted Access
            </span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[#0B0B0C]">
            Store Administration
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-[#6B6A66]">
            Sign in with authorized store owner credentials to manage catalog inventory, upload photography, and fulfill orders.
          </p>

          {user && user.role !== 'admin' && (
            <div className="mt-4 border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 flex items-center justify-between gap-2">
              <span>Signed in as customer ({user.email}).</span>
              <button
                type="button"
                onClick={signOut}
                className="font-semibold underline whitespace-nowrap"
              >
                Sign out
              </button>
            </div>
          )}

          {loginError && (
            <div role="alert" className="mt-4 border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="admin-login-email"
                className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
              >
                Administrator Email
              </label>
              <input
                id="admin-login-email"
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@theblacklabel.com"
                className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="admin-login-password"
                className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
              >
                Password
              </label>
              <input
                id="admin-login-password"
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="mt-1.5 w-full border border-black/20 bg-[#FAF9F6] px-3.5 py-2.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full bg-[#0B0B0C] py-3.5 text-xs font-semibold uppercase tracking-[0.16em] text-white hover:bg-[#C5A059] hover:text-[#0B0B0C] disabled:opacity-60"
            >
              {loginSubmitting ? 'Verifying...' : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/[0.08] pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#9A7835]">
            Maison Operations · {user?.email}
          </p>
          <h1 className="mt-1.5 font-display text-4xl font-semibold text-[#0B0B0C]">
            Store Administration
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-[#0B0B0C] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-[#C5A059] hover:text-[#0B0B0C]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Product</span>
          </button>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-1.5 border border-black/20 bg-white px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-[#0B0B0C] hover:border-[#0B0B0C]"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      {overview && (
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-black/[0.08] p-5">
            <p className="text-xs uppercase tracking-wider text-[#6B6A66]">Confirmed Revenue</p>
            <p className="mt-2 font-sans text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-[#0B0B0C]">
              {formatCurrency(overview.confirmedRevenue)}
            </p>
          </div>
          <div className="bg-white border border-black/[0.08] p-5">
            <p className="text-xs uppercase tracking-wider text-[#6B6A66]">Total Orders</p>
            <p className="mt-2 font-sans text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-[#0B0B0C]">
              {overview.totalOrders}
            </p>
          </div>
          <div className="bg-white border border-black/[0.08] p-5">
            <p className="text-xs uppercase tracking-wider text-[#6B6A66]">Catalog Pieces</p>
            <p className="mt-2 font-sans text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-[#0B0B0C]">
              {overview.totalProducts}
            </p>
          </div>
          <div className="bg-white border border-black/[0.08] p-5">
            <p className="text-xs uppercase tracking-wider text-[#6B6A66]">Low Stock (≤ 5)</p>
            <p className="mt-2 font-sans text-2xl sm:text-3xl font-semibold tracking-tight tabular-nums text-[#9A7835]">
              {overview.lowStockCount}
            </p>
          </div>
        </div>
      )}

      {/* Workspace Tabs */}
      <div
        role="tablist"
        aria-label="Administration sections"
        className="mt-8 flex items-center gap-2 border-b border-black/[0.08]"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'products'}
          type="button"
          onClick={() => setActiveTab('products')}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] border-b-2 transition-colors ${
            activeTab === 'products'
              ? 'border-[#0B0B0C] text-[#0B0B0C]'
              : 'border-transparent text-[#6B6A66] hover:text-[#0B0B0C]'
          }`}
        >
          Products &amp; Inventory ({products.length})
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'orders'}
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-[#0B0B0C] text-[#0B0B0C]'
              : 'border-transparent text-[#6B6A66] hover:text-[#0B0B0C]'
          }`}
        >
          Customer Orders ({orders.length})
        </button>
      </div>

      {dataError && (
        <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {dataError}
        </div>
      )}

      {loadingData ? (
        <div className="mt-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse bg-[#EAE6DF]" />
          ))}
        </div>
      ) : activeTab === 'products' ? (
        <div className="mt-6 overflow-x-auto bg-white border border-black/[0.08]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/[0.08] bg-[#FAF9F6] text-xs uppercase tracking-wider text-[#6B6A66]">
              <tr>
                <th className="px-4 py-3.5">Piece</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Price</th>
                <th className="px-4 py-3.5">Inventory</th>
                <th className="px-4 py-3.5">Featured</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.06]">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-[#FAF9F6]/70">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <LuxuryImage
                        src={product.images[0] || ''}
                        alt={product.name}
                        className="h-12 w-14 shrink-0 object-cover bg-[#F2EFEA]"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0B0B0C] truncate max-w-[260px]">
                          {product.name}
                        </p>
                        <p className="text-xs text-[#6B6A66]">
                          {product.isNewArrival ? 'New Arrival' : 'Archive'}
                          {product.isBestSeller ? ' · Best Seller' : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs uppercase tracking-wider text-[#54534F]">
                    {CATEGORY_LABELS[product.category]}
                  </td>
                  <td className="px-4 py-3.5 font-semibold tabular-nums text-[#0B0B0C]">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="inline-flex items-center gap-2 border border-black/15 bg-[#FAF9F6] px-2 py-1">
                      <button
                        type="button"
                        onClick={() => handleQuickStockDelta(product, -1)}
                        aria-label={`Decrease stock for ${product.name}`}
                        className="px-1.5 text-xs font-bold hover:text-[#9A7835]"
                      >
                        -
                      </button>
                      <span
                        className={`min-w-[28px] text-center text-xs font-semibold tabular-nums ${
                          product.stock <= 5 ? 'text-amber-800' : 'text-[#0B0B0C]'
                        }`}
                      >
                        {product.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickStockDelta(product, 1)}
                        aria-label={`Increase stock for ${product.name}`}
                        className="px-1.5 text-xs font-bold hover:text-[#9A7835]"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(product)}
                      className={`px-3 py-1 text-xs font-medium border transition-colors ${
                        product.isFeatured
                          ? 'border-[#C5A059] bg-[#C5A059]/15 text-[#0B0B0C]'
                          : 'border-black/15 text-[#6B6A66] hover:border-black/40'
                      }`}
                    >
                      {product.isFeatured ? 'Featured' : 'Standard'}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        aria-label={`Edit ${product.name}`}
                        className="inline-flex items-center gap-1 border border-black/15 px-3 py-1.5 text-xs font-medium text-[#0B0B0C] hover:border-[#0B0B0C]"
                      >
                        <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Edit</span>
                      </button>

                      {confirmDeleteId === product.id ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="bg-red-700 px-2.5 py-1.5 text-xs font-medium text-white"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="border border-black/15 px-2 py-1.5 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(product.id)}
                          aria-label={`Delete ${product.name}`}
                          className="p-1.5 text-[#6B6A66] hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white border border-black/[0.08] p-10 text-center text-sm text-[#6B6A66]">
              No customer orders have been placed yet.
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-black/[0.08] p-6 space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-black/[0.06] pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6A66]">
                      <span className="font-semibold text-[#0B0B0C]">{order.orderNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span>{order.customerName}</span>
                      <span aria-hidden="true">·</span>
                      <span>{order.customerEmail}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#54534F]">
                      {order.deliveryAddress}, {order.city}, {order.country} · {order.customerPhone}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <label htmlFor={`order-status-${order.id}`} className="sr-only">
                        Order status for {order.orderNumber}
                      </label>
                      <select
                        id={`order-status-${order.id}`}
                        value={order.orderStatus}
                        onChange={(e) =>
                          handleOrderStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        className="border border-black/20 bg-[#FAF9F6] px-3 py-1.5 text-xs font-medium text-[#0B0B0C]"
                      >
                        <option value="pending_payment">Pending Payment</option>
                        <option value="pending_confirmation">Pending Confirmation</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor={`payment-status-${order.id}`} className="sr-only">
                        Payment status for {order.orderNumber}
                      </label>
                      <select
                        id={`payment-status-${order.id}`}
                        value={order.paymentStatus}
                        onChange={(e) =>
                          handlePaymentStatusChange(order.id, e.target.value as PaymentStatus)
                        }
                        className="border border-black/20 bg-[#FAF9F6] px-3 py-1.5 text-xs font-medium text-[#0B0B0C]"
                      >
                        <option value="pending">Payment Pending</option>
                        <option value="awaiting_gateway">Awaiting Gateway</option>
                        <option value="paid">Paid</option>
                        <option value="pay_on_delivery">Pay on Delivery</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>

                    <span className="text-base font-semibold tabular-nums text-[#0B0B0C] ml-2">
                      {formatCurrency(order.total)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-xs">
                      <LuxuryImage
                        src={item.productImage}
                        alt={item.productName}
                        className="h-10 w-10 object-cover bg-[#F2EFEA]"
                      />
                      <div>
                        <p className="font-semibold text-[#0B0B0C]">
                          {item.productName} × {item.quantity}
                        </p>
                        <p className="text-[#6B6A66]">
                          {item.selectedSize} · {item.selectedColor} ·{' '}
                          <span className="tabular-nums">{formatCurrency(item.unitPrice)}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Product Create / Edit Modal */}
      {editorOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={draft.id ? 'Edit product' : 'Add new product'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto"
          onClick={() => setEditorOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#FAF9F6] border border-black/15 p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-black/[0.08] pb-4">
              <h2 className="font-display text-2xl font-semibold text-[#0B0B0C]">
                {draft.id ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                type="button"
                onClick={() => setEditorOpen(false)}
                aria-label="Close product editor"
                className="flex h-9 w-9 items-center justify-center text-[#0B0B0C]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {editorError && (
              <div className="mt-4 border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                {editorError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="prod-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
                  >
                    Product Name
                  </label>
                  <input
                    id="prod-name"
                    type="text"
                    required
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    className="mt-1.5 w-full border border-black/20 bg-white px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label
                    htmlFor="prod-category"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
                  >
                    Category
                  </label>
                  <select
                    id="prod-category"
                    value={draft.category}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, category: e.target.value as CategorySlug }))
                    }
                    className="mt-1.5 w-full border border-black/20 bg-white px-3 py-2 text-sm"
                  >
                    <option value="watches">Watches</option>
                    <option value="dresses">Dresses</option>
                    <option value="sneakers">Sneakers</option>
                    <option value="accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="prod-price"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
                  >
                    Price (USD)
                  </label>
                  <input
                    id="prod-price"
                    type="number"
                    min="1"
                    required
                    value={draft.price}
                    onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                    className="mt-1.5 w-full border border-black/20 bg-white px-3 py-2 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-compare"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
                  >
                    Compare-At (Optional)
                  </label>
                  <input
                    id="prod-compare"
                    type="number"
                    min="0"
                    value={draft.compareAtPrice}
                    onChange={(e) => setDraft((d) => ({ ...d, compareAtPrice: e.target.value }))}
                    className="mt-1.5 w-full border border-black/20 bg-white px-3 py-2 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-stock"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
                  >
                    Stock Quantity
                  </label>
                  <input
                    id="prod-stock"
                    type="number"
                    min="0"
                    required
                    value={draft.stock}
                    onChange={(e) => setDraft((d) => ({ ...d, stock: e.target.value }))}
                    className="mt-1.5 w-full border border-black/20 bg-white px-3 py-2 text-sm tabular-nums"
                  />
                </div>
              </div>

              {/* Image Upload + URL */}
              <div className="border border-black/10 bg-white p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#3C3B38]">
                    Product Photography
                  </span>
                  <label className="inline-flex cursor-pointer items-center gap-2 border border-[#0B0B0C] px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-[#0B0B0C] hover:bg-[#0B0B0C] hover:text-white">
                    <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Image File'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  {draft.imageUrl && (
                    <LuxuryImage
                      src={draft.imageUrl}
                      alt="Product preview"
                      className="h-16 w-20 shrink-0 object-cover border border-black/10"
                    />
                  )}
                  <div className="flex-1">
                    <label htmlFor="prod-image-url" className="sr-only">
                      Image URL
                    </label>
                    <input
                      id="prod-image-url"
                      type="text"
                      value={draft.imageUrl}
                      onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))}
                      placeholder="/uploads/... or /src/assets/images/..."
                      className="w-full border border-black/20 bg-[#FAF9F6] px-3 py-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="prod-description"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
                >
                  Description
                </label>
                <textarea
                  id="prod-description"
                  rows={3}
                  required
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  className="mt-1.5 w-full border border-black/20 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="prod-sizes"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
                  >
                    Sizes (comma-separated)
                  </label>
                  <input
                    id="prod-sizes"
                    type="text"
                    value={draft.sizesText}
                    onChange={(e) => setDraft((d) => ({ ...d, sizesText: e.target.value }))}
                    placeholder="XS, S, M, L"
                    className="mt-1.5 w-full border border-black/20 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prod-colors"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
                  >
                    Colors (comma-separated)
                  </label>
                  <input
                    id="prod-colors"
                    type="text"
                    value={draft.colorsText}
                    onChange={(e) => setDraft((d) => ({ ...d, colorsText: e.target.value }))}
                    placeholder="Obsidian Black, Champagne Gold"
                    className="mt-1.5 w-full border border-black/20 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="prod-details"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#3C3B38]"
                >
                  Craft Specifications (one per line)
                </label>
                <textarea
                  id="prod-details"
                  rows={2}
                  value={draft.detailsText}
                  onChange={(e) => setDraft((d) => ({ ...d, detailsText: e.target.value }))}
                  placeholder="100% Italian calfskin&#10;Sapphire crystal"
                  className="mt-1.5 w-full border border-black/20 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-1 text-xs font-medium text-[#0B0B0C]">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.isFeatured}
                    onChange={(e) => setDraft((d) => ({ ...d, isFeatured: e.target.checked }))}
                    className="h-4 w-4 accent-[#0B0B0C]"
                  />
                  <span>Featured Product</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.isNewArrival}
                    onChange={(e) => setDraft((d) => ({ ...d, isNewArrival: e.target.checked }))}
                    className="h-4 w-4 accent-[#0B0B0C]"
                  />
                  <span>New Arrival</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draft.isBestSeller}
                    onChange={(e) => setDraft((d) => ({ ...d, isBestSeller: e.target.checked }))}
                    className="h-4 w-4 accent-[#0B0B0C]"
                  />
                  <span>Best Seller</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-black/[0.08]">
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="border border-black/20 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0B0B0C]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct || uploadingImage}
                  className="inline-flex items-center gap-2 bg-[#0B0B0C] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#C5A059] hover:text-[#0B0B0C] disabled:opacity-60"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{savingProduct ? 'Saving...' : 'Save Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
