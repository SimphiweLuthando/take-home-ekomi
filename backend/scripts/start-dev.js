#!/usr/bin/env node

/**
 * Development Startup Script
 * Handles different startup scenarios and provides helpful guidance
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Outlook Add-in Backend in Development Mode...\n');

const appPath = path.join(__dirname, '../src/app.js');

console.log('📍 Starting from:', __dirname);
console.log('📁 App path:', appPath);
console.log('');

console.log('🔧 Environment Setup:');
console.log('  NODE_ENV: development');
console.log('  PORT: 3001');
console.log('  Database: postgresql://admin:simphiwe1234@localhost:5432/outlook_addin');
console.log('');

console.log('ℹ️  If database connection fails, you can:');
console.log('  1. Start just the database: docker-compose up database');
console.log('  2. Start all services: docker-compose up');
console.log('  3. Install PostgreSQL locally and create the database');
console.log('');

const app = spawn('node', [appPath], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: '3001'
  }
});

app.on('close', (code) => {
  console.log(`\n🛑 Backend process exited with code ${code}`);
  process.exit(code);
});

app.on('error', (err) => {
  console.error('❌ Failed to start backend:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  app.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  app.kill('SIGTERM');
}); 