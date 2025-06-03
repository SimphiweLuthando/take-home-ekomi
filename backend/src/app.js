const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
require('dotenv').config();

let config = {};
if (!process.env.DATABASE_URL) {
  console.log('🔧 Loading development configuration...');
  config = require('../config.dev.js');
  Object.keys(config).forEach(key => {
    if (!process.env[key]) {
      process.env[key] = config[key];
    }
  });
}

const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contacts');

const app = express();
const PORT = process.env.PORT || 3001;

let pool;
try {
  console.log('📋 Database Configuration:');
  console.log('  URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
  console.log('  Environment:', process.env.NODE_ENV || 'development');
  
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  

  pool.on('error', (err) => {
    console.error('❌ Unexpected database pool error:', err);
  });
  
} catch (error) {
  console.error('❌ Failed to create database pool:', error.message);
  process.exit(1);
}

app.locals.db = pool;

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many login attempts from this IP, please try again later.'
  }
});

app.use(limiter);

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://localhost:3000', 'https://localhost:3000'] 
    : '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/contacts', contactRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired'
    });
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('🔧 Troubleshooting suggestions:');
    console.error('   1. Make sure PostgreSQL is running');
    console.error('   2. Check if the database "outlook_addin" exists');
    console.error('   3. Verify credentials: admin/secretpassword');
    console.error('   4. Ensure PostgreSQL is listening on port 5432');
    console.error('   5. If using Docker: run "docker-compose up database" first');
    console.error('');
    console.error('💡 Quick fix: Start the database with Docker:');
    console.error('   docker-compose up database');
    process.exit(1);
  }
}

async function startServer() {
  await testConnection();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

startServer().catch(console.error); 