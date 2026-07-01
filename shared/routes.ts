import { z } from 'zod';
import { insertProfileSchema, profiles } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  health: {
    method: 'GET' as const,
    path: '/api/health',
    responses: {
      200: z.object({ status: z.string() }),
    },
  },
  profiles: {
    get: {
      method: 'GET' as const,
      path: '/api/profiles/:id',
      responses: {
        200: insertProfileSchema,
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/profiles/:id',
      responses: {
        200: insertProfileSchema,
        400: errorSchemas.validation,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
