import { logger } from '@/lib/logger';

export function ok() {
  return Response.json({ ok: true });
}

export function json(data: Record<string, any> = {}) {
  return Response.json(data);
}

export function badRequest(error?: Record<string, any>) {
  return Response.json(
    {
      error: { message: 'Bad request', code: 'bad-request', status: 400, ...error },
    },
    { status: 400 },
  );
}

export function unauthorized(error?: Record<string, any>) {
  return Response.json(
    {
      error: {
        message: 'Unauthorized',
        code: 'unauthorized',
        status: 401,
        ...error,
      },
    },
    { status: 401 },
  );
}

export function forbidden(error?: Record<string, any>) {
  return Response.json(
    { error: { message: 'Forbidden', code: 'forbidden', status: 403, ...error } },
    { status: 403 },
  );
}

export function notFound(error?: Record<string, any>) {
  return Response.json(
    { error: { message: 'Not found', code: 'not-found', status: 404, ...error } },
    { status: 404 },
  );
}

/**
 * Splits whatever a caller threw at us into the parts that are safe to return to
 * the client and the parts that belong only in the logs.
 *
 * Callers pass either a caught `Error` (`serverError(e)`), an object wrapping one
 * (`serverError({ errorObject: e })`), or plain response overrides
 * (`serverError({ message, code })`). Errors carry stack traces and driver
 * internals, so they are routed to the logger; only plain fields reach the body.
 */
export function splitError(error?: unknown): { fields: Record<string, any>; cause?: unknown } {
  if (error === undefined || error === null) {
    return { fields: {} };
  }

  if (error instanceof Error) {
    return { fields: {}, cause: error };
  }

  if (typeof error !== 'object') {
    return { fields: {}, cause: error };
  }

  const fields: Record<string, any> = {};
  let cause: unknown;

  for (const [key, value] of Object.entries(error)) {
    if (value instanceof Error) {
      cause = value;
    } else {
      fields[key] = value;
    }
  }

  return { fields, cause };
}

export function serverError(error?: unknown) {
  const { fields, cause } = splitError(error);

  // Correlates the opaque 500 the client sees with the full stack in the logs.
  const id = crypto.randomUUID().slice(0, 8);

  logger.error('Server error', { errorId: id, err: cause ?? fields });

  return Response.json(
    {
      error: {
        message: 'Server error',
        code: 'server-error',
        status: 500,
        ...fields,
        id,
      },
    },
    { status: 500 },
  );
}
