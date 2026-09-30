import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { startLiveStream } from './services/liveTelematicsService.js';

const app = express();

app.use(cors({
  origin: config.frontendUrl,
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
