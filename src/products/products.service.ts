import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import {
  normalizePagination,
  buildPaginated,
  Paginated,
} from '../common/pagination';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  // ===================== Phần dành cho trang bán hàng (giữ nguyên hành vi cũ) =====================

  /**
   * Lấy sản phẩm cho trang khách hàng.
   * Chỉ trả về sản phẩm đang bật (isActive = true) để admin có thể ẩn hàng
   * mà không cần xóa. Sản phẩm cũ mặc định isActive = true nên không đổi gì.
   */
  async findAll(query?: string, categoryId?: number): Promise<Product[]> {
    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isActive = :active', { active: true });

    if (query) {
      qb.andWhere('product.name LIKE :name', { name: `%${query}%` });
    }
    if (categoryId) {
      qb.andWhere('product.category_id = :categoryId', { categoryId });
    }

    return qb.orderBy('product.id', 'DESC').getMany();
  }

  // Lấy theo id, kiểu trả về Product | null
  async getById(id: number): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });
  }

  create(data: Partial<Product>) {
    return this.productRepository.save(data);
  }

  update(id: number, data: Partial<Product>) {
    return this.productRepository.update(id, data);
  }

  delete(id: number) {
    return this.productRepository.delete(id);
  }

  // ===================== Bổ sung cho khu vực Admin =====================

  /** Danh sách sản phẩm có tìm kiếm + lọc danh mục/trạng thái + sắp xếp + phân trang */
  async findAllPaginated(filter: {
    q?: string;
    categoryId?: any;
    status?: string;
    sort?: string;
    page?: any;
    limit?: any;
  }): Promise<Paginated<Product>> {
    const { page, limit, skip } = normalizePagination(filter.page, filter.limit);

    const qb = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .skip(skip)
      .take(limit);

    const keyword = (filter.q || '').trim();
    if (keyword) {
      qb.andWhere(
        '(product.name LIKE :kw OR product.description LIKE :kw)',
        { kw: `%${keyword}%` },
      );
    }

    const catId = parseInt(String(filter.categoryId), 10);
    if (!Number.isNaN(catId) && catId > 0) {
      qb.andWhere('product.category_id = :catId', { catId });
    }

    if (filter.status === 'active') {
      qb.andWhere('product.isActive = :a', { a: true });
    } else if (filter.status === 'inactive') {
      qb.andWhere('product.isActive = :a', { a: false });
    } else if (filter.status === 'out_of_stock') {
      qb.andWhere('product.stock <= 0');
    }

    // Sắp xếp an toàn: chỉ chấp nhận các giá trị nằm trong whitelist
    switch (filter.sort) {
      case 'price_asc':
        qb.orderBy('product.price', 'ASC');
        break;
      case 'price_desc':
        qb.orderBy('product.price', 'DESC');
        break;
      case 'name_asc':
        qb.orderBy('product.name', 'ASC');
        break;
      case 'oldest':
        qb.orderBy('product.id', 'ASC');
        break;
      default:
        qb.orderBy('product.id', 'DESC');
    }

    const [items, total] = await qb.getManyAndCount();
    return buildPaginated(items, total, page, limit);
  }

  count() {
    return this.productRepository.count();
  }

  countActive() {
    return this.productRepository.count({ where: { isActive: true } });
  }

  async countOutOfStock(): Promise<number> {
    return this.productRepository
      .createQueryBuilder('p')
      .where('p.stock <= 0')
      .getCount();
  }

  /** Tổng giá trị hàng tồn = SUM(price * stock) */
  async inventoryValue(): Promise<number> {
    const raw = await this.productRepository
      .createQueryBuilder('p')
      .select('SUM(p.price * p.stock)', 'sum')
      .getRawOne<{ sum: string | null }>();
    return Number(raw?.sum ?? 0);
  }

  /** Số sản phẩm theo từng danh mục, dùng cho biểu đồ tròn */
  async countByCategory() {
    const rows = await this.productRepository
      .createQueryBuilder('p')
      .leftJoin('p.category', 'c')
      .select('COALESCE(c.name, :none)', 'name')
      .addSelect('COUNT(p.id)', 'count')
      .setParameter('none', 'Chưa phân loại')
      .groupBy('name')
      .orderBy('count', 'DESC')
      .getRawMany<{ name: string; count: string }>();

    return rows.map((r) => ({ name: r.name, count: Number(r.count) }));
  }

  /** Sản phẩm sắp hết hàng, cảnh báo ở Dashboard */
  async lowStock(threshold = 10, limit = 5) {
    return this.productRepository
      .createQueryBuilder('p')
      .where('p.stock <= :threshold', { threshold })
      .orderBy('p.stock', 'ASC')
      .limit(limit)
      .getMany();
  }

  /** Trừ tồn kho khi đặt hàng (không cho âm) */
  async decreaseStock(productId: number, quantity: number) {
    await this.productRepository
      .createQueryBuilder()
      .update(Product)
      .set({ stock: () => `GREATEST(stock - ${Number(quantity) || 0}, 0)` })
      .where('id = :id', { id: productId })
      .execute();
  }
}
