import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * UserIdGuard - Validates and extracts x-user-id header
 * 
 * Requirements:
 * - Request must include header "x-user-id"
 * - If missing, returns 400 Bad Request
 * - If present, sets req.userId = header value (string)
 * 
 * Usage:
 * @UseGuards(UserIdGuard)
 * @Controller('learning')
 */
@Injectable()
export class UserIdGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new BadRequestException({
        message: 'x-user-id required',
      });
    }

    // Set userId on request object for use in decorators
    request.userId = userId.trim();
    return true;
  }
}

