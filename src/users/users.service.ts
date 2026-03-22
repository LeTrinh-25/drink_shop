import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Tìm username
  async findByUsername(username: string) {
    return this.userRepository.findOne({ where: { username } });
  }

  // Tạo user mới
  async createUser(data: { username: string; password: string }) {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user);
  }
}
