const crypto = require('crypto');

/**
 * DharaniMart role-based upgrade migrations.
 *
 * These run against the EXISTING dharanimart database using the same
 * connection pool from config/db.js (no duplicate connection). They are
 * additive only: they never delete or overwrite existing data.
 *
 *  1. Adds `users.role` (buyer / seller / admin), defaulting existing rows
 *     to 'buyer'. Users who already own products are promoted to 'seller'
 *     so their existing products keep working.
 *  2. Adds `orders.status` (default 'Placed') for order status management.
 *  3. Seeds one ADMIN account (only if none exists yet) using
 *     ADMIN_EMAIL / ADMIN_PASSWORD env vars (sensible defaults included).
 */
async function columnExists(pool, table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return Number(rows[0].c) > 0;
}

async function runMigrations(pool, helpers) {
  const hashPassword = helpers && helpers.hashPassword ? helpers.hashPassword : null;

  // ---- 1. users.role ----
  if (!(await columnExists(pool, 'users', 'role'))) {
    await pool.query(
      "ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'buyer' AFTER createdAt"
    );
    await pool.query(
      `UPDATE users u
         JOIN (SELECT DISTINCT sellerId FROM products) p ON p.sellerId = u.id
         SET u.role = 'seller'
       WHERE u.role = 'buyer'`
    );
    console.log('Migration: added users.role (existing sellers promoted, all others stay buyers).');
  } else {
    console.log('Migration: users.role already exists, nothing to do.');
  }

  // ---- 2. orders.status ----
  if (!(await columnExists(pool, 'orders', 'status'))) {
    await pool.query(
      "ALTER TABLE orders ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'Placed' AFTER placedAt"
    );
    console.log("Migration: added orders.status (default 'Placed').");
  } else {
    console.log('Migration: orders.status already exists, nothing to do.');
  }

  // ---- 3. seed admin ----
  const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (admins.length > 0) {
    console.log('Migration: admin account already present, skipping seed.');
    return;
  }

  const email = String(process.env.ADMIN_EMAIL || 'admin@dharanimart.com').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@1234';
  const { salt, hash } = hashPassword ? hashPassword(password) : { salt: '', hash: '' };
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  try {
    await pool.query(
      "INSERT INTO users (id, fullName, email, mobile, dob, salt, hash, createdAt, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'admin')",
      [id, 'DharniMart Admin', email, '9999999999', null, salt, hash, createdAt]
    );
    console.log('Migration: seeded admin account -> ' + email + ' (password: ' + password + ')');
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      // An account with this email already exists - promote it to admin.
      await pool.query("UPDATE users SET role = 'admin' WHERE email = ?", [email]);
      console.log('Migration: promoted existing account to admin -> ' + email);
    } else {
      throw err;
    }
  }
}

module.exports = { runMigrations, columnExists };