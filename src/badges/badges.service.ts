import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeDto } from './dto/badge.dto';

@Injectable()
export class BadgesService {
  constructor(private prisma: PrismaService) {}

  async findBadgesByType(type: string) {
    const badges = await this.prisma.badge.findMany({
      where: {
        type: type
      }
    });

    if (!badges.length) {
      throw new NotFoundException(`No badges found with type ${type}`);
    }

    return badges;
  }
}
