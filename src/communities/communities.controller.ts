import {
  Controller,
  Patch,
  Param,
  Body,
  NotFoundException,
  Get,
} from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UpdateHiddenStatusDto } from './dto/update-hidden-status.dto';
import { BadgeDto } from './dto/badge.dto';

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
    `
  })
  @ApiResponse({
    status: 200,
    description: 'List of communities retrieved successfully',
    type: [CreateCommunityDto],
    content: {
      'application/json': {
        example: [{
          contractAddress: 'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAAAAAAAAAAAAAAAA',
          factoryAddress: 'CCYDNAOVWSHZUHDMXBPXKPOHQW4FH44P26NGVFAYUNPWPUNWPSXAPBAAAAAAAAAAAAAAA',
          name: 'Stellar Developers Community',
          description: 'A community for Stellar blockchain developers',
          creatorAddress: 'GBVNNPOFVV2YNXSQXDJPBVQYY7WJLHGPMLXZLHBZ3Y6HLKXQGFBPBZRY',
          isHidden: false,
          blocktimestamp: '2024-01-23T12:00:00Z',
          totalBadges: 5,
          totalMembers: 150,
          managers: [
            'GDUMR3GDVKYMABGVOQHVKNWMXHVYKZLTWWQZCDZV7GZVWPJVJAXKHXFX'
          ]
        }]
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findAll(): Promise<CreateCommunityDto[]> {
    return this.communitiesService.findAll();
  }

  @Get(':contractAddress')
  @ApiOperation({
    summary: 'Get community details',
    description: `
    Retrieves detailed information about a specific community.
    Includes member count, manager list, and other community details.
    `
  })
  @ApiParam({
    name: 'contractAddress',
    description: 'Soroban contract address of the community',
    example: 'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAAAAAAAAAAAAAAAA',
    required: true
  })
  @ApiResponse({
    status: 200,
    description: 'Community details retrieved successfully',
    type: CreateCommunityDto,
    content: {
      'application/json': {
        example: [{
          contractAddress: 'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAAAAAAAAAAAAAAAA',
          factoryAddress: 'CCYDNAOVWSHZUHDMXBPXKPOHQW4FH44P26NGVFAYUNPWPUNWPSXAPBAAAAAAAAAAAAAAA',
          name: 'Stellar Developers Community',
          description: 'A community for Stellar blockchain developers',
          creatorAddress: 'GBVNNPOFVV2YNXSQXDJPBVQYY7WJLHGPMLXZLHBZ3Y6HLKXQGFBPBZRY',
          isHidden: false,
          blocktimestamp: '2024-01-23T12:00:00Z',
          totalBadges: 5,
          totalMembers: 150,
          managers: [
            'GDUMR3GDVKYMABGVOQHVKNWMXHVYKZLTWWQZCDZV7GZVWPJVJAXKHXFX'
          ]
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
    @Param('contractAddress') contractAddress: string,
  ): Promise<CreateCommunityDto> {
    const community = await this.communitiesService.findOne(contractAddress);
    if (!community) {
      throw new NotFoundException('Community not found');
    }
    return community;
  }

  @Patch(':contractAddress/visibility')
  @ApiOperation({
    summary: 'Update community visibility',
    description: `
    Updates the visibility status of a specific community.
    Hidden communities will not appear in the general listing.
    Only authorized managers can perform this operation.
    `
  })
  @ApiParam({
    name: 'contractAddress',
    required: true,
    description: 'Soroban contract address of the community to update'
  })
  @ApiResponse({
    status: 200,
    description: 'Community visibility updated successfully',
    content: {
      'application/json': {
        example: {
          contractAddress: 'CB5DQK6DDWRJHPWJHYPQGFK4F4K7YZHX7IHT6I4ICO4PVIFQB4RQAAAAAAAAAAAAAAAA',
          isHidden: true,
        }
      }
    }
  })
  async updateVisibility(
    @Param('contractAddress') contractAddress: string,
    @Body() updateHiddenStatusDto: UpdateHiddenStatusDto,
  ): Promise<CreateCommunityDto> {
    const updatedCommunity = await this.communitiesService.updateVisibility(
      contractAddress,
      updateHiddenStatusDto.isHidden,
    );

    if (!updatedCommunity) {
      throw new NotFoundException('Community not found');
    }

    return updatedCommunity;
  }

  @Get(':contractAddress/members')
  @ApiOperation({
    summary: 'Get community members',
    description: 'Retrieves all members of a specific community'
  })
  async getMembers(@Param('contractAddress') contractAddress: string) {
    return this.communitiesService.findMembers(contractAddress);
  }

  @Get(':contractAddress/badges')
  @ApiOperation({
    summary: 'Get community badges',
    description: 'Retrieves all badges from a specific community'
  })
  @ApiResponse({
    status: 200,
    description: 'List of badges retrieved successfully',
    type: [BadgeDto]
  })
  async getBadges(@Param('contractAddress') contractAddress: string) {
    return this.communitiesService.findBadges(contractAddress);
  }
}
