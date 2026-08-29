import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { CampusesModule } from './campuses/campuses.module';
import { LearnersModule } from './learners/learners.module';
import { CohortsModule } from './cohorts/cohorts.module';
import { ProgramsModule } from './programs/programs.module';

@Module({
  imports: [CampusesModule, LearnersModule, CohortsModule, ProgramsModule],
  controllers: [HealthController],
})
export class AppModule {}
