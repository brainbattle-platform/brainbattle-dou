import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract userId from request
 * 
 * Requires UserIdGuard to be applied (which sets req.userId)
 * 
 * Usage:
 * @Get('map')
 * async getMap(@UserId() userId: string) {
 *   // userId is the value from x-user-id header
 * }
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.userId;
  },
);

