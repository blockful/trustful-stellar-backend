import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeDto } from './dto/badge.dto';

@Injectable()
export class BadgesService {
  constructor(private prisma: PrismaService) {}

  private async getAvailableTypes(): Promise<string[]> {
    const types = await this.prisma.badge.findMany({
      select: {
        type: true
      },
      distinct: ['type']
    });
    
    return types.map(t => t.type);
  }

  async findBadgesByType(type: string) {
    const badges = await this.prisma.badge.findMany({
      where: {
        type: type
      }
    });

    if (!badges.length) {
      const availableTypes = await this.getAvailableTypes();
      throw new NotFoundException(
        `Type "${type}" not found. Available types are: ${availableTypes.join(', ')}`
      );
    }

    const uniqueBadgesMap = new Map();
    badges.forEach(badge => {
      const key = `${badge.issuer}_${badge.name}`;
      if (!uniqueBadgesMap.has(key)) {
        uniqueBadgesMap.set(key, badge);
      }
    });

    const uniqueBadges = Array.from(uniqueBadgesMap.values());

    return uniqueBadges;
  }

  async returnCommunityBadgesThatTheUserHas(user_address: String, community_address: String){

    const badgesThatUserHas = await this.prisma.userBadge.findMany({
      where: {
        user_address: user_address.toString(), 
        community_address: community_address.toString()
      }
    })
    return badgesThatUserHas;

  }
}
