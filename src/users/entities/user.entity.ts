import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * Vai trò của tài khoản.
 * - 'user'  : khách hàng bình thường (mặc định khi đăng ký)
 * - 'admin' : quản trị viên, được phép truy cập /admin
 */
export type UserRole = 'user' | 'admin';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  // ===== Các cột bổ sung phục vụ khu vực Admin =====

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  /** Phân quyền. Mặc định 'user' nên dữ liệu cũ không bị ảnh hưởng. */
  @Column({ type: 'varchar', length: 20, default: 'user' })
  role: UserRole;

  /** true = đang hoạt động, false = bị khóa (không đăng nhập được) */
  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
