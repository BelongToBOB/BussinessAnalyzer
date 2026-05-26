import { Controller, Get, Put, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { EntriesService } from './entries.service';
import { upsertEntrySchema } from '../common/validation';
// import { AuthGuard } from '../auth/auth.guard';

@Controller('api/entries')
// @UseGuards(AuthGuard) // TODO: enable after auth setup
export class EntriesController {
  constructor(private entries: EntriesService) {}

  @Get()
  list(@Req() req: any, @Query('months') months?: string) {
    const userId = req.user?.id ?? 'dev-user'; // TODO: use real auth
    return this.entries.list(userId, months ? parseInt(months, 10) : 12);
  }

  @Get('trends')
  trends(@Req() req: any, @Query('months') months?: string) {
    const userId = req.user?.id ?? 'dev-user';
    return this.entries.trends(userId, months ? parseInt(months, 10) : 12);
  }

  @Get(':yyyyMm')
  getOne(@Req() req: any, @Param('yyyyMm') yyyyMm: string) {
    const userId = req.user?.id ?? 'dev-user';
    return this.entries.getWithDashboard(userId, yyyyMm);
  }

  @Put(':yyyyMm')
  upsert(@Req() req: any, @Param('yyyyMm') yyyyMm: string, @Body() body: any) {
    const userId = req.user?.id ?? 'dev-user';
    const dto = upsertEntrySchema.parse(body);
    return this.entries.upsert(userId, yyyyMm, dto);
  }

  @Delete(':yyyyMm')
  remove(@Req() req: any, @Param('yyyyMm') yyyyMm: string) {
    const userId = req.user?.id ?? 'dev-user';
    return this.entries.delete(userId, yyyyMm);
  }
}
