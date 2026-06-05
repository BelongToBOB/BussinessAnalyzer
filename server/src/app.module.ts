import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BusinessModule } from './business/business.module';
import { EntriesModule } from './entries/entries.module';
import { ExpenseMapModule } from './expense-map/expense-map.module';
import { SessionsModule } from './sessions/sessions.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Global rate limit: 100 requests per 15 minutes per IP
    ThrottlerModule.forRoot([{ ttl: 900000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    BusinessModule,
    EntriesModule,
    ExpenseMapModule,
    SessionsModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
