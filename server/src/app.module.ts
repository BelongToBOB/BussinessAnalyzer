import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    PrismaModule,
    AuthModule,
    BusinessModule,
    EntriesModule,
    ExpenseMapModule,
    SessionsModule,
    AdminModule,
  ],
})
export class AppModule {}
