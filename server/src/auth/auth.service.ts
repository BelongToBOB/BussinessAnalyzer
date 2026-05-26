import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async syncUser(data: {
    provider: string;
    providerAccountId: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  }) {
    // Try to find existing user by provider account
    const existingAccount = await this.prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: data.provider,
          providerAccountId: data.providerAccountId,
        },
      },
      include: { user: true },
    });

    if (existingAccount) {
      // Update name/image if changed
      if (data.name || data.image) {
        await this.prisma.user.update({
          where: { id: existingAccount.userId },
          data: {
            ...(data.name && { name: data.name }),
            ...(data.image && { image: data.image }),
          },
        });
      }

      // Log login
      await this.prisma.activityLog.create({
        data: { userId: existingAccount.userId, action: 'login', meta: { provider: data.provider } },
      });

      return existingAccount.user;
    }

    // Try to find by email
    let user = data.email
      ? await this.prisma.user.findUnique({ where: { email: data.email } })
      : null;

    if (!user) {
      // Create new user
      user = await this.prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          image: data.image,
          ...(data.provider === 'line' && {
            lineUserId: data.providerAccountId,
            lineDisplayName: data.name,
          }),
        },
      });
    }

    // Link account
    await this.prisma.account.create({
      data: {
        userId: user.id,
        type: 'oauth',
        provider: data.provider,
        providerAccountId: data.providerAccountId,
      },
    });

    // Log login
    await this.prisma.activityLog.create({
      data: { userId: user.id, action: 'login', meta: { provider: data.provider } },
    });

    return user;
  }
}
