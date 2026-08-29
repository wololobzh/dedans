import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { CampusesModule } from './campuses/campuses.module';

@Module({
  imports: [CampusesModule],
  controllers: [HealthController],
})
export class AppModule {}
