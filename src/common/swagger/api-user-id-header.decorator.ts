import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

/**
 * Reusable decorator to document x-user-id header in Swagger
 * Applies to all endpoints in a controller
 * 
 * Usage:
 * @ApiUserIdHeader()
 * @Controller('learning')
 * export class LearningController { ... }
 */
/**
 * Reusable decorator to document x-user-id header in Swagger
 * Applies to all endpoints in a controller
 * 
 * Usage:
 * @ApiUserIdHeader()
 * @Controller('learning')
 * export class LearningController { ... }
 */
export function ApiUserIdHeader() {
  return applyDecorators(
    ApiHeader({
      name: 'x-user-id',
      description: 'User identifier (required). Examples: "user_1", "user_2", or numeric "1", "2".',
      required: true,
      example: '1',
    }),
  );
}

