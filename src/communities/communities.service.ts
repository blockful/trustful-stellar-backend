import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommunityDto } from './dto/create-community.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) { }

  async findAll(): Promise<CreateCommunityDto[]> {
    const communities = await this.prisma.community.findMany({
      where: {
        is_hidden: false,
      }
    });

    return Promise.all(
      communities.map(async (community) => {
        const membersCount = await this.prisma.communityMember.count({
          where: {
            community_address: community.community_address,
          },
        });
        
        // Fetch managers for this community
        const managers = await this.prisma.communityMember.findMany({
          where: {
            community_address: community.community_address,
            is_manager: true,
          },
          select: {
            user_address: true,
          },
        });
        
        // Return the DTO directly here
        return {
          communityAddress: community.community_address,
          factoryAddress: community.factory_address || '',
          name: community.name,
          description: community.description || '',
          creatorAddress: community.creator_address,
          isHidden: community.is_hidden,
          blocktimestamp: new Date(Number(community.blocktimestamp.toString())),
          totalBadges: community.total_badges,
          totalMembers: membersCount,
          managers: managers.map(manager => manager.user_address),
        };
      })
    );
  }

  async findOne(communityAddress: string): Promise<CreateCommunityDto> {
    const community = await this.prisma.community.findFirst({
      where: {
        community_address: communityAddress,
      }
    });

    if (!community) {
      throw new NotFoundException(
        `Community with contract address ${communityAddress} not found`,
      );
    }

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

    return {
      communityAddress: community.community_address,
      factoryAddress: community.factory_address || '',
      name: community.name,
      description: community.description || '',
      creatorAddress: community.creator_address,
      isHidden: community.is_hidden,
      blocktimestamp: new Date(Number(community.blocktimestamp.toString())),
      totalBadges: community.total_badges,
      totalMembers: membersCount,
      managers: managers.map(manager => manager.user_address),
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

    return members.map(member => ({
      userAddress: member.user_address,
      isManager: member.is_manager,
      isCreator: member.is_creator,
      communityAddress: member.community_address,
      points: member.points,
      lastIndexedAt: new Date(Number(member.last_indexed_at.toString())),
    }));
  }

  async findBadges(communityAddress: string) {
    const badges = await this.prisma.badge.findMany({
      where: {
        community_address: communityAddress
      }
    });

    if (!badges.length) {
      throw new NotFoundException(
        `No badges found for community ${communityAddress}`
      );
    }

    return badges.map(badge => ({
      issuer: badge.issuer,
      communityAddress: badge.community_address,
      name: badge.name,
      score: badge.score,
      type: badge.type,
      createdAt: badge.created_at ? new Date(Number(badge.created_at.toString())) : undefined,
      removedAt: badge.removed_at ? new Date(Number(badge.removed_at.toString())) : undefined,
    }));
  }

  async findCreatedCommunities(userAddress: string) {
    const communities = await this.prisma.community.findMany({
      where: {
        creator_address: userAddress
      }
    });

    return communities;
  }
  async findHiddenCommunities(userAddress: string) {
    const communities = await this.prisma.community.findMany({
      where: {
        creator_address: userAddress,
        is_hidden: true
      }
    });

    return communities;
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

    const communities = await this.prisma.community.findMany({
      where: {
        community_address: {
          in: communitiesAddresses.map(community => community.community_address)
        }
      }
    });
    return communities;
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
      userAddress: badge.user_address,
      issuer: badge.issuer,
      communityAddress: badge.community_address,
      name: badge.name,
      createdAt: badge.created_at ? new Date(Number(badge.created_at.toString())) : undefined,
      badgeId: badge.badge_id,
      communityId: badge.community_id,
      communityMemberId: badge.community_member_id,
    }));
  }

}