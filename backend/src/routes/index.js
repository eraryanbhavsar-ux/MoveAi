import { Router } from 'express';
import { register, login, getMe, googleLogin } from '../controllers/authController.js';
import { getDashboard } from '../controllers/dashboardController.js';
import { getVehicles, getVehicleById } from '../controllers/vehicleController.js';
import { getTrips, getTripById, analyzeTripRisk } from '../controllers/tripController.js';
import { getDeliveries, getDeliveryById } from '../controllers/deliveryController.js';
import { getIncidents, getIncidentById } from '../controllers/incidentController.js';
import {
  getRecommendations,
  applyRec,
  approveRec,
  rejectRec,
  optimizeTrip,
  runSim,
  assistant,
  liveDemo,
  getAnalytics,
  setKey,
  getAIStatus,
  calculateRealRoute,
  getLiveWeather,
  getTrafficFlow
} from '../controllers/aiController.js';
import {
  previewCsv,
  commitCsv,
  ingestPing,
  getHistory,
  getIntegrations,
  saveIntegration
} from '../controllers/ingestionController.js';
import {
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
  createAlert
} from '../controllers/alertController.js';
import {
  getLiveFleetSnapshot,
  getCorridorTelematics,
  getStreamStatus,
  startLiveStream,
  stopLiveStream,
  stepTelematicsTick
} from '../services/liveTelematicsService.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'MOVA API', timestamp: new Date().toISOString() });
});

// ==========================================
// 1. Authentication & Multi-Tenant Identity
// ==========================================
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/google', googleLogin);
router.get('/auth/me', authMiddleware, getMe);

// ==========================================
// 2. Operational Dashboard & KPIs
// ==========================================
router.get('/dashboard', authMiddleware, getDashboard);

// ==========================================
// 3. Vehicles & Fleet Telematics
// ==========================================
router.get('/vehicles', authMiddleware, getVehicles);
router.get('/vehicles/:id', authMiddleware, getVehicleById);

// ==========================================
// 4. Trips, Real Routes, & ETAs
// ==========================================
router.get('/trips', authMiddleware, getTrips);
router.get('/trips/:id', authMiddleware, getTripById);
router.post('/ai/analyze-trip/:id', authMiddleware, analyzeTripRisk);

// ==========================================
// 5. Deliveries & Consignments
// ==========================================
router.get('/deliveries', authMiddleware, getDeliveries);
router.get('/deliveries/:id', authMiddleware, getDeliveryById);

// ==========================================
// 6. Mobility Disruptions & Incidents
// ==========================================
router.get('/incidents', authMiddleware, getIncidents);
router.get('/incidents/:id', authMiddleware, getIncidentById);

// ==========================================
// 7. Human-in-the-Loop Recommendations & AI
// ==========================================
router.get('/recommendations', authMiddleware, getRecommendations);
router.post('/recommendations/:id/apply', authMiddleware, requireRole('admin', 'operations_manager', 'dispatcher'), applyRec);
router.post('/recommendations/:id/approve', authMiddleware, requireRole('admin', 'operations_manager', 'dispatcher'), approveRec);
router.post('/recommendations/:id/reject', authMiddleware, requireRole('admin', 'operations_manager', 'dispatcher'), rejectRec);
router.post('/ai/optimize', authMiddleware, optimizeTrip);
router.post('/ai/assistant', authMiddleware, assistant);
router.get('/ai/status', authMiddleware, getAIStatus);
router.post('/ai/set-key', authMiddleware, setKey);

// ==========================================
// 8. Digital Twin & Scenario Simulations
// ==========================================
router.post('/simulation/run', authMiddleware, runSim);
router.post('/simulation/live-demo', authMiddleware, liveDemo);

// ==========================================
// 9. Data Ingestion & Live Telematics
// ==========================================
router.post('/ingestion/csv-preview', authMiddleware, previewCsv);
router.post('/ingestion/csv-commit', authMiddleware, requireRole('admin', 'operations_manager', 'dispatcher'), commitCsv);
router.post('/telematics/ping', authMiddleware, ingestPing);
router.get('/telematics/live', authMiddleware, async (req, res, next) => {
  try {
    const fleet = await getLiveFleetSnapshot();
    res.json(fleet);
  } catch (err) {
    next(err);
  }
});
router.get('/telematics/corridors', authMiddleware, async (req, res, next) => {
  try {
    const corridors = await getCorridorTelematics();
    res.json(corridors);
  } catch (err) {
    next(err);
  }
});
router.get('/telematics/stream/status', authMiddleware, (req, res) => {
  res.json(getStreamStatus());
});
router.post('/telematics/stream/toggle', authMiddleware, (req, res) => {
  const current = getStreamStatus();
  if (current.active) {
    stopLiveStream();
  } else {
    startLiveStream(4000);
  }
  res.json(getStreamStatus());
});
router.post('/telematics/stream/tick', authMiddleware, async (req, res, next) => {
  try {
    const result = await stepTelematicsTick();
    res.json(result);
  } catch (err) {
    next(err);
  }
});
router.get('/ingestion/history', authMiddleware, getHistory);
router.get('/ingestion/integrations', authMiddleware, getIntegrations);
router.post('/ingestion/integrations', authMiddleware, requireRole('admin', 'operations_manager'), saveIntegration);

// ==========================================
// 10. Operational Alerting System
// ==========================================
router.get('/alerts', authMiddleware, getAlerts);
router.post('/alerts', authMiddleware, requireRole('admin', 'operations_manager', 'dispatcher'), createAlert);
router.post('/alerts/:id/acknowledge', authMiddleware, acknowledgeAlert);
router.post('/alerts/:id/resolve', authMiddleware, requireRole('admin', 'operations_manager', 'dispatcher'), resolveAlert);

// ==========================================
// 11. Real Geospatial & Weather APIs
// ==========================================
router.post('/routing/calculate', authMiddleware, calculateRealRoute);
router.get('/weather', authMiddleware, getLiveWeather);
router.get('/traffic/flow', authMiddleware, getTrafficFlow);

// ==========================================
// 12. Analytics & Historical Performance
// ==========================================
router.get('/analytics', authMiddleware, getAnalytics);

export default router;
