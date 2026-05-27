import { Controller, Get, Put, Delete, Param, Body, Query, Req, BadRequestException } from '@nestjs/common';
import * as express from 'express';
import { EntriesService } from './entries.service';
import { upsertEntrySchema } from '../common/validation';
import { getUserId } from '../common/get-user-id';

@Controller('api/entries')
export class EntriesController {
  constructor(private entries: EntriesService) {}

  @Get()
  list(@Req() req: express.Request, @Query('months') months?: string) {
    return this.entries.list(getUserId(req), months ? parseInt(months, 10) : 12);
  }

  @Get('trends')
  trends(@Req() req: express.Request, @Query('months') months?: string) {
    return this.entries.trends(getUserId(req), months ? parseInt(months, 10) : 12);
  }

  @Get(':yyyyMm')
  getOne(@Req() req: express.Request, @Param('yyyyMm') yyyyMm: string) {
    return this.entries.getWithDashboard(getUserId(req), yyyyMm);
  }

  @Put(':yyyyMm')
  upsert(@Req() req: express.Request, @Param('yyyyMm') yyyyMm: string, @Body() body: any) {
    const result = upsertEntrySchema.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.issues.map((i) => i.message).join(', '));
    }
    return this.entries.upsert(getUserId(req), yyyyMm, result.data);
  }

  @Delete(':yyyyMm')
  remove(@Req() req: express.Request, @Param('yyyyMm') yyyyMm: string) {
    return this.entries.delete(getUserId(req), yyyyMm);
  }
}
