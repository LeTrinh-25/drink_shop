import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  // Kiểm tra login
  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch ? user : null;
  }

  // Đăng ký user
  async registerUser(username: string, password: string) {
    // ❗ Bước 1: Kiểm tra username có tồn tại hay chưa
    const existing = await this.usersService.findByUsername(username);
    if (existing) {
      throw new Error('Username already exists');
    }

    // ❗ Bước 2: Hash mật khẩu
    const hashed = await bcrypt.hash(password, 10);

    // ❗ Bước 3: Lưu user
    return this.usersService.createUser({
      username,
      password: hashed,
    });
  }
}
