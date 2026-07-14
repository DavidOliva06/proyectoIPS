import { getIpAddress, stripPort } from '../ip';

const IP = '127.0.0.1';

describe('getIpAddress', () => {
  const CLIENT_IP_HEADER = process.env.CLIENT_IP_HEADER;

  afterEach(() => {
    // Without this, the custom header set in one test leaks into the rest.
    process.env.CLIENT_IP_HEADER = CLIENT_IP_HEADER;
  });

  test('Custom header', () => {
    process.env.CLIENT_IP_HEADER = 'x-custom-ip-header';

    expect(getIpAddress(new Headers({ 'x-custom-ip-header': IP }))).toEqual(IP);
  });

  test('Custom header configured but absent falls back to the known headers', () => {
    process.env.CLIENT_IP_HEADER = 'x-custom-ip-header';

    expect(getIpAddress(new Headers({ 'cf-connecting-ip': IP }))).toEqual(IP);
  });

  test('CloudFlare header', () => {
    expect(getIpAddress(new Headers({ 'cf-connecting-ip': IP }))).toEqual(IP);
  });

  test('Standard header', () => {
    expect(getIpAddress(new Headers({ 'x-forwarded-for': IP }))).toEqual(IP);
  });

  test('No header', () => {
    expect(getIpAddress(new Headers())).toEqual(undefined);
  });

  test('x-forwarded-for takes the first hop of the chain', () => {
    const headers = new Headers({ 'x-forwarded-for': `${IP}, 10.0.0.1, 192.168.1.1` });

    expect(getIpAddress(headers)).toEqual(IP);
  });

  test('forwarded header: for= is extracted', () => {
    expect(getIpAddress(new Headers({ forwarded: `for=${IP};proto=https` }))).toEqual(IP);
  });

  // Documents current behaviour, which is arguably wrong: RFC 7239 brackets an
  // IPv6 literal in `Forwarded`, and getIpAddress keeps those brackets, so the
  // same client resolves to '[2001:db8::1]' here but '2001:db8::1' via x-real-ip.
  // Fixing it changes what gets written to the events table, so it is left alone
  // and pinned here rather than silently changed.
  test('forwarded header: bracketed IPv6 keeps its brackets', () => {
    expect(getIpAddress(new Headers({ forwarded: 'for=[2001:db8::1]' }))).toEqual('[2001:db8::1]');
  });

  test('IPv4-mapped IPv6 is unwrapped to its IPv4 form', () => {
    expect(getIpAddress(new Headers({ 'x-real-ip': '::ffff:192.0.2.1' }))).toEqual('192.0.2.1');
  });

  test('IPv6 is preserved', () => {
    expect(getIpAddress(new Headers({ 'x-real-ip': '2001:db8::1' }))).toEqual('2001:db8::1');
  });

  test('IPv4 with a port has the port stripped', () => {
    expect(getIpAddress(new Headers({ 'x-real-ip': `${IP}:8080` }))).toEqual(IP);
  });

  test('unparseable values are passed through rather than throwing', () => {
    expect(getIpAddress(new Headers({ 'x-real-ip': 'not-an-ip' }))).toEqual('not-an-ip');
  });
});

describe('stripPort', () => {
  test('strips the port from IPv4', () => {
    expect(stripPort(`${IP}:8080`)).toEqual(IP);
  });

  test('keeps bracketed IPv6 and drops its port', () => {
    expect(stripPort('[2001:db8::1]:443')).toEqual('[2001:db8::1]');
  });

  test('leaves bare IPv6 intact', () => {
    expect(stripPort('2001:db8::1')).toEqual('2001:db8::1');
  });

  test('leaves a portless IPv4 intact', () => {
    expect(stripPort(IP)).toEqual(IP);
  });

  test('passes empty values through', () => {
    expect(stripPort(undefined)).toEqual(undefined);
    expect(stripPort('')).toEqual('');
  });
});
