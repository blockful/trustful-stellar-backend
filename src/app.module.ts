import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommunitiesModule } from './communities/communities.module';
import { BadgesModule } from './badges/badges.module';

@Module({
  imports: [CommunitiesModule, BadgesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
