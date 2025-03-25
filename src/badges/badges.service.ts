import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeDto } from './dto/badge.dto';
import { v4 as uuidv4 } from 'uuid';

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

  async createBadge(badgeDto: BadgeDto) {
    const community = await this.prisma.community.findUnique({
      where: {
        community_address: badgeDto.communityAddress
      }
    });

    if (!community) {
      throw new NotFoundException(`Community with address ${badgeDto.communityAddress} not found`);
    }

    return this.prisma.badge.create({
      data: {
        id: uuidv4(),
        issuer: badgeDto.issuer,
        community_address: badgeDto.communityAddress,
        name: badgeDto.name,
        score: badgeDto.score,
        type: badgeDto.type,
        created_at: badgeDto.createdAt ? new Date(badgeDto.createdAt).getTime() : null,
        removed_at: badgeDto.removedAt ? new Date(badgeDto.removedAt).getTime() : null,
        community_id: community.id,
      }
    });
  }
}
