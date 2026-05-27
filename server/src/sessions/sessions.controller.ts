import { Controller, Get, Put, Param, Body, Req } from '@nestjs/common';
import * as express from 'express';
import { SessionsService } from './sessions.service';
import { getUserId } from '../common/get-user-id';

@Controller('api/sessions')
export class SessionsController {
  constructor(private sessions: SessionsService) {}

  /** GET /api/sessions/:type — list all records for a session type */
  @Get(':type')
  list(@Req() req: express.Request, @Param('type') type: string) {
    return this.sessions.list(getUserId(req), type);
  }

  /** GET /api/sessions/:type/:month — get a specific month's session data */
  @Get(':type/:month')
  getOne(
    @Req() req: express.Request,
    @Param('type') type: string,
    @Param('month') month: string,
  ) {
    return this.sessions.get(getUserId(req), type, month);
  }

  /** PUT /api/sessions/:type — upsert session data (non-monthly) */
  @Put(':type')
  upsertNoMonth(
    @Req() req: express.Request,
    @Param('type') type: string,
    @Body() body: any,
  ) {
    return this.sessions.upsert(getUserId(req), type, body);
  }

  /** PUT /api/sessions/:type/:month — upsert session data for a month */
  @Put(':type/:month')
  upsert(
    @Req() req: express.Request,
    @Param('type') type: string,
    @Param('month') month: string,
    @Body() body: any,
  ) {
    return this.sessions.upsert(getUserId(req), type, body, month);
  }
}
