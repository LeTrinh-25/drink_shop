import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
  ) {}

  // ➕ Thêm sản phẩm vào giỏ
  async addToCart(userId: number, productId: number) {
    // Kiểm tra sản phẩm đã tồn tại trong giỏ chưa
    let item = await this.cartRepository.findOne({
      where: { user_id: userId, product_id: productId },
    });

    if (item) {
      // Nếu đã có, tăng số lượng 1
      item.quantity += 1;
      return this.cartRepository.save(item);
    } else {
      // Nếu chưa có, tạo mới
      return this.cartRepository.save({
        user_id: userId,
        product_id: productId,
        quantity: 1,
      });
    }
  }

  // 🛒 Lấy tất cả sản phẩm của user
  async findByUser(userId: number) {
    return this.cartRepository.find({
      where: { user_id: userId },
      relations: ['product'], // để lấy thông tin sản phẩm
    });
  }

  // ✔ Xóa 1 sản phẩm trong giỏ
  async removeItem(cartId: number) {
    return this.cartRepository.delete(cartId);
  }

  // 🔼 / 🔽 Tăng giảm số lượng
  async updateQuantity(userId: number, productId: number, change: number) {
    const item = await this.cartRepository.findOne({
      where: { user_id: userId, product_id: productId },
    });

    if (!item) return;

    item.quantity += change;
    if (item.quantity < 1) item.quantity = 1;

    return this.cartRepository.save(item);
  }

  // 🗑 Xóa toàn bộ giỏ hàng của 1 user
  async clearCart(userId: number) {
    return this.cartRepository.delete({ user_id: userId });
  }
}
