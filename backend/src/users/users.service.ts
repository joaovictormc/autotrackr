import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
    });
  }

  async create(data: { email: string; password: string; name: string; phone?: string }) {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email já está em uso');

    const hashedPassword = await bcrypt.hash(data.password, 12);
    return this.prisma.user.create({
      data: { email: data.email, hashedPassword, name: data.name, phone: data.phone },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
    });
  }

  async updateProfile(id: string, data: { name?: string; phone?: string }) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, phone: true, role: true },
    });
  }

  async updatePassword(id: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 12);
    return this.prisma.user.update({ where: { id }, data: { hashedPassword } });
  }
}
