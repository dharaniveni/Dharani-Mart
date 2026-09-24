(function () {
  const CATEGORY_ICONS = {
    'Home Grown Vegetables': '\u{1F33F}',
    'Homemade Items': '\u{1F964}',
    'Old Books': '\u{1F4D6}'
  };

  const cartCount = document.getElementById('cartCount');
  const cartCountLabel = document.getElementById('cartCountLabel');
  const cartBody = document.getElementById('cartBody');
  const logoutBtn = document.getElementById('logoutBtn');
  const homeNavBtn = document.getElementById('homeNavBtn');
  const cartNavBtn = document.getElementById('cartNavBtn');
  const myOrdersNavBtn = document.getElementById('myOrdersNavBtn');

  let key = null;
  let cart = [];
  let productMap = {};

  function redirectToLogin() {
    window.location.href = '/';
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatPrice(value) {
    const num = Number(value) || 0;
    return '\u20B9' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function saveCart() {
    localStorage.setItem(key, JSON.stringify(cart));
    updateHeaderCount();
  }

  function loadCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '[]');
      cart = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      cart = [];
    }
    updateHeaderCount();
  }

  function totalQuantity() {
    return cart.reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);
  }

  function updateHeaderCount() {
    cartCount.textContent = totalQuantity();
    cartCountLabel.textContent = cart.length + (cart.length === 1 ? ' item' : ' items');
  }

  function overallTotal() {
    return cart.reduce(function (sum, item) {
      return sum + item.price * item.qty;
    }, 0);
  }

  function productFor(productId) {
    return productMap[productId] || null;
  }

  function canIncrease(item) {
    const product = productFor(item.productId);
    if (!product) {
      return false;
    }
    const available = Number(product.quantity);
    if (!Number.isFinite(available) || available <= 0) {
      return false;
    }
    return item.qty < available;
  }

  function itemImage(item) {
    const product = productFor(item.productId);
    const image = product && product.image ? product.image : item.image;
    if (image) {
      return '<img src="' + esc(image) + '" alt="' + esc(item.name) + '" />';
    }
    const category = product ? product.category : item.category;
    return '<span>' + (CATEGORY_ICONS[category] || '\u{1F4E6}') + '</span>';
  }

  function stockNote(item) {
    const product = productFor(item.productId);
    if (!product) {
      return '<span class="cart-stock-note">No longer available. Please remove this item.</span>';
    }
    const available = Number(product.quantity);
    if (!Number.isFinite(available) || available <= 0) {
      return '<span class="cart-stock-note">Out of stock</span>';
    }
    return '<span class="cart-stock-note">' + available + ' available</span>';
  }

  function renderCart() {
    if (cart.length === 0) {
      cartBody.innerHTML =
        '<div class="cart-empty">' +
          '<p>Your cart is empty.</p>' +
          '<button type="button" class="btn btn-primary" data-browse>Browse Products</button>' +
        '</div>';
      updateHeaderCount();
      return;
    }

    let rows = '';
    cart.forEach(function (item) {
      const product = productFor(item.productId);
      const outOfStock = !product || Number(product.quantity) <= 0;
      const atMax = !canIncrease(item);
      rows +=
        '<div class="cart-row">' +
          '<div class="cart-img">' + itemImage(item) + '</div>' +
          '<div class="cart-name">' +
            '<strong>' + esc(item.name) + '</strong>' +
            '<span>' + formatPrice(item.price) + ' each</span>' +
            stockNote(item) +
          '</div>' +
          '<div class="cart-qty">' +
            '<button type="button" data-cart-dec="' + item.productId + '" aria-label="Decrease quantity"' + (item.qty <= 1 ? ' disabled' : '') + '>&minus;</button>' +
            '<span>' + item.qty + '</span>' +
            '<button type="button" data-cart-inc="' + item.productId + '" aria-label="Increase quantity"' + (atMax || outOfStock ? ' disabled' : '') + '>+</button>' +
          '</div>' +
          '<div class="cart-line-total">' + formatPrice(item.price * item.qty) + '</div>' +
          '<button type="button" class="cart-remove" data-cart-remove="' + item.productId + '" aria-label="Remove item">&times;</button>' +
        '</div>';
    });

    cartBody.innerHTML =
      '<div class="cart-list">' + rows + '</div>' +
      '<div class="cart-summary">' +
        '<span class="label">Overall Total</span>' +
        '<span class="total">' + formatPrice(overallTotal()) + '</span>' +
      '</div>' +
      '<div class="cart-checkout">' +
        '<button type="button" class="btn btn-primary" data-checkout>Proceed to Checkout</button>' +
      '</div>';
    updateHeaderCount();
  }

  function increment(item) {
    if (!item || !canIncrease(item)) {
      return;
    }
    item.qty += 1;
    saveCart();
    renderCart();
  }

  function decrement(item) {
    if (!item || item.qty <= 1) {
      return;
    }
    item.qty -= 1;
    saveCart();
    renderCart();
  }

  function remove(item) {
    cart = cart.filter(function (entry) {
      return entry.productId !== item.productId;
    });
    saveCart();
    renderCart();
  }

  cartBody.addEventListener('click', function (event) {
    const browseBtn = event.target.closest('[data-browse]');
    const incBtn = event.target.closest('[data-cart-inc]');
    const decBtn = event.target.closest('[data-cart-dec]');
    const removeBtn = event.target.closest('[data-cart-remove]');
    const checkoutBtn = event.target.closest('[data-checkout]');

    if (browseBtn) {
      window.location.href = '/home';
      return;
    }
    if (checkoutBtn) {
      window.location.href = '/checkout';
      return;
    }
    if (incBtn) {
      increment(cart.find(function (entry) {
        return entry.productId === incBtn.dataset.cartInc;
      }));
      return;
    }
    if (decBtn) {
      decrement(cart.find(function (entry) {
        return entry.productId === decBtn.dataset.cartDec;
      }));
      return;
    }
    if (removeBtn) {
      remove(cart.find(function (entry) {
        return entry.productId === removeBtn.dataset.cartRemove;
      }));
    }
  });

  homeNavBtn.addEventListener('click', function () {
    window.location.href = '/home';
  });

  cartNavBtn.addEventListener('click', function () {
    window.location.href = '/cart';
  });

  myOrdersNavBtn.addEventListener('click', function () {
    window.location.href = '/my-orders';
  });

  logoutBtn.addEventListener('click', function () {
    logoutBtn.disabled = true;
    logoutBtn.textContent = 'Logging out...';

    fetch('/api/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        redirectToLogin();
      })
      .catch(function () {
        redirectToLogin();
      });
  });

  fetch('/api/me', { method: 'GET' })
    .then(function (response) {
      return response.json().then(function (data) {
        return { ok: response.ok, data: data };
      });
    })
    .then(function (result) {
      if (!result.ok || !result.data.success) {
        redirectToLogin();
        return;
      }
      key = 'dharnimart_cart_' + result.data.user.email;
      loadCart();
      return fetch('/api/products', { method: 'GET' }).then(function (response) {
        return response.json();
      });
    })
    .then(function (data) {
      if (data && data.success) {
        productMap = {};
        data.products.forEach(function (product) {
          productMap[product.id] = product;
        });
      }
      renderCart();
    })
    .catch(function () {
      redirectToLogin();
    });
})();