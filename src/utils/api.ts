import type {
  AdminOverview,
  CategorySlug,
  CheckoutFormInput,
  CustomerUser,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  SortOption,
} from '../types/store';

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  const data = (await res.json().catch(() => ({}))) as T & {
    error?: string;
    fieldErrors?: Record<string, string>;
  };

  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`) as Error & {
      status?: number;
      fieldErrors?: Record<string, string>;
    };
    err.status = res.status;
    err.fieldErrors = data.fieldErrors;
    throw err;
  }

  return data;
}

export async function fetchProducts(params?: {
  category?: CategorySlug | 'all';
  search?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: SortOption;
  featured?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  inStockOnly?: boolean;
}): Promise<Product[]> {
  const qs = new URLSearchParams();
  if (params?.category && params.category !== 'all') qs.set('category', params.category);
  if (params?.search) qs.set('search', params.search);
  if (params?.minPrice !== null && params?.minPrice !== undefined)
    qs.set('minPrice', String(params.minPrice));
  if (params?.maxPrice !== null && params?.maxPrice !== undefined)
    qs.set('maxPrice', String(params.maxPrice));
  if (params?.sort) qs.set('sort', params.sort);
  if (params?.featured) qs.set('featured', 'true');
  if (params?.newArrival) qs.set('newArrival', 'true');
  if (params?.bestSeller) qs.set('bestSeller', 'true');
  if (params?.inStockOnly) qs.set('inStockOnly', 'true');

  const queryStr = qs.toString();
  const data = await requestJson<{ products: Product[] }>(
    `/api/products${queryStr ? `?${queryStr}` : ''}`,
  );
  return data.products;
}

export async function fetchProductBySlug(
  slug: string,
): Promise<{ product: Product; related: Product[] }> {
  return requestJson<{ product: Product; related: Product[] }>(
    `/api/products/${encodeURIComponent(slug)}`,
  );
}

export async function fetchCurrentUser(): Promise<CustomerUser | null> {
  const data = await requestJson<{ user: CustomerUser | null }>('/api/auth/me');
  return data.user;
}

export async function loginUser(email: string, password: string): Promise<CustomerUser> {
  const data = await requestJson<{ user: CustomerUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data.user;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}): Promise<CustomerUser> {
  const data = await requestJson<{ user: CustomerUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function logoutUser(): Promise<void> {
  await requestJson<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
}

export async function createOrder(
  form: CheckoutFormInput,
  items: { productId: number; selectedSize: string; selectedColor: string; quantity: number }[],
): Promise<{ order: Order; paystackConfigured: boolean }> {
  return requestJson<{ order: Order; paystackConfigured: boolean }>('/api/orders', {
    method: 'POST',
    body: JSON.stringify({ ...form, items }),
  });
}

export async function initializePaystack(
  orderNumber: string,
  customerEmail: string,
): Promise<{
  configured: boolean;
  authorizationUrl?: string;
  reference?: string;
  order: Order;
  message?: string;
}> {
  return requestJson('/api/checkout/paystack/initialize', {
    method: 'POST',
    body: JSON.stringify({ orderNumber, customerEmail }),
  });
}

export async function verifyPaystackPayment(reference: string): Promise<{
  configured: boolean;
  verified: boolean;
  order: Order;
  message: string;
}> {
  return requestJson(`/api/checkout/paystack/verify/${encodeURIComponent(reference)}`);
}

export async function fetchMyOrders(): Promise<Order[]> {
  const data = await requestJson<{ orders: Order[] }>('/api/orders/mine');
  return data.orders;
}

export async function lookupOrder(orderNumber: string, email: string): Promise<Order> {
  const qs = new URLSearchParams({ orderNumber, email });
  const data = await requestJson<{ order: Order }>(`/api/orders/lookup?${qs.toString()}`);
  return data.order;
}

export async function subscribeNewsletter(
  email: string,
): Promise<{ ok: boolean; alreadySubscribed: boolean; message: string }> {
  return requestJson('/api/newsletter', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function submitContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ ok: boolean; message: string }> {
  return requestJson('/api/contact', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// --- Admin API ---
export async function fetchAdminOverview(): Promise<AdminOverview> {
  const data = await requestJson<{ overview: AdminOverview }>('/api/admin/overview');
  return data.overview;
}

export async function fetchAdminProducts(): Promise<Product[]> {
  const data = await requestJson<{ products: Product[] }>('/api/admin/products');
  return data.products;
}

export async function uploadProductImage(
  filename: string,
  dataUrl: string,
): Promise<{ url: string }> {
  return requestJson<{ url: string }>('/api/admin/upload', {
    method: 'POST',
    body: JSON.stringify({ filename, dataUrl }),
  });
}

export async function createAdminProduct(payload: {
  name: string;
  category: CategorySlug;
  price: number;
  compareAtPrice?: number | null;
  description: string;
  details: string[];
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
}): Promise<Product> {
  const data = await requestJson<{ product: Product }>('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.product;
}

export async function updateAdminProduct(
  id: number,
  payload: Partial<{
    name: string;
    category: CategorySlug;
    price: number;
    compareAtPrice: number | null;
    description: string;
    details: string[];
    images: string[];
    sizes: string[];
    colors: string[];
    stock: number;
    isFeatured: boolean;
    isNewArrival: boolean;
    isBestSeller: boolean;
  }>,
): Promise<Product> {
  const data = await requestJson<{ product: Product }>(`/api/admin/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return data.product;
}

export async function deleteAdminProduct(id: number): Promise<void> {
  await requestJson<{ ok: boolean }>(`/api/admin/products/${id}`, { method: 'DELETE' });
}

export async function fetchAdminOrders(): Promise<Order[]> {
  const data = await requestJson<{ orders: Order[] }>('/api/admin/orders');
  return data.orders;
}

export async function updateAdminOrderStatus(
  id: number,
  updates: { orderStatus?: OrderStatus; paymentStatus?: PaymentStatus },
): Promise<Order> {
  const data = await requestJson<{ order: Order }>(`/api/admin/orders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data.order;
}
