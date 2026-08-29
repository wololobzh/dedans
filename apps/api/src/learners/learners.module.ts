import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createPrismaClient } from '@school-erp/database';
import { LearnersController } from './learners.controller';

const prisma = createPrismaClient();

@Module({
  controllers: [LearnersController],
  providers: [
    {
      provide: PrismaClient,
      useValue: prisma,
    },
  ],
})
export class LearnersModule {}
