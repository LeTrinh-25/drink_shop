import { Controller, Get, Post, Param, Body, Req, Res, Query } from '@nestjs/common';
import type { Response } from 'express';
import { OrdersService } from '../orders/orders.service';
import { adminView } from './admin-view.helper';
import { setFlash } from '../common/flash';
import {
  OrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
} from '../orders/entities/order.entity';

const VALID_STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  async index(@Req() req, @Res() res: Response, @Query() query) {
    try {
      const [result, statusCounts] = await Promise.all([
        this.ordersService.findAllPaginated({
          q: query.q,
          status: query.status,
          from: query.from,
          to: query.to,
          page: query.page,
          limit: query.limit,
        }),
        this.ordersService.countGroupedByStatus(),
      ]);

      return res.render(
        'admin/orders/index',
        adminView(req, 'orders', {
          result,
          statusCounts,
          statusLabels: ORDER_STATUS_LABELS,
          statusColors: ORDER_STATUS_COLORS,
        }),
      );
    } catch (error) {
      return res.status(500).render(
        'admin/error',
        adminView(req, 'orders', {
          message: 'Không tải được danh sách đơn hàng.',
          detail: (error as Error).message,
        }),
      );
    }
  }

  @Get(':id/detail')
  async detail(@Req() req, @Res() res: Response, @Param('id') id: string) {
    const order = await this.ordersService.findById(Number(id));

    if (!order) {
      setFlash(req, 'danger', 'Không tìm thấy đơn hàng.');
      return res.redirect('/admin/orders');
    }

    return res.render(
      'admin/orders/detail',
      adminView(req, 'orders', {
        order,
        statusLabels: ORDER_STATUS_LABELS,
        statusColors: ORDER_STATUS_COLORS,
        validStatuses: VALID_STATUSES,
      }),
    );
  }

  /** Cập nhật trạng thái đơn hàng (dùng ở cả bảng danh sách và trang chi tiết) */
  @Post(':id/status')
  async updateStatus(
    @Req() req,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body,
  ) {
    const status = String(body.status || '') as OrderStatus;

    if (!VALID_STATUSES.includes(status)) {
      setFlash(req, 'danger', 'Trạng thái đơn hàng không hợp lệ.');
      return res.redirect('/admin/orders');
    }

    const order = await this.ordersService.findById(Number(id));
    if (!order) {
      setFlash(req, 'danger', 'Không tìm thấy đơn hàng.');
      return res.redirect('/admin/orders');
    }

    await this.ordersService.updateStatus(Number(id), status);
    setFlash(
      req,
      'success',
      `Đơn hàng #${id} đã chuyển sang "${ORDER_STATUS_LABELS[status]}".`,
    );

    return res.redirect(req.get('Referrer') || '/admin/orders');
  }

  @Post(':id/delete')
  async remove(@Req() req, @Res() res: Response, @Param('id') id: string) {
    const order = await this.ordersService.findById(Number(id));

    if (!order) {
      setFlash(req, 'danger', 'Không tìm thấy đơn hàng.');
      return res.redirect('/admin/orders');
    }

    try {
      await this.ordersService.delete(Number(id));
      setFlash(req, 'success', `Đã xóa đơn hàng #${id}.`);
    } catch (error) {
      setFlash(req, 'danger', 'Không xóa được đơn hàng: ' + (error as Error).message);
    }

    return res.redirect('/admin/orders');
  }
}
