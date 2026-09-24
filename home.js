(function () {
  const CATEGORY_ICONS = {
    'Home Grown Vegetables': '\u{1F33F}',
    'Homemade Items': '\u{1F964}',
    'Old Books': '\u{1F4D6}'
  };

  const PLACEHOLDER_BG = {
    'Home Grown Vegetables': '#dcfce7',
    'Homemade Items': '#fef3c7',
    'Old Books': '#e0e7ff'
  };

  const homeUser = document.getElementById('homeUser');
  const logoutBtn = document.getElementById('logoutBtn');
  const addProductNavBtn = document.getElementById('addProductNavBtn');
  const heroAddBtn = document.getElementById('heroAddBtn');
  const productGrid = document.getElementById('productGrid');
  const emptyState = document.getElementById('emptyState');
  const noResults = document.getElementById('noResults');
  const productSearch = document.getElementById('productSearch');
  const categoryFilter = document.getElementById('categoryFilter');
  const productsCount = document.getElementById('productsCount');
  const addProductModal = document.getElementById('addProductModal');
  const addProductForm = document.getElementById('addProductForm');
  const addProductAlert = document.getElementById('addProductAlert');
  const cancelAddBtn = document.getElementById('cancelAddBtn');
  const addProductBtn = document.getElementById('addProductBtn');
  const successModal = document.getElementById('successModal');
  const successMessage = document.getElementById('successMessage');
  const successOkBtn = document.getElementById('successOkBtn');
  const cartNavBtn = document.getElementById('cartNavBtn');
  const cartCount = document.getElementById('cartCount');
  const myOrdersNavBtn = document.getElementById('myOrdersNavBtn');

  let products = [];
  let cart = [];
  let userEmail = null;
  let searchQuery = '';
  let selectedCategory = '';

  function redirectToLogin() {
    window.location.href = '/';
  }

  function formatPrice(value) {
    const num = Number(value) || 0;
    return '\u20B9' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function openModal(modal) {
    modal.classList.add('open');
  }

  function closeModal(modal) {
    modal.classList.remove('open');
  }

  function getCartKey() {
    return 'dharnimart_cart_' + (userEmail || 'guest');
  }

  function updateCartCount() {
    const count = cart.reduce(function (sum, item) {
      return sum + item.qty;
    }, 0);
    cartCount.textContent = count;
  }

  function saveCart() {
    localStorage.setItem(getCartKey(), JSON.stringify(cart));
    updateCartCount();
  }

  function loadCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(getCartKey()) || '[]');
      cart = Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      cart = [];
    }
    updateCartCount();
  }

  function findProduct(productId) {
    return products.find(function (product) {
      return product.id === productId;
    });
  }

  function imageHtml(product) {
    if (product.image) {
      return '<div class="product-img"><img src="' + esc(product.image) + '" alt="' + esc(product.name) + '" loading="lazy" /></div>';
    }
    const bg = PLACEHOLDER_BG[product.category] || '#e2e8f0';
    return '<div class="product-img product-img-ph" style="background:' + bg + '">' + (CATEGORY_ICONS[product.category] || '\u{1F4E6}') + '</div>';
  }

  function productCard(product) {
    const outOfStock = product.quantity <= 0;
    return (
      '<article class="product-card">' +
        imageHtml(product) +
        '<div class="product-body">' +
          '<span class="product-cat">' + esc(product.category) + '</span>' +
          '<h3 class="product-name">' + esc(product.name) + '</h3>' +
          '<p class="product-desc">' + esc(product.description) + '</p>' +
          '<div class="product-price-row">' +
            '<span class="product-price">' + formatPrice(product.price) + '</span>' +
            '<span class="product-stock' + (outOfStock ? ' out' : '') + '">' + (outOfStock ? 'Out of stock' : product.quantity + ' available') + '</span>' +
          '</div>' +
          '<div class="product-actions">' +
            '<button type="button" class="btn btn-primary add-to-cart-btn" data-add-cart="' + product.id + '"' + (outOfStock ? ' disabled' : '') + '>Add to Cart</button>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function renderProducts(list) {
    products = list;
    renderFiltered();
  }

  function renderFiltered() {
    const query = searchQuery.trim().toLowerCase();
    const filtered = products.filter(function (product) {
      const nameMatch = !query || String(product.name || '').toLowerCase().indexOf(query) !== -1;
      const catMatch = !selectedCategory || product.category === selectedCategory;
      return nameMatch && catMatch;
    });

    productsCount.textContent = filtered.length + (filtered.length === 1 ? ' product' : ' products');

    if (filtered.length === 0) {
      productGrid.innerHTML = '';
      if (products.length === 0) {
        emptyState.hidden = false;
        noResults.hidden = true;
      } else {
        emptyState.hidden = true;
        noResults.hidden = false;
      }
      return;
    }

    emptyState.hidden = true;
    noResults.hidden = true;
    productGrid.innerHTML = filtered.map(productCard).join('');
  }

  function refreshProducts() {
    fetch('/api/products', { method: 'GET' })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          renderProducts(data.products);
        }
      })
      .catch(function () {
        // Keep the page usable even if the product list fails to load.
      });
  }

  function addToCart(productId) {
    const product = findProduct(productId);
    if (!product || product.quantity <= 0) {
      return;
    }
    const existing = cart.find(function (item) {
      return item.productId === productId;
    });
    if (existing) {
      if (existing.qty < product.quantity) {
        existing.qty += 1;
        saveCart();
      }
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        qty: 1
      });
      saveCart();
    }
  }

  function showFieldError(fieldId, errorId, message) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(errorId);
    field.classList.add('has-error');
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }

  function clearFieldErrors() {
    addProductForm.querySelectorAll('.field-error').forEach(function (el) {
      el.textContent = '';
      el.classList.remove('visible');
    });
    addProductForm.querySelectorAll('.has-error').forEach(function (el) {
      el.classList.remove('has-error');
    });
    addProductAlert.classList.remove('visible');
  }

  function openAddProduct() {
    addProductForm.reset();
    clearFieldErrors();
    openModal(addProductModal);
    document.getElementById('pName').focus();
  }

  addProductNavBtn.addEventListener('click', openAddProduct);
  heroAddBtn.addEventListener('click', openAddProduct);
  cancelAddBtn.addEventListener('click', function () {
    closeModal(addProductModal);
  });

  productGrid.addEventListener('click', function (event) {
    const addBtn = event.target.closest('[data-add-cart]');
    if (addBtn && !addBtn.disabled) {
      addToCart(addBtn.dataset.addCart);
    }
  });

  productSearch.addEventListener('input', function () {
    searchQuery = productSearch.value;
    renderFiltered();
  });

  categoryFilter.addEventListener('change', function () {
    selectedCategory = categoryFilter.value;
    renderFiltered();
  });

  cartNavBtn.addEventListener('click', function () {
    window.location.href = '/cart';
  });

  myOrdersNavBtn.addEventListener('click', function () {
    window.location.href = '/my-orders';
  });

  document.addEventListener('click', function (event) {
    const closeBtn = event.target.closest('[data-close]');
    if (closeBtn) {
      closeModal(document.getElementById(closeBtn.dataset.close));
      return;
    }
    if (event.target.classList.contains('modal')) {
      event.target.classList.remove('open');
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      if (addProductModal.classList.contains('open')) {
        closeModal(addProductModal);
      }
      if (successModal.classList.contains('open')) {
        closeModal(successModal);
      }
    }
  });

  successOkBtn.addEventListener('click', function () {
    closeModal(successModal);
  });

  addProductForm.addEventListener('submit', function (event) {
    event.preventDefault();
    clearFieldErrors();
    let valid = true;

    const name = document.getElementById('pName').value.trim();
    const category = document.getElementById('pCategory').value;
    const description = document.getElementById('pDescription').value.trim();
    const price = Number(document.getElementById('pPrice').value);
    const quantity = Number(document.getElementById('pQuantity').value);
    const imageFile = document.getElementById('pImage').files[0];

    if (!name) {
      showFieldError('pName', 'pNameError', 'Product Name is required.');
      valid = false;
    }

    if (!category) {
      showFieldError('pCategory', 'pCategoryError', 'Please select a category.');
      valid = false;
    }

    if (!description) {
      showFieldError('pDescription', 'pDescriptionError', 'Description is required.');
      valid = false;
    }

    if (document.getElementById('pPrice').value === '' || !Number.isFinite(price) || price <= 0) {
      showFieldError('pPrice', 'pPriceError', 'Enter a valid price greater than zero.');
      valid = false;
    }

    if (document.getElementById('pQuantity').value === '' || !Number.isInteger(quantity) || quantity < 0) {
      showFieldError('pQuantity', 'pQuantityError', 'Enter a valid quantity.');
      valid = false;
    }

    if (imageFile && !imageFile.type.startsWith('image/')) {
      showFieldError('pImage', 'pImageError', 'Please choose a valid image file.');
      valid = false;
    } else if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      showFieldError('pImage', 'pImageError', 'Image must be 5 MB or smaller.');
      valid = false;
    }

    if (!valid) {
      return;
    }

    function postProduct(imageData) {
      addProductBtn.disabled = true;
      addProductBtn.textContent = 'Adding...';

      fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          category: category,
          description: description,
          price: price,
          quantity: quantity,
          image: imageData
        })
      })
        .then(function (response) {
          return response.json().then(function (data) {
            return { ok: response.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok && result.data.success) {
            addProductForm.reset();
            closeModal(addProductModal);
            refreshProducts();
            successMessage.textContent = '"' + result.data.product.name + '" was added successfully.';
            openModal(successModal);
            return;
          }

          if (result.data.errors) {
            if (result.data.errors.name) {
              showFieldError('pName', 'pNameError', result.data.errors.name);
            }
            if (result.data.errors.category) {
              showFieldError('pCategory', 'pCategoryError', result.data.errors.category);
            }
            if (result.data.errors.description) {
              showFieldError('pDescription', 'pDescriptionError', result.data.errors.description);
            }
            if (result.data.errors.price) {
              showFieldError('pPrice', 'pPriceError', result.data.errors.price);
            }
            if (result.data.errors.quantity) {
              showFieldError('pQuantity', 'pQuantityError', result.data.errors.quantity);
            }
          }
          addProductAlert.textContent = result.data.message || 'Unable to add the product. Please check the details.';
          addProductAlert.classList.add('visible');
        })
        .catch(function () {
          addProductAlert.textContent = 'Something went wrong. Please check your connection and try again.';
          addProductAlert.classList.add('visible');
        })
        .finally(function () {
          addProductBtn.disabled = false;
          addProductBtn.textContent = 'Add Product';
        });
    }

    if (!imageFile) {
      postProduct(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = function () {
      postProduct(reader.result);
    };
    reader.onerror = function () {
      postProduct(null);
    };
    reader.readAsDataURL(imageFile);
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
        if (data.success) {
          redirectToLogin();
        } else {
          redirectToLogin();
        }
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
      homeUser.textContent = 'Signed in as ' + result.data.user.fullName + ' (' + result.data.user.email + ')';
      userEmail = result.data.user.email;
      loadCart();
    })
    .catch(function () {
      redirectToLogin();
    });

  refreshProducts();
})();