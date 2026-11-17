import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { hashPassword } from './auth';
import type {
  AdminOverview,
  CategorySlug,
  CustomerUser,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
} from '../src/types/store';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const UPLOADS_PATH = UPLOAD_DIR;

const db = new DatabaseSync(path.join(DATA_DIR, 'blacklabel.db'));
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    compare_at_price REAL,
    description TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT '[]',
    images TEXT NOT NULL DEFAULT '[]',
    sizes TEXT NOT NULL DEFAULT '[]',
    colors TEXT NOT NULL DEFAULT '[]',
    stock INTEGER NOT NULL DEFAULT 0,
    is_featured INTEGER NOT NULL DEFAULT 0,
    is_new_arrival INTEGER NOT NULL DEFAULT 0,
    is_best_seller INTEGER NOT NULL DEFAULT 0,
    popularity_score INTEGER NOT NULL DEFAULT 50,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    user_id INTEGER,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    notes TEXT DEFAULT '',
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL,
    paystack_reference TEXT,
    order_status TEXT NOT NULL,
    subtotal REAL NOT NULL,
    shipping_fee REAL NOT NULL,
    total REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    product_image TEXT NOT NULL,
    selected_size TEXT DEFAULT '',
    selected_color TEXT DEFAULT '',
    unit_price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

interface ProductRow {
  id: number;
  slug: string;
  name: string;
  category: CategorySlug;
  price: number;
  compare_at_price: number | null;
  description: string;
  details: string;
  images: string;
  sizes: string;
  colors: string;
  stock: number;
  is_featured: number;
  is_new_arrival: number;
  is_best_seller: number;
  popularity_score: number;
  created_at: string;
  updated_at: string;
}

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    price: row.price,
    compareAtPrice: row.compare_at_price,
    description: row.description,
    details: JSON.parse(row.details || '[]') as string[],
    images: JSON.parse(row.images || '[]') as string[],
    sizes: JSON.parse(row.sizes || '[]') as string[],
    colors: JSON.parse(row.colors || '[]') as string[],
    stock: row.stock,
    isFeatured: row.is_featured === 1,
    isNewArrival: row.is_new_arrival === 1,
    isBestSeller: row.is_best_seller === 1,
    popularityScore: row.popularity_score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function seedDatabase(): void {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@theblacklabel.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'BlackLabelAdmin2026!';

  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (!existingAdmin) {
    db.prepare(
      `INSERT INTO users (name, email, password_hash, role, phone, address)
       VALUES (?, ?, ?, 'admin', ?, ?)`,
    ).run(
      'Maison Director',
      adminEmail,
      hashPassword(adminPassword),
      '+44 20 7946 0821',
      '18 Mount Street, Mayfair, London',
    );
  }

  const sampleCustomerEmail = 'claire@example.com';
  let customerRow = db
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(sampleCustomerEmail) as { id: number } | undefined;

  if (!customerRow) {
    const info = db
      .prepare(
        `INSERT INTO users (name, email, password_hash, role, phone, address)
         VALUES (?, ?, ?, 'customer', ?, ?)`,
      )
      .run(
        'Claire Vance',
        sampleCustomerEmail,
        hashPassword('CustomerPass2026!'),
        '+1 212 555 0148',
        '420 West Broadway, SoHo, New York',
      );
    customerRow = { id: Number(info.lastInsertRowid) };
  }

  const productCountRow = db.prepare('SELECT COUNT(*) as count FROM products').get() as {
    count: number;
  };
  if (productCountRow.count === 0) {
    const seedProducts = [
      {
        slug: 'chronographe-noir-obsidian',
        name: 'Chronographe Noir Obsidian',
        category: 'watches',
        price: 1450,
        compareAtPrice: null,
        description:
          'Precision-milled 40mm matte DLC black stainless steel chronograph paired with brushed champagne-gold hands, recessed sub-dials, and anti-reflective sapphire crystal.',
        details: [
          'Swiss Ronda 5030.D quartz chronograph movement',
          '40mm 316L steel case with matte black DLC coating',
          'Scratch-resistant domed sapphire crystal',
          '10 ATM (100m) water resistance',
        ],
        images: ['/src/assets/images/watch_obsidian_chrono_1794839037427.jpg'],
        sizes: ['40mm'],
        colors: ['Obsidian Black', 'Champagne Dial'],
        stock: 9,
        isFeatured: 1,
        isNewArrival: 1,
        isBestSeller: 1,
        popularityScore: 98,
      },
      {
        slug: 'aeterna-champagne-dress-watch',
        name: 'Aeterna Champagne Dress Watch',
        category: 'watches',
        price: 1890,
        compareAtPrice: null,
        description:
          'An ultra-slim 6.8mm dress silhouette sculpted in brushed champagne-gold PVD over surgical steel, anchored by a matte obsidian guilloché dial and hand-stitched alligator-grain calfskin strap.',
        details: [
          'Automatic Sellita SW200-1 calibre with 38h reserve',
          '38mm brushed champagne-gold case, 6.8mm profile',
          'Italian hand-finished black calfskin leather strap',
          'Exhibition sapphire caseback',
        ],
        images: ['/src/assets/images/watch_champagne_dress_1794839038349.jpg'],
        sizes: ['38mm', '40mm'],
        colors: ['Champagne Gold / Noir'],
        stock: 6,
        isFeatured: 1,
        isNewArrival: 0,
        isBestSeller: 1,
        popularityScore: 95,
      },
      {
        slug: 'monolith-titanium-automatic',
        name: 'Monolith Titanium Automatic',
        category: 'watches',
        price: 2250,
        compareAtPrice: 2450,
        description:
          'Engineered from featherweight Grade 5 brushed titanium with a charcoal sunburst dial and integrated H-link bracelet for effortless architectural poise from day to evening.',
        details: [
          '42-hour automatic mechanical movement',
          '41mm Grade 5 brushed charcoal titanium',
          'Super-LumiNova baton indices',
          'Butterfly deployant clasp with micro-adjustment',
        ],
        images: ['/src/assets/images/watch_titanium_automatic_1794839037981.jpg'],
        sizes: ['41mm'],
        colors: ['Charcoal Titanium'],
        stock: 4,
        isFeatured: 0,
        isNewArrival: 1,
        isBestSeller: 0,
        popularityScore: 89,
      },
      {
        slug: 'nocturne-bias-silk-gown',
        name: 'Nocturne Bias Silk Gown',
        category: 'dresses',
        price: 980,
        compareAtPrice: null,
        description:
          'Cut on the true bias from heavy 22-momme mulberry silk charmeuse, the Nocturne gown drapes fluidly along the collarbone with an asymmetrical cowl and floor-sweeping hem.',
        details: [
          '100% Grade 6A 22-momme mulberry silk',
          'Asymmetric draped neckline and open back detail',
          'French seam interior construction',
          'Dry clean only; made in Milan',
        ],
        images: ['/src/assets/images/dress_silk_evening_1794839037901.jpg'],
        sizes: ['XS', 'S', 'M', 'L'],
        colors: ['Obsidian Noir'],
        stock: 7,
        isFeatured: 1,
        isNewArrival: 0,
        isBestSeller: 1,
        popularityScore: 97,
      },
      {
        slug: 'atelier-double-breasted-blazer-dress',
        name: 'Atelier Tailored Blazer Dress',
        category: 'dresses',
        price: 840,
        compareAtPrice: null,
        description:
          'Sharply structured in Italian virgin wool-crepe, this double-breasted blazer dress pairs peak lapels and architectural shoulders with custom brushed champagne-gold crest buttons.',
        details: [
          '100% Italian virgin wool crepe, cupro lining',
          'Six custom brushed champagne-gold buttons',
          'Internal waist stay for sculpted drape',
          'Functional welt pockets and buttoned cuffs',
        ],
        images: ['/src/assets/images/dress_tailored_blazer_1794839038757.jpg'],
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Jet Black'],
        stock: 11,
        isFeatured: 1,
        isNewArrival: 1,
        isBestSeller: 1,
        popularityScore: 94,
      },
      {
        slug: 'lumiere-draped-satin-midi',
        name: 'Lumière Draped Satin Midi',
        category: 'dresses',
        price: 760,
        compareAtPrice: null,
        description:
          'Crafted in liquid champagne-ivory duchesse satin with diagonal waist tucking and a concealed side zip, capturing light with understated evening luminosity.',
        details: [
          'Heavyweight silk-blend duchesse satin',
          'Sculpted asymmetric waist pleating',
          'Concealed side seam zip closure',
          'Mid-calf architectural hem',
        ],
        images: ['/src/assets/images/dress_champagne_satin_1794839039856.jpg'],
        sizes: ['XS', 'S', 'M', 'L'],
        colors: ['Champagne Ivory'],
        stock: 8,
        isFeatured: 0,
        isNewArrival: 1,
        isBestSeller: 0,
        popularityScore: 86,
      },
      {
        slug: 'corso-low-top-calfskin-sneaker',
        name: 'Corso Low-Top Calfskin Sneaker',
        category: 'sneakers',
        price: 495,
        compareAtPrice: null,
        description:
          'Hand-lasted in Marche, Italy from supple full-grain black calfskin leather, lined in breathable calfskin and anchored on a stitched cream Margom rubber cupsole.',
        details: [
          'Full-grain Tuscan pebble & smooth calfskin upper',
          'Sidewall-stitched Italian Margom rubber outsole',
          'Waxed cotton tonal laces & cushioned leather footbed',
          'Includes brushed cotton dust bag',
        ],
        images: ['/src/assets/images/sneaker_obsidian_leather_1794839039289.jpg'],
        sizes: ['39', '40', '41', '42', '43', '44', '45'],
        colors: ['Black / Cream Sole'],
        stock: 14,
        isFeatured: 1,
        isNewArrival: 0,
        isBestSeller: 1,
        popularityScore: 96,
      },
      {
        slug: 'arcadia-suede-leather-runner',
        name: 'Arcadia Suede & Leather Runner',
        category: 'sneakers',
        price: 540,
        compareAtPrice: null,
        description:
          'A contemporary architectural runner combining water-repellent off-white suede panels with charcoal nappa overlays and a sculpted lightweight traction sole.',
        details: [
          'Water-repellent Italian suede & nappa leather',
          'Ergonomic sculpted EVA and rubber outsole',
          'Vegetable-tanned leather heel lining',
          'Handcrafted in Portugal',
        ],
        images: ['/src/assets/images/sneaker_ivory_suede_1794839039965.jpg'],
        sizes: ['39', '40', '41', '42', '43', '44'],
        colors: ['Ivory / Charcoal'],
        stock: 10,
        isFeatured: 0,
        isNewArrival: 1,
        isBestSeller: 0,
        popularityScore: 88,
      },
      {
        slug: 'palazzo-pebbled-leather-tote',
        name: 'Palazzo Pebbled Leather Tote',
        category: 'accessories',
        price: 1150,
        compareAtPrice: null,
        description:
          'Structured architectural carryall crafted from full-grain pebbled calfskin with dual rolled handles, detachable shoulder strap, and brushed champagne-gold hardware.',
        details: [
          '100% full-grain Italian pebbled calfskin',
          'Micro-suede bonded interior with padded 14" sleeve',
          'Custom solid brass hardware in brushed champagne gold',
          'Dimensions: 38cm × 27cm × 15cm',
        ],
        images: ['/src/assets/images/accessory_calfskin_tote_1794839040149.jpg'],
        sizes: ['One Size'],
        colors: ['Obsidian Black'],
        stock: 6,
        isFeatured: 1,
        isNewArrival: 0,
        isBestSeller: 1,
        popularityScore: 93,
      },
      {
        slug: 'sovereign-acetate-sunglasses',
        name: 'Sovereign Acetate Sunglasses',
        category: 'accessories',
        price: 380,
        compareAtPrice: null,
        description:
          'Sculpted geometric frames milled from cured 8mm Japanese Takiron black acetate, accented with a brushed titanium bridge and anti-reflective CR-39 charcoal lenses.',
        details: [
          '8mm hand-beveled Japanese black acetate',
          'Brushed champagne-gold titanium bridge & temple pins',
          '100% UVA/UVB polarized CR-39 lenses',
          'Includes hard calfskin case and polishing cloth',
        ],
        images: ['/src/assets/images/accessory_acetate_eyewear_1794839040138.jpg'],
        sizes: ['52-20-145'],
        colors: ['Noir / Brushed Gold'],
        stock: 15,
        isFeatured: 0,
        isNewArrival: 1,
        isBestSeller: 1,
        popularityScore: 91,
      },
      {
        slug: 'atelier-leather-watch-roll',
        name: 'Atelier Leather Watch Roll',
        category: 'accessories',
        price: 290,
        compareAtPrice: null,
        description:
          'Designed for collectors in transit, featuring matte black full-grain calfskin, plush removable micro-suede cushion, and a recessed brushed champagne-gold snap closure.',
        details: [
          'Full-grain pebble calfskin exterior',
          'Ultra-soft charcoal Alcantara watch cushion',
          'Solid brass champagne-gold snap fastening',
          'Fits case sizes up to 44mm',
        ],
        images: ['/src/assets/images/promo_atelier_campaign_1794839035889.jpg'],
        sizes: ['Single Slot'],
        colors: ['Black / Champagne Hardware'],
        stock: 12,
        isFeatured: 0,
        isNewArrival: 1,
        isBestSeller: 0,
        popularityScore: 84,
      },
      {
        slug: 'corso-monochrome-edition',
        name: 'Corso Noir Atelier Sneaker',
        category: 'sneakers',
        price: 520,
        compareAtPrice: null,
        description:
          'Limited atelier run of our signature low-top silhouette featuring reinforced waxed stitching, tonal metal eyelets, and memory-foam arch support.',
        details: [
          'Box-calf and pebbled Italian leather panels',
          'Custom Margom cupsole with stitched perimeter',
          'Removable calfskin comfort insole',
          'Numbered interior tongue stamp',
        ],
        images: ['/src/assets/images/sneaker_obsidian_leather_1794839039289.jpg'],
        sizes: ['40', '41', '42', '43', '44'],
        colors: ['Obsidian / Ivory Sole'],
        stock: 3,
        isFeatured: 0,
        isNewArrival: 1,
        isBestSeller: 0,
        popularityScore: 82,
      },
    ];

    const insertProduct = db.prepare(`
      INSERT INTO products (
        slug, name, category, price, compare_at_price, description,
        details, images, sizes, colors, stock,
        is_featured, is_new_arrival, is_best_seller, popularity_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of seedProducts) {
      insertProduct.run(
        p.slug,
        p.name,
        p.category,
        p.price,
        p.compareAtPrice,
        p.description,
        JSON.stringify(p.details),
        JSON.stringify(p.images),
        JSON.stringify(p.sizes),
        JSON.stringify(p.colors),
        p.stock,
        p.isFeatured,
        p.isNewArrival,
        p.isBestSeller,
        p.popularityScore,
      );
    }
  }

  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders').get() as { count: number };
  if (orderCount.count === 0) {
    const o1 = db
      .prepare(
        `INSERT INTO orders (
          order_number, user_id, customer_name, customer_email, customer_phone,
          delivery_address, city, country, notes, payment_method, payment_status,
          paystack_reference, order_status, subtotal, shipping_fee, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        'TBL-2026-1041',
        customerRow.id,
        'Claire Vance',
        'claire@example.com',
        '+1 212 555 0148',
        '420 West Broadway, SoHo',
        'New York',
        'United States',
        'Leave with concierge desk',
        'paystack',
        'paid',
        'PSK-TBL-1041',
        'delivered',
        1890,
        0,
        1890,
      );

    db.prepare(
      `INSERT INTO order_items (
        order_id, product_id, product_name, product_image, selected_size, selected_color, unit_price, quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      Number(o1.lastInsertRowid),
      2,
      'Aeterna Champagne Dress Watch',
      '/src/assets/images/watch_champagne_dress_1794839038349.jpg',
      '38mm',
      'Champagne Gold / Noir',
      1890,
      1,
    );

    const o2 = db
      .prepare(
        `INSERT INTO orders (
          order_number, user_id, customer_name, customer_email, customer_phone,
          delivery_address, city, country, notes, payment_method, payment_status,
          paystack_reference, order_status, subtotal, shipping_fee, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        'TBL-2026-1042',
        null,
        'Tunde Adeyemi',
        'tunde.adeyemi@example.com',
        '+234 809 412 8821',
        '24 Gerrard Road, Ikoyi',
        'Lagos',
        'Nigeria',
        'Call upon arrival',
        'pay_on_delivery',
        'pay_on_delivery',
        null,
        'processing',
        875,
        0,
        875,
      );

    db.prepare(
      `INSERT INTO order_items (
        order_id, product_id, product_name, product_image, selected_size, selected_color, unit_price, quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      Number(o2.lastInsertRowid),
      7,
      'Corso Low-Top Calfskin Sneaker',
      '/src/assets/images/sneaker_obsidian_leather_1794839039289.jpg',
      '42',
      'Black / Cream Sole',
      495,
      1,
    );
    db.prepare(
      `INSERT INTO order_items (
        order_id, product_id, product_name, product_image, selected_size, selected_color, unit_price, quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      Number(o2.lastInsertRowid),
      10,
      'Sovereign Acetate Sunglasses',
      '/src/assets/images/accessory_acetate_eyewear_1794839040138.jpg',
      '52-20-145',
      'Noir / Brushed Gold',
      380,
      1,
    );
  }
}

seedDatabase();

export function getAllProducts(): Product[] {
  const rows = db.prepare('SELECT * FROM products ORDER BY id DESC').all() as unknown as ProductRow[];
  return rows.map(mapProductRow);
}

export function getProductBySlug(slug: string): Product | null {
  const row = db.prepare('SELECT * FROM products WHERE slug = ?').get(slug) as
    | ProductRow
    | undefined;
  return row ? mapProductRow(row) : null;
}

export function getProductById(id: number): Product | null {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as ProductRow | undefined;
  return row ? mapProductRow(row) : null;
}

export function createProduct(input: {
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
}): Product {
  // Ensure unique slug
  let uniqueSlug = input.slug;
  let suffix = 1;
  while (db.prepare('SELECT id FROM products WHERE slug = ?').get(uniqueSlug)) {
    uniqueSlug = `${input.slug}-${suffix++}`;
  }

  const info = db
    .prepare(
      `INSERT INTO products (
        slug, name, category, price, compare_at_price, description,
        details, images, sizes, colors, stock,
        is_featured, is_new_arrival, is_best_seller, popularity_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 75)`,
    )
    .run(
      uniqueSlug,
      input.name.trim(),
      input.category,
      input.price,
      input.compareAtPrice,
      input.description.trim(),
      JSON.stringify(input.details),
      JSON.stringify(input.images),
      JSON.stringify(input.sizes),
      JSON.stringify(input.colors),
      input.stock,
      input.isFeatured ? 1 : 0,
      input.isNewArrival ? 1 : 0,
      input.isBestSeller ? 1 : 0,
    );

  return getProductById(Number(info.lastInsertRowid))!;
}

export function updateProduct(
  id: number,
  updates: Partial<{
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
): Product | null {
  const existing = getProductById(id);
  if (!existing) return null;

  const merged = {
    name: updates.name !== undefined ? updates.name.trim() : existing.name,
    category: updates.category !== undefined ? updates.category : existing.category,
    price: updates.price !== undefined ? updates.price : existing.price,
    compareAtPrice:
      updates.compareAtPrice !== undefined ? updates.compareAtPrice : existing.compareAtPrice,
    description: updates.description !== undefined ? updates.description.trim() : existing.description,
    details: updates.details !== undefined ? updates.details : existing.details,
    images: updates.images !== undefined ? updates.images : existing.images,
    sizes: updates.sizes !== undefined ? updates.sizes : existing.sizes,
    colors: updates.colors !== undefined ? updates.colors : existing.colors,
    stock: updates.stock !== undefined ? updates.stock : existing.stock,
    isFeatured: updates.isFeatured !== undefined ? updates.isFeatured : existing.isFeatured,
    isNewArrival: updates.isNewArrival !== undefined ? updates.isNewArrival : existing.isNewArrival,
    isBestSeller: updates.isBestSeller !== undefined ? updates.isBestSeller : existing.isBestSeller,
  };

  db.prepare(
    `UPDATE products SET
      name = ?, category = ?, price = ?, compare_at_price = ?, description = ?,
      details = ?, images = ?, sizes = ?, colors = ?, stock = ?,
      is_featured = ?, is_new_arrival = ?, is_best_seller = ?, updated_at = datetime('now')
     WHERE id = ?`,
  ).run(
    merged.name,
    merged.category,
    merged.price,
    merged.compareAtPrice,
    merged.description,
    JSON.stringify(merged.details),
    JSON.stringify(merged.images),
    JSON.stringify(merged.sizes),
    JSON.stringify(merged.colors),
    merged.stock,
    merged.isFeatured ? 1 : 0,
    merged.isNewArrival ? 1 : 0,
    merged.isBestSeller ? 1 : 0,
    id,
  );

  return getProductById(id);
}

export function deleteProduct(id: number): boolean {
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  return Number(info.changes) > 0;
}

export function findUserByEmail(
  email: string,
): (CustomerUser & { passwordHash: string }) | null {
  const row = db
    .prepare('SELECT id, name, email, password_hash, role, phone, address FROM users WHERE email = ?')
    .get(email.toLowerCase().trim()) as
    | {
        id: number;
        name: string;
        email: string;
        password_hash: string;
        role: 'customer' | 'admin';
        phone: string;
        address: string;
      }
    | undefined;

  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    phone: row.phone,
    address: row.address,
  };
}

export function findUserById(id: number): CustomerUser | null {
  const row = db
    .prepare('SELECT id, name, email, role, phone, address FROM users WHERE id = ?')
    .get(id) as CustomerUser | undefined;
  return row || null;
}

export function createCustomerUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  address?: string;
}): CustomerUser {
  const info = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role, phone, address)
       VALUES (?, ?, ?, 'customer', ?, ?)`,
    )
    .run(
      input.name.trim(),
      input.email.toLowerCase().trim(),
      input.passwordHash,
      input.phone || '',
      input.address || '',
    );
  return findUserById(Number(info.lastInsertRowid))!;
}

interface OrderRow {
  id: number;
  order_number: string;
  user_id: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  city: string;
  country: string;
  notes: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  paystack_reference: string | null;
  order_status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  total: number;
  created_at: string;
  updated_at: string;
}

interface OrderItemRow {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  selected_size: string;
  selected_color: string;
  unit_price: number;
  quantity: number;
}

function hydrateOrder(row: OrderRow): Order {
  const itemRows = db
    .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id ASC')
    .all(row.id) as unknown as OrderItemRow[];

  const items: OrderItem[] = itemRows.map((item) => ({
    id: item.id,
    productId: item.product_id,
    productName: item.product_name,
    productImage: item.product_image,
    selectedSize: item.selected_size,
    selectedColor: item.selected_color,
    unitPrice: item.unit_price,
    quantity: item.quantity,
  }));

  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    deliveryAddress: row.delivery_address,
    city: row.city,
    country: row.country,
    notes: row.notes || '',
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    paystackReference: row.paystack_reference,
    orderStatus: row.order_status,
    subtotal: row.subtotal,
    shippingFee: row.shipping_fee,
    total: row.total,
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createOrderRecord(input: {
  userId: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  country: string;
  notes: string;
  paymentMethod: PaymentMethod;
  items: { productId: number; selectedSize: string; selectedColor: string; quantity: number }[];
}): Order {
  db.exec('BEGIN IMMEDIATE');
  try {
    let subtotal = 0;
    const verifiedItems: {
      product: Product;
      selectedSize: string;
      selectedColor: string;
      quantity: number;
    }[] = [];

    for (const reqItem of input.items) {
      const product = getProductById(reqItem.productId);
      if (!product) {
        throw new Error(`Product #${reqItem.productId} no longer exists.`);
      }
      if (reqItem.quantity <= 0 || !Number.isInteger(reqItem.quantity)) {
        throw new Error(`Invalid quantity for ${product.name}.`);
      }
      if (product.stock < reqItem.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}. Only ${product.stock} unit${product.stock === 1 ? '' : 's'} remaining.`,
        );
      }
      subtotal += product.price * reqItem.quantity;
      verifiedItems.push({
        product,
        selectedSize: reqItem.selectedSize || product.sizes[0] || '',
        selectedColor: reqItem.selectedColor || product.colors[0] || '',
        quantity: reqItem.quantity,
      });
    }

    const shippingFee = subtotal >= 500 || subtotal === 0 ? 0 : 25;
    const total = subtotal + shippingFee;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `TBL-${new Date().getFullYear()}-${randomSuffix}`;
    const paystackReference =
      input.paymentMethod === 'paystack' ? `PSK-${orderNumber}-${Date.now()}` : null;
    const paymentStatus: PaymentStatus =
      input.paymentMethod === 'paystack' ? 'pending' : 'pay_on_delivery';
    const orderStatus: OrderStatus =
      input.paymentMethod === 'paystack' ? 'pending_payment' : 'pending_confirmation';

    const orderInfo = db
      .prepare(
        `INSERT INTO orders (
          order_number, user_id, customer_name, customer_email, customer_phone,
          delivery_address, city, country, notes, payment_method, payment_status,
          paystack_reference, order_status, subtotal, shipping_fee, total
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        orderNumber,
        input.userId,
        input.customerName.trim(),
        input.customerEmail.toLowerCase().trim(),
        input.customerPhone.trim(),
        input.deliveryAddress.trim(),
        input.city.trim(),
        input.country.trim(),
        input.notes.trim(),
        input.paymentMethod,
        paymentStatus,
        paystackReference,
        orderStatus,
        subtotal,
        shippingFee,
        total,
      );

    const orderId = Number(orderInfo.lastInsertRowid);
    const insertItemStmt = db.prepare(`
      INSERT INTO order_items (
        order_id, product_id, product_name, product_image, selected_size, selected_color, unit_price, quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const decrementStockStmt = db.prepare(`
      UPDATE products
      SET stock = stock - ?, popularity_score = popularity_score + ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    for (const item of verifiedItems) {
      insertItemStmt.run(
        orderId,
        item.product.id,
        item.product.name,
        item.product.images[0] || '',
        item.selectedSize,
        item.selectedColor,
        item.product.price,
        item.quantity,
      );
      decrementStockStmt.run(item.quantity, item.quantity * 2, item.product.id);
    }

    db.exec('COMMIT');
    return getOrderByNumber(orderNumber)!;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function getOrderByNumber(orderNumber: string): Order | null {
  const row = db
    .prepare('SELECT * FROM orders WHERE order_number = ?')
    .get(orderNumber.trim().toUpperCase()) as OrderRow | undefined;
  return row ? hydrateOrder(row) : null;
}

export function getOrderByPaystackReference(reference: string): Order | null {
  const row = db
    .prepare('SELECT * FROM orders WHERE paystack_reference = ?')
    .get(reference) as OrderRow | undefined;
  return row ? hydrateOrder(row) : null;
}

export function getOrdersByUserId(userId: number): Order[] {
  const rows = db
    .prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC')
    .all(userId) as unknown as OrderRow[];
  return rows.map(hydrateOrder);
}

export function getAllOrders(): Order[] {
  const rows = db.prepare('SELECT * FROM orders ORDER BY id DESC').all() as unknown as OrderRow[];
  return rows.map(hydrateOrder);
}

export function updateOrderStatuses(
  id: number,
  updates: { orderStatus?: OrderStatus; paymentStatus?: PaymentStatus },
): Order | null {
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as OrderRow | undefined;
  if (!existing) return null;

  const nextOrderStatus = updates.orderStatus || existing.order_status;
  const nextPaymentStatus = updates.paymentStatus || existing.payment_status;

  db.prepare(
    `UPDATE orders SET order_status = ?, payment_status = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(nextOrderStatus, nextPaymentStatus, id);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as unknown as OrderRow;
  return hydrateOrder(updated);
}

export function getAdminOverview(): AdminOverview {
  const totalOrders = (
    db.prepare('SELECT COUNT(*) as c FROM orders').get() as { c: number }
  ).c;
  const totalProducts = (
    db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number }
  ).c;
  const lowStockCount = (
    db.prepare('SELECT COUNT(*) as c FROM products WHERE stock <= 5').get() as { c: number }
  ).c;
  const pendingOrdersCount = (
    db
      .prepare(
        "SELECT COUNT(*) as c FROM orders WHERE order_status IN ('pending_payment', 'pending_confirmation', 'processing')",
      )
      .get() as { c: number }
  ).c;
  const revenueRow = db
    .prepare(
      "SELECT COALESCE(SUM(total), 0) as rev FROM orders WHERE order_status != 'cancelled' AND (payment_status = 'paid' OR order_status IN ('processing', 'shipped', 'delivered'))",
    )
    .get() as { rev: number };

  return {
    totalOrders,
    totalProducts,
    lowStockCount,
    confirmedRevenue: revenueRow.rev || 0,
    pendingOrdersCount,
  };
}

export function saveNewsletterSubscriber(email: string): { alreadySubscribed: boolean } {
  const normalized = email.toLowerCase().trim();
  const existing = db
    .prepare('SELECT id FROM newsletter_subscribers WHERE email = ?')
    .get(normalized);
  if (existing) return { alreadySubscribed: true };
  db.prepare('INSERT INTO newsletter_subscribers (email) VALUES (?)').run(normalized);
  return { alreadySubscribed: false };
}

export function saveContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): void {
  db.prepare(
    'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
  ).run(input.name.trim(), input.email.toLowerCase().trim(), input.subject.trim(), input.message.trim());
}
