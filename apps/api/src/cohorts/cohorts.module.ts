import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createPrismaClient } from '@school-erp/database';
import { CohortsController } from './cohorts.controller';

const prisma = createPrismaClient();

@Module({
  controllers: [CohortsController],
  providers: [
    {
      provide: PrismaClient,
      useValue: prisma,
    },
  ],
})
export class CohortsModule {}
