import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface HeartsState {
  current: number;
  max: number;
  regen: {
    secondsPerHeart: number;
    nextHeartInSeconds?: number;
  };
}

/**
 * Prisma-based hearts service that persists hearts in DB
 */
@Injectable()
export class PrismaHeartsService {
  private readonly DEFAULT_MAX_HEARTS = 5;
  private readonly DEFAULT_SECONDS_PER_HEART = 1800; // 30 minutes

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get hearts for user (from DB)
   */
  async getHearts(userId: number): Promise<HeartsState> {
    let hearts = await this.prisma.userHearts.findUnique({
      where: { userId },
    });

    if (!hearts) {
      // Ensure user progress exists
      await this.prisma.userProgress.upsert({
        where: { userId },
        create: {
          userId,
          xpTotal: 0,
          streak: 0,
          lastActiveDate: new Date(),
        },
        update: {},
      });

      // Create default hearts
      hearts = await this.prisma.userHearts.create({
        data: {
          userId,
          current: this.DEFAULT_MAX_HEARTS,
          max: this.DEFAULT_MAX_HEARTS,
          lastRefillAt: new Date(),
        },
      });
    }

    return {
      current: hearts.current,
      max: hearts.max,
      regen: {
        secondsPerHeart: this.DEFAULT_SECONDS_PER_HEART,
      },
    };
  }

  /**
   * Decrement hearts on wrong answer
   */
  async decrementOnWrong(userId: number): Promise<HeartsState> {
    const hearts = await this.getHearts(userId);
    const newCurrent = Math.max(0, hearts.current - 1);

    await this.prisma.userHearts.update({
      where: { userId },
      data: { current: newCurrent },
    });

    return this.getHearts(userId);
  }

  /**
   * Check if user is out of hearts
   */
  async isOutOfHearts(userId: number): Promise<boolean> {
    const hearts = await this.getHearts(userId);
    return hearts.current <= 0;
  }

  /**
   * Get hearts with regen info
   */
  async getHeartsWithRegen(userId: number): Promise<HeartsState> {
    const hearts = await this.getHearts(userId);
    
    if (hearts.current < hearts.max) {
      return {
        ...hearts,
        regen: {
          ...hearts.regen,
          nextHeartInSeconds: hearts.current === 0 ? hearts.regen.secondsPerHeart : undefined,
        },
      };
    }
    
    return hearts;
  }
}

