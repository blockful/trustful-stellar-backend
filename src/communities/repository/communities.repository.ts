import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Community, Badge } from '@prisma/client';

@Injectable()
export class CommunitiesRepository {
  constructor(private prisma: PrismaService) {}

  async getLatestCommunities(communities: Community[]): Promise<Community[]> {
    if (communities.length === 0) {
      return [];
    }
    const communityAddresses = [...new Set(communities.map(community => community.community_address))];
    const latestCommunities = await this.prisma.$queryRawUnsafe<Community[]>(`
      SELECT 
        id, community_address, factory_address, name, description, icon,
        creator_address, is_hidden, blocktimestamp, total_badges, last_indexed_at, _id,
        _block_range::text as block_range_text
      FROM communities 
      WHERE community_address IN (${communityAddresses.map(addr => `'${addr}'`).join(',')})
      AND upper_inf(_block_range) = true
    `);
    
    return latestCommunities || [];
  }

  async getLatestBadges(badges: Badge[]): Promise<Badge[]> {
    if (badges.length === 0) {
      return [];
    }
    const badgeIdentifiers = badges.map(badge => ({
      name: badge.name,
      issuer: badge.issuer,
      community_address: badge.community_address
    }));
    const latestBadges: Badge[] = [];
    for (const badge of badgeIdentifiers) {
      const result = await this.prisma.$queryRawUnsafe<Badge[]>(`
        SELECT 
          id, issuer, community_address, name, score, type,
          created_at, removed_at, community_id, _id,
          _block_range::text as block_range_text
        FROM badges 
        WHERE name = '${badge.name.replace(/'/g, "''")}'
        AND issuer = '${badge.issuer}'
        AND community_address = '${badge.community_address}'
        AND upper_inf(_block_range) = true
      `);
      
      if (result && result.length > 0) {
        latestBadges.push(result[0]);
      }
    }
    
    return latestBadges;
  }

  async getLatestCommunityMembers(members: any[]): Promise<any[]> {
    if (members.length === 0) {
      return [];
    }
    const userAddresses = [...new Set(members.map(member => member.user_address))];
    const communityAddress = members[0].community_address;
    const latestMembers = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id, user_address, is_manager, is_creator, community_address, 
        last_indexed_at, points, user_id, community_id, _id,
        _block_range::text as block_range_text
      FROM community_members 
      WHERE user_address IN (${userAddresses.map(addr => `'${addr}'`).join(',')})
      AND community_address = '${communityAddress}'
      AND upper_inf(_block_range) = true
    `);
    
    return latestMembers || [];
  }

  async countValidCommunityMembers(communityAddress: string): Promise<number> {
    const result = await this.prisma.$queryRawUnsafe<[{count: string}]>(`
      SELECT COUNT(*) as count 
      FROM community_members 
      WHERE community_address = '${communityAddress}'
      AND upper_inf(_block_range) = true
      AND is_member = true
    `);
    
    return Number(result[0].count);
  }

  async getValidCommunityMembers(communityAddress: string): Promise<any[]> {
    const validMembers = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id, user_address, is_manager, is_creator, community_address, 
        last_indexed_at, points, user_id, community_id, _id, is_member,
        _block_range::text as block_range_text
      FROM community_members 
      WHERE community_address = '${communityAddress}'
      AND upper_inf(_block_range) = true
      AND is_member = true
      ORDER BY last_indexed_at DESC
    `);
    
    return validMembers || [];
  }

  async getValidUserMemberships(userAddress: string): Promise<any[]> {
    const validMemberships = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id, user_address, is_manager, is_creator, community_address, 
        last_indexed_at, points, user_id, community_id, _id, is_member,
        _block_range::text as block_range_text
      FROM community_members 
      WHERE user_address = '${userAddress}'
      AND upper_inf(_block_range) = true
      AND is_member = true
      ORDER BY last_indexed_at DESC
    `);
    
    return validMemberships || [];
  }

  async getValidUserMemberInCommunity(userAddress: string, communityAddress: string): Promise<any | null> {
    const validMember = await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id, user_address, is_manager, is_creator, community_address, 
        last_indexed_at, points, user_id, community_id, _id, is_member,
        _block_range::text as block_range_text
      FROM community_members 
      WHERE user_address = '${userAddress}'
      AND community_address = '${communityAddress}'
      AND upper_inf(_block_range) = true
      AND is_member = true
      ORDER BY last_indexed_at DESC
      LIMIT 1
    `);
    
    return validMember && validMember.length > 0 ? validMember[0] : null;
  }

  async getCommunitiesWhereUserIsManager(userAddress: string): Promise<string[]> {
    const result = await this.prisma.$queryRawUnsafe<{community_address: string}[]>(`
      SELECT DISTINCT community_address 
      FROM community_members 
      WHERE user_address = '${userAddress}'
      AND is_manager = true
      AND upper_inf(_block_range) = true
      AND is_member = true
      ORDER BY community_address
    `);
    
    return result.map(r => r.community_address);
  }
} 