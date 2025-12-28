/**
 * Health Check Integration Tests
 *
 * Tests for /health endpoints.
 */

import express from 'express';
import request from 'supertest';

// Mock the database connection
jest.mock('../../db/connection', () => ({
  testConnection: jest.fn(),
}));

import { testConnection } from '../../db/connection';

const mockedTestConnection = testConnection as jest.MockedFunction<typeof testConnection>;

// Create test app with health endpoints
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'auth-service',
    timestamp: new Date().toISOString(),
  });
});

// Database health check
app.get('/db/health', async (req, res) => {
  const isConnected = await testConnection();
  res.json({
    database: isConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

describe('Health Check Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return service status ok', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('auth-service');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should return valid ISO timestamp', async () => {
      const response = await request(app).get('/health');

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.toISOString()).toBe(response.body.timestamp);
    });
  });

  describe('GET /db/health', () => {
    it('should return connected when database is available', async () => {
      mockedTestConnection.mockResolvedValue(true);

      const response = await request(app).get('/db/health');

      expect(response.status).toBe(200);
      expect(response.body.database).toBe('connected');
    });

    it('should return disconnected when database is unavailable', async () => {
      mockedTestConnection.mockResolvedValue(false);

      const response = await request(app).get('/db/health');

      expect(response.status).toBe(200);
      expect(response.body.database).toBe('disconnected');
    });
  });
});
