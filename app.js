/* =========================================================
   Hoa Quả Nhà Trồng - logic dùng chung cho toàn bộ website
   Dữ liệu sản phẩm, giỏ hàng, đơn hàng, tin nhắn được lưu
   trong localStorage của trình duyệt (website tĩnh, không cần server).
   ========================================================= */
(function () {
  'use strict';

  /* ----------------------------- Cấu hình ----------------------------- */
  const KEYS = {
    products: 'hqnt_products_v1',
    cart: 'hqnt_cart_v1',
    orders: 'hqnt_orders_v1',
    messages: 'hqnt_messages_v1'
  };

  const SHIPPING_FEE = 30000;
  const FREE_SHIPPING_FROM = 300000;

  const CATEGORIES = {
    'cam-quyt': 'Họ cam quýt',
    'qua-mong': 'Họ quả mọng',
    'nhiet-doi': 'Trái cây nhiệt đới',
    'nhap-khau': 'Trái cây nhập khẩu',
    'gio-qua': 'Giỏ quà'
  };

  const PRICE_RANGES = [
    { id: 'p1', label: 'Dưới 100.000đ', min: 0, max: 100000 },
    { id: 'p2', label: '100.000đ - 200.000đ', min: 100000, max: 200000 },
    { id: 'p3', label: '200.000đ - 500.000đ', min: 200000, max: 500000 },
    { id: 'p4', label: '500.000đ - 1.000.000đ', min: 500000, max: 1000000 },
    { id: 'p5', label: 'Từ 1.000.000đ trở lên', min: 1000000, max: Infinity }
  ];

  const IMAGE_OPTIONS = [
    'image/traicay1.jpg', 'image/traicay2.jpg', 'image/traicay3.jpg',
    'image/traicay4.jpg', 'image/traicay5.jpg', 'image/traicay6.jpg',
    'image/traicay7.jpg', 'image/traicay8.jpg', 'image/traicay9.jpg',
    'image/traicay10.jpg', 'image/traicay11.jpg', 'image/traicay12.jpg',
    'image/traicay13.jpg', 'image/traicay14.jpg', 'image/gio-qua-tet.png'
  ];

  const DEFAULT_PRODUCTS = [
    {
      id: 'cam-dalat', name: 'Cam Đà Lạt', price: 16000, oldPrice: 20000, unit: 'kg',
      category: 'cam-quyt', origin: 'Việt Nam', stock: 120, sold: 145, badge: 'Bán chạy',
      image: 'image/traicay3.jpg',
      desc: 'Cam sành Đà Lạt mọng nước, vị ngọt thanh, giàu vitamin C. Hái trong ngày và giao ngay cho bạn.'
    },
    {
      id: 'nho-on-doi', name: 'Nho ôn đới', price: 13000, oldPrice: 15000, unit: 'kg',
      category: 'qua-mong', origin: 'Mỹ', stock: 80, sold: 96, badge: '',
      image: 'image/traicay4.jpg',
      desc: 'Nho mọng, hạt nhỏ, ngọt đậm, được bảo quản lạnh từ vườn đến tay khách hàng.'
    },
    {
      id: 'xoai-binh-duong', name: 'Xoài Bình Dương', price: 55000, oldPrice: 100000, unit: 'kg',
      category: 'nhiet-doi', origin: 'Việt Nam', stock: 60, sold: 210, badge: 'Giảm sâu',
      image: 'image/traicay5.jpg',
      desc: 'Xoài cát Bình Dương chín vàng, thịt dày, thơm ngọt tự nhiên, ít xơ.'
    },
    {
      id: 'dua-hau', name: 'Dưa hấu không hột', price: 17000, oldPrice: 20000, unit: 'kg',
      category: 'nhiet-doi', origin: 'Việt Nam', stock: 90, sold: 132, badge: '',
      image: 'image/traicay6.jpg',
      desc: 'Dưa hấu ruột đỏ, không hột, giòn ngọt, thích hợp giải nhiệt cho cả gia đình.'
    },
    {
      id: 'mang-cau', name: 'Mãng cầu ta', price: 13000, oldPrice: 15000, unit: 'kg',
      category: 'nhiet-doi', origin: 'Việt Nam', stock: 45, sold: 78, badge: '',
      image: 'image/traicay7.jpg',
      desc: 'Mãng cầu ta chín tới, thịt trắng mềm, ngọt thơm, hạt ít.'
    },
    {
      id: 'chuoi', name: 'Chuối chín', price: 14000, oldPrice: 16000, unit: 'kg',
      category: 'nhiet-doi', origin: 'Việt Nam', stock: 150, sold: 260, badge: 'Bán chạy',
      image: 'image/traicay8.jpg',
      desc: 'Chuối chín tự nhiên, vỏ vàng đẹp, vị ngọt bùi, tốt cho bữa sáng.'
    },
    {
      id: 'tao-do', name: 'Táo đỏ', price: 10000, oldPrice: 12000, unit: 'kg',
      category: 'nhap-khau', origin: 'Trung Quốc', stock: 100, sold: 188, badge: '',
      image: 'image/traicay9.jpg',
      desc: 'Táo đỏ giòn, ngọt nhẹ, giàu chất xơ, phù hợp ăn vặt hằng ngày.'
    },
    {
      id: 'cherry-uc', name: 'Cherry Úc', price: 13000, oldPrice: 16000, unit: 'hộp',
      category: 'nhap-khau', origin: 'Úc', stock: 40, sold: 64, badge: 'Nhập khẩu',
      image: 'image/traicay10.jpg',
      desc: 'Cherry Úc quả to, căng mọng, vị ngọt thanh, nhập khẩu chính ngạch.'
    },
    {
      id: 'dua-luoi', name: 'Dưa lưới Đà Lạt', price: 15000, oldPrice: 17000, unit: 'kg',
      category: 'nhiet-doi', origin: 'Việt Nam', stock: 55, sold: 91, badge: '',
      image: 'image/traicay11.jpg',
      desc: 'Dưa lưới Đà Lạt ruột vàng, mật ngọt, thơm dịu, chuẩn vị nhà trồng.'
    },
    {
      id: 'dau-tay-han', name: 'Dâu tây Hàn Quốc', price: 15000, oldPrice: 16000, unit: 'hộp',
      category: 'qua-mong', origin: 'Hàn Quốc', stock: 35, sold: 57, badge: '',
      image: 'image/traicay12.jpg',
      desc: 'Dâu tây Hàn Quốc đỏ mọng, thơm ngọt, đóng hộp giấy bảo vệ từng quả.'
    },
    {
      id: 'kiwi-xanh', name: 'Kiwi xanh', price: 17000, oldPrice: 20000, unit: 'kg',
      category: 'nhap-khau', origin: 'New Zealand', stock: 70, sold: 83, badge: '',
      image: 'image/traicay13.jpg',
      desc: 'Kiwi xanh New Zealand giàu vitamin C, vị chua ngọt cân bằng, dễ ăn.'
    },
    {
      id: 'bo-dak-lak', name: 'Quả bơ', price: 14000, oldPrice: 16000, unit: 'kg',
      category: 'nhiet-doi', origin: 'Việt Nam', stock: 85, sold: 119, badge: '',
      image: 'image/traicay14.jpg',
      desc: 'Bơ Đắk Lắk dẻo mịn, béo nhẹ, chín tự nhiên, giàu dinh dưỡng.'
    },
    {
      id: 'gio-qua-tet', name: 'Giỏ quà trái cây cao cấp', price: 450000, oldPrice: null, unit: 'giỏ',
      category: 'gio-qua', origin: 'Việt Nam', stock: 25, sold: 38, badge: 'Quà tặng',
      image: 'image/gio-qua-tet.png',
      desc: 'Giỏ quà 5 loại trái cây theo mùa, gói giấy kraft và kèm thiệp chúc. Món quà cho Tết, lễ và sinh nhật.'
    }
  ];

  /* ----------------------------- Tiện ích ----------------------------- */
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      /* bỏ qua khi trình duyệt chặn localStorage */
    }
  }

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatMoney(number) {
    return Number(number || 0).toLocaleString('vi-VN') + 'đ';
  }

  function formatDate(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('vi-VN', { hour12: false });
  }

  function removeDiacritics(text) {
    return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D');
  }

  function discountPercent(product) {
    if (!product.oldPrice || product.oldPrice <= product.price) return 0;
    return Math.round((1 - product.price / product.oldPrice) * 100);
  }

  /* ----------------------------- Sản phẩm ----------------------------- */
  function getProducts() {
    let list = read(KEYS.products, null);
    if (!Array.isArray(list) || !list.length) {
      list = DEFAULT_PRODUCTS.map(function (p) { return Object.assign({}, p); });
      write(KEYS.products, list);
    }
    return list;
  }

  function saveProducts(list) {
    write(KEYS.products, list);
  }

  function getProduct(id) {
    return getProducts().find(function (p) { return p.id === id; });
  }

  function slugify(text) {
    return removeDiacritics(text).toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || ('sp-' + Date.now());
  }

  /* ----------------------------- Giỏ hàng ----------------------------- */
  function getCart() {
    const cart = read(KEYS.cart, []);
    if (!Array.isArray(cart)) return [];
    return cart.filter(function (line) {
      return line && line.id && Number(line.qty) > 0;
    }).map(function (line) {
      return { id: line.id, qty: Math.max(1, parseInt(line.qty, 10) || 1) };
    });
  }

  function saveCart(cart) {
    write(KEYS.cart, cart);
    updateCartBadge();
  }

  function cartCount() {
    return getCart().reduce(function (sum, line) { return sum + line.qty; }, 0);
  }

  function cartTotals() {
    const products = getProducts();
    const lines = getCart().map(function (line) {
      return { id: line.id, qty: line.qty, product: products.find(function (p) { return p.id === line.id; }) };
    }).filter(function (line) { return line.product; });
    const subtotal = lines.reduce(function (sum, line) { return sum + line.product.price * line.qty; }, 0);
    const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
    return { lines: lines, subtotal: subtotal, shipping: shipping, total: subtotal + shipping };
  }

  function addToCart(id, qty) {
    const product = getProduct(id);
    if (!product) return;
    const amount = Math.max(1, parseInt(qty, 10) || 1);
    const cart = getCart();
    const line = cart.find(function (item) { return item.id === id; });
    if (line) {
      line.qty += amount;
    } else {
      cart.push({ id: id, qty: amount });
    }
    saveCart(cart);
    toast('Đã thêm "' + product.name + '" vào giỏ hàng');
  }

  function setQty(id, qty) {
    const amount = parseInt(qty, 10);
    const cart = getCart();
    const line = cart.find(function (item) { return item.id === id; });
    if (!line) return;
    if (!amount || amount < 1) {
      saveCart(cart.filter(function (item) { return item.id !== id; }));
      return;
    }
    line.qty = Math.min(amount, 99);
    saveCart(cart);
  }

  function removeFromCart(id) {
    saveCart(getCart().filter(function (item) { return item.id !== id; }));
  }

  function updateCartBadge() {
    const count = cartCount();
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = count;
      el.classList.toggle('is-empty', count === 0);
    });
  }

  /* ----------------------------- Thông báo ---------------------------- */
  function toast(message, type) {
    let area = document.querySelector('.toast-area');
    if (!area) {
      area = document.createElement('div');
      area.className = 'toast-area';
      document.body.appendChild(area);
    }
    const el = document.createElement('div');
    el.className = 'toast-msg' + (type === 'error' ? ' is-error' : '');
    el.innerHTML = '<i class="fa-solid ' + (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check') + '"></i><span></span>';
    el.querySelector('span').textContent = message;
    area.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 300);
    }, 2800);
  }

  /* --------------------------- Thẻ sản phẩm --------------------------- */
  function productCard(product) {
    const off = discountPercent(product);
    const badge = off
      ? '<span class="product-badge is-sale">-' + off + '%</span>'
      : (product.badge ? '<span class="product-badge">' + esc(product.badge) + '</span>' : '');

    return '' +
      '<div class="col-lg-4 col-md-4 col-6 mb-4">' +
        '<div class="card h-100 product-card">' +
          '<a class="product-thumb" href="chi-tiet.html?id=' + encodeURIComponent(product.id) + '">' +
            badge +
            '<img src="' + esc(product.image) + '" class="card-img-top" alt="' + esc(product.name) + '" loading="lazy">' +
            '<button type="button" class="quick-view" data-view="' + esc(product.id) + '">' +
              '<i class="fa-solid fa-eye"></i> Xem nhanh' +
            '</button>' +
          '</a>' +
          '<div class="card-body">' +
            '<h5 class="card-title"><a href="chi-tiet.html?id=' + encodeURIComponent(product.id) + '">' + esc(product.name) + '</a></h5>' +
            '<p class="product-meta">' + esc(product.origin) + ' • ' + esc(product.unit) + '</p>' +
            '<p class="product-price">' + formatMoney(product.price) +
              (product.oldPrice ? '<span class="price-old">' + formatMoney(product.oldPrice) + '</span>' : '') +
            '</p>' +
            '<p class="product-sold">Đã bán ' + (product.sold || 0) + ' ' + esc(product.unit) + '</p>' +
          '</div>' +
          '<div class="card-footer">' +
            '<button type="button" class="btn btn-outline-success w-100" data-add="' + esc(product.id) + '">' +
              '<i class="fa-solid fa-cart-plus"></i> Đặt mua' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* ---------------------------- Xem nhanh ----------------------------- */
  function ensureQuickView() {
    if (document.getElementById('quickViewModal')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="modal fade" id="quickViewModal" tabindex="-1" aria-hidden="true">' +
        '<div class="modal-dialog modal-dialog-centered modal-lg">' +
          '<div class="modal-content" id="quickViewContent"></div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap.firstElementChild);
  }

  function openQuickView(id) {
    const product = getProduct(id);
    if (!product) return;
    ensureQuickView();
    const off = discountPercent(product);
    const content = document.getElementById('quickViewContent');
    content.innerHTML =
      '<button type="button" class="btn-close modal-close" data-bs-dismiss="modal" aria-label="Đóng"></button>' +
      '<div class="row g-0">' +
        '<div class="col-md-5"><img src="' + esc(product.image) + '" class="quick-img" alt="' + esc(product.name) + '"></div>' +
        '<div class="col-md-7">' +
          '<div class="modal-body">' +
            '<span class="product-meta">' + esc(CATEGORIES[product.category] || '') + ' • ' + esc(product.origin) + '</span>' +
            '<h3 class="quick-title">' + esc(product.name) + '</h3>' +
            '<p class="quick-desc">' + esc(product.desc || '') + '</p>' +
            '<p class="product-price mb-1">' + formatMoney(product.price) + ' / ' + esc(product.unit) +
              (product.oldPrice ? '<span class="price-old">' + formatMoney(product.oldPrice) + '</span>' : '') +
            '</p>' +
            (off ? '<p class="quick-save">Tiết kiệm ' + off + '% so với giá thường</p>' : '') +
            '<p class="product-sold">Còn ' + (product.stock || 0) + ' ' + esc(product.unit) + ' • Đã bán ' + (product.sold || 0) + '</p>' +
            '<div class="quick-actions">' +
              '<div class="qty-control">' +
                '<button type="button" class="js-qv-dec" aria-label="Giảm">−</button>' +
                '<input type="number" id="quickViewQty" min="1" max="99" value="1" aria-label="Số lượng">' +
                '<button type="button" class="js-qv-inc" aria-label="Tăng">+</button>' +
              '</div>' +
              '<button type="button" class="btn btn-success" data-add="' + esc(product.id) + '">' +
                '<i class="fa-solid fa-cart-plus"></i> Thêm vào giỏ' +
              '</button>' +
              '<a class="btn btn-outline-success" href="chi-tiet.html?id=' + encodeURIComponent(product.id) + '">Xem chi tiết</a>' +
            '</div>' +
            '<p class="quick-ship"><i class="fa-solid fa-truck-fast"></i> Giao trong 2 giờ tại TP.HCM • Miễn phí ship từ ' + formatMoney(FREE_SHIPPING_FROM) + '</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    const input = content.querySelector('#quickViewQty');
    content.querySelector('.js-qv-dec').addEventListener('click', function () {
      input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
    });
    content.querySelector('.js-qv-inc').addEventListener('click', function () {
      input.value = Math.min(99, (parseInt(input.value, 10) || 1) + 1);
    });

    bootstrap.Modal.getOrCreateInstance(document.getElementById('quickViewModal')).show();
  }

  /* --------------------------- Trang danh mục -------------------------- */
  function initCatalog(saleOnly) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    const state = {
      q: '', category: '', origins: new Set(), prices: new Set(),
      page: 1, perPage: 9, saleOnly: false
    };

    const params = new URLSearchParams(location.search);
    state.q = (params.get('q') || '').trim();
    state.category = params.get('category') || '';

    document.querySelectorAll('.js-search-form input[name="q"]').forEach(function (input) {
      input.value = state.q;
    });

    /* Danh mục */
    const catList = document.getElementById('categoryList');
    if (catList) {
      catList.addEventListener('click', function (event) {
        const link = event.target.closest('[data-category]');
        if (!link) return;
        event.preventDefault();
        state.category = link.getAttribute('data-category');
        state.page = 1;
        catList.querySelectorAll('[data-category]').forEach(function (item) {
          item.classList.toggle('is-active', item === link);
        });
        render();
      });
    }

    /* Xuất xứ */
    const originList = document.getElementById('originList');
    if (originList) {
      originList.addEventListener('change', function (event) {
        const box = event.target.closest('input[data-origin]');
        if (!box) return;
        if (box.checked) state.origins.add(box.value);
        else state.origins.delete(box.value);
        state.page = 1;
        render();
      });
    }

    /* Giá */
    const priceList = document.getElementById('priceList');
    if (priceList) {
      priceList.addEventListener('change', function (event) {
        const box = event.target.closest('input[data-price]');
        if (!box) return;
        if (box.checked) state.prices.add(box.value);
        else state.prices.delete(box.value);
        state.page = 1;
        render();
      });
    }

    /* Tìm kiếm trực tiếp */
    document.querySelectorAll('.js-search-form input[name="q"]').forEach(function (input) {
      input.addEventListener('input', function () {
        state.q = input.value;
        state.page = 1;
        render();
      });
    });

    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        state.q = '';
        state.category = '';
        state.origins.clear();
        state.prices.clear();
        state.page = 1;
        document.querySelectorAll('.js-search-form input[name="q"]').forEach(function (input) { input.value = ''; });
        document.querySelectorAll('input[data-origin], input[data-price]').forEach(function (box) { box.checked = false; });
        if (catList) {
          catList.querySelectorAll('[data-category]').forEach(function (item) {
            item.classList.toggle('is-active', item.getAttribute('data-category') === '');
          });
        }
        history.replaceState(null, '', location.pathname);
        render();
      });
    }

    const paginationEl = document.getElementById('pagination');
    function onPageClick(event) {
      const pageBtn = event.target.closest('[data-page]');
      if (!pageBtn) return;
      event.preventDefault();
      const target = parseInt(pageBtn.getAttribute('data-page'), 10) || 1;
      if (target < 1) return;
      state.page = target;
      render();
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    grid.addEventListener('click', onPageClick);
    if (paginationEl) paginationEl.addEventListener('click', onPageClick);

    function matches(product) {
      if (state.saleOnly && !(product.oldPrice && product.oldPrice > product.price)) return false;
      if (state.category && product.category !== state.category) return false;
      if (state.origins.size && !state.origins.has(product.origin)) return false;
      if (state.prices.size) {
        const ok = Array.from(state.prices).some(function (id) {
          const range = PRICE_RANGES.find(function (r) { return r.id === id; });
          return range && product.price >= range.min && product.price < range.max;
        });
        if (!ok) return false;
      }
      if (state.q) {
        const needle = removeDiacritics(state.q.toLowerCase());
        const haystack = removeDiacritics(
          product.name + ' ' + product.origin + ' ' + (CATEGORIES[product.category] || '')
        ).toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    }

    function buildSidebar() {
      const products = getProducts();
      const counts = {};
      products.forEach(function (p) { counts[p.category] = (counts[p.category] || 0) + 1; });

      if (catList) {
        let html = '<a href="#" class="' + (state.category ? '' : 'is-active') + '" data-category="">' +
          'Tất cả sản phẩm <span>' + products.length + '</span></a>';
        Object.keys(CATEGORIES).forEach(function (key) {
          if (!counts[key]) return;
          html += '<a href="#" class="' + (state.category === key ? 'is-active' : '') + '" data-category="' + key + '">' +
            esc(CATEGORIES[key]) + ' <span>' + counts[key] + '</span></a>';
        });
        catList.innerHTML = html;
      }

      if (originList) {
        const origins = [];
        products.forEach(function (p) {
          if (origins.indexOf(p.origin) === -1) origins.push(p.origin);
        });
        origins.sort(function (a, b) { return a.localeCompare(b, 'vi'); });
        originList.innerHTML = origins.map(function (origin, index) {
          const id = 'origin-' + index;
          return '<div class="filter-item">' +
            '<input class="form-check-input" type="checkbox" id="' + id + '" value="' + esc(origin) + '" data-origin ' +
              (state.origins.has(origin) ? 'checked' : '') + '>' +
            '<label class="form-check-label" for="' + id + '">' + esc(origin) + '</label>' +
          '</div>';
        }).join('');
      }

      if (priceList) {
        priceList.innerHTML = PRICE_RANGES.map(function (range, index) {
          const id = 'price-' + index;
          return '<div class="filter-item">' +
            '<input class="form-check-input" type="checkbox" id="' + id + '" value="' + range.id + '" data-price ' +
              (state.prices.has(range.id) ? 'checked' : '') + '>' +
            '<label class="form-check-label" for="' + id + '">' + esc(range.label) + '</label>' +
          '</div>';
        }).join('');
      }
    }

    function render() {
      if (catList) {
        catList.querySelectorAll('[data-category]').forEach(function (item) {
          item.classList.toggle('is-active', item.getAttribute('data-category') === state.category);
        });
      }

      const list = getProducts().filter(matches);
      const totalPages = Math.max(1, Math.ceil(list.length / state.perPage));
      if (state.page > totalPages) state.page = totalPages;
      const start = (state.page - 1) * state.perPage;
      const pageItems = list.slice(start, start + state.perPage);

      grid.innerHTML = pageItems.length
        ? pageItems.map(productCard).join('')
        : '<div class="col-12"><div class="empty-state">' +
            '<i class="fa-solid fa-basket-shopping"></i>' +
            '<h3>Không tìm thấy sản phẩm phù hợp</h3>' +
            '<p>Thử từ khóa khác hoặc bỏ bớt bộ lọc nhé.</p>' +
          '</div></div>';

      const info = document.getElementById('resultInfo');
      if (info) {
        info.textContent = list.length
          ? 'Hiển thị ' + (start + 1) + '–' + (start + pageItems.length) + ' trong ' + list.length + ' sản phẩm'
          : 'Không có sản phẩm phù hợp';
      }

      const pagination = document.getElementById('pagination');
      if (pagination) {
        if (totalPages <= 1) {
          pagination.innerHTML = '';
        } else {
          let html = '<li class="page-item' + (state.page === 1 ? ' disabled' : '') + '">' +
            '<a class="page-link" href="#" data-page="' + (state.page - 1) + '">&laquo;</a></li>';
          for (let i = 1; i <= totalPages; i++) {
            html += '<li class="page-item' + (i === state.page ? ' active' : '') + '">' +
              '<a class="page-link" href="#" data-page="' + i + '">' + i + '</a></li>';
          }
          html += '<li class="page-item' + (state.page === totalPages ? ' disabled' : '') + '">' +
            '<a class="page-link" href="#" data-page="' + (state.page + 1) + '">&raquo;</a></li>';
          pagination.innerHTML = html;
        }
      }
    }

    buildSidebar();
    render();
  }

  /* ----------------------------- Giỏ hàng ----------------------------- */
  function initCart() {
    const wrap = document.getElementById('cartWrap');
    if (!wrap) return;

    function template(totals) {
      const items = totals.lines.map(function (line) {
        const p = line.product;
        return '<tr>' +
          '<td>' +
            '<div class="cart-product">' +
              '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '">' +
              '<div><strong>' + esc(p.name) + '</strong>' +
                '<div class="text-muted small">' + formatMoney(p.price) + ' / ' + esc(p.unit) + '</div></div>' +
            '</div>' +
          '</td>' +
          '<td class="text-center">' +
            '<div class="qty-control">' +
              '<button type="button" data-cart-dec="' + esc(p.id) + '" aria-label="Giảm">−</button>' +
              '<input type="number" min="1" max="99" value="' + line.qty + '" data-cart-qty="' + esc(p.id) + '" aria-label="Số lượng">' +
              '<button type="button" data-cart-inc="' + esc(p.id) + '" aria-label="Tăng">+</button>' +
            '</div>' +
          '</td>' +
          '<td class="text-end fw-semibold">' + formatMoney(p.price * line.qty) + '</td>' +
          '<td class="text-end">' +
            '<button type="button" class="btn btn-sm btn-outline-danger" data-cart-remove="' + esc(p.id) + '" aria-label="Xóa sản phẩm">' +
              '<i class="fa-solid fa-trash"></i>' +
            '</button>' +
          '</td>' +
        '</tr>';
      }).join('');

      return '' +
        '<div class="row g-4">' +
          '<div class="col-lg-7">' +
            '<div class="panel">' +
              '<h4 class="panel-title">Sản phẩm trong giỏ</h4>' +
              '<div class="table-responsive">' +
                '<table class="table align-middle cart-table mb-0">' +
                  '<thead><tr><th>Sản phẩm</th><th class="text-center">Số lượng</th><th class="text-end">Tạm tính</th><th></th></tr></thead>' +
                  '<tbody>' + items + '</tbody>' +
                '</table>' +
              '</div>' +
            '</div>' +
            '<a href="index.html" class="btn btn-outline-success mt-3"><i class="fa-solid fa-arrow-left"></i> Tiếp tục mua sắm</a>' +
          '</div>' +
          '<div class="col-lg-5">' +
            '<div class="panel">' +
              '<h4 class="panel-title">Thông tin đặt hàng</h4>' +
              '<form id="checkoutForm" class="row g-3" novalidate>' +
                '<div class="col-12">' +
                  '<label class="form-label" for="coName">Họ và tên người nhận</label>' +
                  '<input class="form-control" id="coName" name="name" required placeholder="Nguyễn Văn A">' +
                  '<div class="invalid-feedback">Vui lòng nhập họ tên.</div>' +
                '</div>' +
                '<div class="col-md-6">' +
                  '<label class="form-label" for="coPhone">Số điện thoại</label>' +
                  '<input class="form-control" id="coPhone" name="phone" required inputmode="numeric" pattern="0[0-9]{9,10}" placeholder="0901234567">' +
                  '<div class="invalid-feedback">Số điện thoại gồm 10–11 số, bắt đầu bằng 0.</div>' +
                '</div>' +
                '<div class="col-md-6">' +
                  '<label class="form-label" for="coEmail">Email (không bắt buộc)</label>' +
                  '<input type="email" class="form-control" id="coEmail" name="email" placeholder="ban@email.com">' +
                '</div>' +
                '<div class="col-12">' +
                  '<label class="form-label" for="coAddress">Địa chỉ giao hàng</label>' +
                  '<input class="form-control" id="coAddress" name="address" required placeholder="Số nhà, đường, phường, quận">' +
                  '<div class="invalid-feedback">Vui lòng nhập địa chỉ giao hàng.</div>' +
                '</div>' +
                '<div class="col-md-6">' +
                  '<label class="form-label" for="coDelivery">Hình thức giao</label>' +
                  '<select class="form-select" id="coDelivery" name="delivery">' +
                    '<option>Giao nhanh trong 2 giờ (nội thành TP.HCM)</option>' +
                    '<option>Giao tiêu chuẩn trong ngày</option>' +
                  '</select>' +
                '</div>' +
                '<div class="col-md-6">' +
                  '<label class="form-label" for="coPayment">Thanh toán</label>' +
                  '<select class="form-select" id="coPayment" name="payment">' +
                    '<option>Thanh toán khi nhận hàng (COD)</option>' +
                    '<option>Chuyển khoản ngân hàng</option>' +
                    '<option>Ví điện tử MoMo</option>' +
                  '</select>' +
                '</div>' +
                '<div class="col-12">' +
                  '<label class="form-label" for="coNote">Ghi chú</label>' +
                  '<textarea class="form-control" id="coNote" name="note" rows="2" placeholder="Ví dụ: giao sau 18h, chọn quả chín vừa..."></textarea>' +
                '</div>' +
                '<div class="col-12"><div class="summary">' +
                  '<div><span>Tạm tính</span><strong>' + formatMoney(totals.subtotal) + '</strong></div>' +
                  '<div><span>Phí giao hàng</span><strong>' + (totals.shipping ? formatMoney(totals.shipping) : 'Miễn phí') + '</strong></div>' +
                  '<div class="summary-total"><span>Tổng cộng</span><strong>' + formatMoney(totals.total) + '</strong></div>' +
                '</div></div>' +
                '<div class="col-12">' +
                  '<button type="submit" class="btn btn-success w-100"><i class="fa-solid fa-bag-shopping"></i> Đặt hàng</button>' +
                '</div>' +
                '<p class="col-12 mb-0 small text-muted">Miễn phí giao hàng cho đơn từ ' + formatMoney(FREE_SHIPPING_FROM) + '.</p>' +
              '</form>' +
            '</div>' +
          '</div>' +
        '</div>';
    }

    function render() {
      const totals = cartTotals();
      if (!totals.lines.length) {
        wrap.innerHTML =
          '<div class="empty-state">' +
            '<i class="fa-solid fa-cart-shopping"></i>' +
            '<h3>Giỏ hàng đang trống</h3>' +
            '<p>Hãy chọn vài loại trái cây tươi cho gia đình bạn nhé.</p>' +
            '<a class="btn btn-success" href="index.html">Tiếp tục mua sắm</a>' +
          '</div>';
        return;
      }

      wrap.innerHTML = template(totals);

      wrap.querySelectorAll('[data-cart-inc]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const id = btn.getAttribute('data-cart-inc');
          const line = getCart().find(function (item) { return item.id === id; });
          setQty(id, (line ? line.qty : 1) + 1);
          render();
        });
      });
      wrap.querySelectorAll('[data-cart-dec]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          const id = btn.getAttribute('data-cart-dec');
          const line = getCart().find(function (item) { return item.id === id; });
          if (!line) return;
          if (line.qty <= 1) removeFromCart(id);
          else setQty(id, line.qty - 1);
          render();
        });
      });
      wrap.querySelectorAll('[data-cart-remove]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          removeFromCart(btn.getAttribute('data-cart-remove'));
          render();
        });
      });
      wrap.querySelectorAll('[data-cart-qty]').forEach(function (input) {
        input.addEventListener('change', function () {
          setQty(input.getAttribute('data-cart-qty'), input.value);
          render();
        });
      });

      const form = wrap.querySelector('#checkoutForm');
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!form.checkValidity()) {
          form.classList.add('was-validated');
          return;
        }
        const data = new FormData(form);
        const current = cartTotals();
        const order = {
          code: 'HQ' + Date.now().toString().slice(-8),
          name: String(data.get('name')).trim(),
          phone: String(data.get('phone')).trim(),
          email: String(data.get('email') || '').trim(),
          address: String(data.get('address')).trim(),
          note: String(data.get('note') || '').trim(),
          delivery: data.get('delivery'),
          payment: data.get('payment'),
          items: current.lines.map(function (line) {
            return {
              id: line.product.id, name: line.product.name, price: line.product.price,
              unit: line.product.unit, qty: line.qty, image: line.product.image
            };
          }),
          subtotal: current.subtotal,
          shipping: current.shipping,
          total: current.total,
          status: 'Mới',
          createdAt: new Date().toISOString()
        };

        const orders = read(KEYS.orders, []);
        orders.unshift(order);
        write(KEYS.orders, orders);
        saveCart([]);

        wrap.innerHTML =
          '<div class="empty-state success-state">' +
            '<i class="fa-solid fa-circle-check"></i>' +
            '<h3>Đặt hàng thành công!</h3>' +
            '<p>Cảm ơn <strong>' + esc(order.name) + '</strong>. Mã đơn hàng của bạn là <strong>' + order.code + '</strong>.</p>' +
            '<p>Tổng thanh toán: <strong>' + formatMoney(order.total) + '</strong> • ' + esc(order.payment) + '</p>' +
            '<p class="text-muted">Cửa hàng sẽ gọi xác nhận tới số ' + esc(order.phone) + ' trong ít phút.</p>' +
            '<div class="d-flex gap-2 justify-content-center flex-wrap">' +
              '<a class="btn btn-success" href="index.html">Tiếp tục mua sắm</a>' +
              '<a class="btn btn-outline-success" href="admin.html">Xem đơn trong trang quản lý</a>' +
            '</div>' +
          '</div>';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    render();
  }

  /* --------------------------- Chi tiết sản phẩm ---------------------- */
  function initProductDetail() {
    const wrap = document.getElementById('productDetail');
    if (!wrap) return;

    const id = new URLSearchParams(location.search).get('id');
    const products = getProducts();
    const product = products.find(function (p) { return p.id === id; });

    if (!product) {
      wrap.innerHTML =
        '<div class="empty-state">' +
          '<i class="fa-solid fa-basket-shopping"></i>' +
          '<h3>Không tìm thấy sản phẩm</h3>' +
          '<p>Sản phẩm có thể đã được đổi tên hoặc gỡ khỏi cửa hàng.</p>' +
          '<a class="btn btn-success" href="index.html">Về trang sản phẩm</a>' +
        '</div>';
      return;
    }

    document.title = product.name + ' – Hoa Quả Nhà Trồng';
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) descMeta.setAttribute('content', product.desc || product.name);

    const off = discountPercent(product);
    const categoryName = CATEGORIES[product.category] || 'Sản phẩm';
    let related = products.filter(function (p) {
      return p.id !== product.id && p.category === product.category;
    }).slice(0, 3);
    if (!related.length) {
      related = products.filter(function (p) { return p.id !== product.id; }).slice(0, 3);
    }

    wrap.innerHTML =
      '<nav aria-label="breadcrumb" class="detail-head">' +
        '<ol class="breadcrumb mb-0">' +
          '<li class="breadcrumb-item"><a href="index.html">Trang chủ</a></li>' +
          '<li class="breadcrumb-item"><a href="index.html?category=' + encodeURIComponent(product.category) + '">' + esc(categoryName) + '</a></li>' +
          '<li class="breadcrumb-item active" aria-current="page">' + esc(product.name) + '</li>' +
        '</ol>' +
      '</nav>' +
      '<div class="row g-4 g-lg-5 detail-card">' +
        '<div class="col-lg-5">' +
          '<div class="detail-media">' +
            '<img src="' + esc(product.image) + '" alt="' + esc(product.name) + '">' +
            (off ? '<span class="product-badge is-sale">-' + off + '%</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="col-lg-7">' +
          '<span class="detail-cat">' + esc(categoryName) + '</span>' +
          '<h1 class="detail-title">' + esc(product.name) + '</h1>' +
          '<div class="detail-stats">' +
            '<span><i class="fa-solid fa-star"></i>4.8/5</span>' +
            '<span><i class="fa-solid fa-box"></i>Còn ' + (product.stock || 0) + ' ' + esc(product.unit) + '</span>' +
            '<span><i class="fa-solid fa-cart-shopping"></i>Đã bán ' + (product.sold || 0) + '</span>' +
          '</div>' +
          '<div class="detail-price">' + formatMoney(product.price) +
            '<small>/ ' + esc(product.unit) + '</small>' +
            (product.oldPrice ? '<span class="price-old">' + formatMoney(product.oldPrice) + '</span>' : '') +
          '</div>' +
          (off ? '<p class="quick-save">Tiết kiệm ' + formatMoney(product.oldPrice - product.price) + ' (' + off + '%)</p>' : '') +
          '<p class="detail-desc">' + esc(product.desc || '') + '</p>' +
          '<ul class="detail-specs">' +
            '<li><span>Xuất xứ</span><strong>' + esc(product.origin) + '</strong></li>' +
            '<li><span>Danh mục</span><strong>' + esc(categoryName) + '</strong></li>' +
            '<li><span>Đơn vị bán</span><strong>' + esc(product.unit) + '</strong></li>' +
          '</ul>' +
          '<div class="detail-actions">' +
            '<div class="qty-control">' +
              '<button type="button" id="detailDec" aria-label="Giảm">−</button>' +
              '<input type="number" id="detailQty" min="1" max="99" value="1" aria-label="Số lượng">' +
              '<button type="button" id="detailInc" aria-label="Tăng">+</button>' +
            '</div>' +
            '<button type="button" class="btn btn-success" data-add="' + esc(product.id) + '" data-qty-source="#detailQty">' +
              '<i class="fa-solid fa-cart-plus"></i> Thêm vào giỏ' +
            '</button>' +
          '</div>' +
          '<div class="detail-perks">' +
            '<span><i class="fa-solid fa-truck-fast"></i>Giao trong 2 giờ</span>' +
            '<span><i class="fa-solid fa-rotate-left"></i>Đổi trả 24 giờ</span>' +
            '<span><i class="fa-solid fa-sack-dollar"></i>Miễn phí ship từ ' + formatMoney(FREE_SHIPPING_FROM) + '</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      (related.length
        ? '<section class="related-section">' +
            '<div class="section-head text-start"><h2>Sản phẩm cùng loại</h2>' +
              '<p>Những loại trái cây khác trong cùng danh mục ' + esc(categoryName) + '.</p>' +
            '</div>' +
            '<div class="row">' + related.map(productCard).join('') + '</div>' +
          '</section>'
        : '');

    const qtyInput = document.getElementById('detailQty');
    document.getElementById('detailDec').addEventListener('click', function () {
      qtyInput.value = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1);
    });
    document.getElementById('detailInc').addEventListener('click', function () {
      qtyInput.value = Math.min(99, (parseInt(qtyInput.value, 10) || 1) + 1);
    });
  }

  /* ------------------------------ Liên hệ ----------------------------- */
  function initContact() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }
      const data = new FormData(form);
      const messages = read(KEYS.messages, []);
      messages.unshift({
        id: 'msg-' + Date.now(),
        title: String(data.get('title') || '').trim(),
        name: String(data.get('name') || '').trim(),
        email: String(data.get('email') || '').trim(),
        phone: String(data.get('phone') || '').trim(),
        address: String(data.get('address') || '').trim(),
        content: String(data.get('content') || '').trim(),
        createdAt: new Date().toISOString()
      });
      write(KEYS.messages, messages);
      form.reset();
      form.classList.remove('was-validated');
      toast('Đã gửi tin nhắn. Chúng tôi sẽ phản hồi sớm nhất!');
      const note = document.getElementById('contactSuccess');
      if (note) note.hidden = false;
    });
  }

  /* ------------------------ Trang quản lý ----------------------------- */
  function initAdmin() {
    const tableBody = document.getElementById('productTableBody');
    if (!tableBody) return;

    const form = document.getElementById('productForm');
    const formTitle = document.getElementById('formTitle');
    const cancelBtn = document.getElementById('cancelEdit');
    let editingId = null;

    /* Đổ lựa chọn danh mục + ảnh */
    const categorySelect = document.getElementById('pCategory');
    categorySelect.innerHTML = Object.keys(CATEGORIES).map(function (key) {
      return '<option value="' + key + '">' + esc(CATEGORIES[key]) + '</option>';
    }).join('');

    const imageSelect = document.getElementById('pImage');
    imageSelect.innerHTML = IMAGE_OPTIONS.map(function (src) {
      return '<option value="' + src + '">' + src.replace('image/', '') + '</option>';
    }).join('');

    function statCard(icon, label, value) {
      return '<div class="col-6 col-lg-3"><div class="stat-card">' +
        '<i class="fa-solid ' + icon + '"></i>' +
        '<div><span>' + label + '</span><strong>' + value + '</strong></div>' +
      '</div></div>';
    }

    function renderStats(products, orders) {
      const stats = document.getElementById('adminStats');
      const revenue = orders.filter(function (o) { return o.status !== 'Hủy'; })
        .reduce(function (sum, o) { return sum + Number(o.total || 0); }, 0);
      const newOrders = orders.filter(function (o) { return o.status === 'Mới'; }).length;
      stats.innerHTML =
        statCard('fa-basket-shopping', 'Sản phẩm', products.length) +
        statCard('fa-receipt', 'Đơn hàng', orders.length) +
        statCard('fa-bell', 'Đơn mới chờ xử lý', newOrders) +
        statCard('fa-sack-dollar', 'Doanh thu', formatMoney(revenue));

      document.querySelectorAll('[data-order-count]').forEach(function (el) {
        el.textContent = newOrders;
      });
    }

    function renderProducts() {
      const products = getProducts();
      tableBody.innerHTML = products.map(function (p, index) {
        return '<tr>' +
          '<td>' + (index + 1) + '</td>' +
          '<td><div class="admin-product"><img src="' + esc(p.image) + '" alt="">' +
            '<div><strong>' + esc(p.name) + '</strong>' +
              '<div class="small text-muted">' + esc(CATEGORIES[p.category] || '') + ' • ' + esc(p.origin) + '</div>' +
            '</div></div></td>' +
          '<td class="text-nowrap">' + formatMoney(p.price) +
            (p.oldPrice ? '<div class="small text-muted text-decoration-line-through">' + formatMoney(p.oldPrice) + '</div>' : '') +
          '</td>' +
          '<td>' + (p.stock || 0) + '</td>' +
          '<td>' + (p.sold || 0) + '</td>' +
          '<td class="text-end text-nowrap">' +
            '<button type="button" class="btn btn-sm btn-warning" data-edit="' + esc(p.id) + '">Sửa</button> ' +
            '<button type="button" class="btn btn-sm btn-danger" data-del="' + esc(p.id) + '">Xóa</button>' +
          '</td>' +
        '</tr>';
      }).join('') || '<tr><td colspan="6" class="text-center text-muted py-4">Chưa có sản phẩm nào</td></tr>';
    }

    function resetForm() {
      editingId = null;
      form.reset();
      formTitle.textContent = 'Thêm sản phẩm mới';
      cancelBtn.hidden = true;
      imageSelect.value = IMAGE_OPTIONS[2];
    }

    tableBody.addEventListener('click', function (event) {
      const editBtn = event.target.closest('[data-edit]');
      if (editBtn) {
        const p = getProduct(editBtn.getAttribute('data-edit'));
        if (!p) return;
        editingId = p.id;
        document.getElementById('pName').value = p.name;
        document.getElementById('pPrice').value = p.price;
        document.getElementById('pOldPrice').value = p.oldPrice || '';
        document.getElementById('pUnit').value = p.unit;
        document.getElementById('pCategory').value = p.category;
        document.getElementById('pOrigin').value = p.origin;
        document.getElementById('pStock').value = p.stock;
        document.getElementById('pImage').value = p.image;
        document.getElementById('pDesc').value = p.desc || '';
        formTitle.textContent = 'Sửa sản phẩm: ' + p.name;
        cancelBtn.hidden = false;
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const delBtn = event.target.closest('[data-del]');
      if (delBtn) {
        const p = getProduct(delBtn.getAttribute('data-del'));
        if (!p) return;
        if (!confirm('Xóa sản phẩm "' + p.name + '" khỏi cửa hàng?')) return;
        saveProducts(getProducts().filter(function (item) { return item.id !== p.id; }));
        if (editingId === p.id) resetForm();
        renderAll();
        toast('Đã xóa sản phẩm');
      }
    });

    cancelBtn.addEventListener('click', resetForm);

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }
      const name = document.getElementById('pName').value.trim();
      const price = parseInt(document.getElementById('pPrice').value, 10);
      const oldPriceRaw = document.getElementById('pOldPrice').value.trim();
      const oldPrice = oldPriceRaw ? parseInt(oldPriceRaw, 10) : null;
      const data = {
        name: name,
        price: price,
        oldPrice: oldPrice && oldPrice > price ? oldPrice : null,
        unit: document.getElementById('pUnit').value.trim() || 'kg',
        category: document.getElementById('pCategory').value,
        origin: document.getElementById('pOrigin').value.trim() || 'Việt Nam',
        stock: parseInt(document.getElementById('pStock').value, 10) || 0,
        image: document.getElementById('pImage').value,
        desc: document.getElementById('pDesc').value.trim()
      };

      const products = getProducts();
      if (editingId) {
        const index = products.findIndex(function (p) { return p.id === editingId; });
        if (index > -1) products[index] = Object.assign({}, products[index], data);
        saveProducts(products);
        toast('Đã cập nhật sản phẩm');
      } else {
        products.push(Object.assign({ id: slugify(name), sold: 0, badge: '' }, data));
        saveProducts(products);
        toast('Đã thêm sản phẩm mới');
      }
      resetForm();
      form.classList.remove('was-validated');
      renderAll();
    });

    /* Đơn hàng */
    function renderOrders() {
      const wrap = document.getElementById('ordersWrap');
      const orders = read(KEYS.orders, []);
      if (!orders.length) {
        wrap.innerHTML = '<div class="empty-state"><i class="fa-solid fa-receipt"></i>' +
          '<h3>Chưa có đơn hàng nào</h3><p>Đơn đặt từ trang giỏ hàng sẽ hiện ở đây.</p></div>';
        return;
      }
      wrap.innerHTML = orders.map(function (order) {
        const items = order.items.map(function (item) {
          return '<li><span>' + esc(item.name) + ' × ' + item.qty + ' ' + esc(item.unit) + '</span>' +
            '<strong>' + formatMoney(item.price * item.qty) + '</strong></li>';
        }).join('');
        return '<div class="order-card">' +
          '<div class="order-head">' +
            '<div><strong>#' + esc(order.code) + '</strong>' +
              '<div class="small text-muted">' + formatDate(order.createdAt) + '</div></div>' +
            '<select class="form-select form-select-sm order-status" data-order-status="' + esc(order.code) + '">' +
              ['Mới', 'Đang giao', 'Hoàn tất', 'Hủy'].map(function (status) {
                return '<option' + (order.status === status ? ' selected' : '') + '>' + status + '</option>';
              }).join('') +
            '</select>' +
          '</div>' +
          '<div class="row g-2 small">' +
            '<div class="col-md-6"><span class="text-muted">Người nhận:</span> ' + esc(order.name) + ' • ' + esc(order.phone) + '</div>' +
            '<div class="col-md-6"><span class="text-muted">Địa chỉ:</span> ' + esc(order.address) + '</div>' +
            '<div class="col-md-6"><span class="text-muted">Giao hàng:</span> ' + esc(order.delivery || '') + '</div>' +
            '<div class="col-md-6"><span class="text-muted">Thanh toán:</span> ' + esc(order.payment || '') + '</div>' +
            (order.note ? '<div class="col-12"><span class="text-muted">Ghi chú:</span> ' + esc(order.note) + '</div>' : '') +
          '</div>' +
          '<ul class="order-items">' + items + '</ul>' +
          '<div class="order-total"><span>Phí ship: ' + (order.shipping ? formatMoney(order.shipping) : 'Miễn phí') + '</span>' +
            '<strong>Tổng: ' + formatMoney(order.total) + '</strong></div>' +
          '<div class="text-end mt-2">' +
            '<button type="button" class="btn btn-sm btn-outline-danger" data-order-del="' + esc(order.code) + '">Xóa đơn</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    const ordersWrap = document.getElementById('ordersWrap');
    ordersWrap.addEventListener('change', function (event) {
      const select = event.target.closest('[data-order-status]');
      if (!select) return;
      const orders = read(KEYS.orders, []);
      const order = orders.find(function (o) { return o.code === select.getAttribute('data-order-status'); });
      if (!order) return;
      order.status = select.value;
      write(KEYS.orders, orders);
      renderStats(getProducts(), orders);
      toast('Đã cập nhật trạng thái đơn ' + order.code);
    });

    ordersWrap.addEventListener('click', function (event) {
      const btn = event.target.closest('[data-order-del]');
      if (!btn) return;
      const code = btn.getAttribute('data-order-del');
      if (!confirm('Xóa đơn hàng #' + code + '?')) return;
      const orders = read(KEYS.orders, []).filter(function (o) { return o.code !== code; });
      write(KEYS.orders, orders);
      renderAll();
      toast('Đã xóa đơn hàng');
    });

    /* Tin nhắn */
    function renderMessages() {
      const wrap = document.getElementById('messagesWrap');
      const messages = read(KEYS.messages, []);
      if (!messages.length) {
        wrap.innerHTML = '<div class="empty-state"><i class="fa-solid fa-envelope-open-text"></i>' +
          '<h3>Chưa có tin nhắn</h3><p>Tin nhắn từ trang Liên hệ sẽ hiện ở đây.</p></div>';
        return;
      }
      wrap.innerHTML = messages.map(function (msg) {
        return '<div class="message-card">' +
          '<div class="d-flex justify-content-between align-items-start gap-2">' +
            '<div><strong>' + esc(msg.title || 'Tin nhắn liên hệ') + '</strong>' +
              '<div class="small text-muted">' + formatDate(msg.createdAt) + '</div></div>' +
            '<button type="button" class="btn btn-sm btn-outline-danger" data-msg-del="' + esc(msg.id) + '">Xóa</button>' +
          '</div>' +
          '<p class="mb-2 mt-2">' + esc(msg.content) + '</p>' +
          '<div class="small text-muted">' + esc(msg.name) + ' • ' + esc(msg.phone) +
            (msg.email ? ' • ' + esc(msg.email) : '') +
            (msg.address ? '<br>Địa chỉ: ' + esc(msg.address) : '') +
          '</div>' +
        '</div>';
      }).join('');
    }

    const messagesWrap = document.getElementById('messagesWrap');
    messagesWrap.addEventListener('click', function (event) {
      const btn = event.target.closest('[data-msg-del]');
      if (!btn) return;
      const id = btn.getAttribute('data-msg-del');
      write(KEYS.messages, read(KEYS.messages, []).filter(function (m) { return m.id !== id; }));
      renderMessages();
      toast('Đã xóa tin nhắn');
    });

    document.getElementById('resetData').addEventListener('click', function () {
      if (!confirm('Khôi phục toàn bộ sản phẩm mẫu? Các thay đổi sản phẩm sẽ mất, đơn hàng và tin nhắn được giữ lại.')) return;
      write(KEYS.products, DEFAULT_PRODUCTS.map(function (p) { return Object.assign({}, p); }));
      resetForm();
      renderAll();
      toast('Đã khôi phục dữ liệu sản phẩm mẫu');
    });

    function renderAll() {
      const products = getProducts();
      const orders = read(KEYS.orders, []);
      renderStats(products, orders);
      renderProducts();
      renderOrders();
      renderMessages();
    }

    renderAll();
  }

  /* --------------------------- Khởi động ------------------------------ */
  function bindGlobal() {
    document.addEventListener('click', function (event) {
      const addBtn = event.target.closest('[data-add]');
      if (addBtn) {
        event.preventDefault();
        const modal = addBtn.closest('#quickViewModal');
        const qtySource = addBtn.getAttribute('data-qty-source');
        const sourceEl = qtySource ? document.querySelector(qtySource) : null;
        const qty = sourceEl ? sourceEl.value : (modal ? (modal.querySelector('#quickViewQty') || {}).value : 1);
        addToCart(addBtn.getAttribute('data-add'), qty);
        if (modal) {
          const instance = bootstrap.Modal.getInstance(modal);
          if (instance) instance.hide();
        }
        return;
      }

      const viewBtn = event.target.closest('[data-view]');
      if (viewBtn) {
        event.preventDefault();
        openQuickView(viewBtn.getAttribute('data-view'));
      }
    });

    document.querySelectorAll('.js-search-form').forEach(function (form) {
      form.addEventListener('submit', function (event) {
        const page = document.body.dataset.page;
        if (page === 'home' || page === 'sale') return; /* lọc trực tiếp trên trang */
        event.preventDefault();
        const input = form.querySelector('input[name="q"]');
        location.href = 'index.html?q=' + encodeURIComponent((input && input.value || '').trim());
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    const page = document.body.dataset.page || '';
    getProducts();
    updateCartBadge();
    bindGlobal();

    if (page === 'home' || page === 'sale') initCatalog(page === 'sale');
    if (page === 'detail') initProductDetail();
    if (page === 'cart') initCart();
    if (page === 'contact') initContact();
    if (page === 'admin') initAdmin();

    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
  });
})();
