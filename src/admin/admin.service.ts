import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { OrdersService } from '../orders/orders.service';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class AdminService implements OnModuleInit {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly usersService: UsersService,
    private readonly productsService: ProductsService,
    private readonly ordersService: OrdersService,
    private readonly categoriesService: CategoriesService,
  ) {}

  /**
   * Khi khởi động, nếu trong DB chưa có tài khoản admin nào thì tạo một
   * tài khoản mặc định để có thể đăng nhập lần đầu.
   * Đây không phải dữ liệu giả — nó là tài khoản quản trị bắt buộc phải có.
   */
  async onModuleInit() {
    const adminCount = await this.userRepository.count({
      where: { role: 'admin' },
    });

    if (adminCount > 0) return;

    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    // Nếu đã tồn tại user trùng tên thì nâng quyền thay vì tạo trùng lặp
    const existing = await this.userRepository.findOne({ where: { username } });
    if (existing) {
      existing.role = 'admin';
      await this.userRepository.save(existing);
      this.logger.warn(`Đã nâng quyền Admin cho tài khoản có sẵn: ${username}`);
      return;
    }

    await this.userRepository.save(
      this.userRepository.create({
        username,
        password: await bcrypt.hash(password, 10),
        fullName: 'Quản trị viên',
        role: 'admin',
        isActive: true,
      }),
    );

    this.logger.warn(
      `Đã tạo tài khoản Admin mặc định -> username: ${username} / password: ${password}. Hãy đổi mật khẩu ngay sau khi đăng nhập.`,
    );
  }

  /** Gom toàn bộ số liệu cần cho trang Dashboard trong một lần gọi */
  async getDashboardData() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    // Chạy song song để giảm thời gian chờ
    const [
      totalUsers,
      totalAdmins,
      totalProducts,
      totalCategories,
      totalOrders,
      totalRevenue,
      revenueToday,
      ordersToday,
      revenueThisMonth,
      newUsers30d,
      ordersByStatus,
      averageOrderValue,
      outOfStock,
      inventoryValue,
      revenueByDay,
      topProducts,
      productsByCategory,
      recentOrders,
      recentUsers,
      lowStockProducts,
    ] = await Promise.all([
      this.usersService.count(),
      this.usersService.countAdmins(),
      this.productsService.count(),
      this.categoriesService.count(),
      this.ordersService.count(),
      this.ordersService.totalRevenue(),
      this.ordersService.revenueBetween(startOfToday, endOfToday),
      this.ordersService.countBetween(startOfToday, endOfToday),
      this.ordersService.revenueBetween(startOfMonth, endOfToday),
      this.usersService.countCreatedSince(last30Days),
      this.ordersService.countGroupedByStatus(),
      this.ordersService.averageOrderValue(),
      this.productsService.countOutOfStock(),
      this.productsService.inventoryValue(),
      this.ordersService.revenueByDay(7),
      this.ordersService.topProducts(5),
      this.productsService.countByCategory(),
      this.ordersService.findRecent(5),
      this.usersService.findRecent(5),
      this.productsService.lowStock(10, 5),
    ]);

    return {
      stats: {
        totalUsers,
        totalAdmins,
        totalProducts,
        totalCategories,
        totalOrders,
        totalRevenue,
        revenueToday,
        ordersToday,
        revenueThisMonth,
        newUsers30d,
        averageOrderValue,
        outOfStock,
        inventoryValue,
        pendingOrders: ordersByStatus['pending'] || 0,
      },
      ordersByStatus,
      charts: {
        revenueByDay,
        topProducts,
        productsByCategory,
      },
      recentOrders,
      recentUsers,
      lowStockProducts,
    };
  }

  /** Số liệu chi tiết cho trang Thống kê & Báo cáo */
  async getStatisticsData(year: number) {
    const [
      revenueByMonth,
      revenueByDay30,
      topProducts,
      productsByCategory,
      ordersByStatus,
      totalRevenue,
      averageOrderValue,
      totalOrders,
    ] = await Promise.all([
      this.ordersService.revenueByMonth(year),
      this.ordersService.revenueByDay(30),
      this.ordersService.topProducts(10),
      this.productsService.countByCategory(),
      this.ordersService.countGroupedByStatus(),
      this.ordersService.totalRevenue(),
      this.ordersService.averageOrderValue(),
      this.ordersService.count(),
    ]);

    return {
      year,
      revenueByMonth,
      revenueByDay30,
      topProducts,
      productsByCategory,
      ordersByStatus,
      totalRevenue,
      averageOrderValue,
      totalOrders,
      yearRevenue: revenueByMonth.reduce((s, m) => s + m.revenue, 0),
    };
  }
}
