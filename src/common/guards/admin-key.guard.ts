import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * AdminKeyGuard - Protects admin endpoints with x-admin-key header
 * 
 * Requirements:
 * - Request must include header "x-admin-key" with value "dev-admin"
 * - If missing or invalid, returns 403 Forbidden
 * 
 * Usage:
 * @UseGuards(AdminKeyGuard)
 * @Controller('admin/learning')
 */
@Injectable()
export class AdminKeyGuard implements CanActivate {
  private readonly ADMIN_KEY = 'dev-admin';

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const adminKey = request.headers['x-admin-key'];

    if (!adminKey || adminKey !== this.ADMIN_KEY) {
      throw new ForbiddenException({
        error: {
          code: 'FORBIDDEN',
          message: 'Invalid or missing admin key. Header "x-admin-key" must equal "dev-admin".',
        },
      });
    }

    return true;
  }
}

