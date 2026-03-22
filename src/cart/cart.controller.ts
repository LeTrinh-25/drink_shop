import { Controller, Get, Post, Param, Req, Res, Body } from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // ➕ Thêm sản phẩm vào giỏ
  @Get('/add/:productId')
  async add(@Param('productId') productId: number, @Req() req, @Res() res) {
    if (!req.session.user) return res.redirect('/auth/login');

    const userId = req.session.user.id;
    await this.cartService.addToCart(userId, productId);

    return res.redirect('/cart');
  }

  // 🛒 Hiển thị giỏ hàng
  @Get('/')
  async showCart(@Req() req, @Res() res) {
    if (!req.session.user) return res.redirect('/auth/login');

    const userId = req.session.user.id;
    const cart = await this.cartService.findByUser(userId);

    return res.render('cart', { cart });
  }

  // 🔼 Tăng số lượng
  @Get('/increase/:productId')
  async increase(@Param('productId') productId: number, @Req() req, @Res() res) {
    if (!req.session.user) return res.redirect('/auth/login');
    const userId = req.session.user.id;

    await this.cartService.updateQuantity(userId, productId, 1);
    return res.redirect('/cart');
  }

  // 🔽 Giảm số lượng
  @Get('/decrease/:productId')
  async decrease(@Param('productId') productId: number, @Req() req, @Res() res) {
    if (!req.session.user) return res.redirect('/auth/login');
    const userId = req.session.user.id;

    await this.cartService.updateQuantity(userId, productId, -1);
    return res.redirect('/cart');
  }

  // ❌ Xóa sản phẩm khỏi giỏ
  @Get('/delete/:cartId')
  async removeItem(@Param('cartId') cartId: number, @Req() req, @Res() res) {
    if (!req.session.user) return res.redirect('/auth/login');

    await this.cartService.removeItem(cartId);
    return res.redirect('/cart');
  }

  // 💳 Trang checkout
  @Get('/checkout')
  async checkoutPage(@Req() req, @Res() res) {
    if (!req.session.user) return res.redirect('/auth/login');

    const userId = req.session.user.id;
    const cart = await this.cartService.findByUser(userId);

    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    return res.render('checkout', { cart, total });
  }

  // ✔ Xử lý thanh toán
  @Post('/checkout')
  async checkout(@Req() req, @Res() res, @Body() body) {
    if (!req.session.user) return res.redirect('/auth/login');

    const userId = req.session.user.id;
    const { name, phone, address, payment } = body;

    // 🧹 Xóa giỏ hàng sau thanh toán
    await this.cartService.clearCart(userId);

    // Trả về giao diện thành công
    return res.send(`
      <div style="
        max-width:600px;
        margin:50px auto;
        padding:20px;
        font-family:sans-serif;
        border-radius:10px;
        border:1px solid #ddd;
        box-shadow:0 4px 12px rgba(0,0,0,0.1);
      ">
        <h2 style="color:#28a745;">🎉 Thanh toán thành công!</h2>
        <p><b>Khách hàng:</b> ${name}</p>
        <p><b>Số điện thoại:</b> ${phone}</p>
        <p><b>Địa chỉ:</b> ${address}</p>
        <p><b>Phương thức thanh toán:</b> ${payment === 'cash' ? '💵 Tiền mặt' : '🏦 Chuyển khoản'}</p>
        <a href="/" style="font-size:20px;display:inline-block;margin-top:20px;color:#007bff;text-decoration:none;">
          ⬅ Quay về trang chủ
        </a>
      </div>
    `);
  }
}
