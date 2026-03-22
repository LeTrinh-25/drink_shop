import { Injectable, NestMiddleware } from '@nestjs/common';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req, res, next) {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    next();
  }
}
