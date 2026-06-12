import { Controller, Get, Post, Put, Param, Body, Req } from '@nestjs/common';
import * as express from 'express';
import { ReadinessService } from './readiness.service';
import { WinBankService } from './winbank.service';
import { getUserId } from '../common/get-user-id';

@Controller('api/ib')
export class ReadinessController {
  constructor(private svc: ReadinessService, private winbank: WinBankService) {}

  // ─── Assessment CRUD ─────────────────────────────────────

  @Post('assessments')
  createAssessment(@Req() req: express.Request, @Body() body: any) {
    return this.svc.createAssessment(getUserId(req), body);
  }

  @Get('assessments')
  listAssessments(@Req() req: express.Request) {
    return this.svc.listAssessments(getUserId(req));
  }

  @Get('assessments/:id')
  getAssessment(@Req() req: express.Request, @Param('id') id: string) {
    return this.svc.getAssessment(getUserId(req), id);
  }

  // ─── Session Saves ───────────────────────────────────────

  @Put('assessments/:id/s1')
  saveS1(@Req() req: express.Request, @Param('id') id: string, @Body() body: any) {
    return this.svc.saveS1(getUserId(req), id, body);
  }

  @Put('assessments/:id/s2')
  saveS2(@Req() req: express.Request, @Param('id') id: string, @Body() body: any) {
    return this.svc.saveS2(getUserId(req), id, body);
  }

  @Put('assessments/:id/s3')
  saveS3(@Req() req: express.Request, @Param('id') id: string, @Body() body: any) {
    return this.svc.saveS3(getUserId(req), id, body);
  }

  @Put('assessments/:id/s4')
  saveS4(@Req() req: express.Request, @Param('id') id: string, @Body() body: any) {
    return this.svc.saveS4(getUserId(req), id, body);
  }

  @Put('assessments/:id/s5')
  saveS5(@Req() req: express.Request, @Param('id') id: string, @Body() body: any) {
    return this.svc.saveS5(getUserId(req), id, body);
  }

  @Put('assessments/:id/s6')
  saveS6(@Req() req: express.Request, @Param('id') id: string, @Body() body: any) {
    return this.svc.saveS6(getUserId(req), id, body);
  }

  @Put('assessments/:id/kpi')
  saveKpi(@Req() req: express.Request, @Param('id') id: string, @Body() body: any) {
    return this.svc.saveKpi(getUserId(req), id, body);
  }

  @Put('assessments/:id/frs-profile')
  switchFrsProfile(@Req() req: express.Request, @Param('id') id: string, @Body() body: { profile: 'learning' | 'bank' }) {
    return this.svc.switchFrsProfile(getUserId(req), id, body.profile);
  }

  // ─── WinBank AI ─────────────────────────────────────────

  @Get('winbank/:assessmentId/latest')
  async getLatestWinBank(@Req() req: express.Request, @Param('assessmentId') assessmentId: string) {
    return this.winbank.getLatestAnalysis(getUserId(req), assessmentId);
  }

  @Get('winbank/:assessmentId/history')
  async listWinBankHistory(@Req() req: express.Request, @Param('assessmentId') assessmentId: string) {
    return this.winbank.listAnalyses(getUserId(req), assessmentId);
  }

  @Post('winbank/analyze')
  async analyzeWinBank(@Req() req: express.Request, @Body() body: { assessmentId: string }) {
    try {
      return await this.winbank.analyze(getUserId(req), body.assessmentId);
    } catch (err: any) {
      console.error('[WinBank Controller]', err.message);
      return { error: true, message: err.message ?? 'Unknown error' };
    }
  }

  @Post('winbank/chat')
  async chatWinBank(@Req() req: express.Request, @Body() body: { assessmentId: string; message: string; history?: any[] }) {
    try {
      return await this.winbank.chat(getUserId(req), body.assessmentId, body.message, body.history ?? []);
    } catch (err: any) {
      return { error: true, reply: err.message ?? 'Unknown error' };
    }
  }

  // ─── Config ──────────────────────────────────────────────

  @Get('config')
  getConfig() {
    return this.svc.getConfig();
  }

  @Put('config/:key')
  updateConfig(@Req() req: express.Request, @Param('key') key: string, @Body() body: { value: number }) {
    return this.svc.updateConfig(getUserId(req), key, body.value);
  }
}
