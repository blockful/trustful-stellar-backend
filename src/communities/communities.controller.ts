import { Controller, Get } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all communities' })
  @ApiResponse({
    status: 200,
    description: 'List of all communities with their details',
    type: [CreateCommunityDto],
  })
  @Get()
  async findAll(): Promise<CreateCommunityDto[]> {
    return this.communitiesService.findAll();
  }
}
