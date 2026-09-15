import { Controller, Get, Res, Req, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CategoriesService } from '../categories/categories.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productService: ProductsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  // Trang chủ với tìm kiếm + lọc theo danh mục
  @Get('/')
  async showProducts(
    @Req() req,
    @Res() res,
    @Query('q') q: string,
    @Query('category') category: string,
  ) {
    const categoryId = parseInt(category, 10);
    const products = await this.productService.findAll(
      q,
      Number.isNaN(categoryId) ? undefined : categoryId,
    );
    const categories = await this.categoriesService.findActive();

    res.render('home', {
      products,
      categories,
      activeCategory: Number.isNaN(categoryId) ? null : categoryId,
      user: req.session.user || null, // Navbar
      q: q || '', // Truyền lại giá trị tìm kiếm
    });
  }

  /*
   * ===== Các route quản trị cũ =====
   * Trước đây việc quản lý sản phẩm nằm ở /products/admin. Toàn bộ chức năng
   * đó đã được chuyển sang khu vực Admin mới (/admin/products) với đầy đủ
   * tìm kiếm, lọc, phân trang và phân quyền.
   * Giữ lại các route này dưới dạng chuyển hướng để link cũ (bookmark,
   * lịch sử trình duyệt) không bị lỗi 404.
   */

  @Get('/admin')
  legacyAdmin(@Res() res) {
    return res.redirect(301, '/admin/products');
  }

  @Get('/admin/add')
  legacyAdminAdd(@Res() res) {
    return res.redirect(301, '/admin/products/create');
  }

  @Get('/admin/edit/:id')
  legacyAdminEdit(@Param('id') id: string, @Res() res) {
    return res.redirect(301, `/admin/products/${id}/edit`);
  }
}
