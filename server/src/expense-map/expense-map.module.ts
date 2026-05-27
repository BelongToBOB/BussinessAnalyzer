import { Module } from '@nestjs/common';
import { ExpenseMapController } from './expense-map.controller';
import { ExpenseMapService } from './expense-map.service';

@Module({
  controllers: [ExpenseMapController],
  providers: [ExpenseMapService],
})
export class ExpenseMapModule {}
