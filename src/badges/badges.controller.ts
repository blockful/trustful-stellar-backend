import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BadgeDto } from './dto/badge.dto';
import { toLowerCaseAddress } from '../utils/address.utils';

@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get(':type')
  @ApiOperation({
    summary: 'Get badges by type',
    description: 'Retrieves all badges of a specific type'
  })
  @ApiResponse({
    status: 200,
    description: 'List of badges retrieved successfully',
    type: [BadgeDto]
  })
  async getBadgesByType(@Param('type') type: string) {
    return this.badgesService.findBadgesByType(type);
  }

  @Get('users/:user_address/communities/:community_address/badges')
  @ApiOperation({
    summary: 'Get user badges in a community',
    description: 'Retrieves all badges that a user has in a specific community'
  })
  @ApiResponse({
    status: 200,
    description: 'List of badges retrieved successfully',
    type: [BadgeDto]
  })
  async getUserCommunityBadges(
    @Param('user_address') user_address: String,
    @Param('community_address') community_address: String
  ) {
    return this.badgesService.returnCommunityBadgesThatTheUserHas(
      toLowerCaseAddress(user_address.toString()),
      toLowerCaseAddress(community_address.toString())
    );
  }
}
