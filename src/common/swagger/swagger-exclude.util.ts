/**
 * Utility to check if legacy endpoints should be shown in Swagger
 * Controlled by SHOW_LEGACY_SWAGGER environment variable (default: false)
 */
export function shouldShowLegacySwagger(): boolean {
  return process.env.SHOW_LEGACY_SWAGGER === 'true';
}

