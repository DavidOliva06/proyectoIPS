import { logger, resolveLevel, safeStringify, serializeError } from '../logger';

function captureStdout() {
  return jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
}

function captureStderr() {
  return jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
}

function lastEntry(spy: jest.SpyInstance) {
  return JSON.parse(spy.mock.calls.at(-1)?.[0] as string);
}

describe('resolveLevel', () => {
  test('defaults to info when unset or unrecognised', () => {
    expect(resolveLevel(undefined)).toBe('info');
    expect(resolveLevel('')).toBe('info');
    expect(resolveLevel('verbose')).toBe('info');
  });

  test('accepts known levels regardless of case or padding', () => {
    expect(resolveLevel('debug')).toBe('debug');
    expect(resolveLevel('  WARN ')).toBe('warn');
    expect(resolveLevel('Error')).toBe('error');
  });
});

describe('serializeError', () => {
  test('keeps name, message and stack', () => {
    const serialized = serializeError(new TypeError('boom'));

    expect(serialized).toMatchObject({ name: 'TypeError', message: 'boom' });
    expect(serialized.stack).toEqual(expect.stringContaining('boom'));
  });

  test('walks the cause chain', () => {
    const error = new Error('outer', { cause: new Error('inner') });

    expect(serializeError(error).cause).toMatchObject({ message: 'inner' });
  });

  test('stringifies non-errors', () => {
    expect(serializeError('nope')).toEqual({ message: 'nope' });
    expect(serializeError(undefined)).toEqual({ message: 'undefined' });
  });
});

describe('safeStringify', () => {
  test('replaces circular references instead of throwing', () => {
    const circular: Record<string, unknown> = { name: 'loop' };
    circular.self = circular;

    expect(JSON.parse(safeStringify(circular))).toEqual({ name: 'loop', self: '[Circular]' });
  });

  test('renders bigints, which JSON.stringify rejects', () => {
    expect(JSON.parse(safeStringify({ count: 10n }))).toEqual({ count: '10' });
  });
});

describe('logger', () => {
  const LOG_LEVEL = process.env.LOG_LEVEL;

  afterEach(() => {
    process.env.LOG_LEVEL = LOG_LEVEL;
    jest.restoreAllMocks();
  });

  test('writes one structured line with level, time and message', () => {
    const stdout = captureStdout();

    logger.info('website created', { websiteId: 'abc' });

    expect(stdout).toHaveBeenCalledTimes(1);
    expect(stdout.mock.calls[0][0]).toMatch(/\n$/);

    const entry = lastEntry(stdout);

    expect(entry).toMatchObject({ level: 'info', message: 'website created', websiteId: 'abc' });
    expect(Number.isNaN(Date.parse(entry.time))).toBe(false);
  });

  test('sends warn and error to stderr, not stdout', () => {
    const stdout = captureStdout();
    const stderr = captureStderr();

    logger.warn('slow query');
    logger.error('query failed');

    expect(stdout).not.toHaveBeenCalled();
    expect(stderr).toHaveBeenCalledTimes(2);
  });

  test('serializes the err field', () => {
    const stderr = captureStderr();

    logger.error('Server error', { errorId: 'a1b2c3d4', err: new Error('db down') });

    expect(lastEntry(stderr)).toMatchObject({
      level: 'error',
      errorId: 'a1b2c3d4',
      err: { name: 'Error', message: 'db down' },
    });
  });

  test('suppresses levels below LOG_LEVEL', () => {
    process.env.LOG_LEVEL = 'warn';

    const stdout = captureStdout();
    const stderr = captureStderr();

    logger.debug('noisy');
    logger.info('also noisy');
    logger.warn('kept');

    expect(stdout).not.toHaveBeenCalled();
    expect(stderr).toHaveBeenCalledTimes(1);
  });

  test('emits debug once LOG_LEVEL allows it', () => {
    process.env.LOG_LEVEL = 'debug';

    const stdout = captureStdout();

    logger.debug('cache miss');

    expect(lastEntry(stdout)).toMatchObject({ level: 'debug', message: 'cache miss' });
  });
});
