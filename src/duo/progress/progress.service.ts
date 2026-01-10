import { Injectable } from '@nestjs/common';
import { InMemoryStateService } from './in-memory-state.service';

export interface UserProgress {
  userId: number;
  xp: number;
  streak: number;
  mastery: Record<number, number>; // skillId -> level
}

@Injectable()
export class ProgressService {
  constructor(private readonly stateService: InMemoryStateService) {}

  getProgress(userId: number): UserProgress {
    const progress = this.stateService.getUserProgress(userId);
    return {
      userId: progress.userId,
      xp: progress.xpTotal,
      streak: progress.streak,
      mastery: {}, // Not used in MVP, kept for compatibility
    };
  }

  updateProgress(userId: number, xpGained: number, skillId: number) {
    // This is deprecated - progress is now updated via session finish
    // Kept for backward compatibility if called elsewhere
    const progress = this.stateService.getUserProgress(userId);
    progress.xpTotal += xpGained;
  }
}
