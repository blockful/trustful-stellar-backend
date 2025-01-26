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
}
