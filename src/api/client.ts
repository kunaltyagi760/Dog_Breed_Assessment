import { env } from '@/config/env';

import { createDogApi } from './dogApi';

export const dogApi = createDogApi({ baseUrl: env.apiBaseUrl });
