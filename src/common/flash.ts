/**
 * Flash message tự cài đặt dựa trên express-session.
 * Dự án có sẵn express-flash nhưng gói này không có type definition,
 * nên ở đây dùng session trực tiếp cho gọn và type-safe.
 *
 * Luồng: controller gọi setFlash() -> redirect -> controller đích gọi
 * popFlash() để lấy ra và xóa khỏi session (chỉ hiển thị đúng 1 lần).
 */

export type FlashType = 'success' | 'danger' | 'warning' | 'info';

export interface FlashMessage {
  type: FlashType;
  message: string;
}

export function setFlash(req: any, type: FlashType, message: string): void {
  if (!req.session) return;
  req.session.flash = { type, message };
}

export function popFlash(req: any): FlashMessage | null {
  if (!req.session || !req.session.flash) return null;
  const flash = req.session.flash as FlashMessage;
  delete req.session.flash;
  return flash;
}
