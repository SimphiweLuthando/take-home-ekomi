/**
 * Development Configuration
 * Use this when running outside Docker or when .env is not available
 */

module.exports = {
  NODE_ENV: 'development',
  PORT: 3001,
  
  DATABASE_URL: 'postgresql://admin:simphiwe1234@localhost:5432/outlook_addin',
  
  JWT_SECRET: 'your-super-secret-jwt-key-change-in-production',
  
  FRONTEND_URL: 'http://localhost:3000'
}; 