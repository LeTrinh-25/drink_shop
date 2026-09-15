/** Kết quả trả về chuẩn cho mọi danh sách có phân trang trong Admin */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Chuẩn hóa tham số phân trang từ query string */
export function normalizePagination(page: any, limit: any, defaultLimit = 10) {
  let p = parseInt(String(page), 10);
  let l = parseInt(String(limit), 10);

  if (Number.isNaN(p) || p < 1) p = 1;
  if (Number.isNaN(l) || l < 1) l = defaultLimit;
  if (l > 100) l = 100; // chặn client yêu cầu quá nhiều bản ghi

  return { page: p, limit: l, skip: (p - 1) * l };
}

/** Đóng gói kết quả truy vấn thành đối tượng Paginated */
export function buildPaginated<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): Paginated<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}
