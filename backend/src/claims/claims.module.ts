import { Module } from '@nestjs/common';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAIService } from '../openai/openai.service';

@Module({
  controllers: [ClaimsController],
  providers: [ClaimsService, PrismaService, OpenAIService],
})
export class ClaimsModule {}
