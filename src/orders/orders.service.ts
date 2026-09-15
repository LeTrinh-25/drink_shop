import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import {
  normalizePagination,
  buildPaginated,
  Paginated,
} from '../common/pagination';

/** Các trạng thái được tính vào doanh thu thực thu */
const REVENUE_STATUSES: OrderStatus[] = ['completed'];

export interface CreateOrderInput {
  user_id?: number;
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: string;
  note?: string;
  items: {
    product_id?: number;
    productName: string;
    productImage?: string;
    price: number;
    quantity: number;
  }[];
}

/**
 * Chuyển Date về khóa 'yyyy-mm-dd' theo giờ địa phương.
 * Không dùng toISOString() vì hàm đó quy về UTC và có thể lệch 1 ngày.
 */
function toDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  // ===================== Tạo đơn (dùng bởi luồng checkout của khách) =====================

  async createOrder(input: CreateOrderInput): Promise<Order> {
    const total = input.items.reduce(
      (sum, i) => sum + Number(i.price) * Number(i.quantity),
      0,
    );

    const order = this.orderRepository.create({
      user_id: input.user_id,
      customerName: input.customerName,
      phone: input.phone,
      address: input.address,
      paymentMethod: input.paymentMethod,
      note: input.note,
      total,
      status: 'pending',
      items: input.items.map((i) =>
        this.orderItemRepository.create({
          product_id: i.product_id,
          productName: i.productName,
          productImage: i.productImage,
          price: i.price,
          quantity: i.quantity,
        }),
      ),
    });

    // cascade: true trên quan hệ items nên OrderItem được lưu cùng lúc.
    return this.orderRepository.save(order);
  }

  // ===================== Truy vấn cho Admin =====================

  async findAllPaginated(filter: {
    q?: string;
    status?: string;
    from?: string;
    to?: string;
    page?: any;
    limit?: any;
  }): Promise<Paginated<Order>> {
    const { page, limit, skip } = normalizePagination(filter.page, filter.limit);

    const qb = this.orderRepository
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.user', 'user')
      .orderBy('o.id', 'DESC')
      .skip(skip)
      .take(limit);

    const keyword = (filter.q || '').trim();
    if (keyword) {
      // Cho phép tìm theo mã đơn, tên khách hoặc số điện thoại
      qb.andWhere(
        '(o.customerName LIKE :kw OR o.phone LIKE :kw OR CAST(o.id AS CHAR) LIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }

    if (filter.status) {
      qb.andWhere('o.status = :status', { status: filter.status });
    }

    if (filter.from) {
      qb.andWhere('o.createdAt >= :from', { from: `${filter.from} 00:00:00` });
    }
    if (filter.to) {
      qb.andWhere('o.createdAt <= :to', { to: `${filter.to} 23:59:59` });
    }

    const [items, total] = await qb.getManyAndCount();
    return buildPaginated(items, total, page, limit);
  }

  /** Chi tiết đơn kèm danh sách sản phẩm */
  findById(id: number) {
    return this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'user'],
    });
  }

  async updateStatus(id: number, status: OrderStatus) {
    await this.orderRepository.update(id, { status });
    return this.findById(id);
  }

  delete(id: number) {
    // OrderItem có onDelete: 'CASCADE' nên chi tiết đơn tự xóa theo.
    return this.orderRepository.delete(id);
  }

  findRecent(limit = 5) {
    return this.orderRepository.find({
      order: { id: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  findByUser(userId: number) {
    return this.orderRepository.find({
      where: { user_id: userId },
      order: { id: 'DESC' },
      relations: ['items'],
    });
  }

  // ===================== Thống kê =====================

  count() {
    return this.orderRepository.count();
  }

  countByStatus(status: OrderStatus) {
    return this.orderRepository.count({ where: { status } });
  }

  /** Đếm số đơn theo từng trạng thái, trả về object { pending: 3, ... } */
  async countGroupedByStatus(): Promise<Record<string, number>> {
    const rows = await this.orderRepository
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(o.id)', 'count')
      .groupBy('o.status')
      .getRawMany<{ status: string; count: string }>();

    const result: Record<string, number> = {};
    rows.forEach((r) => (result[r.status] = Number(r.count)));
    return result;
  }

  /** Tổng doanh thu từ các đơn đã hoàn thành */
  async totalRevenue(): Promise<number> {
    const raw = await this.orderRepository
      .createQueryBuilder('o')
      .select('SUM(o.total)', 'sum')
      .where('o.status IN (:...statuses)', { statuses: REVENUE_STATUSES })
      .getRawOne<{ sum: string | null }>();

    return Number(raw?.sum ?? 0);
  }

  /** Doanh thu trong một khoảng ngày */
  async revenueBetween(from: Date, to: Date): Promise<number> {
    const raw = await this.orderRepository
      .createQueryBuilder('o')
      .select('SUM(o.total)', 'sum')
      .where('o.status IN (:...statuses)', { statuses: REVENUE_STATUSES })
      .andWhere('o.createdAt BETWEEN :from AND :to', { from, to })
      .getRawOne<{ sum: string | null }>();

    return Number(raw?.sum ?? 0);
  }

  async countBetween(from: Date, to: Date): Promise<number> {
    return this.orderRepository.count({
      where: { createdAt: Between(from, to) },
    });
  }

  /**
   * Doanh thu và số đơn theo từng ngày trong N ngày gần nhất.
   * Trả về đủ N phần tử, ngày không có đơn thì giá trị 0 để biểu đồ không bị đứt.
   */
  async revenueByDay(days = 7) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const rows = await this.orderRepository
      .createQueryBuilder('o')
      .select('DATE(o.createdAt)', 'day')
      .addSelect('SUM(o.total)', 'revenue')
      .addSelect('COUNT(o.id)', 'orders')
      .where('o.createdAt >= :start', { start })
      .andWhere('o.status IN (:...statuses)', { statuses: REVENUE_STATUSES })
      .groupBy('DATE(o.createdAt)')
      .orderBy('day', 'ASC')
      .getRawMany<{ day: string | Date; revenue: string; orders: string }>();

    // Đưa kết quả về map để tra cứu nhanh theo yyyy-mm-dd.
    // Driver mysql2 thường trả DATE() về dạng chuỗi, nhưng nếu cấu hình
    // dateStrings = false thì lại là đối tượng Date -> xử lý cả hai trường hợp.
    const map = new Map<string, { revenue: number; orders: number }>();
    rows.forEach((r) => {
      const rawDay: unknown = r.day;
      const key =
        rawDay instanceof Date
          ? toDateKey(rawDay)
          : String(rawDay).slice(0, 10);
      map.set(key, { revenue: Number(r.revenue), orders: Number(r.orders) });
    });

    const result: { label: string; revenue: number; orders: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = toDateKey(d);
      const found = map.get(key);
      result.push({
        label: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
        revenue: found?.revenue ?? 0,
        orders: found?.orders ?? 0,
      });
    }
    return result;
  }

  /** Doanh thu 12 tháng của một năm */
  async revenueByMonth(year: number) {
    const rows = await this.orderRepository
      .createQueryBuilder('o')
      .select('MONTH(o.createdAt)', 'month')
      .addSelect('SUM(o.total)', 'revenue')
      .addSelect('COUNT(o.id)', 'orders')
      .where('YEAR(o.createdAt) = :year', { year })
      .andWhere('o.status IN (:...statuses)', { statuses: REVENUE_STATUSES })
      .groupBy('MONTH(o.createdAt)')
      .orderBy('month', 'ASC')
      .getRawMany<{ month: string; revenue: string; orders: string }>();

    const result = Array.from({ length: 12 }, (_, i) => ({
      label: `Tháng ${i + 1}`,
      revenue: 0,
      orders: 0,
    }));
    rows.forEach((r) => {
      const idx = Number(r.month) - 1;
      if (idx >= 0 && idx < 12) {
        result[idx].revenue = Number(r.revenue);
        result[idx].orders = Number(r.orders);
      }
    });
    return result;
  }

  /** Top sản phẩm bán chạy dựa trên bảng order_items */
  async topProducts(limit = 5) {
    const rows = await this.orderItemRepository
      .createQueryBuilder('i')
      .innerJoin('i.order', 'o')
      .select('i.productName', 'name')
      .addSelect('SUM(i.quantity)', 'quantity')
      .addSelect('SUM(i.price * i.quantity)', 'revenue')
      .where('o.status != :cancelled', { cancelled: 'cancelled' })
      .groupBy('i.productName')
      .orderBy('quantity', 'DESC')
      .limit(limit)
      .getRawMany<{ name: string; quantity: string; revenue: string }>();

    return rows.map((r) => ({
      name: r.name,
      quantity: Number(r.quantity),
      revenue: Number(r.revenue),
    }));
  }

  /** Giá trị trung bình mỗi đơn hoàn thành */
  async averageOrderValue(): Promise<number> {
    const raw = await this.orderRepository
      .createQueryBuilder('o')
      .select('AVG(o.total)', 'avg')
      .where('o.status IN (:...statuses)', { statuses: REVENUE_STATUSES })
      .getRawOne<{ avg: string | null }>();

    return Math.round(Number(raw?.avg ?? 0));
  }
}
