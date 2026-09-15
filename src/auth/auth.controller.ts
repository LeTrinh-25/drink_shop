import { Controller, Get, Post, Body, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Trang login
  @Get('login')
  loginPage(@Res() res) {
    res.render('login');
  }

  // Xử lý login
  @Post('/login')
  async login(@Req() req, @Res() res, @Body() body) {
    const user = await this.authService.validateUser(body.username, body.password);

    if (!user) {
      return res.render('login', { error: 'Sai tài khoản hoặc mật khẩu' });
    }

    // Tài khoản bị admin khóa thì không cho đăng nhập
    if (!user.isActive) {
      return res.render('login', { error: 'Tài khoản của bạn đã bị khóa' });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role, // cần cho việc phân quyền khu vực /admin
    };

    // Admin đăng nhập từ trang khách vẫn được đưa thẳng vào khu quản trị
    if (user.role === 'admin') {
      return res.redirect('/admin');
    }

    return res.redirect('/');
  }

  // Trang đăng ký
  @Get('register')
  registerPage(@Res() res) {
    res.render('register');
  }

  // Xử lý đăng ký
  @Post('register')
  async register(@Body() body, @Res() res) {
    try {
      await this.authService.registerUser(body.username, body.password);
      return res.redirect('/auth/login');
    } catch (e) {
      return res.render('register', { error: 'Tài khoản đã tồn tại!' });
    }
  }

  // Logout
  @Get('logout')
  logout(@Req() req, @Res() res) {
    req.session.destroy();
    res.redirect('/auth/login');
  }
}
