import { Controller, Get, Post, Body, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { adminView } from './admin-view.helper';
import { setFlash } from '../common/flash';
import { Validator, cleanString } from '../common/validation';

/**
 * Cài đặt tài khoản Admin đang đăng nhập:
 * cập nhật thông tin cá nhân và đổi mật khẩu.
 */
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async index(@Req() req, @Res() res: Response) {
    const user = await this.usersService.findById(req.session.user.id);
    const adminCount = await this.usersService.countAdmins();

    return res.render(
      'admin/settings',
      adminView(req, 'settings', {
        user,
        adminCount,
        errors: [],
      }),
    );
  }

  /** Cập nhật thông tin cá nhân */
  @Post('profile')
  async updateProfile(@Req() req, @Res() res: Response, @Body() body) {
    const userId = req.session.user.id;

    const data = {
      fullName: cleanString(body.fullName),
      email: cleanString(body.email),
      phone: cleanString(body.phone),
    };

    const validator = new Validator()
      .email(data.email, 'Email')
      .phone(data.phone, 'Số điện thoại');

    if (!validator.isValid()) {
      const user = await this.usersService.findById(userId);
      const adminCount = await this.usersService.countAdmins();
      return res.render(
        'admin/settings',
        adminView(req, 'settings', {
          user: { ...user, ...data },
          adminCount,
          errors: validator.getErrors(),
        }),
      );
    }

    await this.usersService.updateFromAdmin(userId, data);

    // Đồng bộ lại session để tên hiển thị trên sidebar cập nhật ngay
    req.session.user.fullName = data.fullName;

    setFlash(req, 'success', 'Đã cập nhật thông tin tài khoản.');
    return res.redirect('/admin/settings');
  }

  /** Đổi mật khẩu */
  @Post('password')
  async changePassword(@Req() req, @Res() res: Response, @Body() body) {
    const userId = req.session.user.id;
    const user = await this.usersService.findById(userId);

    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');
    const confirmPassword = String(body.confirmPassword || '');

    const validator = new Validator()
      .required(currentPassword, 'Mật khẩu hiện tại')
      .required(newPassword, 'Mật khẩu mới')
      .minLength(newPassword, 6, 'Mật khẩu mới');

    if (newPassword && newPassword !== confirmPassword) {
      validator.add('Xác nhận mật khẩu không khớp.');
    }

    // Xác thực mật khẩu hiện tại trước khi cho đổi
    if (user && currentPassword) {
      const matched = await bcrypt.compare(currentPassword, user.password);
      if (!matched) validator.add('Mật khẩu hiện tại không đúng.');
    }

    if (!validator.isValid()) {
      const adminCount = await this.usersService.countAdmins();
      return res.render(
        'admin/settings',
        adminView(req, 'settings', {
          user,
          adminCount,
          errors: validator.getErrors(),
        }),
      );
    }

    await this.usersService.updateFromAdmin(userId, { password: newPassword });
    setFlash(req, 'success', 'Đổi mật khẩu thành công.');
    return res.redirect('/admin/settings');
  }
}
