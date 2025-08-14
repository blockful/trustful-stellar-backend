import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommunityDto } from './dto/create-community.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CommunitiesRepository } from './repository/communities.repository';

@Injectable()
export class CommunitiesService {
  constructor(
    private prisma: PrismaService,
    private communitiesRepository: CommunitiesRepository
  ) { }

  async findAll(userAddress?: string): Promise<CreateCommunityDto[]> {
    const communities = await this.prisma.community.findMany({
      where: {
        is_hidden: false,
      },
      orderBy: {
        last_indexed_at: 'desc'
      }
    });

    const latestCommunities = await this.communitiesRepository.getLatestCommunities(communities);

    return Promise.all(
      latestCommunities.map(async (community) => {
        const membersCount = await this.communitiesRepository.countValidCommunityMembers(community.community_address);
        
        const validMembers = await this.communitiesRepository.getValidCommunityMembers(community.community_address);
        
        const managers = validMembers.filter(member => member.is_manager);
        let is_joined = false;
        
        if (userAddress) {
          const userMembership = validMembers.find(
            member => member.user_address.toLowerCase() === userAddress.toLowerCase()
          );
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
    
    const community = communities[0];
    const membersCount = await this.communitiesRepository.countValidCommunityMembers(communityAddress);
    const validMembers = await this.communitiesRepository.getValidCommunityMembers(communityAddress);
    
    const managers = validMembers.filter(member => member.is_manager);
    let is_joined = false;
    
    if (userAddress) {
      const userMembership = validMembers.find(
        member => member.user_address.toLowerCase() === userAddress.toLowerCase()
      );
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
    const validMembers = await this.communitiesRepository.getValidCommunityMembers(communityAddress);

    if (!validMembers.length) {
      throw new NotFoundException(
        `No members found for community ${communityAddress}`
      );
    }
    
    validMembers.sort((a, b) => b.points - a.points);
    
    return Promise.all(validMembers.map(async member => ({
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

    const latestBadges = await this.communitiesRepository.getLatestBadges(badges);
    
    // Filter out badges that have been removed
    const activeBadges = latestBadges.filter(badge => !badge.removed_at);

    const mappedBadges = activeBadges.map(badge => ({
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
        total_badges: activeBadges.length,
        community_badges: mappedBadges
      };
    }

    return { total_badges: activeBadges.length, community_badges: mappedBadges };
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

    return this.communitiesRepository.getLatestCommunities(communities);
  }

  async findManagedCommunities(userAddress: string) {
    const managedCommunityAddresses = await this.communitiesRepository.getCommunitiesWhereUserIsManager(userAddress);
    
    if (!managedCommunityAddresses.length) {
      return [];
    }

    const communities = await this.prisma.community.findMany({
      where: {
        community_address: {
          in: managedCommunityAddresses
        }
      },
      orderBy: {
        last_indexed_at: 'desc'
      }
    });

    return this.communitiesRepository.getLatestCommunities(communities);
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

    return this.communitiesRepository.getLatestCommunities(communities);
  }

  async findJoinnedCommunities(userAddress: string) {
    const validMemberships = await this.communitiesRepository.getValidUserMemberships(userAddress);
    
    const uniqueCommunities = new Map<string, string>();
    const latestMemberships = [];
    
    for (const membership of validMemberships) {
      if (!uniqueCommunities.has(membership.community_address)) {
        uniqueCommunities.set(membership.community_address, membership.community_address);
        latestMemberships.push(membership);
      }
    }
    
    const communityAddresses = latestMemberships.map(m => m.community_address);

    const badges_by_community = new Map<string, number>();
    const points_by_community = new Map<string, number>();

    for (const communityAddress of communityAddresses) {
      const { badges_count, points } = await this.getUsersBadgeNumberAndPoints(userAddress, communityAddress);
      badges_by_community.set(communityAddress, badges_count);
      points_by_community.set(communityAddress, points);
    }

    const communities = await this.prisma.community.findMany({
      where: {
        community_address: {
          in: communityAddresses
        }
      },
      orderBy: {
        last_indexed_at: 'desc'
      }
    });

    const latestCommunities = await this.communitiesRepository.getLatestCommunities(communities);

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
    
    const validMember = await this.communitiesRepository.getValidUserMemberInCommunity(userAddress, community_address);
    
    return { 
      badges_count: user_badges.length, 
      points: validMember?.points || 0 
    };
  }
}