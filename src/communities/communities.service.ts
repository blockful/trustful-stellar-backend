import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommunityDto } from './dto/create-community.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) { }

  async findAll(): Promise<CreateCommunityDto[]> {
    const communities = await this.prisma.community.findMany({
      where: {
        is_hidden: false
      },
      include: {
        members: {
          orderBy: {
            last_score_update: 'desc'
          }
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    // Group by ID and take the latest entry for each ID
    const latestCommunities = Object.values(
      communities.reduce((acc, community) => {
        // Only keep the first (latest) occurrence of each ID
        if (!acc[community.id]) {
          acc[community.id] = community;
        }
        return acc;
      }, {} as Record<string, typeof communities[0]>)
    );

    return latestCommunities.map(community => ({
      id: community.id,
      name: community.name,
      description: community.description || '',
      issuer: community.issuer,
      isHidden: community.is_hidden,
      totalMembers: community.members.length,
      managers: []
    }));
  }

  // TODO: Add creator_addres and total_badges and managers
  async findOne(communityId: string): Promise<CreateCommunityDto> {

    const community = await this.prisma.community.findUnique({
      where: {
        id: communityId
      },
      include: {
        members: true
      }
    });

    if (!community) {
      throw new NotFoundException(`Community with ID ${communityId} not found`);
    }

    return {
      id: community.id,
      name: community.name,
      description: community.description || '',
      issuer: community.issuer,
      isHidden: community.is_hidden,
      totalMembers: community.members.length,
      managers: [] // community.members.filter(member => member.is_manager).map(member => member.user_id)
    };
  }

  async updateVisibility(
    communityId: string,
    isHidden: boolean,
  ): Promise<CreateCommunityDto> {
    try {
      const updatedCommunity = await this.prisma.community.update({
        where: {
          id: communityId,
        },
        data: {
          is_hidden: isHidden,
        },
        include: {
          members: true
        },
      });

      //TODO: missing the community_creator, total_badges and manaagers
      return {
        id: updatedCommunity.id,
        issuer: updatedCommunity.issuer,
        name: updatedCommunity.name,
        description: updatedCommunity.description || '',
        totalMembers: updatedCommunity.members.length,
        isHidden: updatedCommunity.is_hidden, 
        managers: []
      };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(
          `Community with ID ${communityId} not found`,
        );
      }
      throw error;
    }
  }

  async findMembers(communityId: string) {
    const members = await this.prisma.communityMember.findMany({
      where: {
        community_id: communityId,
      },
      orderBy: {
        score: 'desc',
      },
    });

    if (!members.length) {
      throw new NotFoundException(
        `No members found for community ${communityId}`
      );
    }

    return members;
  }

  // async findBadges(communityAddress: string) {
  //   const badges = await this.prisma.badge.findMany({
  //     where: {
  //       communityAddress: communityAddress
  //     }
  //   });

  //   if (!badges.length) {
  //     throw new NotFoundException(
  //       `No badges found for community ${communityAddress}`
  //     );
  //   }

  //   return badges;
  // }

  // async findCreatedCommunities(userAddress: string) {
  //   const communities = await this.prisma.community.findMany({
  //     where: {
  //       creatorAddress: userAddress
  //     }
  //   });

  //   return communities;
  // }
  // async findHiddenCommunities(userAddress: string) {
  //   const communities = await this.prisma.community.findMany({
  //     where: {
  //       creatorAddress: userAddress,
  //       isHidden: true
  //     }
  //   });

  //   return communities;
  // }

  async findJoinnedCommunities(userAddress: string) {
    const communitiesAddresses = await this.prisma.communityMember.findMany({
      where: {
        user_id: userAddress
      },
      select: {
        community_id: true
      }
    });

    const communities = await this.prisma.community.findMany({
      where: {
        id: {
          in: communitiesAddresses.map(community => community.community_id)
        }
      },
      orderBy: {
        id: 'desc'
      }
    });

    // Group by ID and take the latest entry for each ID, excluding hidden communities
    const latestCommunities = Object.values(
      communities.reduce((acc, community) => {
        // Only keep non-hidden communities and first occurrence of each ID
        if (!community.is_hidden && !acc[community.id]) {
          acc[community.id] = community;
        }
        return acc;
      }, {} as Record<string, typeof communities[0]>)
    );

    return latestCommunities;
  }

}