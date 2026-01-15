import { SwaggerDocumentOptions } from '@nestjs/swagger';
import { shouldShowLegacySwagger } from './swagger-exclude.util';

/**
 * Swagger document filter to exclude legacy endpoints when SHOW_LEGACY_SWAGGER=false
 * This filter removes all paths under /api/duo/* from Swagger documentation
 * unless SHOW_LEGACY_SWAGGER=true
 */
export function createSwaggerDocumentOptions(): SwaggerDocumentOptions {
  return {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    deepScanRoutes: true,
  };
}

/**
 * Filter function to exclude legacy paths from Swagger document
 * Called after document creation to remove legacy endpoints
 * Note: Paths in Swagger document don't include the global prefix '/api'
 */
export function filterSwaggerDocument(document: any): any {
  if (shouldShowLegacySwagger()) {
    // Show all endpoints if flag is enabled
    return document;
  }

  // Remove all paths under /duo/* (legacy endpoints)
  // Note: Swagger paths don't include the global prefix '/api'
  if (document.paths) {
    const filteredPaths: any = {};
    for (const [path, pathItem] of Object.entries(document.paths)) {
      // Keep only /learning/* paths (new DB-backed endpoints)
      if (path.startsWith('/learning')) {
        filteredPaths[path] = pathItem;
      }
      // Also keep /docs and other non-duo paths
      if (!path.startsWith('/duo')) {
        filteredPaths[path] = pathItem;
      }
    }
    document.paths = filteredPaths;
  }

  // Also filter tags to remove "Learning (Legacy - In-Memory)" and "Learning (Legacy - DEBUG)" tags
  if (document.tags) {
    document.tags = document.tags.filter(
      (tag: any) => !tag.name?.includes('Legacy') && !tag.name?.includes('legacy'),
    );
  }

  return document;
}

