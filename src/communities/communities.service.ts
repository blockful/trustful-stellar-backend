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
      contractAddress: community.contractAddress,
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

  async findOne(contractAddress: string): Promise<CreateCommunityDto> {
    const community = await this.prisma.community.findUnique({
      where: {
        contractAddress,
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
        `Community with contract address ${contractAddress} not found`,
      );
    }

    return {
      contractAddress: community.contractAddress,
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
    contractAddress: string,
    isHidden: boolean,
  ): Promise<CreateCommunityDto> {
    try {
      const updatedCommunity = await this.prisma.community.update({
        where: {
          contractAddress,
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
        contractAddress: updatedCommunity.contractAddress,
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
          `Community with address ${contractAddress} not found`,
        );
      }
      throw error;
    }
  }

  async findMembers(contractAddress: string) {
    const members = await this.prisma.communityMember.findMany({
      where: {
        contractAddress: contractAddress
      },
      include: {
        user: true
      }
    });

    if (!members.length) {
      throw new NotFoundException(
        `No members found for community ${contractAddress}`
      );
    }

    return members;
  }

  async findBadges(contractAddress: string) {
    const badges = await this.prisma.badge.findMany({
      where: {
        contractAddress: contractAddress
      }
    });

    if (!badges.length) {
      throw new NotFoundException(
        `No badges found for community ${contractAddress}`
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
}
