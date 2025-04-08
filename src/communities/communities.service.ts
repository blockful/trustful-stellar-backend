import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommunityDto } from './dto/create-community.dto';
import { Community, Badge } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) { }

  private async getLatestCommunities(communities: Community[]): Promise<Community[]> {
    // Group communities by address and keep only the most recent version
    const uniqueCommunities = communities.reduce((acc: Record<string, Community>, community) => {
      if (!acc[community.community_address] || 
          Number(community.last_indexed_at) >= Number(acc[community.community_address].last_indexed_at)) {
        acc[community.community_address] = community;
      }
      return acc;
    }, {});

    return Object.values(uniqueCommunities);
  }

  private async getLatestBadges(badges: Badge[]): Promise<Badge[]> {
    // Group badges by name and issuer and keep only the most recent version
    const uniqueBadges = badges.reduce((acc: Record<string, Badge>, badge) => {
      const key = `${badge.name}_${badge.issuer}`;
      if (!acc[key] || 
          Number(badge.created_at || 0) > Number(acc[key].created_at || 0)) {
        acc[key] = badge;
      }
      return acc;
    }, {});

    return Object.values(uniqueBadges);
  }

  async findAll(userAddress?: string): Promise<CreateCommunityDto[]> {
    const communities = await this.prisma.community.findMany({
      where: {
        is_hidden: false,
      },
      orderBy: {
        last_indexed_at: 'desc'
      }
    });

    const latestCommunities = await this.getLatestCommunities(communities);

    return Promise.all(
      latestCommunities.map(async (community) => {
        const membersCount = await this.prisma.communityMember.count({
          where: {
            community_address: community.community_address,
          },
        });
        
        const managers = await this.prisma.communityMember.findMany({
          where: {
            community_address: community.community_address,
            is_manager: true,
          },
          select: {
            user_address: true,
          },
        });

        let is_joined = false;
        if (userAddress) {
          const userMembership = await this.prisma.communityMember.findFirst({
            where: {
              community_address: community.community_address,
              user_address: userAddress,
            },
          });
          is_joined = !!userMembership;
        }
        
        return {
          community_address: community.community_address,
          factory_address: community.factory_address || '',
          name: community.name,
          description: community.description || '',
          icon: community.icon || '',
          creator_address: community.creator_address,
          is_hidden: community.is_hidden,
          blocktimestamp: new Date(Number(community.blocktimestamp.toString())),
          total_badges: community.total_badges,
          total_members: membersCount,
          managers: managers.map(manager => manager.user_address),
          is_joined,
        };
      })
    );
  }

  async findOne(communityAddress: string, userAddress?: string): Promise<CreateCommunityDto> {
    const communities = await this.prisma.community.findMany({
      where: {
        community_address: communityAddress,
      },
      orderBy: {
        last_indexed_at: 'desc'
      }
    });

    if (!communities.length) {
      throw new NotFoundException(
        `Community with contract address ${communityAddress} not found`,
      );
    }

    // Get the most recent version
    const community = communities[0];

    const membersCount = await this.prisma.communityMember.count({
      where: {
        community_address: communityAddress,
      },
    });

    const managers = await this.prisma.communityMember.findMany({
      where: {
        community_address: communityAddress,
        is_manager: true,
      },
      select: {
        user_address: true,
      },
    });

    let is_joined = false;
    if (userAddress) {
      const userMembership = await this.prisma.communityMember.findFirst({
        where: {
          community_address: communityAddress,
          user_address: userAddress,
        },
      });
      is_joined = !!userMembership;
    }

    return {
      community_address: community.community_address,
      factory_address: community.factory_address || '',
      name: community.name,
      description: community.description || '',
      icon: community.icon || '',
      creator_address: community.creator_address,
      is_hidden: community.is_hidden,
      blocktimestamp: new Date(Number(community.blocktimestamp.toString())),
      total_badges: community.total_badges,
      total_members: membersCount,
      managers: managers.map(manager => manager.user_address),
      is_joined,
    };
  }

  async updateVisibility(
    communityAddress: string,
    isHidden: boolean,
  ): Promise<CreateCommunityDto> {
    try {
      const updatedCommunity = await this.prisma.community.updateMany({
        where: {
          community_address: communityAddress,
        },
        data: {
          is_hidden: isHidden,
        },
      });

      if (updatedCommunity.count === 0) {
        throw new NotFoundException(
          `Community with address ${communityAddress} not found`,
        );
      }

      return this.findOne(communityAddress);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Community with address ${communityAddress} not found`,
        );
      }
      throw error;
    }
  }

  async findMembers(communityAddress: string) {
    const members = await this.prisma.communityMember.findMany({
      where: {
        community_address: communityAddress
      },
      orderBy: {
        points: 'desc'
      }
    });

    if (!members.length) {
      throw new NotFoundException(
        `No members found for community ${communityAddress}`
      );
    }

    return Promise.all(members.map(async member => ({
      user_address: member.user_address,
      is_manager: member.is_manager,
      is_creator: member.is_creator,
      community_address: member.community_address,
      points: member.points,
      badges_count: (await this.getUsersBadgeNumberAndPoints(member.user_address, communityAddress)).badges_count,
      last_indexed_at: new Date(Number(member.last_indexed_at.toString())),
    })));
  }

  async findBadges(communityAddress: string, user_address?: string) {
    const badges = await this.prisma.badge.findMany({
      where: {
        community_address: communityAddress
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (!badges.length) {
      throw new NotFoundException(
        `No badges found for community ${communityAddress}`
      );
    }

    const latestBadges = await this.getLatestBadges(badges);

    const mappedBadges = latestBadges.map(badge => ({
      issuer: badge.issuer,
      community_address: badge.community_address,
      name: badge.name,
      score: badge.score,
      type: badge.type,
      created_at: badge.created_at ? new Date(Number(badge.created_at.toString())) : undefined,
      removed_at: badge.removed_at ? new Date(Number(badge.removed_at.toString())) : undefined,
      ...(user_address && { user_has: false })
    }));

    if (user_address) {
      const { badges_count, points } = await this.getUsersBadgeNumberAndPoints(user_address, communityAddress);
      const userBadges = await this.prisma.userBadge.findMany({
        where: {
          community_address: communityAddress,
          user_address: user_address
        }
      });

      mappedBadges.forEach(badge => {
        badge.user_has = userBadges.some(ub => 
          ub.name === badge.name && 
          ub.issuer === badge.issuer
        );
      });

      return {
        badges_count,
        users_points: points,
        total_badges: latestBadges.length,
        community_badges: mappedBadges
      };
    }

    return { total_badges: latestBadges.length, community_badges: mappedBadges };
  }

  async findCreatedCommunities(userAddress: string) {
    const communities = await this.prisma.community.findMany({
      where: {
        creator_address: userAddress
      },
      orderBy: {
        last_indexed_at: 'desc'
      }
    });

    return this.getLatestCommunities(communities);
  }
  
  async findHiddenCommunities(userAddress: string) {
    const communities = await this.prisma.community.findMany({
      where: {
        creator_address: userAddress,
        is_hidden: true
      },
      orderBy: {
        last_indexed_at: 'desc'
      }
    });

    return this.getLatestCommunities(communities);
  }

  async findJoinnedCommunities(userAddress: string) {
    const communitiesAddresses = await this.prisma.communityMember.findMany({
      where: {
        user_address: userAddress
      },
      select: {
        community_address: true
      }
    });

    const badges_by_community = new Map<string, number>();
    const points_by_community = new Map<string, number>();

    for (const community of communitiesAddresses) {
      const { badges_count, points } = await this.getUsersBadgeNumberAndPoints(userAddress, community.community_address);
      badges_by_community.set(community.community_address, badges_count);
      points_by_community.set(community.community_address, points);
    }

    const communities = await this.prisma.community.findMany({
      where: {
        community_address: {
          in: communitiesAddresses.map(community => community.community_address)
        }
      },
      orderBy: {
        last_indexed_at: 'desc'
      }
    });

    const latestCommunities = await this.getLatestCommunities(communities);

    return latestCommunities.map(community => ({
      ...community,
      users_badges_count: badges_by_community.get(community.community_address) || 0,
      users_points: points_by_community.get(community.community_address) || 0
    }));
  }

  async findUserBadges(userAddress: string) {
    const userBadges = await this.prisma.userBadge.findMany({
      where: {
        user_address: userAddress
      }
    });

    if (!userBadges.length) {
      throw new NotFoundException(
        `No badges found for user ${userAddress}`
      );
    }

    return userBadges.map(badge => ({
      user_address: badge.user_address,
      issuer: badge.issuer,
      community_address: badge.community_address,
      name: badge.name,
      created_at: badge.created_at ? new Date(Number(badge.created_at.toString())) : undefined,
      badge_id: badge.badge_id,
      community_id: badge.community_id,
      community_member_id: badge.community_member_id,
    }));
  }

  async getUsersBadgeNumberAndPoints(userAddress: string, community_address: any) {
      const user_badges = await this.prisma.userBadge.findMany({
        where: {
          user_address: userAddress,
          community_address: community_address
        }
      });

      const points = await this.prisma.communityMember.findMany({
        where: {
          user_address: userAddress,
          community_address: community_address
        },
        take: 1
      });

      return { 
        badges_count: user_badges.length, 
        points: points[0]?.points || 0 
      };
  }

}