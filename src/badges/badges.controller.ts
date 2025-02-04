import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BadgeDto } from '../communities/dto/badge.dto';

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

  @Patch('/create')
  async createBadge(@Body() badgeDto: BadgeDto) {
    return this.badgesService.createBadge(badgeDto);
  }
}
