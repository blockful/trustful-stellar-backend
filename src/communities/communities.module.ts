import { Module } from '@nestjs/common';
import { CommunitiesService } from './communities.service';
import { CommunitiesController } from './communities.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunitiesRepository } from './repository/communities.repository';

@Module({
  imports: [PrismaModule],
  controllers: [CommunitiesController],
  providers: [CommunitiesService, CommunitiesRepository],
})
export class CommunitiesModule {}
