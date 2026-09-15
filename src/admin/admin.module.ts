import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';
import { CategoriesModule } from '../categories/categories.module';
import { OrdersModule } from '../orders/orders.module';

import { AdminService } from './admin.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminProductsController } from './admin-products.controller';
import { AdminCategoriesController } from './admin-categories.controller';
import { AdminOrdersController } from './admin-orders.controller';
import { AdminStatisticsController } from './admin-statistics.controller';
import { AdminSettingsController } from './admin-settings.controller';

/**
 * Module gom toàn bộ khu vực quản trị.
 * Không định nghĩa lại service nghiệp vụ — chỉ import lại các module
 * sẵn có của dự án (users, products, orders, categories, auth).
 *
 * Thứ tự controller có ý nghĩa với việc khớp route: AdminAuthController
 * khai báo trước để '/admin/login' không bị các route động che mất.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    UsersModule,
    AuthModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
  ],
  controllers: [
    AdminAuthController,
    AdminDashboardController,
    AdminUsersController,
    AdminProductsController,
    AdminCategoriesController,
    AdminOrdersController,
    AdminStatisticsController,
    AdminSettingsController,
  ],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
