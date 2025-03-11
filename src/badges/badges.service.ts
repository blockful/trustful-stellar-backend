import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeDto } from './dto/badge.dto';

@Injectable()
export class BadgesService {
  constructor(private prisma: PrismaService) {}

  /*
   * Find badges by type
   * @param type The badge type to search for
   * @returns Array of badges matching the type
   * @throws NotFoundException if no badges are found
   *
   * async findBadgesByType(type: string) {
   *   const badges = await this.prisma.badge.findMany({
   *     where: {
   *       type: type
   *     }
   *   });
   *
   *   if (!badges.length) {
   *     throw new NotFoundException(`No badges found with type ${type}`);
   *   }
   *
   *   return badges;
   * }
   */

  /*
   * Create a new badge
   * @param badgeDto The badge data transfer object
   * @returns The created badge
   *
   * async createBadge(badgeDto: BadgeDto) {
   *   return this.prisma.badge.create({
   *     data: badgeDto
   *   });
   * }
   */
}
