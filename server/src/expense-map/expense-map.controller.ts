import { Controller, Get, Post, Put, Delete, Body, Param, Req } from '@nestjs/common';
import * as express from 'express';
import { ExpenseMapService } from './expense-map.service';
import { getUserId } from '../common/get-user-id';

@Controller('api/expense-map')
export class ExpenseMapController {
  constructor(private expenseMap: ExpenseMapService) {}

  // ─── Items ─────────────────────────────

  @Get('items')
  getItems(@Req() req: express.Request) {
    return this.expenseMap.getItems(getUserId(req));
  }

  @Post('items')
  createItem(@Req() req: express.Request, @Body() body: any) {
    return this.expenseMap.upsertItem(getUserId(req), body);
  }

  @Put('items/:id')
  updateItem(@Req() req: express.Request, @Param('id') id: string, @Body() body: any) {
    return this.expenseMap.upsertItem(getUserId(req), { ...body, id });
  }

  @Delete('items/:id')
  deleteItem(@Req() req: express.Request, @Param('id') id: string) {
    return this.expenseMap.deleteItem(getUserId(req), id);
  }

  // ─── Leak Checks ──────────────────────

  @Get('leaks')
  getLeakChecks(@Req() req: express.Request) {
    return this.expenseMap.getLeakChecks(getUserId(req));
  }

  @Put('leaks/:checkNumber')
  upsertLeakCheck(@Req() req: express.Request, @Param('checkNumber') checkNumber: string, @Body() body: any) {
    return this.expenseMap.upsertLeakCheck(getUserId(req), { ...body, checkNumber: parseInt(checkNumber, 10) });
  }
}
