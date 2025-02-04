import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommunityDto } from './dto/create-community.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<CreateCommunityDto[]> {
    const communities = await this.prisma.community.findMany({
      include: {
        _count: {
          select: {
            members: true,
          },
        },

        managers: {
          select: {
            managerAddress: true,
          },
        },
      },
      where: {
        isHidden: false,
      },
    });

    // Transform the data to match our DTO
    return communities.map((community) => ({
      communityAddress: community.communityAddress,
      factoryAddress: community.factoryAddress,
      name: community.name,
      description: community.description,
      creatorAddress: community.creatorAddress,
      isHidden: community.isHidden,
      blocktimestamp: community.blocktimestamp,
      totalBadges: community.totalBadges,
      totalMembers: community._count.members,
      managers: community.managers.map((manager) => manager.managerAddress),
    }));
  }

  async findOne(communityAddress: string): Promise<CreateCommunityDto> {
    const community = await this.prisma.community.findUnique({
      where: {
        communityAddress,
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
        managers: {
          select: {
            managerAddress: true,
          },
        },
      },
    });

    if (!community) {
      throw new NotFoundException(
          `Community with contract address ${communityAddress} not found`,
      );
    }

    return {
      communityAddress: community.communityAddress,
      factoryAddress: community.factoryAddress,
      name: community.name,
      description: community.description,
      creatorAddress: community.creatorAddress,
      isHidden: community.isHidden,
      blocktimestamp: community.blocktimestamp,
      totalBadges: community.totalBadges,
      totalMembers: community._count.members,
      managers: community.managers.map((manager) => manager.managerAddress),
    };
  }

  async updateVisibility(
    communityAddress: string,
    isHidden: boolean,
  ): Promise<CreateCommunityDto> {
    try {
      const updatedCommunity = await this.prisma.community.update({
        where: {
          communityAddress,
        },
        data: {
          isHidden,
        },
        include: {
          _count: {
            select: {
              members: true,
            },
          },
          managers: {
            select: {
              managerAddress: true,
            },
          },
        },
      });

      return {
        communityAddress: updatedCommunity.communityAddress,
        factoryAddress: updatedCommunity.factoryAddress,
        name: updatedCommunity.name,
        description: updatedCommunity.description,
        creatorAddress: updatedCommunity.creatorAddress,
        isHidden: updatedCommunity.isHidden,
        blocktimestamp: updatedCommunity.blocktimestamp,
        totalBadges: updatedCommunity.totalBadges,
        totalMembers: updatedCommunity._count.members,
        managers: updatedCommunity.managers.map(
          (manager) => manager.managerAddress,
        ),
      };
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
        communityAddress: communityAddress
      },
      include: {
        user: true
      }
    });

    if (!members.length) {
      throw new NotFoundException(
          `No members found for community ${communityAddress}`
      );
    }

    return members;
  }

  async findBadges(communityAddress: string) {
    const badges = await this.prisma.badge.findMany({
      where: {
        communityAddress: communityAddress
      }
    });

    if (!badges.length) {
      throw new NotFoundException(
          `No badges found for community ${communityAddress}`
      );
    }

    return badges;
  }

  async findCreatedCommunities(userAddress: string) {
    const communities = await this.prisma.community.findMany({
      where: {
        creatorAddress: userAddress
      }
    });

    return communities;
  }
  async findHiddenCommunities(userAddress: string) {
    const communities = await this.prisma.community.findMany({
      where: {
        creatorAddress: userAddress,
        isHidden: true
      }
    });

    return communities;
  }

  async findJoinnedCommunities(userAddress: string) {
    const communitiesAddresses = await this.prisma.communityMember.findMany({
      where: {
        userAddress: userAddress
      },
      select: {
        communityAddress: true
      }
    });

    const communities = await this.prisma.community.findMany({
      where: {
        communityAddress: {
          in: communitiesAddresses.map(community => community.communityAddress)
        }
      }
    });
    return communities;
  } 

}