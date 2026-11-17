import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import {
  attachUser,
  clearSessionCookie,
  hashPassword,
  requireAdmin,
  requireAuth,
  setSessionCookie,
  signSessionToken,
  verifyPassword,
  type AuthenticatedRequest,
} from './server/auth';
import {
  createCustomerUser,
  createOrderRecord,
  createProduct,
  deleteProduct,
  findUserByEmail,
  findUserById,
  getAdminOverview,
  getAllOrders,
  getAllProducts,
  getOrderByNumber,
  getOrderByPaystackReference,
  getOrdersByUserId,
  getProductById,
  getProductBySlug,
  saveContactMessage,
  saveNewsletterSubscriber,
  updateOrderStatuses,
  updateProduct,
  UPLOADS_PATH,
} from './server/db';
import {
  initializePaystackTransaction,
  isPaystackConfigured,
  verifyPaystackTransaction,
  verifyPaystackWebhookSignature,
} from './server/paystack';
import {
  filterAndSortProducts,
  slugifyProductName,
  validateCheckoutForm,
  validateProductInput,
} from './src/utils/storeLogic';
import type { CategorySlug, OrderStatus, PaymentStatus, SortOption } from './src/types/store';

const PORT = 3000;

async function startServer(): Promise<void> {
  const app = express();

  // Webhook endpoint needs raw body for Paystack HMAC-SHA512 verification
  app.post(
    '/api/checkout/paystack/webhook',
    express.raw({ type: 'application/json' }),
    (req, res) => {
      const signature = req.headers['x-paystack-signature'] as string | undefined;
      const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : '';
      if (!verifyPaystackWebhookSignature(rawBody, signature)) {
        res.status(401).json({ error: 'Invalid webhook signature.' });
        return;
      }
      try {
        const event = JSON.parse(rawBody) as {
          event: string;
          data?: { reference?: string; status?: string };
        };
        if (event.event === 'charge.success' && event.data?.reference) {
          const order = getOrderByPaystackReference(event.data.reference);
          if (order) {
            updateOrderStatuses(order.id, {
              paymentStatus: 'paid',
              orderStatus: 'processing',
            });
          }
        }
        res.status(200).json({ received: true });
      } catch {
        res.status(400).json({ error: 'Malformed webhook payload.' });
      }
    },
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(attachUser);
  app.use('/uploads', express.static(UPLOADS_PATH));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      paystackConfigured: isPaystackConfigured(),
    });
  });

  // --- Public Catalog Endpoints ---
  app.get('/api/products', (req, res) => {
    const category = (req.query.category as CategorySlug | 'all' | undefined) || 'all';
    const search = (req.query.search as string | undefined) || '';
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null;
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
    const sort = (req.query.sort as SortOption | undefined) || 'featured';
    const inStockOnly = req.query.inStockOnly === 'true';

    let products = getAllProducts();
    if (req.query.featured === 'true') {
      products = products.filter((p) => p.isFeatured);
    }
    if (req.query.newArrival === 'true') {
      products = products.filter((p) => p.isNewArrival);
    }
    if (req.query.bestSeller === 'true') {
      products = products.filter((p) => p.isBestSeller);
    }

    const result = filterAndSortProducts(products, {
      category,
      search,
      minPrice: Number.isFinite(minPrice) ? minPrice : null,
      maxPrice: Number.isFinite(maxPrice) ? maxPrice : null,
      sort,
      inStockOnly,
    });

    res.json({ products: result });
  });

  app.get('/api/products/:slug', (req, res) => {
    const product = getProductBySlug(req.params.slug);
    if (!product) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    const all = getAllProducts();
    const related = all
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
    res.json({ product, related });
  });

  // --- Customer & Admin Authentication ---
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, phone, address } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
      address?: string;
    };

    if (!name || name.trim().length < 2) {
      res.status(400).json({ error: 'Full name is required.' });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Valid email address is required.' });
      return;
    }
    if (!password || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters.' });
      return;
    }

    if (findUserByEmail(email)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const user = createCustomerUser({
      name,
      email,
      passwordHash: hashPassword(password),
      phone,
      address,
    });

    const token = signSessionToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });
    setSessionCookie(res, token);
    res.status(201).json({ user });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const userRecord = findUserByEmail(email);
    if (!userRecord || !verifyPassword(password, userRecord.passwordHash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = signSessionToken({
      userId: userRecord.id,
      email: userRecord.email,
      role: userRecord.role,
      name: userRecord.name,
    });
    setSessionCookie(res, token);
    res.json({
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role,
        phone: userRecord.phone,
        address: userRecord.address,
      },
    });
  });

  app.post('/api/auth/logout', (_req, res) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  app.get('/api/auth/me', (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      res.json({ user: null });
      return;
    }
    const user = findUserById(req.user.userId);
    res.json({ user });
  });

  // --- Orders & Checkout ---
  app.post('/api/orders', (req: AuthenticatedRequest, res) => {
    const {
      customerName,
      customerEmail,
      customerPhone,
      deliveryAddress,
      city,
      country,
      notes,
      paymentMethod,
      items,
    } = req.body as {
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      deliveryAddress: string;
      city: string;
      country: string;
      notes?: string;
      paymentMethod: 'paystack' | 'pay_on_delivery';
      items: { productId: number; selectedSize: string; selectedColor: string; quantity: number }[];
    };

    const validation = validateCheckoutForm({
      customerName: customerName || '',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      deliveryAddress: deliveryAddress || '',
      city: city || '',
      country: country || '',
      notes: notes || '',
      paymentMethod,
    });

    if (!validation.valid) {
      res.status(400).json({ error: 'Please correct the highlighted checkout fields.', fieldErrors: validation.errors });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Your shopping bag is empty.' });
      return;
    }

    try {
      const order = createOrderRecord({
        userId: req.user ? req.user.userId : null,
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress,
        city,
        country,
        notes: notes || '',
        paymentMethod,
        items,
      });

      res.status(201).json({ order, paystackConfigured: isPaystackConfigured() });
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Unable to create order.' });
    }
  });

  app.get('/api/orders/mine', requireAuth, (req: AuthenticatedRequest, res) => {
    const orders = getOrdersByUserId(req.user!.userId);
    res.json({ orders });
  });

  app.get('/api/orders/lookup', (req, res) => {
    const orderNumber = String(req.query.orderNumber || '').trim();
    const email = String(req.query.email || '').trim().toLowerCase();

    if (!orderNumber || !email) {
      res.status(400).json({ error: 'Order number and email are required.' });
      return;
    }

    const order = getOrderByNumber(orderNumber);
    if (!order || order.customerEmail.toLowerCase() !== email) {
      res.status(404).json({ error: 'No matching order found for that order number and email.' });
      return;
    }

    res.json({ order });
  });

  app.post('/api/checkout/paystack/initialize', async (req, res) => {
    const { orderNumber, customerEmail } = req.body as {
      orderNumber?: string;
      customerEmail?: string;
    };

    if (!orderNumber || !customerEmail) {
      res.status(400).json({ error: 'Order number and email are required.' });
      return;
    }

    const order = getOrderByNumber(orderNumber);
    if (!order || order.customerEmail.toLowerCase() !== customerEmail.toLowerCase().trim()) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }

    if (order.paymentMethod !== 'paystack') {
      res.status(400).json({ error: 'Order is not configured for Paystack payment.' });
      return;
    }

    const reference = order.paystackReference || `PSK-${order.orderNumber}`;
    const appOrigin =
      process.env.APP_URL || `${req.protocol}://${req.get('host') || `localhost:${PORT}`}`;
    const callbackUrl = `${appOrigin.replace(/\/$/, '')}/checkout/verify?reference=${encodeURIComponent(reference)}&orderNumber=${encodeURIComponent(order.orderNumber)}`;

    try {
      const result = await initializePaystackTransaction({
        email: order.customerEmail,
        amountUsd: order.total,
        reference,
        callbackUrl,
        metadata: {
          orderNumber: order.orderNumber,
          customerName: order.customerName,
        },
      });

      if (!result.configured) {
        updateOrderStatuses(order.id, {
          paymentStatus: 'awaiting_gateway',
          orderStatus: 'pending_payment',
        });
        const refreshed = getOrderByNumber(order.orderNumber);
        res.status(200).json({
          configured: false,
          order: refreshed,
          message: result.message,
        });
        return;
      }

      res.json({
        configured: true,
        authorizationUrl: result.authorizationUrl,
        reference: result.reference,
        order,
      });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Unable to reach Paystack gateway.',
      });
    }
  });

  app.get('/api/checkout/paystack/verify/:reference', async (req, res) => {
    const reference = req.params.reference;
    const order = getOrderByPaystackReference(reference);
    if (!order) {
      res.status(404).json({ error: 'No order matches this payment reference.' });
      return;
    }

    try {
      const verification = await verifyPaystackTransaction(reference);
      if (!verification.configured) {
        res.status(503).json({
          configured: false,
          verified: false,
          order,
          message: verification.message,
        });
        return;
      }

      if (verification.verified) {
        const updated = updateOrderStatuses(order.id, {
          paymentStatus: 'paid',
          orderStatus: 'processing',
        });
        res.json({
          configured: true,
          verified: true,
          order: updated,
          message: verification.message,
        });
        return;
      }

      res.json({
        configured: true,
        verified: false,
        order,
        message: verification.message,
      });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Verification request failed.',
      });
    }
  });

  // --- Newsletter & Contact ---
  app.post('/api/newsletter', (req, res) => {
    const { email } = req.body as { email?: string };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }
    const { alreadySubscribed } = saveNewsletterSubscriber(email);
    res.status(201).json({
      ok: true,
      alreadySubscribed,
      message: alreadySubscribed
        ? 'You are already on our private client list.'
        : 'Welcome to THE BLACK LABEL private list.',
    });
  });

  app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    };
    if (!name || name.trim().length < 2) {
      res.status(400).json({ error: 'Please enter your name.' });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!subject || subject.trim().length < 3 || !message || message.trim().length < 10) {
      res.status(400).json({ error: 'Please enter a subject and message (at least 10 characters).' });
      return;
    }
    saveContactMessage({ name, email, subject, message });
    res.status(201).json({
      ok: true,
      message: 'Your inquiry has been received by our Mayfair client concierge.',
    });
  });

  // --- Admin Endpoints (Protected by requireAdmin) ---
  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    res.json({ overview: getAdminOverview() });
  });

  app.get('/api/admin/products', requireAdmin, (_req, res) => {
    res.json({ products: getAllProducts() });
  });

  app.post('/api/admin/upload', requireAdmin, (req, res) => {
    const { filename, dataUrl } = req.body as { filename?: string; dataUrl?: string };
    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ error: 'Image data is required.' });
      return;
    }

    const match = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) {
      res.status(400).json({ error: 'Only PNG, JPEG, or WEBP images are supported.' });
      return;
    }

    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: 'Image must be 5 MB or smaller.' });
      return;
    }

    const safeBase = (filename || 'product')
      .replace(/\.[^.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .slice(0, 40);
    const outName = `${safeBase || 'product'}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    fs.writeFileSync(path.join(UPLOADS_PATH, outName), buffer);

    res.status(201).json({ url: `/uploads/${outName}` });
  });

  app.post('/api/admin/products', requireAdmin, (req, res) => {
    const body = req.body as {
      name?: string;
      category?: CategorySlug;
      price?: number;
      compareAtPrice?: number | null;
      description?: string;
      details?: string[];
      images?: string[];
      sizes?: string[];
      colors?: string[];
      stock?: number;
      isFeatured?: boolean;
      isNewArrival?: boolean;
      isBestSeller?: boolean;
    };

    const price = Number(body.price);
    const stock = Number(body.stock);
    const validation = validateProductInput({
      name: body.name || '',
      category: body.category || '',
      price,
      stock,
      description: body.description || '',
    });

    if (!validation.valid) {
      res.status(400).json({ error: 'Invalid product fields.', fieldErrors: validation.errors });
      return;
    }

    const images =
      Array.isArray(body.images) && body.images.length > 0
        ? body.images.filter((u) => typeof u === 'string' && u.trim().length > 0)
        : [];
    if (images.length === 0) {
      res.status(400).json({ error: 'At least one product image URL or uploaded image is required.' });
      return;
    }

    const product = createProduct({
      slug: slugifyProductName(body.name!),
      name: body.name!,
      category: body.category!,
      price,
      compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null,
      description: body.description!,
      details: Array.isArray(body.details) ? body.details : [],
      images,
      sizes: Array.isArray(body.sizes) ? body.sizes : [],
      colors: Array.isArray(body.colors) ? body.colors : [],
      stock,
      isFeatured: Boolean(body.isFeatured),
      isNewArrival: Boolean(body.isNewArrival),
      isBestSeller: Boolean(body.isBestSeller),
    });

    res.status(201).json({ product });
  });

  app.patch('/api/admin/products/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: 'Invalid product ID.' });
      return;
    }

    const existing = getProductById(id);
    if (!existing) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }

    const body = req.body as Partial<{
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
    }>;

    const nextPrice = body.price !== undefined ? Number(body.price) : existing.price;
    const nextStock = body.stock !== undefined ? Number(body.stock) : existing.stock;
    const validation = validateProductInput({
      name: body.name !== undefined ? body.name : existing.name,
      category: body.category !== undefined ? body.category : existing.category,
      price: nextPrice,
      stock: nextStock,
      description: body.description !== undefined ? body.description : existing.description,
    });

    if (!validation.valid) {
      res.status(400).json({ error: 'Invalid product fields.', fieldErrors: validation.errors });
      return;
    }

    const updated = updateProduct(id, {
      ...body,
      price: nextPrice,
      stock: nextStock,
    });
    res.json({ product: updated });
  });

  app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: 'Invalid product ID.' });
      return;
    }
    const deleted = deleteProduct(id);
    if (!deleted) {
      res.status(404).json({ error: 'Product not found.' });
      return;
    }
    res.json({ ok: true });
  });

  app.get('/api/admin/orders', requireAdmin, (_req, res) => {
    res.json({ orders: getAllOrders() });
  });

  app.patch('/api/admin/orders/:id', requireAdmin, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: 'Invalid order ID.' });
      return;
    }

    const { orderStatus, paymentStatus } = req.body as {
      orderStatus?: OrderStatus;
      paymentStatus?: PaymentStatus;
    };

    const validOrderStatuses: OrderStatus[] = [
      'pending_payment',
      'pending_confirmation',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ];
    const validPaymentStatuses: PaymentStatus[] = [
      'pending',
      'awaiting_gateway',
      'paid',
      'pay_on_delivery',
      'failed',
    ];

    if (orderStatus && !validOrderStatuses.includes(orderStatus)) {
      res.status(400).json({ error: 'Invalid order status.' });
      return;
    }
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      res.status(400).json({ error: 'Invalid payment status.' });
      return;
    }

    const updated = updateOrderStatuses(id, { orderStatus, paymentStatus });
    if (!updated) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    res.json({ order: updated });
  });

  // --- Vite Dev Middleware or Static Production Build ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`THE BLACK LABEL server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
