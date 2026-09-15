import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import {
  normalizePagination,
  buildPaginated,
  Paginated,
} from '../common/pagination';

export interface UserFilter {
  q?: string;
  role?: string;
  status?: string; // 'active' | 'locked'
  page?: any;
  limit?: any;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ===================== Phần đã có từ trước (giữ nguyên) =====================

  // Tìm username
  async findByUsername(username: string) {
    return this.userRepository.findOne({ where: { username } });
  }

  // Tạo user mới
  async createUser(data: { username: string; password: string }) {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }

  // ===================== Bổ sung cho khu vực Admin =====================

  /** Danh sách người dùng có tìm kiếm + lọc + phân trang */
  async findAllPaginated(filter: UserFilter): Promise<Paginated<User>> {
    const { page, limit, skip } = normalizePagination(filter.page, filter.limit);

    const base: FindOptionsWhere<User> = {};
    if (filter.role === 'admin' || filter.role === 'user') {
      base.role = filter.role as UserRole;
    }
    if (filter.status === 'active') base.isActive = true;
    if (filter.status === 'locked') base.isActive = false;

    // Tìm kiếm theo username HOẶC họ tên HOẶC email -> cần mảng điều kiện OR
    const keyword = (filter.q || '').trim();
    const where: FindOptionsWhere<User>[] | FindOptionsWhere<User> = keyword
      ? [
          { ...base, username: Like(`%${keyword}%`) },
          { ...base, fullName: Like(`%${keyword}%`) },
          { ...base, email: Like(`%${keyword}%`) },
        ]
      : base;

    const [items, total] = await this.userRepository.findAndCount({
      where,
      order: { id: 'DESC' },
      skip,
      take: limit,
    });

    return buildPaginated(items, total, page, limit);
  }

  findById(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }

  /** Tạo user từ trang Admin (có đầy đủ thông tin và vai trò) */
  async createFromAdmin(data: {
    username: string;
    password: string;
    fullName?: string;
    email?: string;
    phone?: string;
    role?: UserRole;
    isActive?: boolean;
  }) {
    const user = this.userRepository.create({
      ...data,
      password: await bcrypt.hash(data.password, 10),
    });
    return this.userRepository.save(user);
  }

  /** Cập nhật user. Chỉ hash lại mật khẩu khi admin thực sự nhập mật khẩu mới. */
  async updateFromAdmin(
    id: number,
    data: Partial<User> & { password?: string },
  ) {
    const payload: Partial<User> = { ...data };

    if (data.password && data.password.trim() !== '') {
      payload.password = await bcrypt.hash(data.password, 10);
    } else {
      delete payload.password;
    }

    await this.userRepository.update(id, payload);
    return this.findById(id);
  }

  delete(id: number) {
    return this.userRepository.delete(id);
  }

  // ===================== Thống kê =====================

  count() {
    return this.userRepository.count();
  }

  countByRole(role: UserRole) {
    return this.userRepository.count({ where: { role } });
  }

  countAdmins() {
    return this.countByRole('admin');
  }

  /** Số user đăng ký kể từ mốc thời gian (dùng cho thống kê "user mới") */
  async countCreatedSince(date: Date): Promise<number> {
    return this.userRepository
      .createQueryBuilder('u')
      .where('u.createdAt >= :date', { date })
      .getCount();
  }

  /** 5 user đăng ký gần nhất, hiển thị ở Dashboard */
  findRecent(limit = 5) {
    return this.userRepository.find({ order: { id: 'DESC' }, take: limit });
  }
}
