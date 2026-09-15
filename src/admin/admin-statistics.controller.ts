import { Controller, Get, Req, Res, Query } from '@nestjs/common';
import type { Response } from 'express';
import { AdminService } from './admin.service';
import { adminView } from './admin-view.helper';

@Controller('admin/statistics')
export class AdminStatisticsController {
  constructor(private readonly adminService: AdminService) {}

  /** Trang thống kê & báo cáo: /admin/statistics?year=2026 */
  @Get()
  async index(@Req() req, @Res() res: Response, @Query('year') year: string) {
    const currentYear = new Date().getFullYear();
    let selectedYear = parseInt(year, 10);
    if (Number.isNaN(selectedYear)) selectedYear = currentYear;

    try {
      const data = await this.adminService.getStatisticsData(selectedYear);

      // Danh sách năm cho dropdown: 5 năm gần nhất
      const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

      return res.render(
        'admin/statistics',
        adminView(req, 'statistics', { ...data, years }),
      );
    } catch (error) {
      return res.status(500).render(
        'admin/error',
        adminView(req, 'statistics', {
          message: 'Không tải được dữ liệu thống kê.',
          detail: (error as Error).message,
        }),
      );
    }
  }
}
