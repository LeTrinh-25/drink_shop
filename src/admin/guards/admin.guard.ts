import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Guard dùng cho các endpoint trả JSON trong khu vực Admin (ví dụ API biểu đồ).
 * Với các route render HTML thì đã có AdminMiddleware xử lý redirect,
 * còn API thì nên trả về mã lỗi thay vì redirect.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.session?.user;

    if (!user) {
      throw new UnauthorizedException('Bạn cần đăng nhập để thực hiện thao tác này.');
    }
    if (user.role !== 'admin') {
      throw new ForbiddenException('Bạn không có quyền truy cập khu vực quản trị.');
    }
    return true;
  }
}
