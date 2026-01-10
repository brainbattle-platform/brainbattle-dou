import { Injectable } from '@nestjs/common';

export interface HeartsState {
  current: number;
  max: number;
  regen: {
    secondsPerHeart: number;
    nextHeartInSeconds?: number;
  };
}

@Injectable()
export class HeartsService {
  private hearts: Map<number, HeartsState> = new Map();
  private readonly DEFAULT_MAX_HEARTS = 5;
  private readonly DEFAULT_SECONDS_PER_HEART = 1800; // 30 minutes

  getHearts(userId: number): HeartsState {
    if (!this.hearts.has(userId)) {
      this.hearts.set(userId, {
        current: this.DEFAULT_MAX_HEARTS,
        max: this.DEFAULT_MAX_HEARTS,
        regen: {
          secondsPerHeart: this.DEFAULT_SECONDS_PER_HEART,
        },
      });
    }
    return this.hearts.get(userId)!;
  }

  decrementOnWrong(userId: number): HeartsState {
    const hearts = this.getHearts(userId);
    hearts.current = Math.max(0, hearts.current - 1);
    this.hearts.set(userId, hearts);
    return hearts;
  }

  isOutOfHearts(userId: number): boolean {
    const hearts = this.getHearts(userId);
    return hearts.current <= 0;
  }

  getHeartsWithRegen(userId: number): HeartsState {
    const hearts = this.getHearts(userId);
    // For MVP: fake regen calculation (can be enhanced later)
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

