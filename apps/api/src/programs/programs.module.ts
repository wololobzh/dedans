import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createPrismaClient } from '@school-erp/database';
import { ProgramsController } from './programs.controller';

const prisma = createPrismaClient();

@Module({
  controllers: [ProgramsController],
  providers: [
    {
      provide: PrismaClient,
      useValue: prisma,
    },
  ],
})
export class ProgramsModule {}
