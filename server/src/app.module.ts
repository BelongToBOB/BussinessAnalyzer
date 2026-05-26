import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BusinessModule } from './business/business.module';
import { EntriesModule } from './entries/entries.module';

@Module({
  imports: [PrismaModule, AuthModule, BusinessModule, EntriesModule],
})
export class AppModule {}
