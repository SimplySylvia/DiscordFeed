module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  testMatch: ['<rootDir>/lib/**/*.test.[jt]s?(x)', '<rootDir>/app/api/**/*.test.[jt]s?(x)'],
};
