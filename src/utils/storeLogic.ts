import type {
  CartItem,
  CategorySlug,
  CheckoutFormInput,
  OrderStatus,
  Product,
  SortOption,
} from '../types/store';

export const FREE_SHIPPING_THRESHOLD = 500;
export const STANDARD_SHIPPING_FEE = 25;

export const CATEGORY_LABELS: Record<CategorySlug, string> = {
  watches: 'Watches',
  dresses: 'Dresses',
  sneakers: 'Sneakers',
  accessories: 'Accessories',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Pending Payment',
  pending_confirmation: 'Pending Confirmation',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function slugifyProductName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function calculateCartTotals(
  items: Pick<CartItem, 'price' | 'quantity'>[],
  freeThreshold = FREE_SHIPPING_THRESHOLD,
  flatShipping = STANDARD_SHIPPING_FEE,
): {
  itemCount: number;
  subtotal: number;
  shippingFee: number;
  total: number;
  amountToFreeShipping: number;
} {
  const itemCount = items.reduce((sum, item) => sum + Math.max(0, item.quantity), 0);
  const subtotal = items.reduce(
    (sum, item) => sum + Math.max(0, item.price) * Math.max(0, item.quantity),
    0,
  );
  const shippingFee = subtotal === 0 || subtotal >= freeThreshold ? 0 : flatShipping;
  const total = subtotal + shippingFee;
  const amountToFreeShipping = subtotal >= freeThreshold ? 0 : Math.max(0, freeThreshold - subtotal);

  return {
    itemCount,
    subtotal,
    shippingFee,
    total,
    amountToFreeShipping,
  };
}

export function canAddToCart(
  product: Pick<Product, 'stock'>,
  requestedQty: number,
  existingQtyInCart: number,
): { allowed: boolean; maxAddable: number; reason?: string } {
  if (product.stock <= 0) {
    return { allowed: false, maxAddable: 0, reason: 'This item is currently out of stock.' };
  }
  if (requestedQty <= 0) {
    return { allowed: false, maxAddable: 0, reason: 'Quantity must be at least 1.' };
  }
  const remaining = product.stock - existingQtyInCart;
  if (remaining <= 0) {
    return {
      allowed: false,
      maxAddable: 0,
      reason: `You already have the maximum available stock (${product.stock}) in your bag.`,
    };
  }
  if (requestedQty > remaining) {
    return {
      allowed: false,
      maxAddable: remaining,
      reason: `Only ${remaining} additional unit${remaining === 1 ? '' : 's'} available.`,
    };
  }
  return { allowed: true, maxAddable: remaining };
}

export interface ProductFilterOptions {
  category?: CategorySlug | 'all';
  search?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: SortOption;
  inStockOnly?: boolean;
}

export function filterAndSortProducts(
  products: Product[],
  options: ProductFilterOptions = {},
): Product[] {
  const {
    category = 'all',
    search = '',
    minPrice = null,
    maxPrice = null,
    sort = 'featured',
    inStockOnly = false,
  } = options;

  const q = search.trim().toLowerCase();

  const filtered = products.filter((product) => {
    if (category !== 'all' && product.category !== category) {
      return false;
    }
    if (inStockOnly && product.stock <= 0) {
      return false;
    }
    if (minPrice !== null && product.price < minPrice) {
      return false;
    }
    if (maxPrice !== null && product.price > maxPrice) {
      return false;
    }
    if (q) {
      const haystack = `${product.name} ${product.category} ${product.description} ${product.colors.join(' ')}`.toLowerCase();
      if (!haystack.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (sort) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'newest':
        return b.createdAt.localeCompare(a.createdAt) || b.id - a.id;
      case 'popular':
        return b.popularityScore - a.popularityScore;
      case 'featured':
      default:
        if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
        return b.popularityScore - a.popularityScore;
    }
  });

  return sorted;
}

export function validateCheckoutForm(
  input: CheckoutFormInput,
): { valid: boolean; errors: Partial<Record<keyof CheckoutFormInput, string>> } {
  const errors: Partial<Record<keyof CheckoutFormInput, string>> = {};

  if (!input.customerName || input.customerName.trim().length < 2) {
    errors.customerName = 'Please enter your full name.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!input.customerEmail || !emailRegex.test(input.customerEmail.trim())) {
    errors.customerEmail = 'Please enter a valid email address.';
  }
  const phoneDigits = (input.customerPhone || '').replace(/\D/g, '');
  if (phoneDigits.length < 7) {
    errors.customerPhone = 'Please enter a valid phone number.';
  }
  if (!input.deliveryAddress || input.deliveryAddress.trim().length < 6) {
    errors.deliveryAddress = 'Please enter a complete street delivery address.';
  }
  if (!input.city || input.city.trim().length < 2) {
    errors.city = 'Please enter your city.';
  }
  if (!input.country || input.country.trim().length < 2) {
    errors.country = 'Please enter your country.';
  }
  if (input.paymentMethod !== 'paystack' && input.paymentMethod !== 'pay_on_delivery') {
    errors.paymentMethod = 'Please select a valid payment method.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateProductInput(input: {
  name: string;
  category: string;
  price: number;
  stock: number;
  description: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!input.name || input.name.trim().length < 2) {
    errors.name = 'Product name must be at least 2 characters.';
  }
  if (!['watches', 'dresses', 'sneakers', 'accessories'].includes(input.category)) {
    errors.category = 'Select a valid category.';
  }
  if (!Number.isFinite(input.price) || input.price <= 0) {
    errors.price = 'Price must be greater than zero.';
  }
  if (!Number.isInteger(input.stock) || input.stock < 0) {
    errors.stock = 'Stock must be a whole number of 0 or greater.';
  }
  if (!input.description || input.description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters.';
  }
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
