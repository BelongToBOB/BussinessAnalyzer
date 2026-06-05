import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // Stricter limit: 10 requests per 15 minutes (login endpoint)
  @Throttle({ default: { ttl: 900000, limit: 10 } })
  @Post('sync')
  sync(@Body() body: {
    provider: string;
    providerAccountId: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  }) {
    return this.auth.syncUser(body);
  }
}
