import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';

/** Trạng thái vòng đời của đơn hàng */
export type OrderStatus =
  | 'pending'    // Chờ xác nhận
  | 'confirmed'  // Đã xác nhận
  | 'shipping'   // Đang giao
  | 'completed'  // Hoàn thành (được tính vào doanh thu)
  | 'cancelled'; // Đã hủy

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

/** Màu badge Bootstrap tương ứng từng trạng thái */
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'warning',
  confirmed: 'info',
  shipping: 'primary',
  completed: 'success',
  cancelled: 'danger',
};

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  /** Người đặt. Nullable để nếu user bị xóa thì đơn hàng vẫn còn lịch sử. */
  @Column({ nullable: true })
  user_id: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // ===== Thông tin người nhận (chụp lại tại thời điểm đặt hàng) =====

  @Column()
  customerName: string;

  @Column()
  phone: string;

  @Column({ type: 'text' })
  address: string;

  /** 'cash' | 'bank' */
  @Column({ type: 'varchar', length: 20, default: 'cash' })
  paymentMethod: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  /** Tổng tiền đơn hàng (đã tính sẵn để không phải join khi thống kê) */
  @Column({ type: 'bigint', default: 0 })
  total: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: OrderStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];
}
