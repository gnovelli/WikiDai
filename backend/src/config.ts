import dotenv from 'dotenv';

dotenv.config();

export const config = {
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
};

// Validate required config
if (!config.geminiApiKey && config.nodeEnv !== 'test') {
  console.warn('⚠️  GEMINI_API_KEY not set. Please create .env file from .env.example');
}
