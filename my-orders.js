(function () {
  const ordersCount = document.getElementById('ordersCount');
  const ordersBody = document.getElementById('ordersBody');
  const homeNavBtn = document.getElementById('homeNavBtn');
  const cartNavBtn = document.getElementById('cartNavBtn');
  const cartCount = document.getElementById('cartCount');
  const logoutBtn = document.getElementById('logoutBtn');

  let cart = [];

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

  function categoryIcon(category) {
    if (category === 'Home Grown Vegetables') {
      return '\u{1F33F}';
    }
    if (category === 'Homemade Items') {
      return '\u{1F964}';
    }
    if (category === 'Old Books') {
      return '\u{1F4D6}';
    }
    return '\u{1F4E6}';
  }

  function orderDate(iso) {
    const date = new Date(iso);
    if (isNaN(date.getTime())) {
      return String(iso);
    }
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  function orderBadge(order) {
    const status = order.status || 'Placed';
    return '<span class="order-status">' + esc(status) + '</span>';
  }

  function itemImageHtml(item) {
    if (item.image) {
      return '<img src="' + esc(item.image) + '" alt="' + esc(item.name) + '" />';
    }
    return '<span>' + categoryIcon(item.category) + '</span>';
  }

  function orderCard(order) {
    let rows = '';
    order.items.forEach(function (item) {
      rows +=
        '<div class="receipt-row">' +
          '<div class="summary-img">' + itemImageHtml(item) + '</div>' +
          '<div class="receipt-row-detail">' +
            '<strong>' + esc(item.name) + '</strong>' +
            '<span>' + formatPrice(item.price) + ' &times; ' + item.qty + '</span>' +
          '</div>' +
          '<div class="receipt-row-total">' + formatPrice(item.price * item.qty) + '</div>' +
        '</div>';
    });

    return (
      '<div class="order-card">' +
        '<div class="order-card-head">' +
          '<div>' +
            '<span class="order-id">Order #' + esc(order.id.slice(0, 8).toUpperCase()) + '</span>' +
            '<span class="order-date">Placed on ' + esc(orderDate(order.placedAt)) + '</span>' +
          '</div>' +
          orderBadge(order) +
        '</div>' +
        '<div class="order-address">' +
          '<span class="label">Delivery Address</span>' +
          '<p>' + esc(order.address) + '</p>' +
        '</div>' +
        '<div class="order-items">' + rows + '</div>' +
        '<div class="order-receipt-total">' +
          '<span class="label">Total Amount</span>' +
          '<span class="total">' + formatPrice(order.total) + '</span>' +
        '</div>' +
      '</div>'
    );
  }

  function renderOrders(orders) {
    ordersCount.textContent = orders.length + (orders.length === 1 ? ' order' : ' orders');

    if (orders.length === 0) {
      ordersBody.innerHTML =
        '<div class="orders-empty">' +
          '<p>You haven\u2019t placed any orders yet.</p>' +
          '<button type="button" class="btn btn-primary" data-browse>Browse Products</button>' +
        '</div>';
      return;
    }

    let cards = '';
    orders.forEach(function (order) {
      cards += orderCard(order);
    });
    ordersBody.innerHTML = '<div class="orders-list">' + cards + '</div>';
  }

  function loadCartCount(key) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '[]');
      cart = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      cart = [];
    }
    cartCount.textContent = cart.reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);
  }

  ordersBody.addEventListener('click', function (event) {
    const browseBtn = event.target.closest('[data-browse]');
    if (browseBtn) {
      window.location.href = '/home';
    }
  });

  homeNavBtn.addEventListener('click', function () {
    window.location.href = '/home';
  });

  cartNavBtn.addEventListener('click', function () {
    window.location.href = '/cart';
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
      .then(function () {
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
        return null;
      }
      loadCartCount('dharnimart_cart_' + result.data.user.email);
      return fetch('/api/orders', { method: 'GET' });
    })
    .then(function (response) {
      if (!response) {
        return null;
      }
      return response.json().then(function (data) {
        return { ok: response.ok, data: data };
      });
    })
    .then(function (result) {
      if (!result || !result.ok || !result.data.success) {
        return;
      }
      renderOrders(result.data.orders);
    })
    .catch(function () {
      redirectToLogin();
    });
})();