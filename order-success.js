(function () {
  const orderMeta = document.getElementById('orderMeta');
  const orderDetails = document.getElementById('orderDetails');
  const orderReceipt = document.getElementById('orderReceipt');
  const homeBtn = document.getElementById('homeBtn');
  const homeNavBtn = document.getElementById('homeNavBtn');
  const cartNavBtn = document.getElementById('cartNavBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const myOrdersNavBtn = document.getElementById('myOrdersNavBtn');

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

  function orderIdFromQuery() {
    return new URLSearchParams(window.location.search).get('id') || '';
  }

  function renderOrder(order) {
    const placedOn = new Date(order.placedAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    orderMeta.textContent = 'Order ' + order.id.slice(0, 8).toUpperCase() + ' placed on ' + placedOn + '. Your order is confirmed and will be delivered to the address below.';

    orderDetails.innerHTML =
      '<div class="order-meta-row">' +
        '<span>Customer Name</span><strong>' + esc(order.customerName) + '</strong>' +
      '</div>' +
      '<div class="order-meta-row">' +
        '<span>Mobile Number</span><strong>' + esc(order.mobile) + '</strong>' +
      '</div>' +
      '<div class="order-meta-row">' +
        '<span>Delivery Address</span><strong>' + esc(order.address) + '</strong>' +
      '</div>';

    let rows = '';
    order.items.forEach(function (item) {
      const image = item.image
        ? '<img src="' + esc(item.image) + '" alt="' + esc(item.name) + '" />'
        : '<span>' + categoryIcon(item.category) + '</span>';
      rows +=
        '<div class="receipt-row">' +
          '<div class="summary-img">' + image + '</div>' +
          '<div class="receipt-row-detail">' +
            '<strong>' + esc(item.name) + '</strong>' +
            '<span>' + formatPrice(item.price) + ' &times; ' + item.qty + '</span>' +
          '</div>' +
          '<div class="receipt-row-total">' + formatPrice(item.price * item.qty) + '</div>' +
        '</div>';
    });

    orderReceipt.innerHTML =
      '<p class="receipt-title">Order Summary</p>' +
      rows +
      '<div class="order-receipt-total">' +
        '<span class="label">Total Amount</span>' +
        '<span class="total">' + formatPrice(order.total) + '</span>' +
      '</div>';
  }

  const orderId = orderIdFromQuery();

  homeBtn.addEventListener('click', function () {
    window.location.href = '/home';
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
      .then(function () {
        redirectToLogin();
      })
      .catch(function () {
        redirectToLogin();
      });
  });

  function requireAuth() {
    return fetch('/api/me', { method: 'GET' })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok || !result.data.success) {
          redirectToLogin();
          return Promise.reject();
        }
        return fetchOrder();
      });
  }

  function fetchOrder() {
    if (!orderId) {
      window.location.href = '/home';
      return Promise.reject();
    }
    return fetch('/api/orders/' + encodeURIComponent(orderId), { method: 'GET' })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        if (!result.ok || !result.data.success) {
          window.location.href = '/home';
          return Promise.reject();
        }
        renderOrder(result.data.order);
      });
  }

  requireAuth().catch(function () {
  });
})();