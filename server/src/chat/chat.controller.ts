import { Controller, Post, Body, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import * as express from 'express';
import { ChatService } from './chat.service';
import { getUserId } from '../common/get-user-id';

@Controller('api/chat')
export class ChatController {
  constructor(private chat: ChatService) {}

  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Post()
  async sendMessage(
    @Req() req: express.Request,
    @Res() res: express.Response,
    @Body() body: { message: string; history?: { role: string; content: string }[] },
  ) {
    const userId = getUserId(req);
    await this.chat.chatStream(userId, body.message, body.history || [], res);
  }
}
