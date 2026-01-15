import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

/**
 * Service to resolve current user ID from HTTP request
 * Resolves from "x-user-id" header, defaults to "user_1" if missing
 * 
 * This is a temporary solution until full auth is implemented.
 * Uses REQUEST scope to access request headers per request.
 */
@Injectable({ scope: Scope.REQUEST })
export class UserContextService {
  private readonly userId: string;

  constructor(@Inject(REQUEST) private readonly request: Request) {
    // Extract userId from header, default to "user_1"
    const headerUserId = this.request.headers['x-user-id'];
    
    if (headerUserId && typeof headerUserId === 'string') {
      this.userId = headerUserId.trim();
    } else {
      this.userId = 'user_1';
    }
  }

  /**
   * Get current user ID
   * Returns string like "user_1", "user_2", etc.
   */
  getUserId(): string {
    return this.userId;
  }

  /**
   * Get current user ID as number
   * Converts "user_1" -> 1, "user_2" -> 2, etc.
   * Falls back to 1 if format is invalid
   */
  getUserIdAsNumber(): number {
    const match = this.userId.match(/^user_(\d+)$/);
    if (match) {
      return parseInt(match[1], 10);
    }
    // Fallback to 1 if format doesn't match
    return 1;
  }

  /**
   * Get raw header value (for debugging)
   */
  getRawHeaderValue(): string | undefined {
    const header = this.request.headers['x-user-id'];
    return typeof header === 'string' ? header : undefined;
  }
}

