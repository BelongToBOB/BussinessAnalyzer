import { Controller, Get, Post, Patch, Delete, Body, Req } from '@nestjs/common';
import * as express from 'express';
import { BusinessService } from './business.service';
import { createBusinessSchema, updateBusinessSchema } from '../common/validation';
import { getUserId } from '../common/get-user-id';

@Controller('api/business')
export class BusinessController {
  constructor(private business: BusinessService) {}

  @Get()
  get(@Req() req: express.Request) {
    return this.business.get(getUserId(req));
  }

  @Post()
  create(@Req() req: express.Request, @Body() body: any) {
    const dto = createBusinessSchema.parse(body);
    return this.business.create(getUserId(req), dto);
  }

  @Patch()
  update(@Req() req: express.Request, @Body() body: any) {
    const dto = updateBusinessSchema.parse(body);
    return this.business.update(getUserId(req), dto);
  }

  @Delete()
  deleteAll(@Req() req: express.Request) {
    return this.business.deleteAll(getUserId(req));
  }
}
