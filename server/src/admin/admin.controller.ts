import { Controller, Get, Param, Query } from '@nestjs/common';
import { AdminService } from './admin.service.js';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('overview')
  getOverview() {
    return this.adminService.getOverview();
  }

  @Get('users')
  getUserList(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
  ) {
    return this.adminService.getUserList({ status, search, sort });
  }

  @Get('alerts')
  getAlerts() {
    return this.adminService.getAlerts();
  }

  @Get('users/:userId')
  getUserDetail(@Param('userId') userId: string) {
    return this.adminService.getUserDetail(userId);
  }

  @Get('users/:userId/summary')
  async getUserSummary(@Param('userId') userId: string) {
    return { text: await this.adminService.generateSummary(userId) };
  }
}
