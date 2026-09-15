import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Not } from 'typeorm';
import { Category } from './entities/category.entity';
import {
  normalizePagination,
  buildPaginated,
  Paginated,
} from '../common/pagination';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /** Lấy toàn bộ danh mục (dùng để đổ vào dropdown ở form sản phẩm) */
  findAll() {
    return this.categoryRepository.find({ order: { name: 'ASC' } });
  }

  /** Chỉ lấy danh mục đang bật, dùng cho trang bán hàng */
  findActive() {
    return this.categoryRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findAllPaginated(filter: {
    q?: string;
    status?: string;
    page?: any;
    limit?: any;
  }): Promise<Paginated<Category>> {
    const { page, limit, skip } = normalizePagination(filter.page, filter.limit);

    const where: any = {};
    const keyword = (filter.q || '').trim();
    if (keyword) where.name = Like(`%${keyword}%`);
    if (filter.status === 'active') where.isActive = true;
    if (filter.status === 'inactive') where.isActive = false;

    const [items, total] = await this.categoryRepository.findAndCount({
      where,
      order: { id: 'DESC' },
      skip,
      take: limit,
    });

    return buildPaginated(items, total, page, limit);
  }

  findById(id: number) {
    return this.categoryRepository.findOne({ where: { id } });
  }

  /** Kiểm tra trùng tên. excludeId dùng khi đang sửa chính bản ghi đó. */
  async isNameTaken(name: string, excludeId?: number): Promise<boolean> {
    const found = await this.categoryRepository.findOne({
      where: excludeId
        ? { name, id: Not(excludeId) }
        : { name },
    });
    return !!found;
  }

  create(data: Partial<Category>) {
    return this.categoryRepository.save(this.categoryRepository.create(data));
  }

  async update(id: number, data: Partial<Category>) {
    await this.categoryRepository.update(id, data);
    return this.findById(id);
  }

  delete(id: number) {
    // Product.category_id đặt onDelete: 'SET NULL' nên sản phẩm không bị mất.
    return this.categoryRepository.delete(id);
  }

  count() {
    return this.categoryRepository.count();
  }
}
