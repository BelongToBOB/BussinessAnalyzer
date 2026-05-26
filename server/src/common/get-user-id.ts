import * as express from 'express';
import { UnauthorizedException } from '@nestjs/common';

/** Extract user ID from X-User-Id header (set by frontend from JWT session) */
export function getUserId(req: express.Request): string {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    throw new UnauthorizedException('Missing X-User-Id header. Please login first.');
  }
  return userId;
}
