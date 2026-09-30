import dotenv from 'dotenv';
dotenv.config();

export default {
  port: process.env.PORT || 3001,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'mova-dev-secret-key-2024',
  geminiApiKey: process.env.GEMINI_API_KEY,
  weatherApiKey: process.env.WEATHER_API_KEY,
  tomtomApiKey: process.env.TOMTOM_API_KEY,
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  googleMapsMapId: process.env.GOOGLE_MAPS_MAP_ID,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtExpiresIn: '24h',
};
