import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startLiveStream } from './services/liveTelematicsService.js';

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or health monitors)
    if (!origin) return callback(null, true);
    if (
      !config.frontendUrl ||
      config.frontendUrl === '*' ||
      origin === config.frontendUrl ||
      origin.includes('localhost') ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'MOVA API', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', routes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`\n🚀 MOVA API Server running on port ${config.port}`);
  console.log(`   Health: http://localhost:${config.port}/health`);
  console.log(`   AI: ${config.geminiApiKey ? '✓ Gemini connected' : '⚠ No Gemini key — using fallback'}`);
  console.log(`   Frontend: ${config.frontendUrl}\n`);
  startLiveStream(4000);
});
