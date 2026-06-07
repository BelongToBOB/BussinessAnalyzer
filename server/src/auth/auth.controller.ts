import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Throttle({ default: { ttl: 60000, limit: 30 } })
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

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('register')
  register(@Body() body: { email: string; password: string; name: string }) {
    return this.auth.register(body);
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body);
  }
}
