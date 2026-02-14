import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/**
 * Marca rota como publica para ignorar JWT global.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
