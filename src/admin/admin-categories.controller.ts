import { Controller, Get, Post, Param, Body, Req, Res, Query } from '@nestjs/common';
import type { Response } from 'express';
import { CategoriesService } from '../categories/categories.service';
import { adminView } from './admin-view.helper';
import { setFlash } from '../common/flash';
import { Validator, cleanString, toBool } from '../common/validation';

@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async index(@Req() req, @Res() res: Response, @Query() query) {
    try {
      const result = await this.categoriesService.findAllPaginated({
        q: query.q,
        status: query.status,
        page: query.page,
        limit: query.limit,
      });

      return res.render(
        'admin/categories/index',
        adminView(req, 'categories', { result }),
      );
    } catch (error) {
      return res.status(500).render(
        'admin/error',
        adminView(req, 'categories', {
          message: 'Không tải được danh sách danh mục.',
          detail: (error as Error).message,
        }),
      );
    }
  }

  @Get('create')
  createPage(@Req() req, @Res() res: Response) {
    return res.render(
      'admin/categories/form',
      adminView(req, 'categories', {
        isEdit: false,
        category: { isActive: true },
        errors: [],
      }),
    );
  }

  @Post('create')
  async create(@Req() req, @Res() res: Response, @Body() body) {
    const data = {
      name: String(body.name || '').trim(),
      description: cleanString(body.description),
      isActive: toBool(body.isActive),
    };

    const validator = new Validator()
      .required(data.name, 'Tên danh mục')
      .maxLength(data.name, 100, 'Tên danh mục');

    if (data.name && (await this.categoriesService.isNameTaken(data.name))) {
      validator.add('Tên danh mục đã tồn tại.');
    }

    if (!validator.isValid()) {
      return res.render(
        'admin/categories/form',
        adminView(req, 'categories', {
          isEdit: false,
          category: data,
          errors: validator.getErrors(),
        }),
      );
    }

    await this.categoriesService.create(data);
    setFlash(req, 'success', `Đã thêm danh mục "${data.name}".`);
    return res.redirect('/admin/categories');
  }

  @Get(':id/edit')
  async editPage(@Req() req, @Res() res: Response, @Param('id') id: string) {
    const category = await this.categoriesService.findById(Number(id));

    if (!category) {
      setFlash(req, 'danger', 'Không tìm thấy danh mục.');
      return res.redirect('/admin/categories');
    }

    return res.render(
      'admin/categories/form',
      adminView(req, 'categories', { isEdit: true, category, errors: [] }),
    );
  }

  @Post(':id/edit')
  async update(
    @Req() req,
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body,
  ) {
    const categoryId = Number(id);
    const existing = await this.categoriesService.findById(categoryId);

    if (!existing) {
      setFlash(req, 'danger', 'Không tìm thấy danh mục.');
      return res.redirect('/admin/categories');
    }

    const data = {
      name: String(body.name || '').trim(),
      description: cleanString(body.description),
      isActive: toBool(body.isActive),
    };

    const validator = new Validator()
      .required(data.name, 'Tên danh mục')
      .maxLength(data.name, 100, 'Tên danh mục');

    if (
      data.name &&
      (await this.categoriesService.isNameTaken(data.name, categoryId))
    ) {
      validator.add('Tên danh mục đã tồn tại.');
    }

    if (!validator.isValid()) {
      return res.render(
        'admin/categories/form',
        adminView(req, 'categories', {
          isEdit: true,
          category: { ...existing, ...data },
          errors: validator.getErrors(),
        }),
      );
    }

    await this.categoriesService.update(categoryId, data);
    setFlash(req, 'success', `Đã cập nhật danh mục "${data.name}".`);
    return res.redirect('/admin/categories');
  }

  @Post(':id/delete')
  async remove(@Req() req, @Res() res: Response, @Param('id') id: string) {
    const category = await this.categoriesService.findById(Number(id));

    if (!category) {
      setFlash(req, 'danger', 'Không tìm thấy danh mục.');
      return res.redirect('/admin/categories');
    }

    try {
      // Sản phẩm thuộc danh mục này sẽ chuyển về "Chưa phân loại" (SET NULL)
      await this.categoriesService.delete(Number(id));
      setFlash(req, 'success', `Đã xóa danh mục "${category.name}".`);
    } catch (error) {
      setFlash(req, 'danger', 'Không xóa được danh mục: ' + (error as Error).message);
    }

    return res.redirect('/admin/categories');
  }
}
