import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { BusinessModule } from './business/business.module';
import { EntriesModule } from './entries/entries.module';

@Module({
  imports: [PrismaModule, BusinessModule, EntriesModule],
})
export class AppModule {}
