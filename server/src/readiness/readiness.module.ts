import { Module } from '@nestjs/common';
import { ReadinessController } from './readiness.controller';
import { ReadinessService } from './readiness.service';
import { WinBankService } from './winbank.service';
import { ConfigLoaderService } from './engine/config-loader.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReadinessController],
  providers: [ReadinessService, WinBankService, ConfigLoaderService],
})
export class ReadinessModule {}
