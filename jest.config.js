module.exports = {
  clearMocks: true,
  collectCoverageFrom: ['<rootDir>/src/services/*.ts'],
  coverageDirectory: 'coverage',
  coverageProvider: 'v8',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.spec.ts'],
  preset: 'ts-jest'
}
