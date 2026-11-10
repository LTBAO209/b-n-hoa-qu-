'use strict';

/* =========================================================
   Trang quản trị Hoa Quả Nhà Trồng
   Đăng nhập bằng tài khoản role = admin, gọi API /api/admin/*.
   ========================================================= */
(function () {
  const app = document.getElementById('app');
  const state = { user: null, categories: [], images: [], products: [], orders: [], messages: [], view: 'dashboard', editingId: null };

  /* ------------------------------ Tiện ích ---------------------------- */
  const money = function (value) { return Number(value || 0).toLocaleString('vi-VN') + 'đ'; };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function dateText(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('vi-VN', { hour12: false });
  }

  function statusKey(status) {
    return { 'Mới': 'new', 'Đang giao': 'shipping', 'Hoàn tất': 'done', 'Hủy': 'canceled' }[status] || 'new';
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
      setTimeout(function () { element.remove(); }, 250);
    }, 2600);
  }

  async function api(path, options) {
    const settings = options || {};
    const init = { method: settings.method || 'GET', credentials: 'same-origin', headers: {} };
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

  function loading() { return '<div class="loading">Đang tải dữ liệu...</div>'; }
  function errorCard(message) {
    return '<div class="card error-card"><p><i class="fa-solid fa-circle-exclamation"></i> ' + esc(message) + '</p></div>';
  }

  /* ------------------------------- Khởi động -------------------------- */
  async function boot() {
    try {
      const data = await api('/api/auth/me');
      state.user = data.user;
    } catch (error) {
      state.user = null;
    }

    if (!state.user || state.user.role !== 'admin') {
      renderLogin();
      return;
    }
    await loadMeta();
    renderShell();
    go('dashboard');
  }

  async function loadMeta() {
    try {
      const results = await Promise.all([api('/api/meta'), api('/api/admin/images')]);
      state.categories = results[0].categories;
      state.images = results[1].images;
    } catch (error) {
      state.categories = [];
      state.images = [];
    }
  }

  function renderLogin() {
    app.innerHTML = '' +
      '<div class="login-screen"><div class="login-card">' +
        '<div class="login-brand">' +
          '<span class="mark"><i class="fa-solid fa-leaf"></i></span>' +
          '<div><strong>Hoa Quả Nhà Trồng</strong><small>Trang quản trị cửa hàng</small></div>' +
        '</div>' +
        '<h1>Đăng nhập quản trị</h1>' +
        '<p class="muted">Chỉ tài khoản có quyền quản trị mới truy cập được trang này.</p>' +
        '<form id="adminLogin" novalidate>' +
          '<div class="form-error"></div>' +
          '<div class="field" style="margin-bottom:10px"><label for="admEmail">Email</label>' +
            '<input class="input" id="admEmail" name="email" type="email" required autocomplete="email" placeholder="admin@hoaquanhatrong.vn"></div>' +
          '<div class="field" style="margin-bottom:14px"><label for="admPassword">Mật khẩu</label>' +
            '<input class="input" id="admPassword" name="password" type="password" required autocomplete="current-password" placeholder="Mật khẩu"></div>' +
          '<button class="btn btn-green btn-block" type="submit"><i class="fa-solid fa-right-to-bracket"></i> Đăng nhập</button>' +
        '</form>' +
        '<p class="muted" style="margin-top:14px"><a href="/index.html">← Về cửa hàng</a></p>' +
      '</div></div>';

    const form = document.getElementById('adminLogin');
    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      const errorBox = form.querySelector('.form-error');
      errorBox.classList.remove('show');
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        const data = await api('/api/auth/login', {
          method: 'POST',
          body: {
            email: form.elements.email.value.trim(),
            password: form.elements.password.value
          }
        });
        if (!data.user || data.user.role !== 'admin') {
          await api('/api/auth/logout', { method: 'POST' }).catch(function () {});
          throw new Error('Tài khoản này không có quyền quản trị.');
        }
        boot();
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.classList.add('show');
        button.disabled = false;
      }
    });
  }

  function renderShell() {
    const items = [
      ['dashboard', 'Tổng quan', 'fa-chart-line'],
      ['products', 'Sản phẩm', 'fa-box'],
      ['orders', 'Đơn hàng', 'fa-receipt'],
      ['messages', 'Tin nhắn', 'fa-envelope'],
      ['users', 'Khách hàng', 'fa-users']
    ];

    app.innerHTML = '' +
      '<div class="admin-shell">' +
        '<aside class="aside">' +
          '<div class="brand">' +
            '<span class="mark"><i class="fa-solid fa-leaf"></i></span>' +
            '<div><strong>Hoa Quả Nhà Trồng</strong><small>Quản trị cửa hàng</small></div>' +
          '</div>' +
          '<nav class="menu">' + items.map(function (item) {
            return '<button type="button" class="menu-item" data-view="' + item[0] + '">' +
              '<i class="fa-solid ' + item[2] + '"></i>' + item[1] + '</button>';
          }).join('') + '</nav>' +
          '<div class="aside-foot">' +
            '<a class="aside-link" href="/index.html"><i class="fa-solid fa-store"></i>Về cửa hàng</a>' +
            '<button type="button" class="aside-link" data-logout><i class="fa-solid fa-right-from-bracket"></i>Đăng xuất</button>' +
          '</div>' +
        '</aside>' +
        '<div class="admin-main">' +
          '<header class="admin-topbar">' +
            '<h1 id="pageTitle">Tổng quan</h1>' +
            '<div class="who"><span class="avatar">' + esc(state.user.name.charAt(0).toUpperCase()) + '</span>' +
              '<div><strong>' + esc(state.user.name) + '</strong><div class="muted">' + esc(state.user.email) + '</div></div></div>' +
          '</header>' +
          '<main class="view" id="view"></main>' +
        '</div>' +
      '</div>';

    app.querySelectorAll('[data-view]').forEach(function (button) {
      button.addEventListener('click', function () { go(button.getAttribute('data-view')); });
    });

    const logout = app.querySelector('[data-logout]');
    logout.addEventListener('click', async function () {
      try { await api('/api/auth/logout', { method: 'POST' }); } catch (error) { /* ignore */ }
      boot();
    });

    const viewBox = document.getElementById('view');
    viewBox.addEventListener('click', handleViewClick);
    viewBox.addEventListener('change', handleViewChange);
    viewBox.addEventListener('submit', handleViewSubmit);
  }

  /* ------------------------------- Điều hướng ------------------------- */
  const TITLES = {
    dashboard: 'Tổng quan cửa hàng',
    products: 'Quản lý sản phẩm',
    orders: 'Quản lý đơn hàng',
    messages: 'Tin nhắn liên hệ',
    users: 'Khách hàng'
  };

  function go(name) {
    state.view = name;
    app.querySelectorAll('.menu-item').forEach(function (button) {
      button.classList.toggle('active', button.getAttribute('data-view') === name);
    });
    document.getElementById('pageTitle').textContent = TITLES[name] || '';
    if (name === 'dashboard') renderDashboard();
    else if (name === 'products') renderProducts();
    else if (name === 'orders') renderOrders();
    else if (name === 'messages') renderMessages();
    else if (name === 'users') renderUsers();
  }

  /* ------------------------------- Tổng quan -------------------------- */
  async function renderDashboard() {
    const box = document.getElementById('view');
    box.innerHTML = loading();
    let stats;
    try {
      stats = await api('/api/admin/stats');
    } catch (error) {
      box.innerHTML = errorCard(error.message);
      return;
    }

    function stat(label, value, icon, tone) {
      return '<div class="stat"><span class="icon ' + (tone || '') + '"><i class="fa-solid ' + icon + '"></i></span>' +
        '<div><span>' + label + '</span><strong>' + value + '</strong></div></div>';
    }

    box.innerHTML = '' +
      '<div class="stat-grid">' +
        stat('Doanh thu (trừ đơn hủy)', money(stats.revenue), 'fa-sack-dollar') +
        stat('Tổng đơn hàng', stats.orderCount, 'fa-receipt', 'blue') +
        stat('Đơn mới chờ xử lý', stats.newOrders, 'fa-bell', 'amber') +
        stat('Khách hàng', stats.customerCount, 'fa-users', 'purple') +
      '</div>' +
      '<div class="grid-2">' +
        '<section class="card">' +
          '<div class="card-head"><h2>Đơn hàng gần đây</h2>' +
            '<button class="btn btn-ghost btn-sm" data-go="orders">Xem tất cả</button></div>' +
          '<div class="table-wrap"><table class="table"><thead><tr>' +
            '<th>Mã đơn</th><th>Khách hàng</th><th>Tổng</th><th>Trạng thái</th></tr></thead><tbody>' +
            (stats.recentOrders.length ? stats.recentOrders.map(function (order) {
              return '<tr><td><strong>#' + esc(order.code) + '</strong><div class="muted">' + dateText(order.createdAt) + '</div></td>' +
                '<td>' + esc(order.customerName) + '</td><td>' + money(order.total) + '</td>' +
                '<td><span class="status ' + statusKey(order.status) + '">' + esc(order.status) + '</span></td></tr>';
            }).join('') : '<tr><td colspan="4" class="muted">Chưa có đơn hàng nào</td></tr>') +
          '</tbody></table></div>' +
        '</section>' +
        '<section class="card">' +
          '<div class="card-head"><h2>Bán chạy nhất</h2>' +
            '<button class="btn btn-ghost btn-sm" data-go="products">Quản lý</button></div>' +
          '<ul class="rank-list">' + stats.topProducts.map(function (product) {
            return '<li><img src="' + esc(product.image) + '" alt="">' +
              '<div><strong>' + esc(product.name) + '</strong><span>Đã bán ' + product.sold + ' • còn ' + product.stock + '</span></div>' +
              '<b>' + money(product.price) + '</b></li>';
          }).join('') + '</ul>' +
        '</section>' +
      '</div>' +
      '<section class="card">' +
        '<div class="card-head"><h2>Sản phẩm sắp hết hàng</h2><span class="pill amber">' + stats.lowStock.length + ' sản phẩm</span></div>' +
        (stats.lowStock.length
          ? '<ul class="rank-list">' + stats.lowStock.map(function (product) {
              return '<li><img src="' + esc(product.image) + '" alt="">' +
                '<div><strong>' + esc(product.name) + '</strong><span>Còn ' + product.stock + ' ' + esc(product.unit) + '</span></div>' +
                '<b>' + (product.stock < 5 ? 'Cần nhập gấp' : 'Sắp hết') + '</b></li>';
            }).join('') + '</ul>'
          : '<p class="muted">Tất cả sản phẩm vẫn còn đủ hàng.</p>') +
      '</section>';

    box.querySelectorAll('[data-go]').forEach(function (button) {
      button.addEventListener('click', function () { go(button.getAttribute('data-go')); });
    });
  }

  /* ------------------------------- Sản phẩm --------------------------- */
  function productRow(product) {
    return '<tr>' +
      '<td><div class="product-cell"><img src="' + esc(product.image) + '" alt="">' +
        '<div><strong>' + esc(product.name) + '</strong>' +
        '<div class="muted">' + esc(product.categoryName || '') + ' • ' + esc(product.origin) + '</div></div></div></td>' +
      '<td><strong>' + money(product.price) + '</strong>' +
        (product.oldPrice ? '<div class="muted"><s>' + money(product.oldPrice) + '</s></div>' : '') + '</td>' +
      '<td>' + product.stock + ' ' + esc(product.unit) + '</td>' +
      '<td>' + product.sold + '</td>' +
      '<td><span class="pill ' + (product.active ? 'ok' : 'off') + '">' + (product.active ? 'Đang bán' : 'Đã ẩn') + '</span></td>' +
      '<td><div class="actions">' +
        '<button type="button" class="btn btn-ghost btn-sm" data-edit="' + product.id + '">Sửa</button>' +
        '<button type="button" class="btn btn-danger btn-sm" data-del="' + product.id + '">Xóa</button>' +
      '</div></td>' +
    '</tr>';
  }

  async function renderProducts() {
    const box = document.getElementById('view');
    box.innerHTML = loading();
    try {
      state.products = (await api('/api/admin/products')).products;
    } catch (error) {
      box.innerHTML = errorCard(error.message);
      return;
    }

    box.innerHTML = '' +
      '<div class="toolbar">' +
        '<p class="muted">' + state.products.length + ' sản phẩm • ' +
          state.products.filter(function (product) { return product.active; }).length + ' đang bán</p>' +
        '<button type="button" class="btn btn-accent" data-new><i class="fa-solid fa-plus"></i> Thêm sản phẩm</button>' +
      '</div>' +
      '<section class="card" id="editor" hidden></section>' +
      '<section class="card"><div class="table-wrap"><table class="table"><thead><tr>' +
        '<th>Sản phẩm</th><th>Giá bán</th><th>Tồn kho</th><th>Đã bán</th><th>Trạng thái</th><th></th>' +
        '</tr></thead><tbody>' +
        (state.products.length ? state.products.map(productRow).join('')
          : '<tr><td colspan="6" class="muted">Chưa có sản phẩm nào</td></tr>') +
      '</tbody></table></div></section>';
  }

  function productFormHTML(product) {
    const isEdit = Boolean(product);
    return '' +
      '<div class="card-head"><h2>' + (isEdit ? 'Sửa sản phẩm: ' + esc(product.name) : 'Thêm sản phẩm mới') + '</h2>' +
        '<button type="button" class="btn btn-ghost btn-sm" data-close-editor>Đóng</button></div>' +
      '<form id="productForm" class="form-grid" novalidate>' +
        '<div class="form-error"></div>' +
        '<div class="field"><label>Tên sản phẩm</label>' +
          '<input class="input" name="name" required value="' + (isEdit ? esc(product.name) : '') + '"></div>' +
        '<div class="field"><label>Danh mục</label><select class="select" name="categoryId">' +
          state.categories.map(function (category) {
            const selected = isEdit && product.categoryId === category.id ? ' selected' : '';
            return '<option value="' + category.id + '"' + selected + '>' + esc(category.name) + '</option>';
          }).join('') + '</select></div>' +
        '<div class="field"><label>Giá bán (VNĐ)</label>' +
          '<input class="input" type="number" min="0" step="500" name="price" required value="' + (isEdit ? product.price : '') + '"></div>' +
        '<div class="field"><label>Giá gốc (bỏ trống nếu không giảm)</label>' +
          '<input class="input" type="number" min="0" step="500" name="oldPrice" value="' + (isEdit && product.oldPrice ? product.oldPrice : '') + '"></div>' +
        '<div class="field"><label>Đơn vị</label>' +
          '<input class="input" name="unit" value="' + (isEdit ? esc(product.unit) : 'kg') + '"></div>' +
        '<div class="field"><label>Số lượng còn</label>' +
          '<input class="input" type="number" min="0" name="stock" value="' + (isEdit ? product.stock : 50) + '"></div>' +
        '<div class="field"><label>Xuất xứ</label>' +
          '<input class="input" name="origin" value="' + (isEdit ? esc(product.origin) : 'Việt Nam') + '"></div>' +
        '<div class="field"><label>Nhãn hiển thị</label>' +
          '<input class="input" name="badge" placeholder="Bán chạy, Quà tặng..." value="' + (isEdit ? esc(product.badge) : '') + '"></div>' +
        '<div class="field"><label>Ảnh sản phẩm</label><select class="select" name="image">' +
          state.images.map(function (source) {
            const selected = isEdit && product.image === source ? ' selected' : '';
            return '<option value="' + esc(source) + '"' + selected + '>' + esc(source.replace('/image/', '')) + '</option>';
          }).join('') + '</select></div>' +
        '<div class="field checkbox"><label><input type="checkbox" name="active"' +
          (!isEdit || product.active ? ' checked' : '') + '> Đang bán</label></div>' +
        '<div class="field full"><label>Mô tả</label>' +
          '<textarea class="textarea" name="description">' + (isEdit ? esc(product.description) : '') + '</textarea></div>' +
        '<div class="field full"><button type="submit" class="btn btn-green">' +
          (isEdit ? 'Lưu thay đổi' : 'Thêm sản phẩm') + '</button></div>' +
      '</form>';
  }

  function openProductEditor(product) {
    const editor = document.getElementById('editor');
    if (!editor) return;
    state.editingId = product ? product.id : null;
    editor.hidden = false;
    editor.innerHTML = productFormHTML(product);
    editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function saveProduct(form) {
    const errorBox = form.querySelector('.form-error');
    errorBox.classList.remove('show');
    const body = {
      name: form.elements.name.value.trim(),
      categoryId: Number(form.elements.categoryId.value),
      price: Number(form.elements.price.value),
      oldPrice: form.elements.oldPrice.value ? Number(form.elements.oldPrice.value) : null,
      unit: form.elements.unit.value.trim(),
      stock: Number(form.elements.stock.value),
      origin: form.elements.origin.value.trim(),
      badge: form.elements.badge.value.trim(),
      image: form.elements.image.value,
      description: form.elements.description.value.trim(),
      active: form.elements.active.checked
    };
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      if (state.editingId) {
        await api('/api/admin/products/' + state.editingId, { method: 'PUT', body: body });
        toast('Đã cập nhật sản phẩm');
      } else {
        await api('/api/admin/products', { method: 'POST', body: body });
        toast('Đã thêm sản phẩm mới');
      }
      renderProducts();
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.classList.add('show');
      button.disabled = false;
    }
  }

  async function deleteProduct(id) {
    const product = state.products.find(function (item) { return item.id === id; });
    if (!product) return;
    if (!window.confirm('Xóa sản phẩm "' + product.name + '"? Hành động này không thể hoàn tác.')) return;
    try {
      await api('/api/admin/products/' + id, { method: 'DELETE' });
      toast('Đã xóa sản phẩm');
      renderProducts();
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  /* ------------------------------- Đơn hàng --------------------------- */
  function orderCard(order) {
    return '<section class="card order-card">' +
      '<div class="card-head">' +
        '<div><h3>#' + esc(order.code) + '</h3>' +
          '<span class="muted">' + dateText(order.createdAt) + ' • ' + esc(order.payment) + '</span></div>' +
        '<select class="select status-select" data-order-status="' + order.id + '">' +
          ['Mới', 'Đang giao', 'Hoàn tất', 'Hủy'].map(function (status) {
            return '<option' + (order.status === status ? ' selected' : '') + '>' + status + '</option>';
          }).join('') + '</select>' +
      '</div>' +
      '<div class="order-info">' +
        '<div><span>Người nhận</span><strong>' + esc(order.customerName) + ' • ' + esc(order.phone) + '</strong></div>' +
        '<div><span>Địa chỉ</span><strong>' + esc(order.address) + '</strong></div>' +
        '<div><span>Giao hàng</span><strong>' + esc(order.delivery) + '</strong></div>' +
        '<div><span>Ghi chú</span><strong>' + esc(order.note || '—') + '</strong></div>' +
      '</div>' +
      '<ul class="order-lines">' + order.items.map(function (item) {
        return '<li><span>' + esc(item.name) + ' × ' + item.qty + ' ' + esc(item.unit) + '</span>' +
          '<span>' + money(item.price * item.qty) + '</span></li>';
      }).join('') + '</ul>' +
      '<div class="order-sum"><span>Phí giao: ' + (order.shipping ? money(order.shipping) : 'Miễn phí') + '</span>' +
        '<strong>' + money(order.total) + '</strong></div>' +
      (order.userId ? '' : '<p class="muted small">Khách vãng lai (chưa đăng nhập)</p>') +
    '</section>';
  }

  function renderOrderList(filter) {
    const list = document.getElementById('orderList');
    if (!list) return;
    const orders = filter === 'Tất cả'
      ? state.orders
      : state.orders.filter(function (order) { return order.status === filter; });
    list.innerHTML = orders.length
      ? orders.map(orderCard).join('')
      : '<div class="card"><p class="muted">Không có đơn hàng ở trạng thái này.</p></div>';
  }

  async function renderOrders() {
    const box = document.getElementById('view');
    box.innerHTML = loading();
    try {
      state.orders = (await api('/api/admin/orders')).orders;
    } catch (error) {
      box.innerHTML = errorCard(error.message);
      return;
    }

    const filters = ['Tất cả', 'Mới', 'Đang giao', 'Hoàn tất', 'Hủy'];
    box.innerHTML = '' +
      '<div class="chips">' + filters.map(function (status) {
        return '<button type="button" class="chip ' + (status === 'Tất cả' ? 'active' : '') +
          '" data-status-filter="' + status + '">' + status + '</button>';
      }).join('') + '</div>' +
      '<div id="orderList"></div>';

    renderOrderList('Tất cả');
  }

  /* ------------------------------- Tin nhắn --------------------------- */
  function messageCard(message) {
    return '<section class="card message-card">' +
      '<div class="card-head">' +
        '<div><h3>' + esc(message.subject) + '</h3>' +
          '<span class="muted">' + dateText(message.createdAt) + ' • ' + esc(message.name) + ' • ' + esc(message.phone) +
          (message.email ? ' • ' + esc(message.email) : '') + '</span></div>' +
        '<span class="pill ' + (message.status === 'Mới' ? 'amber' : 'ok') + '">' + esc(message.status) + '</span>' +
      '</div>' +
      '<p>' + esc(message.content) + '</p>' +
      '<div class="message-actions">' +
        (message.email ? '<a class="btn btn-ghost btn-sm" href="mailto:' + esc(message.email) + '">Phản hồi email</a>' : '') +
        (message.status === 'Mới'
          ? '<button type="button" class="btn btn-green btn-sm" data-resolve="' + message.id + '">Đánh dấu đã xử lý</button>'
          : '') +
        '<button type="button" class="btn btn-danger btn-sm" data-delete-msg="' + message.id + '">Xóa</button>' +
      '</div>' +
    '</section>';
  }

  async function renderMessages() {
    const box = document.getElementById('view');
    box.innerHTML = loading();
    try {
      state.messages = (await api('/api/admin/messages')).messages;
    } catch (error) {
      box.innerHTML = errorCard(error.message);
      return;
    }

    const fresh = state.messages.filter(function (message) { return message.status === 'Mới'; }).length;
    box.innerHTML = '<div class="toolbar"><p class="muted">' + state.messages.length +
      ' tin nhắn • ' + fresh + ' chưa xử lý</p></div>' +
      (state.messages.length
        ? state.messages.map(messageCard).join('')
        : '<div class="card"><p class="muted">Chưa có tin nhắn nào từ khách.</p></div>');
  }

  /* ------------------------------- Khách hàng ------------------------- */
  async function renderUsers() {
    const box = document.getElementById('view');
    box.innerHTML = loading();
    let users;
    try {
      users = (await api('/api/admin/users')).users;
    } catch (error) {
      box.innerHTML = errorCard(error.message);
      return;
    }

    box.innerHTML = '<section class="card">' +
      '<div class="card-head"><h2>Danh sách khách hàng</h2><span class="pill">' + users.length + '</span></div>' +
      '<div class="table-wrap"><table class="table"><thead><tr>' +
        '<th>Khách hàng</th><th>Liên hệ</th><th>Vai trò</th><th>Đơn</th><th>Chi tiêu</th><th>Ngày tạo</th>' +
      '</tr></thead><tbody>' +
      users.map(function (user) {
        return '<tr><td><strong>' + esc(user.name) + '</strong><div class="muted">' + esc(user.email) + '</div></td>' +
          '<td>' + esc(user.phone || '—') + '<div class="muted">' + esc(user.address || '') + '</div></td>' +
          '<td><span class="pill ' + (user.role === 'admin' ? 'purple' : '') + '">' +
            (user.role === 'admin' ? 'Quản trị' : 'Khách') + '</span></td>' +
          '<td>' + user.orderCount + '</td><td>' + money(user.spent) + '</td>' +
          '<td class="muted">' + dateText(user.createdAt) + '</td></tr>';
      }).join('') +
      '</tbody></table></div></section>';
  }

  /* ------------------------------ Sự kiện ----------------------------- */
  function handleViewClick(event) {
    const goButton = event.target.closest('[data-go]');
    if (goButton) { go(goButton.getAttribute('data-go')); return; }

    if (event.target.closest('[data-new]')) { openProductEditor(null); return; }
    if (event.target.closest('[data-close-editor]')) {
      const editor = document.getElementById('editor');
      if (editor) editor.hidden = true;
      return;
    }

    const edit = event.target.closest('[data-edit]');
    if (edit) {
      const id = Number(edit.getAttribute('data-edit'));
      openProductEditor(state.products.find(function (item) { return item.id === id; }));
      return;
    }

    const del = event.target.closest('[data-del]');
    if (del) { deleteProduct(Number(del.getAttribute('data-del'))); return; }

    const chip = event.target.closest('[data-status-filter]');
    if (chip) {
      document.querySelectorAll('[data-status-filter]').forEach(function (other) {
        other.classList.toggle('active', other === chip);
      });
      renderOrderList(chip.getAttribute('data-status-filter'));
      return;
    }

    const resolve = event.target.closest('[data-resolve]');
    if (resolve) {
      api('/api/admin/messages/' + resolve.getAttribute('data-resolve'), {
        method: 'PATCH', body: { status: 'Đã xử lý' }
      }).then(function () {
        toast('Đã đánh dấu xử lý');
        renderMessages();
      }).catch(function (error) { toast(error.message, 'error'); });
      return;
    }

    const removeMessage = event.target.closest('[data-delete-msg]');
    if (removeMessage) {
      if (!window.confirm('Xóa tin nhắn này?')) return;
      api('/api/admin/messages/' + removeMessage.getAttribute('data-delete-msg'), { method: 'DELETE' })
        .then(function () {
          toast('Đã xóa tin nhắn');
          renderMessages();
        })
        .catch(function (error) { toast(error.message, 'error'); });
    }
  }

  function handleViewChange(event) {
    const select = event.target.closest('[data-order-status]');
    if (!select) return;
    const id = Number(select.getAttribute('data-order-status'));
    api('/api/admin/orders/' + id, { method: 'PATCH', body: { status: select.value } })
      .then(function (data) {
        const order = state.orders.find(function (item) { return item.id === id; });
        if (order) order.status = data.order.status;
        toast('Đã cập nhật trạng thái đơn #' + data.order.code);
      })
      .catch(function (error) { toast(error.message, 'error'); });
  }

  function handleViewSubmit(event) {
    const form = event.target.closest('#productForm');
    if (!form) return;
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    saveProduct(form);
  }

  boot();
})();
