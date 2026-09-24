(function () {
  const cartCount = document.getElementById('cartCount');
  const homeNavBtn = document.getElementById('homeNavBtn');
  const cartNavBtn = document.getElementById('cartNavBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const myOrdersNavBtn = document.getElementById('myOrdersNavBtn');
  const checkoutForm = document.getElementById('checkoutForm');
  const checkoutAlert = document.getElementById('checkoutAlert');
  const customerName = document.getElementById('customerName');
  const customerMobile = document.getElementById('customerMobile');
  const deliveryAddress = document.getElementById('deliveryAddress');
  const summaryItems = document.getElementById('summaryItems');
  const summaryTotal = document.getElementById('summaryTotal');
  const placeOrderBtn = document.getElementById('placeOrderBtn');

  const NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,49}$/;
  const MOBILE_RE = /^[6-9]\d{9}$/;

  let key = null;
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

  function loadCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || '[]');
      cart = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      cart = [];
    }
  }

  function totalQuantity() {
    return cart.reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);
  }

  function updateCartCount() {
    cartCount.textContent = totalQuantity();
  }

  function overallTotal() {
    return cart.reduce(function (sum, item) {
      return sum + Number(item.price) * item.qty;
    }, 0);
  }

  function itemImageHtml(item) {
    if (item.image) {
      return '<img src="' + esc(item.image) + '" alt="' + esc(item.name) + '" />';
    }
    return '<span>' + categoryIcon(item.category) + '</span>';
  }

  function renderSummary() {
    if (cart.length === 0) {
      window.location.href = '/cart';
      return;
    }

    let rows = '';
    cart.forEach(function (item) {
      rows +=
        '<div class="summary-row">' +
          '<div class="summary-img">' + itemImageHtml(item) + '</div>' +
          '<div class="summary-row-detail">' +
            '<strong>' + esc(item.name) + '</strong>' +
            '<span>' + formatPrice(item.price) + ' &times; ' + item.qty + '</span>' +
          '</div>' +
          '<div class="summary-row-total">' + formatPrice(item.price * item.qty) + '</div>' +
        '</div>';
    });

    summaryItems.innerHTML = rows;
    summaryTotal.textContent = formatPrice(overallTotal());
  }

  function showFieldError(input, errorId, message) {
    input.classList.add('has-error');
    const errorEl = document.getElementById(errorId);
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }

  function clearFieldErrors() {
    checkoutForm.querySelectorAll('.field-error').forEach(function (el) {
      el.textContent = '';
      el.classList.remove('visible');
    });
    checkoutForm.querySelectorAll('.has-error').forEach(function (el) {
      el.classList.remove('has-error');
    });
    checkoutAlert.classList.remove('visible');
  }

  function validate() {
    let valid = true;
    const name = customerName.value.trim();
    const mobile = customerMobile.value.trim();
    const address = deliveryAddress.value.trim();

    if (!name) {
      showFieldError(customerName, 'customerNameError', 'Customer Name is required.');
      valid = false;
    } else if (!NAME_RE.test(name)) {
      showFieldError(customerName, 'customerNameError', 'Enter a valid name using letters, spaces, dots or hyphens.');
      valid = false;
    }

    if (!mobile) {
      showFieldError(customerMobile, 'customerMobileError', 'Mobile Number is required.');
      valid = false;
    } else if (!MOBILE_RE.test(mobile)) {
      showFieldError(customerMobile, 'customerMobileError', 'Enter a valid 10-digit mobile number.');
      valid = false;
    }

    if (!address) {
      showFieldError(deliveryAddress, 'deliveryAddressError', 'Delivery Address is required.');
      valid = false;
    } else if (address.length < 10) {
      showFieldError(deliveryAddress, 'deliveryAddressError', 'Please enter a complete delivery address.');
      valid = false;
    }

    return valid;
  }

  function placeOrder() {
    if (!validate()) {
      return;
    }

    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = 'Placing Order...';

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: customerName.value.trim(),
        mobile: customerMobile.value.trim(),
        address: deliveryAddress.value.trim(),
        items: cart.map(function (item) {
          return { productId: item.productId, qty: item.qty };
        })
      })
    })
      .then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        });
      })
      .then(function (result) {
        if (result.ok && result.data.success) {
          localStorage.removeItem(key);
          window.location.href = '/order-success?id=' + encodeURIComponent(result.data.order.id);
          return;
        }
        checkoutAlert.textContent = result.data.message || 'Unable to place the order. Please check your details and try again.';
        checkoutAlert.classList.add('visible');
      })
      .catch(function () {
        checkoutAlert.textContent = 'Something went wrong. Please check your connection and try again.';
        checkoutAlert.classList.add('visible');
      })
      .finally(function () {
        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = 'Place Order';
      });
  }

  placeOrderBtn.addEventListener('click', placeOrder);

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
      updateCartCount();
      renderSummary();
    })
    .catch(function () {
      redirectToLogin();
    });
})();