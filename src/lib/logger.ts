/**
 * Structured logging.
 *
 * Emits one JSON object per line so log aggregators can index fields instead of
 * regex-ing prose. Levels are filtered by the LOG_LEVEL env var (default: info).
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogFields = Record<string, unknown>;

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const DEFAULT_LEVEL: LogLevel = 'info';

export function resolveLevel(raw?: string): LogLevel {
  const level = raw?.trim().toLowerCase();

  return level && level in LEVEL_WEIGHT ? (level as LogLevel) : DEFAULT_LEVEL;
}

export function serializeError(value: unknown): LogFields {
  if (!(value instanceof Error)) {
    return { message: String(value) };
  }

  const serialized: LogFields = {
    name: value.name,
    message: value.message,
    stack: value.stack,
  };

  // Preserve the chain from `throw new Error(msg, { cause })`, which is where
  // the actual failure usually lives once a driver has wrapped it.
  if (value.cause !== undefined) {
    serialized.cause = serializeError(value.cause);
  }

  return serialized;
}

/**
 * JSON.stringify throws on circular references, and a logger that throws turns a
 * handled error into an unhandled one. Cycles are replaced, never fatal.
 */
export function safeStringify(entry: LogFields): string {
  const seen = new WeakSet<object>();

  return JSON.stringify(entry, (_key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }

    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }

    return value;
  });
}

function emit(level: LogLevel, message: string, fields: LogFields = {}) {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[resolveLevel(process.env.LOG_LEVEL)]) {
    return;
  }

  const { err, ...rest } = fields;

  const entry: LogFields = {
    level,
    time: new Date().toISOString(),
    message,
    ...rest,
  };

  if (err !== undefined) {
    entry.err = serializeError(err);
  }

  const line = safeStringify(entry);

  // warn/error to stderr so they stay separable from application output.
  if (level === 'error' || level === 'warn') {
    process.stderr.write(`${line}\n`);
  } else {
    process.stdout.write(`${line}\n`);
  }
}

export const logger = {
  debug: (message: string, fields?: LogFields) => emit('debug', message, fields),
  info: (message: string, fields?: LogFields) => emit('info', message, fields),
  warn: (message: string, fields?: LogFields) => emit('warn', message, fields),
  error: (message: string, fields?: LogFields) => emit('error', message, fields),
};

export default logger;
