import { Controller, Get, Res } from '@nestjs/common';

@Controller()
export class AppController {
  
  @Get()
  home(@Res() res) {
    return res.redirect('/products');
  }
}
