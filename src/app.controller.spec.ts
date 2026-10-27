import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should redirect to /products', () => {
      const res = { redirect: jest.fn() };

      appController.home(res as any);

      expect(res.redirect).toHaveBeenCalledWith('/products');
    });
  });
});
