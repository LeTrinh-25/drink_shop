import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Param,
  Put,
  Query,
  Req,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CartService } from '../cart/cart.service';
import { CategoriesService } from '../categories/categories.service';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';

@Controller('api')
export class ApiController {
  constructor(
    private readonly auth: AuthService,
    private readonly cart: CartService,
    private readonly categories: CategoriesService,
    private readonly orders: OrdersService,
    private readonly products: ProductsService,
  ) {}

  private user(req: any) {
    if (!req.session.user) throw new UnauthorizedException('Vui lòng đăng nhập');
    return req.session.user;
  }

  @Get('products')
  async listProducts(@Query('q') q?: string, @Query('category') category?: string) {
    const parsedCategory = Number.parseInt(category || '', 10);
    const [products, categories] = await Promise.all([
      this.products.findAll(q, Number.isNaN(parsedCategory) ? undefined : parsedCategory),
      this.categories.findActive(),
    ]);
    return { products, categories };
  }

  @Get('auth/me')
  me(@Req() req: any) {
    return { user: req.session.user || null };
  }

  @Post('auth/login')
  @HttpCode(200)
  async login(@Body() body: any, @Req() req: any) {
    const user = await this.auth.validateUser(body.username, body.password);
    if (!user || !user.isActive) throw new UnauthorizedException('Tài khoản hoặc mật khẩu không đúng');
    req.session.user = { id: user.id, username: user.username, fullName: user.fullName, role: user.role };
    return { user: req.session.user };
  }

  @Post('auth/register')
  @HttpCode(201)
  async register(@Body() body: any) {
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    if (!username || password.length < 6) throw new BadRequestException('Tên đăng nhập không được để trống và mật khẩu cần ít nhất 6 ký tự');
    try {
      await this.auth.registerUser(username, password);
      return { message: 'Đăng ký thành công' };
    } catch {
      throw new BadRequestException('Tên đăng nhập đã tồn tại');
    }
  }

  @Post('auth/logout')
  @HttpCode(200)
  logout(@Req() req: any) {
    return new Promise((resolve, reject) => req.session.destroy((error) => error ? reject(error) : resolve({ ok: true })));
  }

  @Get('cart')
  async getCart(@Req() req: any) {
    const user = this.user(req);
    const items = await this.cart.findByUser(user.id);
    return { items, total: items.reduce((sum, item) => sum + Number(item.product?.price || 0) * item.quantity, 0) };
  }

  @Post('cart/items')
  async addCartItem(@Req() req: any, @Body() body: any) {
    const user = this.user(req);
    const productId = Number(body.productId);
    if (!Number.isInteger(productId) || productId < 1) throw new BadRequestException('Sản phẩm không hợp lệ');
    await this.cart.addToCart(user.id, productId);
    return this.getCart(req);
  }

  @Put('cart/items/:id')
  async setCartQuantity(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const user = this.user(req);
    const cartId = Number(id);
    const quantity = Number(body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new BadRequestException('Số lượng không hợp lệ');
    const existing = await this.cart.findByUser(user.id);
    const item = existing.find((entry) => entry.id === cartId);
    if (!item) throw new BadRequestException('Không tìm thấy sản phẩm trong giỏ');
    await this.cart.updateQuantity(user.id, item.product_id, quantity - item.quantity);
    return this.getCart(req);
  }

  @Delete('cart/items/:id')
  async deleteCartItem(@Req() req: any, @Param('id') id: string) {
    const user = this.user(req);
    await this.cart.removeItemForUser(user.id, Number(id));
    return this.getCart(req);
  }

  @Post('orders')
  @HttpCode(201)
  async checkout(@Req() req: any, @Body() body: any) {
    const user = this.user(req);
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const address = String(body.address || '').trim();
    if (!name || !phone || !address) throw new BadRequestException('Vui lòng nhập tên, số điện thoại và địa chỉ');
    const cart = await this.cart.findByUser(user.id);
    if (!cart.length) throw new BadRequestException('Giỏ hàng đang trống');
    const order = await this.orders.createOrder({
      user_id: user.id,
      customerName: name,
      phone,
      address,
      paymentMethod: body.payment === 'bank' ? 'bank' : 'cash',
      note: String(body.note || '').trim() || undefined,
      items: cart.map((item) => ({ product_id: item.product.id, productName: item.product.name, productImage: item.product.image, price: item.product.price, quantity: item.quantity })),
    });
    for (const item of cart) await this.products.decreaseStock(item.product.id, item.quantity);
    await this.cart.clearCart(user.id);
    return { order: { id: order.id, total: order.total, status: order.status } };
  }

  @Get('orders')
  myOrders(@Req() req: any) {
    const user = this.user(req);
    return this.orders.findByUser(user.id);
  }
}
