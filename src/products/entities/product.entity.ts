import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  price: number;

  @Column({ nullable: true })
  image: string;

  @Column()
  description: string;

  // ===== Các cột bổ sung phục vụ khu vực Admin =====

  /** Số lượng tồn kho (chỉ mang tính quản trị, không chặn mua hàng) */
  @Column({ default: 0 })
  stock: number;

  /** false = ẩn sản phẩm khỏi trang bán hàng */
  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  category_id: number;

  @ManyToOne(() => Category, (category) => category.products, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @CreateDateColumn()
  createdAt: Date;
}
