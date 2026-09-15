import { Controller, Get, Req, Res, Query, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AdminService } from './admin.service';
import { OrdersService } from '../orders/orders.service';
import { adminView } from './admin-view.helper';
import { AdminGuard } from './guards/admin.guard';

@Controller('admin')
export class AdminDashboardController {
  constructor(
    private readonly adminService: AdminService,
    private readonly ordersService: OrdersService,
  ) {}

  /** Trang tổng quan: /admin */
  @Get()
  async dashboard(@Req() req, @Res() res: Response) {
    try {
      const data = await this.adminService.getDashboardData();
      return res.render('admin/dashboard', adminView(req, 'dashboard', data));
    } catch (error) {
      // Không để lỗi truy vấn làm sập cả trang quản trị
      return res.status(500).render(
        'admin/error',
        adminView(req, 'dashboard', {
          message: 'Không tải được dữ liệu tổng quan.',
          detail: (error as Error).message,
        }),
      );
    }
  }

  /** API JSON cho biểu đồ (dùng khi cần cập nhật động không reload trang) */
  @Get('api/chart/revenue')
  @UseGuards(AdminGuard)
  async revenueChart(@Query('days') days: string) {
    const n = Math.min(Math.max(parseInt(days, 10) || 7, 1), 90);
    return { success: true, data: await this.ordersService.revenueByDay(n) };
  }

  @Get('api/chart/top-products')
  @UseGuards(AdminGuard)
  async topProductsChart(@Query('limit') limit: string) {
    const n = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 20);
    return { success: true, data: await this.ordersService.topProducts(n) };
  }
}
