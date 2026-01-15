import { Module, Global } from '@nestjs/common';
import { UserContextService } from './user-context.service';

/**
 * Global module for user context
 * Makes UserContextService available to all modules without explicit import
 */
@Global()
@Module({
  providers: [UserContextService],
  exports: [UserContextService],
})
export class UserContextModule {}

