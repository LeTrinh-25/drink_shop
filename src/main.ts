import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import session from 'express-session';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Render terminates HTTPS at its proxy; trust it so secure session cookies work.
  app.set('trust proxy', 1);
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  // Set EJS
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('ejs');

  // Session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'mysessionsecret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 8, // phiên làm việc 8 tiếng
        httpOnly: true,
        sameSite: process.env.FRONTEND_URL?.startsWith('https://') ? 'none' : 'lax',
        secure: process.env.FRONTEND_URL?.startsWith('https://') || false,
      },
    }),
  );
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
