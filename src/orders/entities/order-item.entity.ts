import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

/**
 * Chi tiết một dòng trong đơn hàng.
 * productName / price được sao chép lại để lịch sử đơn hàng không bị
 * thay đổi khi admin sửa hoặc xóa sản phẩm gốc.
 */
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order_id: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ nullable: true })
  product_id: number;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  productName: string;

  @Column({ nullable: true })
  productImage: string;

  @Column({ type: 'bigint' })
  price: number;

  @Column({ default: 1 })
  quantity: number;
}
