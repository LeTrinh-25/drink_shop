import { Controller, Get, Post, Body, Res, Req, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductsService) {}

  // Trang chủ với tìm kiếm
  @Get('/')
  async showProducts(@Req() req, @Res() res, @Query('q') q: string) {
    const products = await this.productService.findAll(q);

    res.render('home', {
      products,
      user: req.session.user || null, // Navbar
      q: q || '', // Truyền lại giá trị tìm kiếm
    });
  }

  // Trang admin
  @Get('/admin')
  async admin(@Res() res) {
    const products = await this.productService.findAll();
    res.render('admin/index', { products });
  }

  // Form thêm sản phẩm
  @Get('/admin/add')
  addPage(@Res() res) {
    res.render('admin/add');
  }

  // Xử lý thêm
  @Post('/admin/add')
  async saveProduct(@Body() body, @Res() res) {
    await this.productService.create(body);
    res.redirect('/products/admin');
  }

  // Form chỉnh sửa
  @Get('/admin/edit/:id')
  async editPage(@Param('id') id: number, @Res() res) {
    const product = await this.productService.getById(id);
    if (!product) return res.redirect('/products/admin'); // Nếu không tìm thấy
    res.render('admin/edit', { product });
  }

  // Xử lý lưu chỉnh sửa
  @Post('/admin/edit/:id')
  async updateProduct(@Param('id') id: number, @Body() body, @Res() res) {
    await this.productService.update(id, body);
    res.redirect('/products/admin');
  }

  // Xóa sản phẩm
  @Get('/admin/delete/:id')
  async deleteProduct(@Param('id') id, @Res() res) {
    await this.productService.delete(id);
    res.redirect('/products/admin');
  }
}
