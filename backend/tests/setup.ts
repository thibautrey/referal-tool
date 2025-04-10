import { mockDeep } from 'jest-mock-extended';

// Setup global Jest mocks and configurations
jest.mock('../src/lib/redis', () => ({
  getFromCache: jest.fn(),
  getWithCache: jest.fn(),
  saveToCache: jest.fn(),
}));

jest.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: mockDeep(),
}));

jest.mock('../src/utils/geolocation', () => ({
  getCountryFromIp: jest.fn(),
}));

// Set Jest timeout to 10 seconds
jest.setTimeout(10000);
