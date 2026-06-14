import { SetMetadata } from '@nestjs/common';

export const REQUIRES_PRO_KEY = 'requiresPro';

/** Marca uma rota como exclusiva do plano Pro (validada pelo PlanGuard). */
export const RequiresPro = () => SetMetadata(REQUIRES_PRO_KEY, true);
