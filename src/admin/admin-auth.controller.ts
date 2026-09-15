import { Controller, Get, Post, Body, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { setFlash } from '../common/flash';

/**
 * Đăng nhập / đăng xuất riêng cho khu vực quản trị.
 * Dùng lại AuthService có sẵn (bcrypt + UsersService) nên không phát sinh
 * cơ chế xác thực thứ hai trong dự án.
 */
@Controller('admin')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('login')
  loginPage(@Req() req, @Res() res: Response) {
    // Đã đăng nhập bằng tài khoản admin thì vào thẳng dashboard
    if (req.session?.user?.role === 'admin') {
      return res.redirect('/admin');
    }
    return res.render('admin/login', { error: null, username: '' });
  }

  @Post('login')
  async login(@Req() req, @Res() res: Response, @Body() body) {
    const username = String(body.username || '').trim();
    const password = String(body.password || '');

    if (!username || !password) {
      return res.render('admin/login', {
        error: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.',
        username,
      });
    }

    const user = await this.authService.validateUser(username, password);

    if (!user) {
      return res.render('admin/login', {
        error: 'Sai tài khoản hoặc mật khẩu.',
        username,
      });
    }

    if (!user.isActive) {
      return res.render('admin/login', {
        error: 'Tài khoản này đã bị khóa.',
        username,
      });
    }

    if (user.role !== 'admin') {
      return res.render('admin/login', {
        error: 'Tài khoản này không có quyền truy cập khu vực quản trị.',
        username,
      });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    };

    // Quay lại đúng trang admin đã bị chặn trước đó (nếu có)
    const redirectTo = req.session.redirectAfterLogin || '/admin';
    delete req.session.redirectAfterLogin;

    setFlash(req, 'success', `Xin chào ${user.fullName || user.username}!`);
    return res.redirect(redirectTo);
  }

  @Get('logout')
  logout(@Req() req, @Res() res: Response) {
    req.session.destroy(() => res.redirect('/admin/login'));
  }
}
