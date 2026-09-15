/* =========================================================
   Drink Shop — Admin Panel: các hành vi phía client
   Không dùng framework, chỉ JS thuần + Bootstrap 5 bundle.
   ========================================================= */

(function () {
  'use strict';

  var STORAGE_KEY = 'drinkshop.admin.sidebarCollapsed';

  /* ---------- 1. Thu gọn / mở rộng sidebar ---------- */

  function initSidebar() {
    var body = document.body;
    var toggle = document.getElementById('sidebarToggle');
    var backdrop = document.getElementById('sidebarBackdrop');

    // Khôi phục trạng thái đã lưu (chỉ áp dụng cho desktop)
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') {
        body.classList.add('sidebar-collapsed');
      }
    } catch (e) {
      /* localStorage bị chặn -> bỏ qua, dùng mặc định */
    }

    if (!toggle) return;

    toggle.addEventListener('click', function () {
      var isMobile = window.innerWidth < 992;

      if (isMobile) {
        // Trên mobile: trượt sidebar ra/vào
        body.classList.toggle('sidebar-open');
        return;
      }

      body.classList.toggle('sidebar-collapsed');
      try {
        localStorage.setItem(
          STORAGE_KEY,
          body.classList.contains('sidebar-collapsed') ? '1' : '0'
        );
      } catch (e) {
        /* bỏ qua */
      }
    });

    if (backdrop) {
      backdrop.addEventListener('click', function () {
        body.classList.remove('sidebar-open');
      });
    }

    // Đóng sidebar mobile khi chuyển sang desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 992) {
        body.classList.remove('sidebar-open');
      }
    });
  }

  /* ---------- 2. Modal xác nhận trước khi xóa ---------- */

  function initDeleteConfirm() {
    var modalEl = document.getElementById('confirmDeleteModal');
    if (!modalEl) return;

    var modal = new bootstrap.Modal(modalEl);
    var messageEl = modalEl.querySelector('[data-confirm-message]');
    var confirmBtn = modalEl.querySelector('[data-confirm-submit]');
    var pendingForm = null;

    // Mọi form có thuộc tính data-confirm sẽ đi qua modal này
    document.addEventListener('submit', function (event) {
      var form = event.target;
      if (!form.hasAttribute || !form.hasAttribute('data-confirm')) return;
      if (form.dataset.confirmed === 'yes') return; // đã xác nhận -> cho submit

      event.preventDefault();
      pendingForm = form;

      if (messageEl) {
        messageEl.textContent =
          form.getAttribute('data-confirm') ||
          'Bạn có chắc chắn muốn xóa mục này không?';
      }
      modal.show();
    });

    if (confirmBtn) {
      confirmBtn.addEventListener('click', function () {
        if (!pendingForm) return;
        pendingForm.dataset.confirmed = 'yes';
        modal.hide();
        showLoading();
        pendingForm.submit();
      });
    }
  }

  /* ---------- 3. Loading overlay ---------- */

  function showLoading() {
    var el = document.getElementById('adminLoading');
    if (el) el.classList.add('is-visible');
  }

  function initLoading() {
    // Hiện overlay khi submit form thường (không phải form xóa đã xử lý ở trên)
    document.addEventListener('submit', function (event) {
      var form = event.target;
      if (form.hasAttribute && form.hasAttribute('data-confirm')) return;
      if (form.hasAttribute && form.hasAttribute('data-no-loading')) return;
      showLoading();
    });

    // Ẩn overlay khi người dùng bấm Back (trang lấy từ bfcache)
    window.addEventListener('pageshow', function () {
      var el = document.getElementById('adminLoading');
      if (el) el.classList.remove('is-visible');
    });
  }

  /* ---------- 4. Tự ẩn thông báo flash ---------- */

  function initFlashAutoHide() {
    var flash = document.getElementById('adminFlash');
    if (!flash) return;

    setTimeout(function () {
      var alert = bootstrap.Alert.getOrCreateInstance(flash);
      alert.close();
    }, 4000);
  }

  /* ---------- 5. Tự submit form lọc khi đổi dropdown ---------- */

  function initAutoFilter() {
    document.querySelectorAll('[data-auto-submit]').forEach(function (el) {
      el.addEventListener('change', function () {
        var form = el.closest('form');
        if (form) form.submit();
      });
    });
  }

  /* ---------- Khởi động ---------- */

  document.addEventListener('DOMContentLoaded', function () {
    initSidebar();
    initDeleteConfirm();
    initLoading();
    initFlashAutoHide();
    initAutoFilter();
  });
})();
