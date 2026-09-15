import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

/**
 * Chặn mọi truy cập vào khu vực quản trị nếu không phải Admin.
 *
 * - Chưa đăng nhập            -> chuyển tới /admin/login
 * - Đăng nhập nhưng role user -> chuyển về trang chủ kèm cảnh báo (403)
 *
 * Dùng middleware thay vì Guard vì đây là ứng dụng SSR: middleware có thể
 * res.redirect() trực tiếp mà không làm Nest ném exception sau khi đã gửi response.
 */
@Injectable()
export class AdminMiddleware implements NestMiddleware {
  use(req: Request & { session?: any }, res: Response, next: NextFunction) {
    const user = req.session?.user;

    if (!user) {
      // Ghi nhớ trang đang muốn vào để đăng nhập xong quay lại đúng chỗ
      if (req.session) req.session.redirectAfterLogin = req.originalUrl;
      return res.redirect('/admin/login');
    }

    if (user.role !== 'admin') {
      return res.status(403).render('admin/403', { user });
    }

    return next();
  }
}
