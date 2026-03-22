import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  // Lấy tất cả sản phẩm hoặc tìm theo keyword
  async findAll(query?: string): Promise<Product[]> {
    if (query) {
      return this.productRepository
        .createQueryBuilder('product')
        .where('product.name LIKE :name', { name: `%${query}%` })
        .getMany();
    }
    return this.productRepository.find();
  }

  // Lấy theo id, kiểu trả về Product | null
  async getById(id: number): Promise<Product | null> {
    return this.productRepository.findOne({ where: { id } });
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
}
