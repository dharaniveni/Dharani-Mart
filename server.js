const express = require('express');
const session = require('express-session');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

const CATEGORIES = ['Home Grown Vegetables', 'Homemade Items', 'Old Books'];

app.use(express.json({ limit: '12mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

app.use(session({
  secret: process.env.SESSION_SECRET || 'dharnimart-reusehub-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {}
}));

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, '[]');
  }
  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, '[]');
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, '[]');
  }
  if (!fs.existsSync(REVIEWS_FILE)) {
    fs.writeFileSync(REVIEWS_FILE, '[]');
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function readUsers() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (err) {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function readProducts() {
  try {
    return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8'));
  } catch (err) {
    return [];
  }
}

function writeProducts(products) {
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
}

function readOrders() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch (err) {
    return [];
  }
}

function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

function readReviews() {
  try {
    return JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf8'));
  } catch (err) {
    return [];
  }
}

function writeReviews(reviews) {
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const computed = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, 'hex');
  if (computed.length !== expected.length) {
    return false;
  }
  return crypto.timingSafeEqual(computed, expected);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_RE = /^[6-9]\d{9}$/;
const NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,49}$/;

function validateRegistration(body) {
  const errors = {};
  const fullName = String(body.fullName || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const mobile = String(body.mobile || '').trim();
  const dob = String(body.dob || '').trim();
  const password = String(body.password || '');
  const confirmPassword = String(body.confirmPassword || '');

  if (!fullName) {
    errors.fullName = 'Full Name is required.';
  } else if (!NAME_RE.test(fullName)) {
    errors.fullName = 'Enter a valid name using letters, spaces, dots or hyphens.';
  }

  if (!email) {
    errors.email = 'Email Address is required.';
  } else if (!EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!mobile) {
    errors.mobile = 'Mobile Number is required.';
  } else if (!MOBILE_RE.test(mobile)) {
    errors.mobile = 'Enter a valid 10-digit mobile number.';
  }

  if (!dob) {
    errors.dob = 'Date of Birth is required.';
  } else {
    const date = new Date(dob);
    const today = new Date();
    if (isNaN(date.getTime()) || date >= today) {
      errors.dob = 'Enter a valid date of birth in the past.';
    }
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters long.';
  } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    errors.password = 'Password must contain at least one letter and one number.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return { errors, data: { fullName, email, mobile, dob, password } };
}

function validateLogin(body) {
  const errors = {};
  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');

  if (!email) {
    errors.email = 'Email Address is required.';
  } else if (!EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!password) {
    errors.password = 'Password is required.';
  }

  return { errors, data: { email, password } };
}

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

app.get('/order-success', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'order-success.html'));
});

app.get('/my-orders', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'my-orders.html'));
});

app.get('/product/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product-details.html'));
});

app.post('/api/register', (req, res) => {
  const { errors, data } = validateRegistration(req.body || {});
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  const users = readUsers();
  if (users.some((user) => user.email === data.email)) {
    return res.status(400).json({
      success: false,
      errors: { email: 'This email address is already registered. Please go to the login page.' }
    });
  }

  const { salt, hash } = hashPassword(data.password);
  const user = {
    id: crypto.randomUUID(),
    fullName: data.fullName,
    email: data.email,
    mobile: data.mobile,
    dob: data.dob,
    salt,
    hash,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  writeUsers(users);

  return res.json({ success: true, message: 'Account created successfully. Please log in.' });
});

app.post('/api/login', (req, res) => {
  const { errors, data } = validateLogin(req.body || {});
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, message: 'Please enter a valid email and password.', errors });
  }

  const users = readUsers();
  const user = users.find((item) => item.email === data.email);
  if (!user || !verifyPassword(data.password, user.salt, user.hash)) {
    return res.status(400).json({ success: false, message: 'Invalid email or password. Please try again.' });
  }

  req.session.userId = user.id;
  if (req.body.rememberMe) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
  }
  return res.json({ success: true, message: 'Login successful.' });
});

app.get('/api/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  const user = readUsers().find((item) => item.id === req.session.userId);
  if (!user) {
    req.session.destroy(() => {});
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  return res.json({ success: true, user: { fullName: user.fullName, email: user.email } });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    return res.json({ success: true });
  });
});

function isAuthenticated(req) {
  return !!req.session.userId;
}

function saveBase64Image(dataUrl) {
  const match = /^data:image\/(png|jpe?g|gif|webp);base64,(.+)$/.exec(String(dataUrl || ''));
  if (!match) {
    return null;
  }
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) {
    return null;
  }
  const filename = crypto.randomUUID() + '.' + ext;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
  return '/uploads/' + filename;
}

function validateProduct(body) {
  const errors = {};
  const name = String(body.name || '').trim();
  const category = String(body.category || '').trim();
  const description = String(body.description || '').trim();
  const price = Number(body.price);
  const quantity = Number(body.quantity);

  if (!name) {
    errors.name = 'Product Name is required.';
  } else if (name.length > 120) {
    errors.name = 'Product Name must be under 120 characters.';
  }

  if (!CATEGORIES.includes(category)) {
    errors.category = 'Please choose a valid category.';
  }

  if (!description) {
    errors.description = 'Description is required.';
  }

  if (!Number.isFinite(price) || price <= 0) {
    errors.price = 'Enter a valid price greater than zero.';
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    errors.quantity = 'Enter a valid quantity.';
  }

  return {
    errors,
    data: { name, category, description, price, quantity }
  };
}

function validateOrder(body) {
  const errors = {};
  const customerName = String(body.customerName || '').trim();
  const mobile = String(body.mobile || '').trim();
  const address = String(body.address || '').trim();

  if (!customerName) {
    errors.customerName = 'Customer Name is required.';
  } else if (!NAME_RE.test(customerName)) {
    errors.customerName = 'Enter a valid name using letters, spaces, dots or hyphens.';
  }

  if (!mobile) {
    errors.mobile = 'Mobile Number is required.';
  } else if (!MOBILE_RE.test(mobile)) {
    errors.mobile = 'Enter a valid 10-digit mobile number.';
  }

  if (!address) {
    errors.address = 'Delivery Address is required.';
  } else if (address.length < 10) {
    errors.address = 'Please enter a complete delivery address.';
  } else if (address.length > 300) {
    errors.address = 'Delivery Address must be under 300 characters.';
  }

  return { errors, data: { customerName, mobile, address } };
}

function validateReview(body) {
  const errors = {};
  const productId = String(body.productId || '').trim();
  const rating = Number(body.rating);
  const review = String(body.review || '').trim();

  if (!productId) {
    errors.productId = 'Product is required.';
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = 'Please select a rating from 1 to 5 stars.';
  }

  if (!review) {
    errors.review = 'Review is required. Please write a short review.';
  } else if (review.length > 1000) {
    errors.review = 'Review must be under 1000 characters.';
  }

  return { errors, data: { productId, rating, review } };
}

app.get('/api/reviews', (req, res) => {
  const productId = String(req.query.productId || '').trim();
  let reviews = readReviews();
  if (productId) {
    reviews = reviews.filter((item) => item.productId === productId);
  }
  reviews.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const reviewCount = reviews.length;
  const averageRating = reviewCount === 0 ? 0 : reviews.reduce(function (sum, review) {
    return sum + review.rating;
  }, 0) / reviewCount;
  return res.json({ success: true, reviews, averageRating, reviewCount });
});

app.post('/api/reviews', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ success: false, message: 'You must be logged in to submit a review.' });
  }

  const { errors, data } = validateReview(req.body || {});
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  const products = readProducts();
  if (!products.some((item) => item.id === data.productId)) {
    return res.status(400).json({ success: false, message: 'Product not found.' });
  }

  const users = readUsers();
  const user = users.find((item) => item.id === req.session.userId);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  const review = {
    id: crypto.randomUUID(),
    productId: data.productId,
    userId: user.id,
    reviewerName: user.fullName,
    rating: data.rating,
    review: data.review,
    createdAt: new Date().toISOString()
  };

  const reviews = readReviews();
  reviews.unshift(review);
  writeReviews(reviews);

  return res.json({ success: true, message: 'Review submitted successfully.', review });
});

app.get('/api/categories', (req, res) => {
  res.json({ success: true, categories: CATEGORIES });
});

app.get('/api/products', (req, res) => {
  const products = readProducts();
  res.json({ success: true, products });
});

app.get('/api/products/:id', (req, res) => {
  const product = readProducts().find((item) => item.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }
  res.json({ success: true, product });
});

app.post('/api/products', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ success: false, message: 'You must be logged in to add products.' });
  }

  const { errors, data } = validateProduct(req.body || {});
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  const image = saveBase64Image(req.body.image);
  const product = {
    id: crypto.randomUUID(),
    name: data.name,
    category: data.category,
    description: data.description,
    price: data.price,
    quantity: data.quantity,
    image,
    sellerId: req.session.userId,
    createdAt: new Date().toISOString()
  };

  const products = readProducts();
  products.unshift(product);
  writeProducts(products);

  return res.json({ success: true, message: 'Product added successfully.', product });
});

app.post('/api/orders', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ success: false, message: 'You must be logged in to place an order.' });
  }

  const { errors, data } = validateOrder(req.body || {});
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  const bodyItems = Array.isArray(req.body.items) ? req.body.items : [];
  const products = readProducts();
  const items = [];
  const seen = {};

  for (const line of bodyItems) {
    const productId = String(line && line.productId || '');
    if (!productId || seen[productId]) {
      continue;
    }
    seen[productId] = true;
    const qty = Math.max(1, Math.min(Number(line.qty) || 1, 1000));
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return res.status(400).json({ success: false, message: 'One of the selected items is no longer available. Please review your cart.' });
    }
    const available = Number(product.quantity);
    if (!Number.isFinite(available) || available <= 0 || qty > available) {
      return res.status(400).json({ success: false, message: 'Insufficient stock for "' + product.name + '". Please review your cart.' });
    }
    items.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
      qty
    });
  }

  if (items.length === 0) {
    return res.status(400).json({ success: false, message: 'Your cart is empty. Add products before placing an order.' });
  }

  const total = items.reduce(function (sum, item) {
    return sum + Number(item.price) * item.qty;
  }, 0);

  const order = {
    id: crypto.randomUUID(),
    userId: req.session.userId,
    customerName: data.customerName,
    mobile: data.mobile,
    address: data.address,
    items,
    total,
    placedAt: new Date().toISOString()
  };

  const orders = readOrders();
  orders.unshift(order);
  writeOrders(orders);

  return res.json({ success: true, message: 'Order placed successfully.', order });
});

app.get('/api/orders', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  const orders = readOrders()
    .filter((item) => item.userId === req.session.userId)
    .sort((a, b) => {
      return new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();
    });
  return res.json({ success: true, orders });
});

app.get('/api/orders/:id', (req, res) => {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  const order = readOrders().find((item) => item.id === req.params.id && item.userId === req.session.userId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }
  return res.json({ success: true, order });
});

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found.' });
});

app.get('*', (req, res) => {
  res.redirect('/');
});

ensureDataFiles();

app.listen(PORT, () => {
  console.log('DharniMart is running at http://localhost:' + PORT);
});