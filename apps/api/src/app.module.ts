import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { LearnersModule } from './learners/learners.module';
import { CohortsModule } from './cohorts/cohorts.module';
import { ProgramsModule } from './programs/programs.module';

@Module({
  imports: [LearnersModule, CohortsModule, ProgramsModule],
  controllers: [HealthController],
})
export class AppModule {}
