import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from './entities/cart.entity';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cart]), OrdersModule, ProductsModule],
  providers: [CartService],
  controllers: [CartController],
})
export class CartModule {}
