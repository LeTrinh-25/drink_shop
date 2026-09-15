import { Controller, Get, Post, Param, Body, Req, Res, Query } from '@nestjs/common';
import type { Response } from 'express';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../categories/categories.service';
import { adminView } from './admin-view.helper';
import { setFlash } from '../common/flash';
import { Validator, cleanString, toInt, toBool } from '../common/validation';

@Controller('admin/products')
export class AdminProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  // ===================== Danh sách =====================

  @Get()
  async index(@Req() req, @Res() res: Response, @Query() query) {
    try {
      const [result, categories] = await Promise.all([
        this.productsService.findAllPaginated({
          q: query.q,
          categoryId: query.categoryId,
          status: query.status,
          sort: query.sort,
          page: query.page,
          limit: query.limit,
        }),
        this.categoriesService.findAll(),
      ]);

      return res.render(
        'admin/products/index',
        adminView(req, 'products', { result, categories }),
      );
    } catch (error) {
      return res.status(500).render(
        'admin/error',
        adminView(req, 'products', {
          message: 'Không tải được danh sách sản phẩm.',
          detail: (error as Error).message,
        }),
      );
    }
  }

  // ===================== Thêm mới =====================

  @Get('create')
  async createPage(@Req() req, @Res() res: Response) {
    const categories = await this.categoriesService.findAll();
    return res.render(
      'admin/products/form',
      adminView(req, 'products', {
        isEdit: false,
        product: { isActive: true, stock: 0, price: 0 },
        categories,
        errors: [],
      }),
    );
  }

  @Post('create')
  async create(@Req() req, @Res() res: Response, @Body() body) {
    const data = this.extractProduct(body);
    const validator = this.validateProduct(data);

    if (!validator.isValid()) {
      const categories = await this.categoriesService.findAll();
      return res.render(
        'admin/products/form',
        adminView(req, 'products', {
          isEdit: false,
          product: data,
          categories,
          errors: validator.getErrors(),
        }),
      );
    }

    try {
      await this.productsService.create(data);
      setFlash(req, 'success', `Đã thêm sản phẩm "${data.name}".`);
      return res.redirect('/admin/products');
    } catch (error) {
      const categories = await this.categoriesService.findAll();
      return res.render(
        'admin/products/form',
        adminView(req, 'products', {
          isEdit: false,
          product: data,
          categories,
          errors: ['Không lưu được sản phẩm: ' + (error as Error).message],
        }),
      );
    }
  }

  // ===================== Chi tiết =====================

  @Get(':id/detail')
  async detail(@Req() req, @Res() res: Response, @Param('id') id: string) {
    const product = await this.productsService.getById(Number(id));

    if (!product) {
      setFlash(req, 'danger', 'Không tìm thấy sản phẩm.');
      return res.redirect('/admin/products');
    }

    return res.render(
      'admin/products/detail',
      adminView(req, 'products', { product }),
    );
  }

  // ===================== Chỉnh sửa =====================

  @Get(':id/edit')
  async editPage(@Req() req, @Res() res: Response, @Param('id') id: string) {
    const product = await this.productsService.getById(Number(id));

    if (!product) {
      setFlash(req, 'danger', 'Không tìm thấy sản phẩm.');
      return res.redirect('/admin/products');
    }

    const categories = await this.categoriesService.findAll();
    return res.render(
      'admin/products/form',
      adminView(req, 'products', {
        isEdit: true,
        product,
        categories,
        errors: [],
      }),
    );
  }

  @Post(':id/edit')
  async update(
    @Req() req,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body,
  ) {
    const productId = Number(id);
    const existing = await this.productsService.getById(productId);

    if (!existing) {
      setFlash(req, 'danger', 'Không tìm thấy sản phẩm.');
      return res.redirect('/admin/products');
    }

    const data = this.extractProduct(body);
    const validator = this.validateProduct(data);

    if (!validator.isValid()) {
      const categories = await this.categoriesService.findAll();
      return res.render(
        'admin/products/form',
        adminView(req, 'products', {
          isEdit: true,
          product: { ...existing, ...data },
          categories,
          errors: validator.getErrors(),
        }),
      );
    }

    try {
      await this.productsService.update(productId, data);
      setFlash(req, 'success', `Đã cập nhật sản phẩm "${data.name}".`);
      return res.redirect('/admin/products');
    } catch (error) {
      const categories = await this.categoriesService.findAll();
      return res.render(
        'admin/products/form',
        adminView(req, 'products', {
          isEdit: true,
          product: { ...existing, ...data },
          categories,
          errors: ['Không cập nhật được: ' + (error as Error).message],
        }),
      );
    }
  }

  // ===================== Xóa =====================

  @Post(':id/delete')
  async remove(@Req() req, @Res() res: Response, @Param('id') id: string) {
    const product = await this.productsService.getById(Number(id));

    if (!product) {
      setFlash(req, 'danger', 'Không tìm thấy sản phẩm.');
      return res.redirect('/admin/products');
    }

    try {
      await this.productsService.delete(Number(id));
      setFlash(req, 'success', `Đã xóa sản phẩm "${product.name}".`);
    } catch (error) {
      // Sản phẩm đang nằm trong giỏ hàng -> khóa ngoại chặn xóa
      setFlash(
        req,
        'danger',
        'Không xóa được sản phẩm vì đang được tham chiếu trong giỏ hàng. Bạn có thể tắt trạng thái hiển thị thay vì xóa.',
      );
    }

    return res.redirect('/admin/products');
  }

  /** Bật/tắt nhanh trạng thái hiển thị của sản phẩm ngay trên bảng danh sách */
  @Post(':id/toggle')
  async toggle(@Req() req, @Res() res: Response, @Param('id') id: string) {
    const product = await this.productsService.getById(Number(id));

    if (!product) {
      setFlash(req, 'danger', 'Không tìm thấy sản phẩm.');
      return res.redirect('/admin/products');
    }

    await this.productsService.update(product.id, { isActive: !product.isActive });
    setFlash(
      req,
      'success',
      `Đã ${product.isActive ? 'ẩn' : 'hiển thị'} sản phẩm "${product.name}".`,
    );

    return res.redirect(req.get('Referrer') || '/admin/products');
  }

  // ===================== Helper =====================

  /** Lấy và chuẩn hóa dữ liệu sản phẩm từ form */
  private extractProduct(body: any) {
    const categoryId = toInt(body.category_id, 0);

    return {
      name: String(body.name || '').trim(),
      price: toInt(body.price, 0),
      image: cleanString(body.image),
      description: String(body.description || '').trim(),
      stock: toInt(body.stock, 0),
      isActive: toBool(body.isActive),
      category_id: categoryId > 0 ? categoryId : null,
    } as any;
  }

  private validateProduct(data: any): Validator {
    return new Validator()
      .required(data.name, 'Tên sản phẩm')
      .maxLength(data.name, 200, 'Tên sản phẩm')
      .numberMin(data.price, 0, 'Giá')
      .numberMin(data.stock, 0, 'Tồn kho')
      .required(data.description, 'Mô tả')
      .maxLength(data.description, 1000, 'Mô tả');
  }
}
