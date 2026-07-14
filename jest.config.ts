/**
 * Coverage is enforced against an allowlist, not the whole tree.
 *
 * A repo-wide threshold on a codebase this size would either sit so low it
 * asserts nothing, or sit high and fail on day one. Instead, `COVERED` names the
 * modules we have committed to keeping tested, and the 70% floor applies only to
 * those. Adding a module here is the act of taking on that commitment — so the
 * gate is real from the first commit and ratchets up as the list grows, instead
 * of being switched off whenever it turns red.
 */
const COVERED = [
  'src/lib/boardComponentCompatibility.ts',
  'src/lib/format.ts',
  'src/lib/get-base-url.ts',
  'src/lib/ip.ts',
  'src/lib/logger.ts',
  'src/lib/match-configured-path.ts',
];

export default {
  roots: ['./src'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: COVERED,
  coverageDirectory: 'coverage',
  coverageReporters: ['text-summary', 'json-summary', 'lcov'],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
};
