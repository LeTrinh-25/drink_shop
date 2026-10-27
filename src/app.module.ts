import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
import { ApiModule } from './api/api.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { AdminMiddleware } from './admin/middlewares/admin.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const databaseUrl = config.get<string>('DATABASE_URL')?.trim();
        const sslEnabled =
          config.get<string>('DB_SSL')?.toLowerCase() === 'true' ||
          !!databaseUrl?.includes('.supabase.co');
        const commonOptions = {
          entities: [User, Product, Cart, Category, Order, OrderItem],
          synchronize: true,
          ssl: sslEnabled ? { rejectUnauthorized: false } : false,
        };

        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            ...commonOptions,
          };
        }

        const host = config.get<string>('DB_HOST')?.trim();
        const username = config.get<string>('DB_USERNAME')?.trim();
        const password = config.get<string>('DB_PASSWORD');
        const database = config.get<string>('DB_DATABASE')?.trim();
        const port = Number(config.get<string>('DB_PORT') || '5432');
        const missingVariables = [
          !host && 'DB_HOST',
          !username && 'DB_USERNAME',
          !password && 'DB_PASSWORD',
          !database && 'DB_DATABASE',
        ].filter(Boolean);

        if (missingVariables.length > 0) {
          throw new Error(
            `Missing database configuration: ${missingVariables.join(', ')}. ` +
              'Set DATABASE_URL or all required DB_* variables.',
          );
        }

        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          throw new Error('DB_PORT must be an integer between 1 and 65535.');
        }

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          ...commonOptions,
        };
      },
    }),

    UsersModule,
    AuthModule,
    ProductsModule,
    CartModule,
    CategoriesModule,
    OrdersModule,
    AdminModule,
    ApiModule,
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
