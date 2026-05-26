import { Controller, Get, Post, Patch, Body, Req } from '@nestjs/common';
import { BusinessService } from './business.service';
import { createBusinessSchema, updateBusinessSchema } from '../common/validation';

@Controller('api/business')
export class BusinessController {
  constructor(private business: BusinessService) {}

  @Get()
  get(@Req() req: any) {
    const userId = req.user?.id ?? 'dev-user'; // TODO: use real auth
    return this.business.get(userId);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    const userId = req.user?.id ?? 'dev-user';
    const dto = createBusinessSchema.parse(body);
    return this.business.create(userId, dto);
  }

  @Patch()
  update(@Req() req: any, @Body() body: any) {
    const userId = req.user?.id ?? 'dev-user';
    const dto = updateBusinessSchema.parse(body);
    return this.business.update(userId, dto);
  }
}
