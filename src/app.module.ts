import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { User } from './users/entities/user.entity';
import { Product } from './products/entities/product.entity';
import { Cart } from './cart/entities/cart.entity';
import { Category } from './categories/entities/category.entity';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';
import { CategoriesModule } from './categories/categories.module';
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { AdminMiddleware } from './admin/middlewares/admin.middleware';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),

    TypeOrmModule.forRoot({
      type: 'mysql',
      // Ưu tiên biến môi trường trong .env, giữ giá trị cũ làm mặc định
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'drink_shop_db',
      entities: [User, Product, Cart, Category, Order, OrderItem],
      synchronize: true, // tự tạo/cập nhật bảng cho các entity mới
    }),

    UsersModule,
    AuthModule,
    ProductsModule,
    CartModule,
    CategoriesModule,
    OrdersModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Bắt buộc đăng nhập cho giỏ hàng (giữ nguyên như trước)
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: 'cart/*path', method: RequestMethod.ALL });

    // Toàn bộ khu vực /admin chỉ dành cho tài khoản role = 'admin'.
    // Riêng trang đăng nhập admin phải được loại trừ, nếu không sẽ lặp vô hạn.
    consumer
      .apply(AdminMiddleware)
      .exclude({ path: 'admin/login', method: RequestMethod.ALL })
      .forRoutes(
        { path: 'admin', method: RequestMethod.ALL },
        { path: 'admin/*path', method: RequestMethod.ALL },
      );
  }
}
