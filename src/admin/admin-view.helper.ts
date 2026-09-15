import { popFlash } from '../common/flash';

/** Định dạng tiền Việt: 25000 -> "25.000" */
export function formatMoney(value: any): string {
  return Number(value || 0).toLocaleString('vi-VN');
}

/** Định dạng ngày giờ: 15/09/2026 14:30 */
export function formatDate(value: any): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Tạo lại query string cho link phân trang / lọc, bỏ qua giá trị rỗng */
export function buildQueryString(
  query: Record<string, any>,
  overrides: Record<string, any> = {},
): string {
  const merged = { ...query, ...overrides };
  const parts: string[] = [];

  Object.keys(merged).forEach((key) => {
    const value = merged[key];
    if (value === undefined || value === null || value === '') return;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  });

  return parts.length ? `?${parts.join('&')}` : '';
}

/**
 * Gộp dữ liệu chung mà mọi trang Admin đều cần (user đang đăng nhập,
 * flash message, menu đang active, các hàm định dạng) với dữ liệu riêng
 * của từng trang. Nhờ vậy controller không phải lặp lại ở mọi chỗ render.
 */
export function adminView(
  req: any,
  activeMenu: string,
  data: Record<string, any> = {},
) {
  return {
    currentUser: req.session?.user || null,
    flash: popFlash(req),
    activeMenu,
    // Giữ lại query string để form lọc và phân trang hiển thị đúng giá trị cũ
    query: req.query || {},
    // Helper dùng trực tiếp trong template EJS
    formatMoney,
    formatDate,
    buildQueryString,
    ...data,
  };
}
