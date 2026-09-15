import { Controller, Get, Post, Param, Body, Req, Res, Query } from '@nestjs/common';
import type { Response } from 'express';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';
import { adminView } from './admin-view.helper';
import { setFlash } from '../common/flash';
import { Validator, cleanString, toBool } from '../common/validation';
import { UserRole } from '../users/entities/user.entity';

@Controller('admin/users')
export class AdminUsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
  ) {}

  // ===================== Danh sách =====================

  @Get()
  async index(@Req() req, @Res() res: Response, @Query() query) {
    try {
      const result = await this.usersService.findAllPaginated({
        q: query.q,
        role: query.role,
        status: query.status,
        page: query.page,
        limit: query.limit,
      });

      return res.render(
        'admin/users/index',
        adminView(req, 'users', { result }),
      );
    } catch (error) {
      return this.renderError(req, res, 'Không tải được danh sách người dùng.', error);
    }
  }

  // ===================== Form thêm mới =====================

  @Get('create')
  createPage(@Req() req, @Res() res: Response) {
    return res.render(
      'admin/users/form',
      adminView(req, 'users', {
        isEdit: false,
        user: { role: 'user', isActive: true },
        errors: [],
      }),
    );
  }

  @Post('create')
  async create(@Req() req, @Res() res: Response, @Body() body) {
    const data = {
      username: String(body.username || '').trim(),
      password: String(body.password || ''),
      fullName: cleanString(body.fullName),
      email: cleanString(body.email),
      phone: cleanString(body.phone),
      role: (body.role === 'admin' ? 'admin' : 'user') as UserRole,
      isActive: toBool(body.isActive),
    };

    const validator = new Validator()
      .required(data.username, 'Tên đăng nhập')
      .minLength(data.username, 3, 'Tên đăng nhập')
      .maxLength(data.username, 50, 'Tên đăng nhập')
      .required(data.password, 'Mật khẩu')
      .minLength(data.password, 6, 'Mật khẩu')
      .email(data.email, 'Email')
      .phone(data.phone, 'Số điện thoại');

    // Kiểm tra trùng tên đăng nhập
    if (data.username && (await this.usersService.findByUsername(data.username))) {
      validator.add('Tên đăng nhập đã tồn tại.');
    }

    if (!validator.isValid()) {
      return res.render(
        'admin/users/form',
        adminView(req, 'users', {
          isEdit: false,
          user: data,
          errors: validator.getErrors(),
        }),
      );
    }

    try {
      await this.usersService.createFromAdmin(data);
      setFlash(req, 'success', `Đã thêm người dùng "${data.username}".`);
      return res.redirect('/admin/users');
    } catch (error) {
      return res.render(
        'admin/users/form',
        adminView(req, 'users', {
          isEdit: false,
          user: data,
          errors: ['Không lưu được người dùng: ' + (error as Error).message],
        }),
      );
    }
  }

  // ===================== Xem chi tiết =====================

  @Get(':id/detail')
  async detail(@Req() req, @Res() res: Response, @Param('id') id: string) {
    const user = await this.usersService.findById(Number(id));

    if (!user) {
      setFlash(req, 'danger', 'Không tìm thấy người dùng.');
      return res.redirect('/admin/users');
    }

    // Lịch sử mua hàng của người dùng này
    const orders = await this.ordersService.findByUser(user.id);
    const totalSpent = orders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + Number(o.total), 0);

    return res.render(
      'admin/users/detail',
      adminView(req, 'users', { user, orders, totalSpent }),
    );
  }

  // ===================== Form chỉnh sửa =====================

  @Get(':id/edit')
  async editPage(@Req() req, @Res() res: Response, @Param('id') id: string) {
    const user = await this.usersService.findById(Number(id));

    if (!user) {
      setFlash(req, 'danger', 'Không tìm thấy người dùng.');
      return res.redirect('/admin/users');
    }

    return res.render(
      'admin/users/form',
      adminView(req, 'users', { isEdit: true, user, errors: [] }),
    );
  }

  @Post(':id/edit')
  async update(
    @Req() req,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body,
  ) {
    const userId = Number(id);
    const existing = await this.usersService.findById(userId);

    if (!existing) {
      setFlash(req, 'danger', 'Không tìm thấy người dùng.');
      return res.redirect('/admin/users');
    }

    const data: any = {
      fullName: cleanString(body.fullName),
      email: cleanString(body.email),
      phone: cleanString(body.phone),
      role: (body.role === 'admin' ? 'admin' : 'user') as UserRole,
      isActive: toBool(body.isActive),
      password: String(body.password || ''),
    };

    const validator = new Validator()
      .email(data.email, 'Email')
      .phone(data.phone, 'Số điện thoại');

    if (data.password) {
      validator.minLength(data.password, 6, 'Mật khẩu');
    }

    // Không cho phép admin tự hạ quyền hoặc tự khóa tài khoản của chính mình
    const isSelf = req.session.user.id === userId;
    if (isSelf && data.role !== 'admin') {
      validator.add('Bạn không thể tự hạ quyền tài khoản đang đăng nhập.');
    }
    if (isSelf && !data.isActive) {
      validator.add('Bạn không thể tự khóa tài khoản đang đăng nhập.');
    }

    if (!validator.isValid()) {
      return res.render(
        'admin/users/form',
        adminView(req, 'users', {
          isEdit: true,
          user: { ...existing, ...data },
          errors: validator.getErrors(),
        }),
      );
    }

    try {
      await this.usersService.updateFromAdmin(userId, data);
      setFlash(req, 'success', `Đã cập nhật người dùng "${existing.username}".`);
      return res.redirect('/admin/users');
    } catch (error) {
      return res.render(
        'admin/users/form',
        adminView(req, 'users', {
          isEdit: true,
          user: { ...existing, ...data },
          errors: ['Không cập nhật được: ' + (error as Error).message],
        }),
      );
    }
  }

  // ===================== Xóa =====================

  @Post(':id/delete')
  async remove(@Req() req, @Res() res: Response, @Param('id') id: string) {
    const userId = Number(id);

    // Chặn tự xóa chính mình
    if (req.session.user.id === userId) {
      setFlash(req, 'danger', 'Bạn không thể xóa tài khoản đang đăng nhập.');
      return res.redirect('/admin/users');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      setFlash(req, 'danger', 'Không tìm thấy người dùng.');
      return res.redirect('/admin/users');
    }

    // Luôn phải còn ít nhất một admin trong hệ thống
    if (user.role === 'admin') {
      const adminCount = await this.usersService.countAdmins();
      if (adminCount <= 1) {
        setFlash(req, 'danger', 'Không thể xóa Admin cuối cùng của hệ thống.');
        return res.redirect('/admin/users');
      }
    }

    try {
      await this.usersService.delete(userId);
      setFlash(req, 'success', `Đã xóa người dùng "${user.username}".`);
    } catch (error) {
      setFlash(
        req,
        'danger',
        'Không xóa được người dùng (có thể đang được tham chiếu bởi dữ liệu khác).',
      );
    }

    return res.redirect('/admin/users');
  }

  private renderError(req: any, res: Response, message: string, error: unknown) {
    return res.status(500).render(
      'admin/error',
      adminView(req, 'users', {
        message,
        detail: (error as Error).message,
      }),
    );
  }
}
