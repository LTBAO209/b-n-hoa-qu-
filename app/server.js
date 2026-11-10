'use strict';

/* =========================================================
   Hoa Quả Nhà Trồng - server Express + SQLite (node:sqlite)
   Chạy: npm start  ->  http://localhost:3000
   ========================================================= */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const { DatabaseSync } = require('node:sqlite');
const seed = require('./seed-data');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(__dirname, 'data');
const IMAGE_DIR = path.join(ROOT, 'image');
fs.mkdirSync(DATA_DIR, { recursive: true });

const PORT = Number(process.env.PORT) || 3000;
const SHIPPING_FEE = 30000;
const FREE_SHIPPING_FROM = 300000;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const ORDER_STATUSES = ['Mới', 'Đang giao', 'Hoàn tất', 'Hủy'];

/* ----------------------------- Database ----------------------------- */
const db = new DatabaseSync(path.join(DATA_DIR, 'shop.db'));
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL,
  old_price INTEGER,
  unit TEXT NOT NULL DEFAULT 'kg',
  origin TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  stock INTEGER NOT NULL DEFAULT 0,
  sold INTEGER NOT NULL DEFAULT 0,
  badge TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  payment TEXT NOT NULL DEFAULT '',
  delivery TEXT NOT NULL DEFAULT '',
  subtotal INTEGER NOT NULL,
  shipping INTEGER NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'Mới',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  qty INTEGER NOT NULL,
  unit TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Mới',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
`);

const all = (sql, ...params) => db.prepare(sql).all(...params);
const get = (sql, ...params) => db.prepare(sql).get(...params);
const run = (sql, ...params) => db.prepare(sql).run(...params);

function transaction(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

/* ----------------------------- Tiện ích ----------------------------- */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return salt + ':' + hash;
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(String(password), salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

function cleanText(value, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function toInt(value, fallback = NaN) {
  const number = Number(value);
  return Number.isInteger(number) ? number : fallback;
}

function slugify(text) {
  const base = String(text)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'san-pham';
}

function uniqueProductSlug(name, excludeId) {
  const base = slugify(name);
  let candidate = base;
  let index = 2;
  while (get('SELECT id FROM products WHERE slug = ? AND id != ?', candidate, excludeId || 0)) {
    candidate = base + '-' + index;
    index += 1;
  }
  return candidate;
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

const PRODUCT_SELECT = `
  SELECT p.*, c.slug AS category_slug, c.name AS category_name
  FROM products p LEFT JOIN categories c ON c.id = p.category_id
`;

function mapProduct(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: row.price,
    oldPrice: row.old_price,
    unit: row.unit,
    origin: row.origin,
    image: row.image,
    stock: row.stock,
    sold: row.sold,
    badge: row.badge,
    active: Boolean(row.active),
    categoryId: row.category_id,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    discount: row.old_price && row.old_price > row.price
      ? Math.round((1 - row.price / row.old_price) * 100)
      : 0
  };
}

function mapOrder(row) {
  return {
    id: row.id,
    code: row.code,
    userId: row.user_id,
    customerName: row.customer_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    note: row.note,
    payment: row.payment,
    delivery: row.delivery,
    subtotal: row.subtotal,
    shipping: row.shipping,
    total: row.total,
    status: row.status,
    createdAt: row.created_at,
    items: all('SELECT product_id, name, price, qty, unit FROM order_items WHERE order_id = ? ORDER BY id', row.id)
      .map((item) => ({
        productId: item.product_id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        unit: item.unit
      }))
  };
}

function orderCode() {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const code = 'HQ' + Date.now().toString().slice(-6) + crypto.randomInt(10, 99);
    if (!get('SELECT id FROM orders WHERE code = ?', code)) return code;
  }
  return 'HQ' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

/* ------------------------------ Seed -------------------------------- */
function seedDatabase() {
  if (get('SELECT COUNT(*) AS count FROM categories').count > 0) return false;

  const now = new Date().toISOString();
  const categoryIds = {};
  for (const category of seed.categories) {
    const result = run('INSERT INTO categories (slug, name) VALUES (?, ?)', category.slug, category.name);
    categoryIds[category.slug] = Number(result.lastInsertRowid);
  }

  const productIds = {};
  for (const product of seed.products) {
    const result = run(
      `INSERT INTO products
        (slug, name, description, price, old_price, unit, origin, image, category_id, stock, sold, badge, active, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      product.slug, product.name, product.description || '', product.price,
      product.oldPrice ?? null, product.unit || 'kg', product.origin || '',
      product.image, categoryIds[product.category] ?? null,
      product.stock || 0, product.sold || 0, product.badge || '', now
    );
    productIds[product.slug] = Number(result.lastInsertRowid);
  }

  const userIds = {};
  for (const user of seed.users) {
    const result = run(
      'INSERT INTO users (name, email, password, phone, address, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      user.name, user.email.toLowerCase(), hashPassword(user.password),
      user.phone || '', user.address || '', user.role || 'customer', now
    );
    userIds[user.email.toLowerCase()] = Number(result.lastInsertRowid);
  }

  for (const order of seed.demoOrders) {
    const lines = order.items
      .map((item) => ({ product: get('SELECT * FROM products WHERE id = ?', productIds[item.slug]), qty: item.qty }))
      .filter((line) => line.product);
    const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
    const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
    const createdAt = new Date(Date.now() - order.hoursAgo * 3600 * 1000).toISOString();
    const result = run(
      `INSERT INTO orders
        (code, user_id, customer_name, phone, email, address, note, payment, delivery, subtotal, shipping, total, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      orderCode(), userIds[order.customerEmail] ?? null, order.customerName, order.phone,
      order.customerEmail, order.address, order.note, order.payment, order.delivery,
      subtotal, shipping, subtotal + shipping, order.status, createdAt
    );
    const orderId = Number(result.lastInsertRowid);
    for (const line of lines) {
      run(
        'INSERT INTO order_items (order_id, product_id, name, price, qty, unit) VALUES (?, ?, ?, ?, ?, ?)',
        orderId, line.product.id, line.product.name, line.product.price, line.qty, line.product.unit
      );
    }
  }

  return true;
}

const seeded = seedDatabase();
run('DELETE FROM sessions WHERE expires_at < ?', Date.now());

/* ------------------------------ App -------------------------------- */
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '200kb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

function parseCookies(header) {
  const cookies = {};
  String(header || '').split(';').forEach((part) => {
    const index = part.indexOf('=');
    if (index === -1) return;
    cookies[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  });
  return cookies;
}

app.use((req, res, next) => {
  req.user = null;
  const token = parseCookies(req.headers.cookie).sid;
  if (token) {
    const row = get(
      `SELECT u.id, u.name, u.email, u.phone, u.address, u.role
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > ?`,
      token, Date.now()
    );
    if (row) req.user = row;
  }
  next();
});

/* Chặn request ghi dữ liệu từ origin lạ (CSRF cơ bản) */
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin;
    if (origin) {
      let host = '';
      try { host = new URL(origin).host; } catch (err) { host = ''; }
      if (host && host !== req.headers.host) {
        return res.status(403).json({ error: 'Yêu cầu không hợp lệ.' });
      }
    }
  }
  next();
});

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục.' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bạn không có quyền truy cập trang quản trị.' });
  }
  next();
}

function startSession(userId, res) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  run('INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
    token, userId, expiresAt, new Date().toISOString());
  res.setHeader('Set-Cookie',
    `sid=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`);
}

function publicUser(user) {
  return {
    id: user.id, name: user.name, email: user.email,
    phone: user.phone || '', address: user.address || '', role: user.role
  };
}

/* ------------------------------ API: chung -------------------------- */
app.get('/api/meta', (req, res) => {
  res.json({
    categories: all('SELECT id, slug, name FROM categories ORDER BY id'),
    shipping: { fee: SHIPPING_FEE, freeFrom: FREE_SHIPPING_FROM }
  });
});

app.get('/api/products', (req, res) => {
  const where = ['p.active = 1'];
  const params = [];

  if (req.query.ids) {
    const ids = String(req.query.ids).split(',').map((value) => toInt(value)).filter(Boolean);
    if (!ids.length) return res.json({ products: [], total: 0, page: 1, limit: 0 });
    where.push(`p.id IN (${ids.map(() => '?').join(',')})`);
    params.push(...ids);
  }

  const search = cleanText(req.query.q, 80);
  if (search) {
    where.push('(p.name LIKE ? OR p.description LIKE ? OR p.origin LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (req.query.category) {
    where.push('c.slug = ?');
    params.push(cleanText(req.query.category, 60));
  }
  if (req.query.sale === '1') {
    where.push('p.old_price IS NOT NULL AND p.old_price > p.price');
  }
  const min = toInt(req.query.min);
  if (Number.isFinite(min) && min > 0) {
    where.push('p.price >= ?');
    params.push(min);
  }
  const max = toInt(req.query.max);
  if (Number.isFinite(max) && max > 0) {
    where.push('p.price < ?');
    params.push(max);
  }

  const sort = {
    'price-asc': 'p.price ASC',
    'price-desc': 'p.price DESC',
    'sold': 'p.sold DESC, p.id DESC',
    'name': 'p.name ASC'
  }[req.query.sort] || 'p.sold DESC, p.id DESC';

  const limit = Math.min(Math.max(toInt(req.query.limit, 9) || 9, 1), 60);
  const page = Math.max(toInt(req.query.page, 1) || 1, 1);
  const total = get(
    `SELECT COUNT(*) AS count FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE ${where.join(' AND ')}`, ...params
  ).count;

  const rows = all(
    `${PRODUCT_SELECT} WHERE ${where.join(' AND ')} ORDER BY ${sort} LIMIT ? OFFSET ?`,
    ...params, limit, (page - 1) * limit
  );

  res.json({ products: rows.map(mapProduct), total, page, limit });
});

app.get('/api/products/:slug', (req, res) => {
  const row = get(`${PRODUCT_SELECT} WHERE p.slug = ? AND p.active = 1`, req.params.slug);
  if (!row) throw httpError(404, 'Không tìm thấy sản phẩm.');
  const product = mapProduct(row);

  let related = all(
    `${PRODUCT_SELECT} WHERE p.active = 1 AND p.id != ? AND p.category_id = ? ORDER BY p.sold DESC LIMIT 3`,
    product.id, product.categoryId
  ).map(mapProduct);

  if (related.length < 3) {
    const exclude = [product.id, ...related.map((item) => item.id)];
    related = related.concat(all(
      `${PRODUCT_SELECT} WHERE p.active = 1 AND p.id NOT IN (${exclude.map(() => '?').join(',')})
       ORDER BY p.sold DESC LIMIT ?`,
      ...exclude, 3 - related.length
    ).map(mapProduct));
  }

  res.json({ product, related });
});

/* ------------------------------ API: tài khoản ----------------------- */
app.post('/api/auth/register', (req, res) => {
  const name = cleanText(req.body && req.body.name, 80);
  const email = cleanText(req.body && req.body.email, 160).toLowerCase();
  const password = String((req.body && req.body.password) || '');
  const phone = cleanText(req.body && req.body.phone, 20);

  if (name.length < 2) throw httpError(400, 'Vui lòng nhập họ tên (ít nhất 2 ký tự).');
  if (!isEmail(email)) throw httpError(400, 'Email không hợp lệ.');
  if (password.length < 6) throw httpError(400, 'Mật khẩu phải có ít nhất 6 ký tự.');
  if (get('SELECT id FROM users WHERE email = ?', email)) {
    throw httpError(409, 'Email này đã được sử dụng.');
  }

  const result = run(
    'INSERT INTO users (name, email, password, phone, address, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    name, email, hashPassword(password), phone, '', 'customer', new Date().toISOString()
  );
  const user = get('SELECT * FROM users WHERE id = ?', Number(result.lastInsertRowid));
  startSession(user.id, res);
  res.status(201).json({ user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const email = cleanText(req.body && req.body.email, 160).toLowerCase();
  const password = String((req.body && req.body.password) || '');
  const user = get('SELECT * FROM users WHERE email = ?', email);
  if (!user || !verifyPassword(password, user.password)) {
    throw httpError(401, 'Email hoặc mật khẩu không đúng.');
  }
  startSession(user.id, res);
  res.json({ user: publicUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  const token = parseCookies(req.headers.cookie).sid;
  if (token) run('DELETE FROM sessions WHERE token = ?', token);
  res.setHeader('Set-Cookie', 'sid=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ user: req.user ? publicUser(req.user) : null });
});

app.put('/api/auth/profile', requireAuth, (req, res) => {
  const name = cleanText(req.body && req.body.name, 80);
  const phone = cleanText(req.body && req.body.phone, 20);
  const address = cleanText(req.body && req.body.address, 200);
  if (name.length < 2) throw httpError(400, 'Vui lòng nhập họ tên (ít nhất 2 ký tự).');
  run('UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?', name, phone, address, req.user.id);
  const user = get('SELECT * FROM users WHERE id = ?', req.user.id);
  res.json({ user: publicUser(user) });
});

/* ------------------------------ API: đơn hàng ----------------------- */
app.post('/api/orders', (req, res) => {
  const body = req.body || {};
  const rawItems = Array.isArray(body.items) ? body.items.slice(0, 40) : [];
  if (!rawItems.length) throw httpError(400, 'Giỏ hàng đang trống.');

  const customerName = cleanText(body.name, 80);
  const phone = cleanText(body.phone, 20);
  const address = cleanText(body.address, 200);
  const email = cleanText(body.email, 160);
  const note = cleanText(body.note, 400);
  const payment = cleanText(body.payment, 60) || 'Thanh toán khi nhận hàng (COD)';
  const delivery = cleanText(body.delivery, 80) || 'Giao nhanh trong 2 giờ (nội thành TP.HCM)';

  if (customerName.length < 2) throw httpError(400, 'Vui lòng nhập họ tên người nhận.');
  if (!/^0[0-9]{9,10}$/.test(phone)) throw httpError(400, 'Số điện thoại không hợp lệ (10-11 số, bắt đầu bằng 0).');
  if (address.length < 8) throw httpError(400, 'Vui lòng nhập địa chỉ giao hàng chi tiết.');
  if (email && !isEmail(email)) throw httpError(400, 'Email không hợp lệ.');

  const lines = [];
  for (const item of rawItems) {
    const id = toInt(item && item.id);
    const qty = Math.min(Math.max(toInt(item && item.qty, 1) || 1, 1), 99);
    const product = get('SELECT * FROM products WHERE id = ? AND active = 1', id);
    if (!product) throw httpError(400, 'Có sản phẩm không còn bán, vui lòng tải lại giỏ hàng.');
    lines.push({ product, qty });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  const shipping = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;
  const code = orderCode();

  const order = transaction(() => {
    const createdAt = new Date().toISOString();
    const result = run(
      `INSERT INTO orders
        (code, user_id, customer_name, phone, email, address, note, payment, delivery, subtotal, shipping, total, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Mới', ?)`,
      code, req.user ? req.user.id : null, customerName, phone, email, address, note,
      payment, delivery, subtotal, shipping, total, createdAt
    );
    const orderId = Number(result.lastInsertRowid);

    for (const line of lines) {
      const fresh = get('SELECT stock FROM products WHERE id = ?', line.product.id);
      if (!fresh || fresh.stock < line.qty) {
        throw httpError(409, `"${line.product.name}" chỉ còn ${fresh ? fresh.stock : 0} ${line.product.unit}. Vui lòng giảm số lượng.`);
      }
      run('UPDATE products SET stock = stock - ?, sold = sold + ? WHERE id = ?', line.qty, line.qty, line.product.id);
      run(
        'INSERT INTO order_items (order_id, product_id, name, price, qty, unit) VALUES (?, ?, ?, ?, ?, ?)',
        orderId, line.product.id, line.product.name, line.product.price, line.qty, line.product.unit
      );
    }

    return get('SELECT * FROM orders WHERE id = ?', orderId);
  });

  res.status(201).json({ order: mapOrder(order) });
});

app.get('/api/orders/my', requireAuth, (req, res) => {
  const orders = all('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', req.user.id).map(mapOrder);
  res.json({ orders });
});

/* ------------------------------ API: liên hệ ------------------------ */
app.post('/api/messages', (req, res) => {
  const body = req.body || {};
  const name = cleanText(body.name, 80);
  const phone = cleanText(body.phone, 20);
  const content = cleanText(body.content, 2000);
  const email = cleanText(body.email, 160);
  const subject = cleanText(body.subject, 120) || 'Tin nhắn liên hệ';

  if (name.length < 2) throw httpError(400, 'Vui lòng nhập họ tên.');
  if (!/^0[0-9]{9,10}$/.test(phone)) throw httpError(400, 'Số điện thoại không hợp lệ.');
  if (content.length < 5) throw httpError(400, 'Vui lòng nhập nội dung tin nhắn.');
  if (email && !isEmail(email)) throw httpError(400, 'Email không hợp lệ.');

  run(
    'INSERT INTO messages (user_id, name, email, phone, subject, content, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    req.user ? req.user.id : null, name, email, phone, subject, content, 'Mới', new Date().toISOString()
  );
  res.status(201).json({ ok: true, message: 'Đã gửi tin nhắn, cửa hàng sẽ phản hồi trong 24 giờ.' });
});

/* ------------------------------ API: quản trị ----------------------- */
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const revenue = get("SELECT COALESCE(SUM(total), 0) AS value FROM orders WHERE status != 'Hủy'").value;
  res.json({
    revenue,
    orderCount: get('SELECT COUNT(*) AS count FROM orders').count,
    newOrders: get("SELECT COUNT(*) AS count FROM orders WHERE status = 'Mới'").count,
    customerCount: get("SELECT COUNT(*) AS count FROM users WHERE role = 'customer'").count,
    productCount: get('SELECT COUNT(*) AS count FROM products').count,
    newMessages: get("SELECT COUNT(*) AS count FROM messages WHERE status = 'Mới'").count,
    byStatus: all('SELECT status, COUNT(*) AS count FROM orders GROUP BY status'),
    topProducts: all('SELECT name, sold, stock, image, price FROM products ORDER BY sold DESC LIMIT 5'),
    lowStock: all(`${PRODUCT_SELECT} WHERE p.active = 1 AND p.stock <= 20 ORDER BY p.stock ASC LIMIT 5`).map(mapProduct),
    recentOrders: all('SELECT * FROM orders ORDER BY id DESC LIMIT 6').map(mapOrder)
  });
});

app.get('/api/admin/products', requireAdmin, (req, res) => {
  const products = all(`${PRODUCT_SELECT} ORDER BY p.id DESC`).map(mapProduct);
  res.json({ products });
});

app.get('/api/admin/images', requireAdmin, (req, res) => {
  let files = [];
  try {
    files = fs.readdirSync(IMAGE_DIR)
      .filter((file) => /\.(jpe?g|png|webp|svg)$/i.test(file))
      .sort()
      .map((file) => '/image/' + file);
  } catch (err) {
    files = [];
  }
  res.json({ images: files });
});

app.post('/api/admin/products', requireAdmin, (req, res) => {
  const body = req.body || {};
  const name = cleanText(body.name, 120);
  const price = toInt(body.price);
  const stock = toInt(body.stock, 0);
  const categoryId = toInt(body.categoryId);
  const image = cleanText(body.image, 200);

  if (name.length < 2) throw httpError(400, 'Vui lòng nhập tên sản phẩm.');
  if (!Number.isFinite(price) || price <= 0) throw httpError(400, 'Giá bán phải là số dương.');
  if (!Number.isFinite(stock) || stock < 0) throw httpError(400, 'Số lượng không hợp lệ.');
  if (!get('SELECT id FROM categories WHERE id = ?', categoryId)) throw httpError(400, 'Danh mục không hợp lệ.');
  if (!image.startsWith('/image/')) throw httpError(400, 'Vui lòng chọn ảnh sản phẩm.');

  const oldPrice = toInt(body.oldPrice);
  const result = run(
    `INSERT INTO products
      (slug, name, description, price, old_price, unit, origin, image, category_id, stock, sold, badge, active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    uniqueProductSlug(name), name, cleanText(body.description, 1000),
    price, Number.isFinite(oldPrice) && oldPrice > price ? oldPrice : null,
    cleanText(body.unit, 20) || 'kg', cleanText(body.origin, 60) || 'Việt Nam',
    image, categoryId, stock, cleanText(body.badge, 40),
    body.active === false ? 0 : 1, new Date().toISOString()
  );
  res.status(201).json({ product: mapProduct(get(`${PRODUCT_SELECT} WHERE p.id = ?`, Number(result.lastInsertRowid))) });
});

app.put('/api/admin/products/:id', requireAdmin, (req, res) => {
  const id = toInt(req.params.id);
  const current = get('SELECT * FROM products WHERE id = ?', id);
  if (!current) throw httpError(404, 'Không tìm thấy sản phẩm.');

  const body = req.body || {};
  const name = body.name === undefined ? current.name : cleanText(body.name, 120);
  const price = body.price === undefined ? current.price : toInt(body.price);
  const stock = body.stock === undefined ? current.stock : toInt(body.stock, 0);
  const categoryId = body.categoryId === undefined ? current.category_id : toInt(body.categoryId);
  const image = body.image === undefined ? current.image : cleanText(body.image, 200);
  const oldPrice = body.oldPrice === undefined ? current.old_price : toInt(body.oldPrice);

  if (name.length < 2) throw httpError(400, 'Vui lòng nhập tên sản phẩm.');
  if (!Number.isFinite(price) || price <= 0) throw httpError(400, 'Giá bán phải là số dương.');
  if (!Number.isFinite(stock) || stock < 0) throw httpError(400, 'Số lượng không hợp lệ.');
  if (!get('SELECT id FROM categories WHERE id = ?', categoryId)) throw httpError(400, 'Danh mục không hợp lệ.');
  if (!image.startsWith('/image/')) throw httpError(400, 'Vui lòng chọn ảnh sản phẩm.');

  run(
    `UPDATE products SET
      name = ?, description = ?, price = ?, old_price = ?, unit = ?, origin = ?,
      image = ?, category_id = ?, stock = ?, badge = ?, active = ?
     WHERE id = ?`,
    name,
    body.description === undefined ? current.description : cleanText(body.description, 1000),
    price,
    Number.isFinite(oldPrice) && oldPrice > price ? oldPrice : null,
    body.unit === undefined ? current.unit : (cleanText(body.unit, 20) || 'kg'),
    body.origin === undefined ? current.origin : cleanText(body.origin, 60),
    image, categoryId, stock,
    body.badge === undefined ? current.badge : cleanText(body.badge, 40),
    body.active === undefined ? current.active : (body.active ? 1 : 0),
    id
  );

  res.json({ product: mapProduct(get(`${PRODUCT_SELECT} WHERE p.id = ?`, id)) });
});

app.delete('/api/admin/products/:id', requireAdmin, (req, res) => {
  const id = toInt(req.params.id);
  const product = get('SELECT * FROM products WHERE id = ?', id);
  if (!product) throw httpError(404, 'Không tìm thấy sản phẩm.');
  run('DELETE FROM products WHERE id = ?', id);
  res.json({ ok: true });
});

app.get('/api/admin/orders', requireAdmin, (req, res) => {
  const status = cleanText(req.query.status, 20);
  const rows = status
    ? all('SELECT * FROM orders WHERE status = ? ORDER BY id DESC', status)
    : all('SELECT * FROM orders ORDER BY id DESC');
  res.json({ orders: rows.map(mapOrder) });
});

app.patch('/api/admin/orders/:id', requireAdmin, (req, res) => {
  const id = toInt(req.params.id);
  const status = cleanText(req.body && req.body.status, 20);
  if (!ORDER_STATUSES.includes(status)) throw httpError(400, 'Trạng thái không hợp lệ.');
  const order = get('SELECT * FROM orders WHERE id = ?', id);
  if (!order) throw httpError(404, 'Không tìm thấy đơn hàng.');
  run('UPDATE orders SET status = ? WHERE id = ?', status, id);
  res.json({ order: mapOrder(get('SELECT * FROM orders WHERE id = ?', id)) });
});

app.get('/api/admin/messages', requireAdmin, (req, res) => {
  const messages = all('SELECT * FROM messages ORDER BY id DESC').map((row) => ({
    id: row.id, userId: row.user_id, name: row.name, email: row.email, phone: row.phone,
    subject: row.subject, content: row.content, status: row.status, createdAt: row.created_at
  }));
  res.json({ messages });
});

app.patch('/api/admin/messages/:id', requireAdmin, (req, res) => {
  const id = toInt(req.params.id);
  const status = cleanText(req.body && req.body.status, 20);
  if (!['Mới', 'Đã xử lý'].includes(status)) throw httpError(400, 'Trạng thái không hợp lệ.');
  if (!get('SELECT id FROM messages WHERE id = ?', id)) throw httpError(404, 'Không tìm thấy tin nhắn.');
  run('UPDATE messages SET status = ? WHERE id = ?', status, id);
  res.json({ ok: true });
});

app.delete('/api/admin/messages/:id', requireAdmin, (req, res) => {
  const id = toInt(req.params.id);
  if (!get('SELECT id FROM messages WHERE id = ?', id)) throw httpError(404, 'Không tìm thấy tin nhắn.');
  run('DELETE FROM messages WHERE id = ?', id);
  res.json({ ok: true });
});

app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = all(`
    SELECT u.id, u.name, u.email, u.phone, u.address, u.role, u.created_at,
           COUNT(o.id) AS order_count, COALESCE(SUM(CASE WHEN o.status != 'Hủy' THEN o.total ELSE 0 END), 0) AS spent
    FROM users u LEFT JOIN orders o ON o.user_id = u.id
    GROUP BY u.id ORDER BY u.id ASC
  `).map((row) => ({
    id: row.id, name: row.name, email: row.email, phone: row.phone, address: row.address,
    role: row.role, createdAt: row.created_at, orderCount: row.order_count, spent: row.spent
  }));
  res.json({ users });
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Không tìm thấy API.' }));

/* ----------------------------- Tệp tĩnh ----------------------------- */
app.use('/image', express.static(IMAGE_DIR, { maxAge: '7d' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], maxAge: '1h' }));

/* ---------------------------- Xử lý lỗi ----------------------------- */
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Dữ liệu gửi lên không hợp lệ.' });
  }
  if (!err || !err.status) console.error(err);
  res.status(err && err.status ? err.status : 500)
    .json({ error: err && err.status ? err.message : 'Có lỗi xảy ra, vui lòng thử lại.' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Hoa Quả Nhà Trồng: http://localhost:${PORT}`);
  console.log(`Khu quản trị:      http://localhost:${PORT}/admin/`);
  if (seeded) {
    console.log('Đã tạo dữ liệu mẫu.');
    console.log('  Admin:   admin@hoaquanhatrong.vn / Admin@123');
    console.log('  Khách:   khach@hoaquanhatrong.vn / Khach@123');
  }
});

function shutdown() {
  server.close(() => {
    try { db.close(); } catch (err) { /* ignore */ }
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
