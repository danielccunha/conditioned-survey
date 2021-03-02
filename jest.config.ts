export default {
  clearMocks: true,
  collectCoverageFrom: ['<rootDir>/src/services/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.spec.ts'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  preset: 'ts-jest'
}
