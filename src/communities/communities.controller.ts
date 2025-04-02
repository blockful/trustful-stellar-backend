import {
  Controller,
  Patch,
  Param,
  Body,
  NotFoundException,
  Get,
  Query,
} from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UpdateHiddenStatusDto } from './dto/update-hidden-status.dto';
import { BadgeDto } from './dto/badge.dto';
import { toLowerCaseAddress } from '../utils/address.utils';

@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get all communities',
    description: `
    Retrieves a list of all visible communities in the network.
    Hidden communities are excluded from the results.
    Results are ordered by creation date (newest first).
    If user_address is provided, each community will include an is_joined field indicating if the user is a member.
    `
  })
  @ApiQuery({
    name: 'user_address',
    required: false,
    description: 'Stellar address of the user to check membership status'
  })
  @ApiResponse({
    status: 200,
    description: 'List of communities retrieved successfully',
    type: [CreateCommunityDto],
    content: {
      'application/json': {
        example: [{
          community_address: 'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAAAAAAAAAAAAAAAA',
          factory_address: 'CCYDNAOVWSHZUHDMXBPXKPOHQW4FH44P26NGVFAYUNPWPUNWPSXAPBAAAAAAAAAAAAAAA',
          name: 'Stellar Developers Community',
          description: 'A community for Stellar blockchain developers',
          creator_address: 'GBVNNPOFVV2YNXSQXDJPBVQYY7WJLHGPMLXZLHBZ3Y6HLKXQGFBPBZRY',
          is_hidden: false,
          blocktimestamp: '2024-01-23T12:00:00Z',
          total_badges: 5,
          total_members: 150,
          managers: [
            'GDUMR3GDVKYMABGVOQHVKNWMXHVYKZLTWWQZCDZV7GZVWPJVJAXKHXFX'
          ],
          is_joined: true
        }]
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(@Query('user_address') user_address?: string): Promise<CreateCommunityDto[]> {
    return this.communitiesService.findAll(user_address ? toLowerCaseAddress(user_address) : undefined);
  }

  @Get(':community_address')
  @ApiOperation({
    summary: 'Get community details',
    description: `
    Retrieves detailed information about a specific community.
    Includes member count, manager list, and other community details.
    If user_address is provided, the response will include an is_joined field indicating if the user is a member.
    `
  })
  @ApiParam({
    name: 'community_address',
    description: 'Soroban contract address of the community',
    example: 'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAAAAAAAAAAAAAAAA',
    required: true
  })
  @ApiQuery({
    name: 'user_address',
    required: false,
    description: 'Stellar address of the user to check membership status'
  })
  @ApiResponse({
    status: 200,
    description: 'Community details retrieved successfully',
    type: CreateCommunityDto,
    content: {
      'application/json': {
        example: [{
          community_address: 'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAAAAAAAAAAAAAAAA',
          factory_address: 'CCYDNAOVWSHZUHDMXBPXKPOHQW4FH44P26NGVFAYUNPWPUNWPSXAPBAAAAAAAAAAAAAAA',
          name: 'Stellar Developers Community',
          description: 'A community for Stellar blockchain developers',
          creator_address: 'GBVNNPOFVV2YNXSQXDJPBVQYY7WJLHGPMLXZLHBZ3Y6HLKXQGFBPBZRY',
          is_hidden: false,
          blocktimestamp: '2024-01-23T12:00:00Z',
          total_badges: 5,
          total_members: 150,
          managers: [
            'GDUMR3GDVKYMABGVOQHVKNWMXHVYKZLTWWQZCDZV7GZVWPJVJAXKHXFX'
          ],
          is_joined: true
        }]
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Community not found',
    content: {
      'application/json': {
        example: {
          statusCode: 404,
          message: 'Community not found',
          error: 'Not Found'
        }
      }
    }
  })
  async findOne(
    @Param('community_address') community_address: string,
    @Query('user_address') user_address?: string,
  ): Promise<CreateCommunityDto> {
    const community = await this.communitiesService.findOne(
      toLowerCaseAddress(community_address),
      user_address ? toLowerCaseAddress(user_address) : undefined
    );
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    return community;
  }

  @Patch(':community_address/visibility')
  @ApiOperation({
    summary: 'Update community visibility',
    description: `
    Updates the visibility status of a specific community.
    Hidden communities will not appear in the general listing.
    Only authorized managers can perform this operation.
    `
  })
  @ApiParam({
    name: 'community_address',
    required: true,
    description: 'Soroban contract address of the community to update'
  })
  @ApiResponse({
    status: 200,
    description: 'Community visibility updated successfully',
    content: {
      'application/json': {
        example: {
          community_address: 'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAAAAAAAAAAAAAAAA',
          is_hidden: true,
        }
      }
    }
  })
  async updateVisibility(
    @Param('community_address') community_address: string,
    @Body() updateHiddenStatusDto: UpdateHiddenStatusDto,
  ): Promise<CreateCommunityDto> {
    const updatedCommunity = await this.communitiesService.updateVisibility(
      toLowerCaseAddress(community_address),
      updateHiddenStatusDto.is_hidden,
    );

    if (!updatedCommunity) {
      throw new NotFoundException('Community not found');
    }

    return updatedCommunity;
  }

  @Get(':community_address/members')
  @ApiOperation({
    summary: 'Get community members',
    description: 'Retrieves all members of a specific community'
  })
  async getMembers(@Param('community_address') community_address: string) {
    return this.communitiesService.findMembers(toLowerCaseAddress(community_address));
  }

  @Get(':community_address/badges')
  @ApiOperation({
    summary: 'Get community badges',
    description: 'Retrieves all badges from a specific community'
  })
  @ApiResponse({
    status: 200,
    description: 'List of badges retrieved successfully',
    type: [BadgeDto]
  })
  @ApiQuery({
    name: 'user_address',
    required: false,
    description: 'Stellar address of the user to check membership status'
  })
  async findBadges(
    @Param('community_address') community_address: string,
    @Query('user_address') user_address?: string
  ) {
    return this.communitiesService.findBadges(
      toLowerCaseAddress(community_address),
      user_address ? toLowerCaseAddress(user_address) : undefined
    );
  }

  @Get('created/:user_address')
  @ApiOperation({
    summary: 'Get created communities',
    description: 'Retrieves all communities created by a specific user'
  })
  async getCreatedCommunities(@Param('user_address') user_address: string) {
    return this.communitiesService.findCreatedCommunities(toLowerCaseAddress(user_address));
  }

  @Get('hidden/:user_address')
  @ApiOperation({
    summary: 'Get hidden communities',
    description: 'Retrieves all hidden communities for a specific user'
  })
  async getHiddenCommunities(@Param('user_address') user_address: string) {
    return this.communitiesService.findHiddenCommunities(toLowerCaseAddress(user_address));
  }

  @Get('joined/:user_address')
  @ApiOperation({
    summary: 'Get joined communities',
    description: 'Retrieves all communities that a specific user has joined'
  })
  async getJoinedCommunities(@Param('user_address') user_address: string) {
    return this.communitiesService.findJoinnedCommunities(toLowerCaseAddress(user_address));
  }
}
