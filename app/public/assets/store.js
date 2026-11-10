'use strict';

/* =========================================================
   Hoa Quả Nhà Trồng - logic giao diện khách hàng
   Gọi API của server, giỏ hàng lưu trong localStorage.
   ========================================================= */
(function () {
  const CART_KEY = 'hqnt_cart';
  const SHIPPING_FEE = 30000;
  const FREE_FROM = 300000;

  const state = { user: null, cart: readCart() };
  let homeSearch = null;

  /* ------------------------------ Tiện ích ---------------------------- */
  function money(value) {
    return Number(value || 0).toLocaleString('vi-VN') + 'đ';
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function formatDate(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('vi-VN', { hour12: false });
  }

  function statusClass(status) {
    return 'status-pill ' + String(status || '').replace(/\s+/g, '-');
  }

  function toast(message, type) {
    let area = document.querySelector('.toast-area');
    if (!area) {
      area = document.createElement('div');
      area.className = 'toast-area';
      document.body.appendChild(area);
    }
    const element = document.createElement('div');
    element.className = 'toast-msg' + (type === 'error' ? ' error' : '');
    element.innerHTML = '<i class="fa-solid ' + (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check') + '"></i><span></span>';
    element.querySelector('span').textContent = message;
    area.appendChild(element);
    requestAnimationFrame(function () { element.classList.add('show'); });
    setTimeout(function () {
      element.classList.remove('show');
      setTimeout(function () { element.remove(); }, 300);
    }, 2800);
  }

  /* -------------------------------- API -------------------------------- */
  async function api(path, options) {
    const settings = options || {};
    const init = {
      method: settings.method || 'GET',
      credentials: 'same-origin',
      headers: {}
    };
    if (settings.body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(settings.body);
    }
    const response = await fetch(path, init);
    let data = {};
    try { data = await response.json(); } catch (error) { data = {}; }
    if (!response.ok) {
      const err = new Error(data.error || 'Không kết nối được máy chủ.');
      err.status = response.status;
      throw err;
    }
    return data;
  }

  /* ------------------------------- Giỏ hàng ---------------------------- */
  function readCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw
        .filter(function (line) { return line && Number(line.id) > 0 && Number(line.qty) > 0; })
        .map(function (line) { return { id: Number(line.id), qty: Math.min(99, Number(line.qty)) }; });
    } catch (error) {
      return [];
    }
  }

  function writeCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(state.cart)); } catch (error) { /* ignore */ }
    updateCartCount();
  }

  function updateCartCount() {
    const count = state.cart.reduce(function (sum, line) { return sum + line.qty; }, 0);
    document.querySelectorAll('[data-cart-count]').forEach(function (element) {
      element.textContent = count;
    });
  }

  function addToCart(id, qty) {
    const amount = Math.max(1, Math.min(99, parseInt(qty, 10) || 1));
    const line = state.cart.find(function (item) { return item.id === id; });
    if (line) line.qty = Math.min(99, line.qty + amount);
    else state.cart.push({ id: id, qty: amount });
    writeCart();
    toast('Đã thêm sản phẩm vào giỏ hàng');
  }

  async function loadCartLines() {
    if (!state.cart.length) return [];
    const data = await api('/api/products?ids=' + state.cart.map(function (line) { return line.id; }).join(','));
    const map = new Map(data.products.map(function (product) { return [product.id, product]; }));
    return state.cart
      .map(function (line) { return { line: line, product: map.get(line.id) }; })
      .filter(function (item) { return item.product; });
  }

  /* ------------------------------ Giao diện ---------------------------- */
  function headerHTML() {
    const page = document.body.dataset.page;
    const saleView = new URLSearchParams(location.search).get('sale') === '1';
    const homeActive = page === 'home' && !saleView;
    return '' +
      '<header class="topbar"><div class="container topbar-inner">' +
        '<a class="brand" href="index.html">' +
          '<span class="brand-mark"><i class="fa-solid fa-leaf"></i></span>' +
          '<span class="brand-text"><strong>Hoa Quả Nhà Trồng</strong>' +
            '<small>Trái cây sạch – hái tận vườn – giao tận nhà</small></span>' +
        '</a>' +
        '<div class="topbar-links">' +
          '<a href="tel:0879917194"><i class="fa-solid fa-phone"></i>0879 917 194</a>' +
          '<span><i class="fa-regular fa-clock"></i>7:00 – 22:00 mỗi ngày</span>' +
        '</div>' +
      '</div></header>' +
      '<nav class="mainnav"><div class="container mainnav-inner">' +
        '<ul class="nav-links">' +
          '<li><a href="index.html"' + (homeActive ? ' class="active"' : '') + '>Trang chủ</a></li>' +
          '<li><a href="index.html?sale=1"' + (saleView ? ' class="active"' : '') + '>Giảm giá</a></li>' +
          '<li><a href="index.html#catalog">Sản phẩm</a></li>' +
          '<li><a href="lien-he.html"' + (page === 'contact' ? ' class="active"' : '') + '>Liên hệ</a></li>' +
        '</ul>' +
        '<form class="nav-search" data-search-form role="search">' +
          '<input type="search" name="q" placeholder="Tìm trái cây..." aria-label="Tìm kiếm sản phẩm">' +
          '<button type="submit" aria-label="Tìm"><i class="fa-solid fa-magnifying-glass"></i></button>' +
        '</form>' +
        '<div class="nav-actions">' +
          '<a class="cart-btn" href="gio-hang.html"><i class="fa-solid fa-cart-shopping"></i>' +
            '<span>Giỏ hàng</span><span class="badge-count" data-cart-count>0</span></a>' +
          '<div id="accountArea"></div>' +
        '</div>' +
      '</div></nav>';
  }

  function accountHTML() {
    if (!state.user) {
      return '<div class="account-box">' +
        '<a class="account-link" href="dang-nhap.html">Đăng nhập</a>' +
        '<a class="btn btn-accent btn-sm" href="dang-ky.html">Đăng ký</a>' +
      '</div>';
    }
    return '<div class="account-box">' +
      '<a class="account-name" href="tai-khoan.html"><i class="fa-regular fa-user"></i> ' + esc(state.user.name) + '</a>' +
      (state.user.role === 'admin' ? '<a class="account-link admin" href="admin/"><i class="fa-solid fa-gauge-high"></i> Quản trị</a>' : '') +
      '<button type="button" class="logout-btn" data-logout>Đăng xuất</button>' +
    '</div>';
  }

  function footerHTML() {
    const categories = [
      ['cam-quyt', 'Họ cam quýt'],
      ['qua-mong', 'Họ quả mọng'],
      ['nhiet-doi', 'Trái cây nhiệt đới'],
      ['nhap-khau', 'Trái cây nhập khẩu'],
      ['gio-qua', 'Giỏ quà']
    ];
    return '<footer class="site-footer"><div class="container footer-grid">' +
      '<div>' +
        '<h4 class="footer-title">Hoa Quả Nhà Trồng</h4>' +
        '<p>Trái cây sạch hái tận vườn, giao tận nhà trong 2 giờ tại TP.HCM.</p>' +
        '<p><i class="fa-solid fa-location-dot"></i>280 Đ. An Dương Vương, P.4, Q.5, TP.HCM</p>' +
        '<p><i class="fa-solid fa-phone"></i>Hotline: 0879 917 194</p>' +
      '</div>' +
      '<div><h4 class="footer-title">Danh mục</h4><ul class="footer-links">' +
        categories.map(function (item) {
          return '<li><a href="index.html?category=' + item[0] + '">' + item[1] + '</a></li>';
        }).join('') +
      '</ul></div>' +
      '<div><h4 class="footer-title">Chính sách</h4><ul class="footer-links">' +
        '<li><a href="#">Chính sách giao hàng</a></li>' +
        '<li><a href="#">Chính sách đổi trả</a></li>' +
        '<li><a href="#">Bảo mật thông tin cá nhân</a></li>' +
        '<li><a href="#">Quy định thanh toán</a></li>' +
      '</ul></div>' +
      '<div><h4 class="footer-title">Tài khoản</h4><ul class="footer-links">' +
        '<li><a href="tai-khoan.html">Thông tin &amp; đơn hàng</a></li>' +
        '<li><a href="gio-hang.html">Giỏ hàng</a></li>' +
        '<li><a href="lien-he.html">Liên hệ</a></li>' +
        '<li><a href="admin/">Trang quản trị</a></li>' +
      '</ul></div>' +
    '</div></footer>' +
    '<div class="copyright">&copy; ' + new Date().getFullYear() + ' Hoa Quả Nhà Trồng Market – Trái cây sạch, giá tận vườn.</div>';
  }

  function renderAccountArea() {
    const area = document.getElementById('accountArea');
    if (area) area.innerHTML = accountHTML();
  }

  function renderLayout() {
    const header = document.getElementById('siteHeader');
    const footer = document.getElementById('siteFooter');
    if (header) header.innerHTML = headerHTML();
    if (footer) footer.innerHTML = footerHTML();
    renderAccountArea();
    updateCartCount();

    const logout = document.querySelector('[data-logout]');
    if (logout) {
      logout.addEventListener('click', async function () {
        try { await api('/api/auth/logout', { method: 'POST' }); } catch (error) { /* ignore */ }
        location.href = 'index.html';
      });
    }

    const form = document.querySelector('[data-search-form]');
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        const value = (form.querySelector('input[name="q"]').value || '').trim();
        if (document.body.dataset.page === 'home' && typeof homeSearch === 'function') {
          homeSearch(value);
          return;
        }
        location.href = 'index.html?q=' + encodeURIComponent(value);
      });
    }
  }

  /* ---------------------------- Thẻ sản phẩm --------------------------- */
  function productCard(product) {
    const link = 'san-pham.html?slug=' + encodeURIComponent(product.slug);
    const badge = product.discount
      ? '<span class="card-badge sale">-' + product.discount + '%</span>'
      : (product.badge ? '<span class="card-badge">' + esc(product.badge) + '</span>' : '');
    return '<article class="product-card">' +
      '<a class="card-media" href="' + link + '">' + badge +
        '<img src="' + esc(product.image) + '" alt="' + esc(product.name) + '" loading="lazy">' +
      '</a>' +
      '<div class="card-body">' +
        '<a class="card-title" href="' + link + '">' + esc(product.name) + '</a>' +
        '<p class="card-meta">' + esc(product.origin) + ' • ' + esc(product.unit) + '</p>' +
        '<p class="card-price">' + money(product.price) +
          (product.oldPrice ? '<s>' + money(product.oldPrice) + '</s>' : '') + '</p>' +
        '<p class="card-sold">Đã bán ' + product.sold + ' ' + esc(product.unit) + '</p>' +
      '</div>' +
      '<div class="card-actions">' +
        '<button type="button" class="btn btn-outline btn-block btn-sm" data-add="' + product.id + '">' +
          '<i class="fa-solid fa-cart-plus"></i> Đặt mua</button>' +
      '</div>' +
    '</article>';
  }

  /* ------------------------------- Trang chủ --------------------------- */
  async function initHome() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    const params = new URLSearchParams(location.search);
    const view = {
      q: params.get('q') || '',
      category: params.get('category') || '',
      sale: params.get('sale') === '1',
      min: '',
      max: '',
      sort: 'sold',
      page: 1
    };

    const searchInput = document.querySelector('[data-search-form] input[name="q"]');
    if (searchInput) searchInput.value = view.q;

    document.getElementById('catalogTitle').textContent = view.sale
      ? 'Giảm giá sốc – Ưu đãi đến tay'
      : 'Sản phẩm bán chạy';
    document.getElementById('catalogSub').textContent = view.sale
      ? 'Giá tốt mỗi ngày, số lượng có hạn. Đặt sớm để chọn được quả đẹp nhất.'
      : 'Chọn trái cây bạn thích, thêm vào giỏ và đặt hàng chỉ trong vài bước.';

    let categories = [];
    try {
      const meta = await api('/api/meta');
      categories = meta.categories;
    } catch (error) {
      categories = [];
    }

    const catList = document.getElementById('categoryList');
    function renderCategories() {
      catList.innerHTML =
        '<button type="button" class="cat-btn' + (view.category ? '' : ' active') + '" data-category="">Tất cả sản phẩm</button>' +
        categories.map(function (category) {
          return '<button type="button" class="cat-btn' + (view.category === category.slug ? ' active' : '') +
            '" data-category="' + esc(category.slug) + '">' + esc(category.name) + '</button>';
        }).join('');
    }
    renderCategories();

    catList.addEventListener('click', function (event) {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      view.category = button.getAttribute('data-category');
      view.page = 1;
      renderCategories();
      load();
    });

    document.querySelectorAll('[data-price]').forEach(function (input) {
      input.addEventListener('change', function () {
        document.querySelectorAll('[data-price]').forEach(function (other) {
          if (other !== input) other.checked = false;
        });
        view.min = input.checked ? input.getAttribute('data-min') : '';
        view.max = input.checked ? input.getAttribute('data-max') : '';
        view.page = 1;
        load();
      });
    });

    const sort = document.getElementById('sortSelect');
    if (sort) {
      sort.addEventListener('change', function () {
        view.sort = sort.value;
        view.page = 1;
        load();
      });
    }

    homeSearch = function (value) {
      view.q = value;
      view.page = 1;
      if (searchInput) searchInput.value = value;
      load();
    };

    document.getElementById('pagination').addEventListener('click', function (event) {
      const button = event.target.closest('[data-page]');
      if (!button || button.disabled) return;
      view.page = Number(button.getAttribute('data-page'));
      load();
      document.getElementById('catalog').scrollIntoView({ behavior: 'smooth' });
    });

    grid.addEventListener('click', function (event) {
      const button = event.target.closest('[data-add]');
      if (!button) return;
      event.preventDefault();
      addToCart(Number(button.getAttribute('data-add')), 1);
    });

    function renderPagination(data) {
      const pagination = document.getElementById('pagination');
      const pages = Math.ceil(data.total / data.limit);
      if (pages <= 1) { pagination.innerHTML = ''; return; }
      let html = '<button type="button" class="page-btn" data-page="' + (view.page - 1) + '"' +
        (view.page === 1 ? ' disabled' : '') + '>«</button>';
      for (let index = 1; index <= pages; index += 1) {
        html += '<button type="button" class="page-btn' + (index === view.page ? ' active' : '') +
          '" data-page="' + index + '">' + index + '</button>';
      }
      html += '<button type="button" class="page-btn" data-page="' + (view.page + 1) + '"' +
        (view.page === pages ? ' disabled' : '') + '>»</button>';
      pagination.innerHTML = html;
    }

    async function load() {
      const query = new URLSearchParams({ page: view.page, limit: 9, sort: view.sort });
      if (view.q) query.set('q', view.q);
      if (view.category) query.set('category', view.category);
      if (view.sale) query.set('sale', '1');
      if (view.min) query.set('min', view.min);
      if (view.max) query.set('max', view.max);

      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1">Đang tải sản phẩm...</div>';
      try {
        const data = await api('/api/products?' + query.toString());
        document.getElementById('resultCount').textContent = data.total + ' sản phẩm';
        grid.innerHTML = data.products.length
          ? data.products.map(productCard).join('')
          : '<div class="empty-state" style="grid-column:1/-1"><i class="fa-solid fa-basket-shopping"></i>' +
            '<h3>Không tìm thấy sản phẩm phù hợp</h3><p>Thử từ khóa khác hoặc bỏ bớt bộ lọc.</p></div>';
        renderPagination(data);
      } catch (error) {
        grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><h3>Không tải được sản phẩm</h3><p>' +
          esc(error.message) + '</p></div>';
      }
    }

    load();
  }

  /* --------------------------- Chi tiết sản phẩm ----------------------- */
  function detailHTML(product, related) {
    const categoryLink = 'index.html?category=' + encodeURIComponent(product.categorySlug || '');
    return '' +
      '<nav class="breadcrumb">' +
        '<a href="index.html">Trang chủ</a><span>/</span>' +
        '<a href="' + categoryLink + '">' + esc(product.categoryName || 'Sản phẩm') + '</a><span>/</span>' +
        '<span>' + esc(product.name) + '</span>' +
      '</nav>' +
      '<div class="detail-grid">' +
        '<div class="detail-media">' +
          '<img src="' + esc(product.image) + '" alt="' + esc(product.name) + '">' +
        '</div>' +
        '<div>' +
          '<span class="detail-cat">' + esc(product.categoryName || '') + '</span>' +
          '<h1 class="detail-title">' + esc(product.name) + '</h1>' +
          '<div class="detail-stats">' +
            '<span><i class="fa-solid fa-star"></i>4.8/5</span>' +
            '<span><i class="fa-solid fa-box"></i>Còn ' + product.stock + ' ' + esc(product.unit) + '</span>' +
            '<span><i class="fa-solid fa-cart-shopping"></i>Đã bán ' + product.sold + '</span>' +
          '</div>' +
          '<div class="detail-price">' + money(product.price) +
            '<small>/ ' + esc(product.unit) + '</small>' +
            (product.oldPrice ? '<s>' + money(product.oldPrice) + '</s>' : '') +
          '</div>' +
          (product.discount ? '<p class="cart-note" style="color:#b91c1c;font-weight:600">Tiết kiệm ' +
            money(product.oldPrice - product.price) + ' (' + product.discount + '%)</p>' : '') +
          '<p class="detail-desc">' + esc(product.description || '') + '</p>' +
          '<ul class="specs">' +
            '<li><span>Xuất xứ</span><strong>' + esc(product.origin) + '</strong></li>' +
            '<li><span>Danh mục</span><strong>' + esc(product.categoryName || '') + '</strong></li>' +
            '<li><span>Đơn vị bán</span><strong>' + esc(product.unit) + '</strong></li>' +
            '<li><span>Tình trạng</span><strong>' + (product.stock > 0 ? 'Còn hàng' : 'Tạm hết') + '</strong></li>' +
          '</ul>' +
          '<div class="buy-row">' +
            '<div class="qty">' +
              '<button type="button" data-qty-dec aria-label="Giảm">−</button>' +
              '<input type="number" id="detailQty" min="1" max="99" value="1" aria-label="Số lượng">' +
              '<button type="button" data-qty-inc aria-label="Tăng">+</button>' +
            '</div>' +
            '<button type="button" class="btn btn-green" data-add="' + product.id + '" data-detail="1"' +
              (product.stock < 1 ? ' disabled' : '') + '>' +
              '<i class="fa-solid fa-cart-plus"></i> Thêm vào giỏ</button>' +
            '<a class="btn btn-ghost" href="gio-hang.html"><i class="fa-solid fa-cart-shopping"></i> Xem giỏ hàng</a>' +
          '</div>' +
          '<div class="perks">' +
            '<span><i class="fa-solid fa-truck-fast"></i>Giao trong 2 giờ</span>' +
            '<span><i class="fa-solid fa-rotate-left"></i>Đổi trả 24 giờ</span>' +
            '<span><i class="fa-solid fa-sack-dollar"></i>Miễn phí ship từ ' + money(FREE_FROM) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      (related && related.length
        ? '<section class="related"><h2>Sản phẩm cùng loại</h2>' +
            '<div class="products-grid">' + related.map(productCard).join('') + '</div></section>'
        : '');
  }

  async function initDetail() {
    const holder = document.getElementById('productDetail');
    if (!holder) return;
    const slug = new URLSearchParams(location.search).get('slug');
    if (!slug) {
      holder.innerHTML = '<div class="empty-state"><i class="fa-solid fa-basket-shopping"></i>' +
        '<h3>Không tìm thấy sản phẩm</h3><p>Sản phẩm có thể đã được gỡ khỏi cửa hàng.</p>' +
        '<a class="btn btn-green" href="index.html">Về trang chủ</a></div>';
      return;
    }

    holder.innerHTML = '<div class="empty-state">Đang tải sản phẩm...</div>';
    try {
      const data = await api('/api/products/' + encodeURIComponent(slug));
      document.title = data.product.name + ' – Hoa Quả Nhà Trồng';
      holder.innerHTML = detailHTML(data.product, data.related);
      const qtyInput = holder.querySelector('#detailQty');
      holder.querySelector('[data-qty-dec]').addEventListener('click', function () {
        qtyInput.value = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1);
      });
      holder.querySelector('[data-qty-inc]').addEventListener('click', function () {
        qtyInput.value = Math.min(99, (parseInt(qtyInput.value, 10) || 1) + 1);
      });
      holder.addEventListener('click', function (event) {
        const button = event.target.closest('[data-add]');
        if (!button) return;
        const qty = button.getAttribute('data-detail') === '1' ? qtyInput.value : 1;
        addToCart(Number(button.getAttribute('data-add')), qty);
      });
    } catch (error) {
      holder.innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-exclamation"></i>' +
        '<h3>Không tìm thấy sản phẩm</h3><p>' + esc(error.message) + '</p>' +
        '<a class="btn btn-green" href="index.html">Về trang chủ</a></div>';
    }
  }

  /* -------------------------------- Giỏ hàng --------------------------- */
  function cartHTML(lines, subtotal, shipping) {
    const rows = lines.map(function (item) {
      const product = item.product;
      return '<tr>' +
        '<td><div class="cart-product">' +
          '<img src="' + esc(product.image) + '" alt="' + esc(product.name) + '">' +
          '<div><strong>' + esc(product.name) + '</strong>' +
            '<span>' + money(product.price) + ' / ' + esc(product.unit) + '</span></div>' +
        '</div></td>' +
        '<td><div class="qty">' +
          '<button type="button" data-dec="' + product.id + '" aria-label="Giảm">−</button>' +
          '<input type="number" min="1" max="99" value="' + item.line.qty + '" data-qty="' + product.id + '" aria-label="Số lượng">' +
          '<button type="button" data-inc="' + product.id + '" aria-label="Tăng">+</button>' +
        '</div></td>' +
        '<td class="cart-right"><strong>' + money(product.price * item.line.qty) + '</strong></td>' +
        '<td class="cart-right"><button type="button" class="btn btn-danger btn-sm" data-remove="' + product.id + '">' +
          '<i class="fa-solid fa-trash"></i></button></td>' +
      '</tr>';
    }).join('');

    return '<div class="cart-layout">' +
      '<div class="panel">' +
        '<h2>Giỏ hàng của bạn</h2>' +
        '<div style="overflow-x:auto"><table class="cart-table">' +
          '<thead><tr><th>Sản phẩm</th><th>Số lượng</th><th class="cart-right">Tạm tính</th><th></th></tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table></div>' +
        '<a class="btn btn-ghost btn-sm" href="index.html" style="margin-top:14px">' +
          '<i class="fa-solid fa-arrow-left"></i> Tiếp tục mua sắm</a>' +
      '</div>' +
      '<div class="panel">' +
        '<h3>Tổng đơn</h3>' +
        '<div class="summary">' +
          '<div class="summary-row"><span>Tạm tính</span><strong>' + money(subtotal) + '</strong></div>' +
          '<div class="summary-row"><span>Phí giao hàng</span><strong>' + (shipping ? money(shipping) : 'Miễn phí') + '</strong></div>' +
          '<div class="summary-total"><span>Tổng cộng</span><strong>' + money(subtotal + shipping) + '</strong></div>' +
        '</div>' +
        '<p class="cart-note">Miễn phí giao hàng cho đơn từ ' + money(FREE_FROM) + '.</p>' +
        '<a class="btn btn-green btn-block" href="thanh-toan.html">' +
          '<i class="fa-solid fa-bag-shopping"></i> Tiến hành đặt hàng</a>' +
      '</div>' +
    '</div>';
  }

  function emptyCartHTML() {
    return '<div class="empty-state"><i class="fa-solid fa-cart-shopping"></i>' +
      '<h3>Giỏ hàng đang trống</h3><p>Hãy chọn vài loại trái cây tươi cho gia đình bạn nhé.</p>' +
      '<a class="btn btn-green" href="index.html">Tiếp tục mua sắm</a></div>';
  }

  async function initCart() {
    const app = document.getElementById('cartApp');
    if (!app) return;

    async function render() {
      if (!state.cart.length) {
        app.innerHTML = emptyCartHTML();
        return;
      }
      let lines;
      try {
        lines = await loadCartLines();
      } catch (error) {
        app.innerHTML = '<div class="empty-state"><h3>Không tải được giỏ hàng</h3><p>' + esc(error.message) + '</p></div>';
        return;
      }
      if (!lines.length) {
        state.cart = [];
        writeCart();
        app.innerHTML = emptyCartHTML();
        return;
      }
      const subtotal = lines.reduce(function (sum, item) { return sum + item.product.price * item.line.qty; }, 0);
      const shipping = subtotal >= FREE_FROM ? 0 : SHIPPING_FEE;
      app.innerHTML = cartHTML(lines, subtotal, shipping);
    }

    app.addEventListener('click', function (event) {
      const inc = event.target.closest('[data-inc]');
      const dec = event.target.closest('[data-dec]');
      const remove = event.target.closest('[data-remove]');
      let id = null;

      if (inc) id = Number(inc.getAttribute('data-inc'));
      else if (dec) id = Number(dec.getAttribute('data-dec'));
      else if (remove) id = Number(remove.getAttribute('data-remove'));

      if (id === null) return;
      const line = state.cart.find(function (item) { return item.id === id; });
      if (!line) return;

      if (remove) {
        state.cart = state.cart.filter(function (item) { return item.id !== id; });
      } else if (inc) {
        line.qty = Math.min(99, line.qty + 1);
      } else {
        if (line.qty <= 1) state.cart = state.cart.filter(function (item) { return item.id !== id; });
        else line.qty -= 1;
      }
      writeCart();
      render();
    });

    app.addEventListener('change', function (event) {
      const input = event.target.closest('[data-qty]');
      if (!input) return;
      const id = Number(input.getAttribute('data-qty'));
      const qty = parseInt(input.value, 10);
      const line = state.cart.find(function (item) { return item.id === id; });
      if (!line) return;
      if (!qty || qty < 1) state.cart = state.cart.filter(function (item) { return item.id !== id; });
      else line.qty = Math.min(99, qty);
      writeCart();
      render();
    });

    render();
  }

  /* ------------------------------ Thanh toán --------------------------- */
  function checkoutHTML(lines, subtotal, shipping) {
    const items = lines.map(function (item) {
      return '<li><span>' + esc(item.product.name) + ' × ' + item.line.qty + ' ' + esc(item.product.unit) +
        '</span><strong>' + money(item.product.price * item.line.qty) + '</strong></li>';
    }).join('');

    return '<div class="cart-layout">' +
      '<div class="panel">' +
        '<h2>Thông tin đặt hàng</h2>' +
        '<form id="checkoutForm" novalidate>' +
          '<div class="form-error"></div>' +
          '<div class="form-grid">' +
            '<div class="field full"><label for="coName">Họ và tên người nhận</label>' +
              '<input class="input" id="coName" name="name" required value="' + esc(state.user.name) + '"></div>' +
            '<div class="field"><label for="coPhone">Số điện thoại</label>' +
              '<input class="input" id="coPhone" name="phone" required inputmode="numeric" pattern="0[0-9]{9,10}" value="' + esc(state.user.phone) + '" placeholder="0901234567"></div>' +
            '<div class="field"><label for="coEmail">Email</label>' +
              '<input class="input" id="coEmail" name="email" type="email" value="' + esc(state.user.email) + '"></div>' +
            '<div class="field full"><label for="coAddress">Địa chỉ giao hàng</label>' +
              '<input class="input" id="coAddress" name="address" required value="' + esc(state.user.address) + '" placeholder="Số nhà, đường, phường, quận"></div>' +
            '<div class="field"><label for="coDelivery">Hình thức giao</label>' +
              '<select class="select" id="coDelivery" name="delivery">' +
                '<option>Giao nhanh trong 2 giờ (nội thành TP.HCM)</option>' +
                '<option>Giao tiêu chuẩn trong ngày</option>' +
              '</select></div>' +
            '<div class="field"><label for="coPayment">Thanh toán</label>' +
              '<select class="select" id="coPayment" name="payment">' +
                '<option>Thanh toán khi nhận hàng (COD)</option>' +
                '<option>Chuyển khoản ngân hàng</option>' +
                '<option>Ví điện tử MoMo</option>' +
              '</select></div>' +
            '<div class="field full"><label for="coNote">Ghi chú</label>' +
              '<textarea class="textarea" id="coNote" name="note" placeholder="Ví dụ: giao sau 18h, chọn quả chín vừa..."></textarea></div>' +
          '</div>' +
          '<button class="btn btn-green btn-block" type="submit"><i class="fa-solid fa-bag-shopping"></i> Đặt hàng</button>' +
        '</form>' +
      '</div>' +
      '<div class="panel">' +
        '<h3>Đơn hàng của bạn</h3>' +
        '<ul class="order-items">' + items + '</ul>' +
        '<div class="summary" style="margin-top:10px">' +
          '<div class="summary-row"><span>Tạm tính</span><strong>' + money(subtotal) + '</strong></div>' +
          '<div class="summary-row"><span>Phí giao hàng</span><strong>' + (shipping ? money(shipping) : 'Miễn phí') + '</strong></div>' +
          '<div class="summary-total"><span>Tổng cộng</span><strong>' + money(subtotal + shipping) + '</strong></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  async function initCheckout() {
    const app = document.getElementById('checkoutApp');
    if (!app) return;

    if (!state.user) {
      location.replace('dang-nhap.html?next=' + encodeURIComponent('thanh-toan.html'));
      return;
    }
    if (!state.cart.length) {
      app.innerHTML = emptyCartHTML();
      return;
    }

    let lines;
    try {
      lines = await loadCartLines();
    } catch (error) {
      app.innerHTML = '<div class="empty-state"><h3>Không tải được giỏ hàng</h3><p>' + esc(error.message) + '</p></div>';
      return;
    }
    if (!lines.length) {
      state.cart = [];
      writeCart();
      app.innerHTML = emptyCartHTML();
      return;
    }

    const subtotal = lines.reduce(function (sum, item) { return sum + item.product.price * item.line.qty; }, 0);
    const shipping = subtotal >= FREE_FROM ? 0 : SHIPPING_FEE;
    app.innerHTML = checkoutHTML(lines, subtotal, shipping);

    const form = app.querySelector('#checkoutForm');
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const errorBox = form.querySelector('.form-error');
      errorBox.classList.remove('show');

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      button.innerHTML = 'Đang đặt hàng...';

      try {
        const result = await api('/api/orders', {
          method: 'POST',
          body: {
            name: form.elements.name.value.trim(),
            phone: form.elements.phone.value.trim(),
            email: form.elements.email.value.trim(),
            address: form.elements.address.value.trim(),
            note: form.elements.note.value.trim(),
            payment: form.elements.payment.value,
            delivery: form.elements.delivery.value,
            items: state.cart.map(function (line) { return { id: line.id, qty: line.qty }; })
          }
        });

        state.cart = [];
        writeCart();
        app.innerHTML = '<div class="empty-state" style="border-style:solid">' +
          '<i class="fa-solid fa-circle-check" style="color:#166534"></i>' +
          '<h3>Đặt hàng thành công!</h3>' +
          '<p>Cảm ơn <strong>' + esc(result.order.customerName) + '</strong>. Mã đơn hàng của bạn là <strong>#' +
            esc(result.order.code) + '</strong>.</p>' +
          '<p>Tổng thanh toán: <strong>' + money(result.order.total) + '</strong> • ' + esc(result.order.payment) + '</p>' +
          '<p>Cửa hàng sẽ gọi xác nhận tới số ' + esc(result.order.phone) + ' trong ít phút.</p>' +
          '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
            '<a class="btn btn-green" href="index.html">Tiếp tục mua sắm</a>' +
            '<a class="btn btn-outline" href="tai-khoan.html">Xem đơn hàng của tôi</a>' +
          '</div>' +
        '</div>';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.classList.add('show');
        button.disabled = false;
        button.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> Đặt hàng';
      }
    });
  }

  /* -------------------------------- Tài khoản -------------------------- */
  function orderCardHTML(order) {
    return '<article class="order-card">' +
      '<div class="order-head">' +
        '<div><strong>#' + esc(order.code) + '</strong>' +
          '<div class="order-meta">' + formatDate(order.createdAt) + ' • ' + esc(order.payment) + '</div></div>' +
        '<span class="' + statusClass(order.status) + '">' + esc(order.status) + '</span>' +
      '</div>' +
      '<ul class="order-items">' + order.items.map(function (item) {
        return '<li><span>' + esc(item.name) + ' × ' + item.qty + ' ' + esc(item.unit) + '</span>' +
          '<span>' + money(item.price * item.qty) + '</span></li>';
      }).join('') + '</ul>' +
      '<div class="order-total"><span>Phí giao: ' + (order.shipping ? money(order.shipping) : 'Miễn phí') +
        ' • Giao tới: ' + esc(order.address) + '</span><strong>' + money(order.total) + '</strong></div>' +
    '</article>';
  }

  async function initAccount() {
    const app = document.getElementById('accountApp');
    if (!app) return;

    if (!state.user) {
      location.replace('dang-nhap.html?next=' + encodeURIComponent('tai-khoan.html'));
      return;
    }

    app.innerHTML = '<div class="account-grid">' +
      '<div class="panel">' +
        '<h2>Thông tin của tôi</h2>' +
        '<form id="profileForm">' +
          '<div class="form-error"></div>' +
          '<div class="field"><label for="pfName">Họ và tên</label>' +
            '<input class="input" id="pfName" name="name" value="' + esc(state.user.name) + '" required></div>' +
          '<div class="field"><label for="pfEmail">Email</label>' +
            '<input class="input" id="pfEmail" value="' + esc(state.user.email) + '" disabled>' +
            '<span class="hint">Email dùng để đăng nhập, không thể đổi tại đây.</span></div>' +
          '<div class="field"><label for="pfPhone">Số điện thoại</label>' +
            '<input class="input" id="pfPhone" name="phone" inputmode="numeric" value="' + esc(state.user.phone) + '"></div>' +
          '<div class="field"><label for="pfAddress">Địa chỉ</label>' +
            '<input class="input" id="pfAddress" name="address" value="' + esc(state.user.address) + '"></div>' +
          '<button class="btn btn-green" type="submit">Lưu thay đổi</button>' +
        '</form>' +
      '</div>' +
      '<div><h2 style="color:#0f3d24">Đơn hàng của tôi</h2><div id="ordersBox" class="empty-state">Đang tải đơn hàng...</div></div>' +
    '</div>';

    const form = app.querySelector('#profileForm');
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const errorBox = form.querySelector('.form-error');
      errorBox.classList.remove('show');
      try {
        const data = await api('/api/auth/profile', {
          method: 'PUT',
          body: {
            name: form.elements.name.value.trim(),
            phone: form.elements.phone.value.trim(),
            address: form.elements.address.value.trim()
          }
        });
        state.user = data.user;
        renderAccountArea();
        toast('Đã cập nhật thông tin');
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.classList.add('show');
      }
    });

    const ordersBox = app.querySelector('#ordersBox');
    try {
      const data = await api('/api/orders/my');
      ordersBox.className = '';
      ordersBox.innerHTML = data.orders.length
        ? data.orders.map(orderCardHTML).join('')
        : '<div class="empty-state"><i class="fa-solid fa-receipt"></i><h3>Chưa có đơn hàng</h3>' +
          '<p>Đơn hàng đầu tiên của bạn sẽ hiện ở đây.</p><a class="btn btn-green" href="index.html">Mua trái cây</a></div>';
    } catch (error) {
      ordersBox.textContent = error.message;
    }
  }

  /* --------------------------- Đăng nhập / đăng ký --------------------- */
  function initAuth(kind) {
    const form = document.getElementById(kind === 'login' ? 'loginForm' : 'registerForm');
    if (!form) return;

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const errorBox = form.querySelector('.form-error');
      errorBox.classList.remove('show');

      const button = form.querySelector('button[type="submit"]');
      const body = {
        email: form.elements.email.value.trim(),
        password: form.elements.password.value
      };
      if (kind === 'register') {
        body.name = form.elements.name.value.trim();
        body.phone = form.elements.phone.value.trim();
      }

      button.disabled = true;
      try {
        const data = await api('/api/auth/' + kind, { method: 'POST', body: body });
        const next = new URLSearchParams(location.search).get('next');
        const allowed = ['thanh-toan.html', 'tai-khoan.html', 'gio-hang.html'];
        if (next && allowed.indexOf(next) !== -1) {
          location.href = next;
          return;
        }
        location.href = data.user.role === 'admin' ? 'admin/' : 'index.html';
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.classList.add('show');
        button.disabled = false;
      }
    });
  }

  /* -------------------------------- Liên hệ ---------------------------- */
  function initContact() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    function prefill() {
      if (!state.user) return;
      form.elements.name.value = state.user.name;
      form.elements.email.value = state.user.email;
      form.elements.phone.value = state.user.phone || '';
    }
    prefill();

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const errorBox = form.querySelector('.form-error');
      const success = document.getElementById('contactSuccess');
      errorBox.classList.remove('show');
      success.hidden = true;

      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        const result = await api('/api/messages', {
          method: 'POST',
          body: {
            name: form.elements.name.value.trim(),
            email: form.elements.email.value.trim(),
            phone: form.elements.phone.value.trim(),
            subject: form.elements.subject.value.trim(),
            content: form.elements.content.value.trim()
          }
        });
        form.reset();
        prefill();
        success.hidden = false;
        success.textContent = result.message;
        toast('Đã gửi tin nhắn tới cửa hàng');
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.classList.add('show');
      } finally {
        button.disabled = false;
      }
    });
  }

  /* -------------------------------- Khởi động -------------------------- */
  async function boot() {
    try {
      const data = await api('/api/auth/me');
      state.user = data.user;
    } catch (error) {
      state.user = null;
    }

    renderLayout();

    const page = document.body.dataset.page;
    if (page === 'home') initHome();
    else if (page === 'detail') initDetail();
    else if (page === 'cart') initCart();
    else if (page === 'checkout') initCheckout();
    else if (page === 'account') initAccount();
    else if (page === 'login') initAuth('login');
    else if (page === 'register') initAuth('register');
    else if (page === 'contact') initContact();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
