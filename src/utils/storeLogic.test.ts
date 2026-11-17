import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateCartTotals,
  canAddToCart,
  filterAndSortProducts,
  formatCurrency,
  slugifyProductName,
  validateCheckoutForm,
  validateProductInput,
} from './storeLogic';
import type { Product } from '../types/store';

const sampleProducts: Product[] = [
  {
    id: 1,
    slug: 'chronographe-noir',
    name: 'Chronographe Noir Obsidian',
    category: 'watches',
    price: 1450,
    compareAtPrice: null,
    description: 'Matte black steel chronograph with sapphire crystal.',
    details: ['40mm case'],
    images: ['/img/1.jpg'],
    sizes: ['40mm'],
    colors: ['Obsidian Black'],
    stock: 5,
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    popularityScore: 95,
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 2,
    slug: 'corso-sneaker',
    name: 'Corso Low-Top Calfskin Sneaker',
    category: 'sneakers',
    price: 495,
    compareAtPrice: null,
    description: 'Hand-lasted Italian calfskin low-top sneaker.',
    details: ['Margom sole'],
    images: ['/img/2.jpg'],
    sizes: ['41', '42', '43'],
    colors: ['Black', 'Cream'],
    stock: 0,
    isFeatured: false,
    isNewArrival: true,
    isBestSeller: false,
    popularityScore: 80,
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-01T10:00:00Z',
  },
  {
    id: 3,
    slug: 'nocturne-silk-dress',
    name: 'Nocturne Bias Silk Gown',
    category: 'dresses',
    price: 980,
    compareAtPrice: null,
    description: 'Mulberry silk bias-cut evening gown.',
    details: ['100% Mulberry Silk'],
    images: ['/img/3.jpg'],
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['Noir'],
    stock: 3,
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    popularityScore: 98,
    createdAt: '2026-09-15T10:00:00Z',
    updatedAt: '2026-09-15T10:00:00Z',
  },
];

test('formatCurrency formats USD cleanly without decimals', () => {
  assert.equal(formatCurrency(1450), '$1,450');
  assert.equal(formatCurrency(495.4), '$495');
});

test('slugifyProductName produces clean URL slugs', () => {
  assert.equal(slugifyProductName('Nocturne Bias Silk Gown!'), 'nocturne-bias-silk-gown');
});

test('calculateCartTotals applies shipping below threshold and complimentary above', () => {
  const below = calculateCartTotals([{ price: 380, quantity: 1 }]);
  assert.equal(below.subtotal, 380);
  assert.equal(below.shippingFee, 25);
  assert.equal(below.total, 405);
  assert.equal(below.amountToFreeShipping, 120);

  const above = calculateCartTotals([
    { price: 495, quantity: 1 },
    { price: 380, quantity: 1 },
  ]);
  assert.equal(above.itemCount, 2);
  assert.equal(above.subtotal, 875);
  assert.equal(above.shippingFee, 0);
  assert.equal(above.total, 875);
  assert.equal(above.amountToFreeShipping, 0);

  const empty = calculateCartTotals([]);
  assert.equal(empty.total, 0);
  assert.equal(empty.shippingFee, 0);
});

test('canAddToCart enforces stock ceiling and zero stock state', () => {
  assert.equal(canAddToCart({ stock: 0 }, 1, 0).allowed, false);
  assert.equal(canAddToCart({ stock: 3 }, 2, 0).allowed, true);
  assert.equal(canAddToCart({ stock: 3 }, 2, 2).allowed, false);
  assert.equal(canAddToCart({ stock: 3 }, 1, 2).allowed, true);
});

test('filterAndSortProducts filters by category, price, search, stock, and sorts accurately', () => {
  const watches = filterAndSortProducts(sampleProducts, { category: 'watches' });
  assert.equal(watches.length, 1);
  assert.equal(watches[0].slug, 'chronographe-noir');

  const inStockUnder1000 = filterAndSortProducts(sampleProducts, {
    inStockOnly: true,
    maxPrice: 1000,
  });
  assert.equal(inStockUnder1000.length, 1);
  assert.equal(inStockUnder1000[0].slug, 'nocturne-silk-dress');

  const searchSilk = filterAndSortProducts(sampleProducts, { search: 'mulberry' });
  assert.equal(searchSilk.length, 1);

  const byPriceAsc = filterAndSortProducts(sampleProducts, { sort: 'price-asc' });
  assert.deepEqual(
    byPriceAsc.map((p) => p.price),
    [495, 980, 1450],
  );

  const byNewest = filterAndSortProducts(sampleProducts, { sort: 'newest' });
  assert.equal(byNewest[0].slug, 'corso-sneaker');
});

test('validateCheckoutForm rejects empty/invalid inputs and accepts valid details', () => {
  const invalid = validateCheckoutForm({
    customerName: 'A',
    customerEmail: 'bad-email',
    customerPhone: '123',
    deliveryAddress: '12',
    city: '',
    country: '',
    notes: '',
    paymentMethod: 'paystack',
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.customerName);
  assert.ok(invalid.errors.customerEmail);
  assert.ok(invalid.errors.customerPhone);
  assert.ok(invalid.errors.deliveryAddress);

  const valid = validateCheckoutForm({
    customerName: 'Amara Okafor',
    customerEmail: 'amara@example.com',
    customerPhone: '+234 803 555 0199',
    deliveryAddress: '14 Bourdillon Road, Ikoyi',
    city: 'Lagos',
    country: 'Nigeria',
    notes: 'Gate code 404',
    paymentMethod: 'paystack',
  });
  assert.equal(valid.valid, true);
});

test('validateProductInput enforces positive price and valid category', () => {
  const bad = validateProductInput({
    name: 'X',
    category: 'hats',
    price: -10,
    stock: -1,
    description: 'short',
  });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.name);
  assert.ok(bad.errors.category);
  assert.ok(bad.errors.price);
  assert.ok(bad.errors.stock);
  assert.ok(bad.errors.description);
});
