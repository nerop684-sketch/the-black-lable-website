export type CategorySlug = 'watches' | 'dresses' | 'sneakers' | 'accessories';

export type SortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'popular';

export type PaymentMethod = 'paystack' | 'pay_on_delivery';

export type PaymentStatus =
  | 'pending'
  | 'awaiting_gateway'
  | 'paid'
  | 'pay_on_delivery'
  | 'failed';

export type OrderStatus =
  | 'pending_payment'
  | 'pending_confirmation'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Product {
  id: number;
  slug: string;
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
  popularityScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  category: CategorySlug;
  price: number;
  image: string;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  maxStock: number;
}

export interface CustomerUser {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  phone?: string;
  address?: string;
}

export interface OrderItem {
  id?: number;
  productId: number;
  productName: string;
  productImage: string;
  selectedSize: string;
  selectedColor: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  country: string;
  notes: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paystackReference: string | null;
  orderStatus: OrderStatus;
  subtotal: number;
  shippingFee: number;
  total: number;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutFormInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  country: string;
  notes: string;
  paymentMethod: PaymentMethod;
}

export interface AdminOverview {
  totalOrders: number;
  totalProducts: number;
  lowStockCount: number;
  confirmedRevenue: number;
  pendingOrdersCount: number;
}
