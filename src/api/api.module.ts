import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CartModule } from '../cart/cart.module';
import { CategoriesModule } from '../categories/categories.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { ApiController } from './api.controller';

@Module({
  imports: [AuthModule, CartModule, CategoriesModule, OrdersModule, ProductsModule],
  controllers: [ApiController],
})
export class ApiModule {}
