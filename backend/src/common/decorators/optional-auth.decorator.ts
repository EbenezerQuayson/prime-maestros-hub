import { SetMetadata } from '@nestjs/common';

export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth';
/**
 * Allows a route to run without a JWT when alternate proof (e.g. applicationToken)
 * is verified in the service, while still attaching req.user if a valid JWT is sent.
 */
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);
