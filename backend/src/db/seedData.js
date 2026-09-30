import bcryptjs from 'bcryptjs';

export const CITIES = {
  mumbai: { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
  thane: { lat: 19.2183, lng: 72.9781, name: 'Thane' },
  vashi: { lat: 19.0771, lng: 73.0071, name: 'Navi Mumbai' },
  panvel: { lat: 18.9894, lng: 73.1175, name: 'Panvel' },
  lonavala: { lat: 18.7546, lng: 73.4062, name: 'Lonavala' },
  pune: { lat: 18.5204, lng: 73.8567, name: 'Pune' },
  nashik: { lat: 19.9975, lng: 73.7898, name: 'Nashik' },
  sambhajinagar: { lat: 19.8762, lng: 75.3433, name: 'Chhatrapati Sambhajinagar' },
  nagpur: { lat: 21.1458, lng: 79.0882, name: 'Nagpur' },
  surat: { lat: 21.1702, lng: 72.8311, name: 'Surat' },
};

export function jitter(val, range = 0.015) {
  return +(val + (Math.random() - 0.5) * range).toFixed(6);
}

export function futureDate(hoursFromNow) {
  return new Date(Date.now() + hoursFromNow * 3600000).toISOString();
}

export function pastDate(hoursAgo) {
  return new Date(Date.now() - hoursAgo * 3600000).toISOString();
}

// ==========================================
// 1. ORGANIZATION
// ==========================================
export const DEMO_ORG = {
  id: 1,
  name: 'MOVA Logistics Demo',
  slug: 'mova-logistics-demo',
  plan: 'enterprise',
  settings: {
    industry: 'Logistics & Distribution',
    country: 'India',
    primary_region: 'Maharashtra',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    mode: 'Seed Data / Development Mode'
  }
};

// ==========================================
// 2. USERS (Hashed passwords)
// ==========================================
export const DEMO_USERS = [
  {
    email: 'admin@mova-demo.com',
    name: 'Admin User',
    role: 'ADMIN',
    password_hash: bcryptjs.hashSync('Password123!', 10)
  },
  {
    email: 'operations@mova-demo.com',
    name: 'Operations Manager',
    role: 'OPERATIONS_MANAGER',
    password_hash: bcryptjs.hashSync('Password123!', 10)
  },
  {
    email: 'dispatcher@mova-demo.com',
    name: 'Dispatcher',
    role: 'DISPATCHER',
    password_hash: bcryptjs.hashSync('Password123!', 10)
  },
  {
    email: 'analyst@mova-demo.com',
    name: 'Mobility Analyst',
    role: 'ANALYST',
    password_hash: bcryptjs.hashSync('Password123!', 10)
  },
  // Retain demo operator for automated test suites
  {
    email: 'demo@mova.ai',
    name: 'MOVA Demo Operator',
    role: 'admin',
    password_hash: bcryptjs.hashSync('MovaDemo123!', 10)
  }
];

// ==========================================
// 3. DRIVERS — 20 RECORDS
// ==========================================
export const DEMO_DRIVERS = [
  { id: 1, employee_code: 'DR-001', name: 'Rajesh Kumar', phone: '+91-9876500001', status: 'ON_TRIP', assigned_vehicle_id: 1, shift_start: '06:00', shift_end: '15:00', hours_driven_today: 4.2, safety_score: 94, rating: 4.8 },
  { id: 2, employee_code: 'DR-002', name: 'Amit Sharma', phone: '+91-9876500002', status: 'ON_TRIP', assigned_vehicle_id: 2, shift_start: '07:00', shift_end: '16:00', hours_driven_today: 3.8, safety_score: 91, rating: 4.6 },
  { id: 3, employee_code: 'DR-003', name: 'Suresh Patil', phone: '+91-9876500003', status: 'AVAILABLE', assigned_vehicle_id: 3, shift_start: '08:00', shift_end: '17:00', hours_driven_today: 1.0, safety_score: 96, rating: 4.9 },
  { id: 4, employee_code: 'DR-004', name: 'Vikram Singh', phone: '+91-9876500004', status: 'ON_TRIP', assigned_vehicle_id: 4, shift_start: '05:00', shift_end: '14:00', hours_driven_today: 6.2, safety_score: 83, rating: 4.4 },
  { id: 5, employee_code: 'DR-005', name: 'Manoj Deshmukh', phone: '+91-9876500005', status: 'ON_TRIP', assigned_vehicle_id: 5, shift_start: '08:30', shift_end: '17:30', hours_driven_today: 2.5, safety_score: 95, rating: 4.8 },
  { id: 6, employee_code: 'DR-006', name: 'Deepak Joshi', phone: '+91-9876500006', status: 'ON_TRIP', assigned_vehicle_id: 6, shift_start: '06:00', shift_end: '15:00', hours_driven_today: 5.1, safety_score: 88, rating: 4.5 },
  { id: 7, employee_code: 'DR-007', name: 'Rahul Mane', phone: '+91-9876500007', status: 'ON_TRIP', assigned_vehicle_id: 7, shift_start: '07:30', shift_end: '16:30', hours_driven_today: 4.0, safety_score: 90, rating: 4.7 },
  { id: 8, employee_code: 'DR-008', name: 'Kiran Gavde', phone: '+91-9876500008', status: 'ON_TRIP', assigned_vehicle_id: 8, shift_start: '08:00', shift_end: '17:00', hours_driven_today: 3.5, safety_score: 85, rating: 4.3 },
  { id: 9, employee_code: 'DR-009', name: 'Prakash Shinde', phone: '+91-9876500009', status: 'ON_TRIP', assigned_vehicle_id: 9, shift_start: '06:30', shift_end: '15:30', hours_driven_today: 4.8, safety_score: 92, rating: 4.6 },
  { id: 10, employee_code: 'DR-010', name: 'Sanjay Pawar', phone: '+91-9876500010', status: 'ON_TRIP', assigned_vehicle_id: 10, shift_start: '09:00', shift_end: '18:00', hours_driven_today: 2.1, safety_score: 97, rating: 4.9 },
  { id: 11, employee_code: 'DR-011', name: 'Nitin Kulkarni', phone: '+91-9876500011', status: 'AVAILABLE', assigned_vehicle_id: 11, shift_start: '08:00', shift_end: '17:00', hours_driven_today: 0.0, safety_score: 94, rating: 4.7 },
  { id: 12, employee_code: 'DR-012', name: 'Aakash Jadhav', phone: '+91-9876500012', status: 'ON_TRIP', assigned_vehicle_id: 12, shift_start: '10:00', shift_end: '19:00', hours_driven_today: 1.8, safety_score: 93, rating: 4.6 },
  { id: 13, employee_code: 'DR-013', name: 'Prashant More', phone: '+91-9876500013', status: 'ON_TRIP', assigned_vehicle_id: 14, shift_start: '07:00', shift_end: '16:00', hours_driven_today: 3.9, safety_score: 89, rating: 4.5 },
  { id: 14, employee_code: 'DR-014', name: 'Sachin Gaikwad', phone: '+91-9876500014', status: 'ON_TRIP', assigned_vehicle_id: 15, shift_start: '08:00', shift_end: '17:00', hours_driven_today: 2.2, safety_score: 95, rating: 4.8 },
  { id: 15, employee_code: 'DR-015', name: 'Ganesh Bhosale', phone: '+91-9876500015', status: 'AVAILABLE', assigned_vehicle_id: 16, shift_start: '08:00', shift_end: '17:00', hours_driven_today: 0.5, safety_score: 92, rating: 4.4 },
  { id: 16, employee_code: 'DR-016', name: 'Vilas Thorat', phone: '+91-9876500016', status: 'AVAILABLE', assigned_vehicle_id: 17, shift_start: '08:30', shift_end: '17:30', hours_driven_today: 0.0, safety_score: 93, rating: 4.6 },
  { id: 17, employee_code: 'DR-017', name: 'Swapnil Rane', phone: '+91-9876500017', status: 'AVAILABLE', assigned_vehicle_id: 18, shift_start: '09:00', shift_end: '18:00', hours_driven_today: 0.0, safety_score: 91, rating: 4.5 },
  { id: 18, employee_code: 'DR-018', name: 'Mahesh Shinde', phone: '+91-9876500018', status: 'AVAILABLE', assigned_vehicle_id: 20, shift_start: '08:00', shift_end: '17:00', hours_driven_today: 0.0, safety_score: 94, rating: 4.7 },
  { id: 19, employee_code: 'DR-019', name: 'Rohan Sawant', phone: '+91-9876500019', status: 'OFF_DUTY', assigned_vehicle_id: null, shift_start: '22:00', shift_end: '06:00', hours_driven_today: 0.0, safety_score: 87, rating: 4.2 },
  { id: 20, employee_code: 'DR-020', name: 'Anand Kadam', phone: '+91-9876500020', status: 'UNAVAILABLE', assigned_vehicle_id: null, shift_start: '08:00', shift_end: '17:00', hours_driven_today: 0.0, safety_score: 89, rating: 4.4 },
];

// ==========================================
// 4. VEHICLES — 20 RECORDS
// ==========================================
export const DEMO_VEHICLES = [
  { id: 1, vehicle_id: 'V001', reg: 'MH-01-VN-1001', type: 'Van', cap: 1000, load: 720, driver: 1, status: 'active', city: 'mumbai', fuel_type: 'Diesel', fuel: 68, odo: 48200, dist: 65, risk: 25, maint: 'OK' },
  { id: 2, vehicle_id: 'V002', reg: 'MH-04-MT-1002', type: 'Mini Truck', cap: 1500, load: 1100, driver: 2, status: 'active', city: 'thane', fuel_type: 'Diesel', fuel: 54, odo: 36400, dist: 82, risk: 38, maint: 'OK' },
  { id: 3, vehicle_id: 'V003', reg: 'MH-12-LC-1003', type: 'Light Commercial Vehicle', cap: 2500, load: 0, driver: 3, status: 'available', city: 'pune', fuel_type: 'Diesel', fuel: 82, odo: 29800, dist: 12, risk: 10, maint: 'OK' },
  { id: 4, vehicle_id: 'V004', reg: 'MH-01-TR-1004', type: 'Medium Truck', cap: 5000, load: 4100, driver: 4, status: 'active', city: 'mumbai', fuel_type: 'Diesel', fuel: 45, odo: 81200, dist: 145, risk: 85, maint: 'DUE_SOON' },
  { id: 5, vehicle_id: 'V005', reg: 'MH-43-PK-1005', type: 'Pickup', cap: 1200, load: 850, driver: 5, status: 'active', city: 'vashi', fuel_type: 'CNG', fuel: 76, odo: 21500, dist: 45, risk: 28, maint: 'OK' },
  { id: 6, vehicle_id: 'V006', reg: 'MH-31-TR-1006', type: 'Medium Truck', cap: 6000, load: 4800, driver: 6, status: 'active', city: 'nagpur', fuel_type: 'Diesel', fuel: 61, odo: 94100, dist: 160, risk: 52, maint: 'OK' },
  { id: 7, vehicle_id: 'V007', reg: 'GJ-05-LC-1007', type: 'Light Commercial Vehicle', cap: 3000, load: 2400, driver: 7, status: 'active', city: 'surat', fuel_type: 'Diesel', fuel: 48, odo: 43700, dist: 110, risk: 64, maint: 'OK' },
  { id: 8, vehicle_id: 'V008', reg: 'MH-15-VN-1008', type: 'Van', cap: 1000, load: 820, driver: 8, status: 'active', city: 'nashik', fuel_type: 'Diesel', fuel: 69, odo: 38900, dist: 78, risk: 71, maint: 'OK' },
  { id: 9, vehicle_id: 'V009', reg: 'MH-20-TR-1009', type: 'Medium Truck', cap: 5500, load: 3900, driver: 9, status: 'active', city: 'sambhajinagar', fuel_type: 'Diesel', fuel: 58, odo: 67300, dist: 135, risk: 38, maint: 'OK' },
  { id: 10, vehicle_id: 'V010', reg: 'MH-12-MT-1010', type: 'Mini Truck', cap: 1400, load: 950, driver: 10, status: 'active', city: 'pune', fuel_type: 'Diesel', fuel: 72, odo: 31200, dist: 55, risk: 55, maint: 'OK' },
  { id: 11, vehicle_id: 'V011', reg: 'MH-02-LC-1011', type: 'Light Commercial Vehicle', cap: 2800, load: 0, driver: 11, status: 'available', city: 'mumbai', fuel_type: 'Diesel', fuel: 90, odo: 19400, dist: 0, risk: 5, maint: 'OK' },
  { id: 12, vehicle_id: 'V012', reg: 'MH-14-VN-1012', type: 'Van', cap: 800, load: 520, driver: 12, status: 'active', city: 'lonavala', fuel_type: 'EV', fuel: 64, odo: 14600, dist: 48, risk: 22, maint: 'OK' },
  { id: 13, vehicle_id: 'V013', reg: 'MH-12-TR-1013', type: 'Medium Truck', cap: 5000, load: 0, driver: null, status: 'maintenance', city: 'pune', fuel_type: 'Diesel', fuel: 30, odo: 105000, dist: 0, risk: 0, maint: 'IN_MAINTENANCE' },
  { id: 14, vehicle_id: 'V014', reg: 'MH-46-TR-1014', type: 'Medium Truck', cap: 6000, load: 4600, driver: 13, status: 'active', city: 'panvel', fuel_type: 'Diesel', fuel: 55, odo: 74200, dist: 125, risk: 40, maint: 'OK' },
  { id: 15, vehicle_id: 'V015', reg: 'MH-43-MT-1015', type: 'Mini Truck', cap: 1200, load: 780, driver: 14, status: 'active', city: 'vashi', fuel_type: 'CNG', fuel: 80, odo: 27800, dist: 35, risk: 15, maint: 'OK' },
  { id: 16, vehicle_id: 'V016', reg: 'MH-04-PK-1016', type: 'Pickup', cap: 1500, load: 0, driver: 15, status: 'available', city: 'thane', fuel_type: 'Diesel', fuel: 88, odo: 18300, dist: 5, risk: 8, maint: 'OK' },
  { id: 17, vehicle_id: 'V017', reg: 'MH-15-LC-1017', type: 'Light Commercial Vehicle', cap: 3200, load: 0, driver: 16, status: 'available', city: 'nashik', fuel_type: 'Diesel', fuel: 75, odo: 33100, dist: 0, risk: 10, maint: 'OK' },
  { id: 18, vehicle_id: 'V018', reg: 'GJ-05-VN-1018', type: 'Van', cap: 900, load: 0, driver: 17, status: 'idle', city: 'surat', fuel_type: 'EV', fuel: 92, odo: 12400, dist: 0, risk: 5, maint: 'OK' },
  { id: 19, vehicle_id: 'V019', reg: 'MH-31-TR-1019', type: 'Medium Truck', cap: 5200, load: 0, driver: null, status: 'maintenance', city: 'nagpur', fuel_type: 'Diesel', fuel: 25, odo: 98700, dist: 0, risk: 0, maint: 'IN_MAINTENANCE' },
  { id: 20, vehicle_id: 'V020', reg: 'MH-20-LC-1020', type: 'Light Commercial Vehicle', cap: 2600, load: 0, driver: 18, status: 'available', city: 'sambhajinagar', fuel_type: 'Diesel', fuel: 84, odo: 22100, dist: 0, risk: 10, maint: 'OK' },
];

// ==========================================
// 5. TRIPS — 30 RECORDS
// ==========================================
export const DEMO_TRIPS = [
  // 12 ACTIVE TRIPS
  { id: 1, tid: 'TRP-001', v: 1, d: 1, from: 'mumbai', to: 'pune', dist: 150, pdist: 148, prog: 45, status: 'in_progress', delay: 35, risk: 82, depH: -2.5, arrH: 1.5, traf: 'HIGH', wth: 'Light Rain', inc: 'Mumbai-Pune Expressway Accident' },
  { id: 2, tid: 'TRP-002', v: 4, d: 4, from: 'mumbai', to: 'nagpur', dist: 780, pdist: 760, prog: 32, status: 'in_progress', delay: 48, risk: 85, depH: -5.0, arrH: 7.0, traf: 'SEVERE', wth: 'Overcast', inc: 'Kasara Ghat Landslide Closure' },
  { id: 3, tid: 'TRP-003', v: 8, d: 8, from: 'nashik', to: 'pune', dist: 210, pdist: 210, prog: 55, status: 'in_progress', delay: 22, risk: 71, depH: -3.5, arrH: 1.5, traf: 'HIGH', wth: 'Clear', inc: 'Alephata NH-60 Breakdown' },
  { id: 4, tid: 'TRP-004', v: 2, d: 2, from: 'thane', to: 'pune', dist: 155, pdist: 150, prog: 60, status: 'in_progress', delay: 14, risk: 48, depH: -2.5, arrH: 1.0, traf: 'MODERATE', wth: 'Clear', inc: 'None' },
  { id: 5, tid: 'TRP-005', v: 6, d: 6, from: 'nagpur', to: 'sambhajinagar', dist: 480, pdist: 480, prog: 38, status: 'in_progress', delay: 18, risk: 52, depH: -4.5, arrH: 3.5, traf: 'MODERATE', wth: 'Heavy Rain Alert', inc: 'Vidarbha Monsoon Slowdown' },
  { id: 6, tid: 'TRP-006', v: 7, d: 7, from: 'surat', to: 'nashik', dist: 280, pdist: 275, prog: 50, status: 'in_progress', delay: 25, risk: 64, depH: -3.5, arrH: 2.5, traf: 'HIGH', wth: 'Clear', inc: 'Malegaon Highway Bottleneck' },
  { id: 7, tid: 'TRP-007', v: 10, d: 10, from: 'pune', to: 'mumbai', dist: 148, pdist: 148, prog: 70, status: 'in_progress', delay: 9, risk: 55, depH: -2.5, arrH: 0.5, traf: 'MODERATE', wth: 'Clear', inc: 'None' },
  { id: 8, tid: 'TRP-008', v: 5, d: 5, from: 'vashi', to: 'pune', dist: 138, pdist: 135, prog: 65, status: 'in_progress', delay: 6, risk: 32, depH: -2.0, arrH: 0.8, traf: 'MODERATE', wth: 'Clear', inc: 'None' },
  { id: 9, tid: 'TRP-009', v: 9, d: 9, from: 'sambhajinagar', to: 'nagpur', dist: 460, pdist: 460, prog: 28, status: 'in_progress', delay: 10, risk: 38, depH: -4.0, arrH: 4.5, traf: 'MODERATE', wth: 'Clear', inc: 'None' },
  { id: 10, tid: 'TRP-010', v: 12, d: 12, from: 'lonavala', to: 'pune', dist: 65, pdist: 65, prog: 80, status: 'in_progress', delay: 4, risk: 22, depH: -1.0, arrH: 0.3, traf: 'LOW', wth: 'Clear', inc: 'None' },
  { id: 11, tid: 'TRP-011', v: 14, d: 13, from: 'panvel', to: 'nashik', dist: 190, pdist: 185, prog: 52, status: 'in_progress', delay: 12, risk: 40, depH: -3.0, arrH: 1.8, traf: 'MODERATE', wth: 'Clear', inc: 'None' },
  { id: 12, tid: 'TRP-012', v: 15, d: 14, from: 'vashi', to: 'thane', dist: 25, pdist: 25, prog: 75, status: 'in_progress', delay: 2, risk: 15, depH: -0.8, arrH: 0.2, traf: 'LOW', wth: 'Clear', inc: 'None' },

  // 16 HISTORICAL COMPLETED TRIPS (planned_eta != actual_arrival)
  { id: 13, tid: 'TRP-013', v: 1, d: 1, from: 'mumbai', to: 'pune', dist: 150, pdist: 148, prog: 100, status: 'completed', delay: 10, risk: 0, depH: -14.0, arrH: -10.5, traf: 'MODERATE', wth: 'Clear', inc: 'None' },
  { id: 14, tid: 'TRP-014', v: 4, d: 4, from: 'pune', to: 'mumbai', dist: 150, pdist: 148, prog: 100, status: 'completed', delay: 55, risk: 0, depH: -26.0, arrH: -21.0, traf: 'HIGH', wth: 'Heavy Rain', inc: 'Lonavala Ghat Congestion' },
  { id: 15, tid: 'TRP-015', v: 2, d: 2, from: 'nashik', to: 'pune', dist: 210, pdist: 210, prog: 100, status: 'completed', delay: 18, risk: 0, depH: -20.0, arrH: -15.5, traf: 'MODERATE', wth: 'Overcast', inc: 'None' },
  { id: 16, tid: 'TRP-016', v: 3, d: 3, from: 'pune', to: 'thane', dist: 155, pdist: 155, prog: 100, status: 'completed', delay: 0, risk: 0, depH: -18.0, arrH: -14.5, traf: 'LOW', wth: 'Clear', inc: 'None' },
  { id: 17, tid: 'TRP-017', v: 5, d: 5, from: 'mumbai', to: 'panvel', dist: 45, pdist: 45, prog: 100, status: 'completed', delay: 22, risk: 0, depH: -16.0, arrH: -14.0, traf: 'HIGH', wth: 'Fog', inc: 'Panvel Overpass Accident' },
  { id: 18, tid: 'TRP-018', v: 7, d: 7, from: 'surat', to: 'mumbai', dist: 280, pdist: 280, prog: 100, status: 'completed', delay: 15, risk: 0, depH: -30.0, arrH: -24.0, traf: 'MODERATE', wth: 'Clear', inc: 'None' },
  { id: 19, tid: 'TRP-019', v: 8, d: 8, from: 'nashik', to: 'sambhajinagar', dist: 250, pdist: 250, prog: 100, status: 'completed', delay: 0, risk: 0, depH: -28.0, arrH: -23.0, traf: 'LOW', wth: 'Clear', inc: 'None' },
  { id: 20, tid: 'TRP-020', v: 6, d: 6, from: 'mumbai', to: 'nagpur', dist: 780, pdist: 760, prog: 100, status: 'completed', delay: 60, risk: 0, depH: -48.0, arrH: -34.0, traf: 'SEVERE', wth: 'Heavy Rain', inc: 'Kasara Ghat Closure' },
  { id: 21, tid: 'TRP-021', v: 10, d: 10, from: 'lonavala', to: 'pune', dist: 65, pdist: 65, prog: 100, status: 'completed', delay: 4, risk: 0, depH: -12.0, arrH: -10.5, traf: 'LOW', wth: 'Clear', inc: 'None' },
  { id: 22, tid: 'TRP-022', v: 12, d: 12, from: 'pune', to: 'nashik', dist: 210, pdist: 210, prog: 100, status: 'completed', delay: 25, risk: 0, depH: -36.0, arrH: -31.0, traf: 'HIGH', wth: 'Clear', inc: 'Malegaon Bottleneck' },
  { id: 23, tid: 'TRP-023', v: 14, d: 13, from: 'vashi', to: 'pune', dist: 138, pdist: 135, prog: 100, status: 'completed', delay: 8, risk: 0, depH: -22.0, arrH: -19.0, traf: 'LOW', wth: 'Clear', inc: 'None' },
  { id: 24, tid: 'TRP-024', v: 15, d: 14, from: 'panvel', to: 'thane', dist: 38, pdist: 38, prog: 100, status: 'completed', delay: 12, risk: 0, depH: -15.0, arrH: -13.5, traf: 'MODERATE', wth: 'Overcast', inc: 'None' },
  { id: 25, tid: 'TRP-025', v: 1, d: 1, from: 'thane', to: 'vashi', dist: 25, pdist: 25, prog: 100, status: 'completed', delay: 0, risk: 0, depH: -24.0, arrH: -23.0, traf: 'LOW', wth: 'Clear', inc: 'None' },
  { id: 26, tid: 'TRP-026', v: 9, d: 9, from: 'nagpur', to: 'sambhajinagar', dist: 480, pdist: 480, prog: 100, status: 'completed', delay: 45, risk: 0, depH: -40.0, arrH: -30.0, traf: 'SEVERE', wth: 'Thunderstorm', inc: 'Severe Weather Delay' },
  { id: 27, tid: 'TRP-027', v: 2, d: 2, from: 'pune', to: 'mumbai', dist: 150, pdist: 148, prog: 100, status: 'completed', delay: 15, risk: 0, depH: -32.0, arrH: -28.5, traf: 'MODERATE', wth: 'Clear', inc: 'Toll Plaza Queue' },
  { id: 28, tid: 'TRP-028', v: 7, d: 7, from: 'nashik', to: 'surat', dist: 280, pdist: 280, prog: 100, status: 'completed', delay: 2, risk: 0, depH: -44.0, arrH: -38.5, traf: 'LOW', wth: 'Clear', inc: 'None' },

  // 2 SCHEDULED / PLANNED TRIPS
  { id: 29, tid: 'TRP-029', v: 3, d: 3, from: 'pune', to: 'nashik', dist: 210, pdist: 210, prog: 0, status: 'scheduled', delay: 0, risk: 10, depH: 2.0, arrH: 6.0, traf: 'LOW', wth: 'Clear', inc: 'None' },
  { id: 30, tid: 'TRP-030', v: 11, d: 11, from: 'mumbai', to: 'surat', dist: 280, pdist: 280, prog: 0, status: 'scheduled', delay: 0, risk: 5, depH: 4.0, arrH: 9.5, traf: 'LOW', wth: 'Clear', inc: 'None' },
];

// ==========================================
// 6. DELIVERIES — 50 RECORDS
// ==========================================
export const DEMO_DELIVERIES = [
  // 10 CRITICAL DELIVERIES (~20%)
  { id: 1, did: 'DEL-001', cust: 'MED-EXP-7701', from: 'mumbai', to: 'pune', prio: 'critical', wt: 280, st: 'in_transit', v: 1, t: 1, d: 1, risk: 85, name: 'MedExpress Healthcare', desc: 'Critical ICU Vaccines - Strict Cold-Chain 2°C - 8°C', req: 'Temperature-sensitive cold chain' },
  { id: 2, did: 'DEL-002', cust: 'BHARAT-ELC-7702', from: 'mumbai', to: 'nagpur', prio: 'critical', wt: 520, st: 'at_risk', v: 4, t: 2, d: 4, risk: 88, name: 'Bharat Electronics Ltd', desc: 'Avionics radar micro-controller modules', req: 'Fragile precision electronic cargo' },
  { id: 3, did: 'DEL-003', cust: 'APOLLO-HSP-7703', from: 'nashik', to: 'pune', prio: 'critical', wt: 190, st: 'in_transit', v: 8, t: 3, d: 8, risk: 75, name: 'Apollo Critical Care', desc: 'Emergency hemodialysis consumable kits', req: 'Emergency hospital delivery' },
  { id: 4, did: 'DEL-004', cust: 'RELIANCE-IND-7704', from: 'mumbai', to: 'nagpur', prio: 'critical', wt: 380, st: 'at_risk', v: 4, t: 2, d: 4, risk: 82, name: 'Reliance Industries', desc: 'Petrochemical refinery safety sensor valve', req: 'Hazardous handling protocol' },
  { id: 5, did: 'DEL-005', cust: 'TATA-AERO-7705', from: 'pune', to: 'mumbai', prio: 'critical', wt: 320, st: 'in_transit', v: 10, t: 7, d: 10, risk: 62, name: 'Tata Aerospace Division', desc: 'Turbine titanium fasteners for aircraft assembly', req: 'High-value sealed bond' },
  { id: 6, did: 'DEL-006', cust: 'CIPLA-PHR-7706', from: 'surat', to: 'nashik', prio: 'critical', wt: 410, st: 'in_transit', v: 7, t: 6, d: 7, risk: 70, name: 'Cipla Laboratories', desc: 'Active pharmaceutical oncology raw ingredients', req: 'Temperature controlled 15°C - 25°C' },
  { id: 7, did: 'DEL-007', cust: 'ADANI-PWR-7707', from: 'thane', to: 'pune', prio: 'critical', wt: 450, st: 'in_transit', v: 2, t: 4, d: 2, risk: 55, name: 'Adani Energy Grid', desc: 'Substation SF6 high voltage breaker unit', req: 'Heavy lift tailgate required' },
  { id: 8, did: 'DEL-008', cust: 'LUPIN-BIO-7708', from: 'nashik', to: 'pune', prio: 'critical', wt: 160, st: 'in_transit', v: 8, t: 3, d: 8, risk: 72, name: 'Lupin Biotech', desc: 'Diagnostic biological reagent vials', req: 'Zero-shock handling' },
  { id: 9, did: 'DEL-009', cust: 'ISRO-PRP-7709', from: 'nagpur', to: 'sambhajinagar', prio: 'critical', wt: 600, st: 'in_transit', v: 6, t: 5, d: 6, risk: 58, name: 'ISRO Support Logistics', desc: 'Cryogenic telemetry sensor assemblies', req: 'Special security clearance' },
  { id: 10, did: 'DEL-010', cust: 'SERUM-INS-7710', from: 'pune', to: 'nashik', prio: 'critical', wt: 350, st: 'pending', v: null, t: null, d: null, risk: 15, name: 'Serum Institute of India', desc: 'Scheduled sterile vaccine export batch', req: 'Cold chain container' },

  // 25 HIGH PRIORITY DELIVERIES (~50%)
  { id: 11, did: 'DEL-011', cust: 'TATA-MOT-8801', from: 'pune', to: 'mumbai', prio: 'high', wt: 420, st: 'in_transit', v: 1, t: 1, d: 1, risk: 80, name: 'Tata Motors Assembly', desc: 'Engine control units for EV production line', req: 'Just-in-Time SLA' },
  { id: 12, did: 'DEL-012', cust: 'MAHINDRA-8802', from: 'nagpur', to: 'sambhajinagar', prio: 'high', wt: 850, st: 'in_transit', v: 6, t: 5, d: 6, risk: 54, name: 'Mahindra Farm Equipment', desc: 'Tractor hydraulic pump sets', req: 'Standard palletized' },
  { id: 13, did: 'DEL-013', cust: 'GODREJ-CP-8803', from: 'surat', to: 'nashik', prio: 'high', wt: 310, st: 'in_transit', v: 7, t: 6, d: 7, risk: 65, name: 'Godrej Consumer', desc: 'FMCG personal care distribution stock', req: 'Fast dispatch' },
  { id: 14, did: 'DEL-014', cust: 'WIPRO-ENT-8804', from: 'pune', to: 'mumbai', prio: 'high', wt: 220, st: 'in_transit', v: 10, t: 7, d: 10, risk: 58, name: 'Wipro Enterprise IT', desc: 'High-density enterprise server racks', req: 'Moisture barrier wrapping' },
  { id: 15, did: 'DEL-015', cust: 'BAJAJ-AUT-8805', from: 'sambhajinagar', to: 'nagpur', prio: 'high', wt: 650, st: 'in_transit', v: 9, t: 9, d: 9, risk: 42, name: 'Bajaj Auto Plant', desc: 'Motorcycle crankshaft components', req: 'Heavy pallet load' },
  { id: 16, did: 'DEL-016', cust: 'JSW-STL-8806', from: 'mumbai', to: 'nagpur', prio: 'high', wt: 1200, st: 'in_transit', v: 4, t: 2, d: 4, risk: 84, name: 'JSW Steel Processing', desc: 'Precision cold-rolled steel alloy sheets', req: 'Flatbed strap secured' },
  { id: 17, did: 'DEL-017', cust: 'SIEMENS-IND-8807', from: 'panvel', to: 'nashik', prio: 'high', wt: 480, st: 'in_transit', v: 14, t: 11, d: 13, risk: 44, name: 'Siemens Industrial Automation', desc: 'Programmable Logic Controller cabinets', req: 'Anti-static container' },
  { id: 18, did: 'DEL-018', cust: 'GLENMARK-8808', from: 'nashik', to: 'pune', prio: 'high', wt: 320, st: 'in_transit', v: 8, t: 3, d: 8, risk: 68, name: 'Glenmark Pharmaceuticals', desc: 'Inhalation aerosol clinical formulations', req: 'Temperature monitor' },
  { id: 19, did: 'DEL-019', cust: 'SCHNEIDER-8809', from: 'thane', to: 'pune', prio: 'high', wt: 390, st: 'in_transit', v: 2, t: 4, d: 2, risk: 50, name: 'Schneider Electric', desc: 'Modular micro-grid distribution boards', req: 'Standard' },
  { id: 20, did: 'DEL-020', cust: 'KIRLOSKAR-8810', from: 'sambhajinagar', to: 'nagpur', prio: 'high', wt: 580, st: 'in_transit', v: 9, t: 9, d: 9, risk: 36, name: 'Kirloskar Oil Engines', desc: 'Diesel generator water pump casings', req: 'Standard' },
  { id: 21, did: 'DEL-021', cust: 'SUN-PHR-8811', from: 'mumbai', to: 'pune', prio: 'high', wt: 260, st: 'in_transit', v: 1, t: 1, d: 1, risk: 78, name: 'Sun Pharma Exports', desc: 'Active therapeutic compounds', req: 'Priority express' },
  { id: 22, did: 'DEL-022', cust: 'ASIAN-PNT-8812', from: 'thane', to: 'pune', prio: 'high', wt: 340, st: 'in_transit', v: 2, t: 4, d: 2, risk: 46, name: 'Asian Paints Industrial', desc: 'Automotive primer resin drums', req: 'Hazardous flammability' },
  { id: 23, did: 'DEL-023', cust: 'LNT-CON-8813', from: 'panvel', to: 'nashik', prio: 'high', wt: 880, st: 'in_transit', v: 14, t: 11, d: 13, risk: 42, name: 'L&T Heavy Engineering', desc: 'Structural post-tensioning bridge anchor heads', req: 'Heavy machinery' },
  { id: 24, did: 'DEL-024', cust: 'ABB-IND-8814', from: 'vashi', to: 'pune', prio: 'high', wt: 410, st: 'in_transit', v: 5, t: 8, d: 5, risk: 34, name: 'ABB Power Grids', desc: 'Substation digital relay panels', req: 'Handle with care' },
  { id: 25, did: 'DEL-025', cust: 'HAVELLS-8815', from: 'surat', to: 'nashik', prio: 'high', wt: 490, st: 'in_transit', v: 7, t: 6, d: 7, risk: 62, name: 'Havells Electrical', desc: 'Armored industrial power cables', req: 'Cable drum spool' },
  { id: 26, did: 'DEL-026', cust: 'ADANI-PRT-8816', from: 'mumbai', to: 'surat', prio: 'high', wt: 750, st: 'pending', v: null, t: null, d: null, risk: 10, name: 'Adani Ports Logistics', desc: 'Marine container reefer spare parts', req: 'Port staging' },
  { id: 27, did: 'DEL-027', cust: 'BHARAT-FRG-8817', from: 'pune', to: 'nagpur', prio: 'high', wt: 620, st: 'assigned', v: 3, t: 29, d: 3, risk: 12, name: 'Bharat Forge Automotive', desc: 'Precision hot forged crankshafts', req: 'Direct factory delivery' },
  { id: 28, did: 'DEL-028', cust: 'ACC-CMT-8818', from: 'nagpur', to: 'sambhajinagar', prio: 'high', wt: 1400, st: 'in_transit', v: 6, t: 5, d: 6, risk: 50, name: 'ACC Cements Ltd', desc: 'Specialized refractory mortar bags', req: 'Moisture tight' },
  { id: 29, did: 'DEL-029', cust: 'HINDALCO-8819', from: 'panvel', to: 'nashik', prio: 'high', wt: 820, st: 'in_transit', v: 14, t: 11, d: 13, risk: 38, name: 'Hindalco Industries', desc: 'Aluminum extruded profiles for metro coaches', req: 'Length > 4 meters' },
  { id: 30, did: 'DEL-030', cust: 'EXIDE-IND-8820', from: 'vashi', to: 'pune', prio: 'high', wt: 440, st: 'in_transit', v: 5, t: 8, d: 5, risk: 30, name: 'Exide Industries', desc: 'Industrial lead-acid backup battery cells', req: 'Upright stacking only' },
  { id: 31, did: 'DEL-031', cust: 'AMUL-DAIRY-8821', from: 'lonavala', to: 'pune', prio: 'high', wt: 320, st: 'in_transit', v: 12, t: 10, d: 12, risk: 24, name: 'Amul Dairy Federation', desc: 'Perishable artisanal cheese wheels', req: 'Refrigerated 4°C' },
  { id: 32, did: 'DEL-032', cust: 'RAYMOND-8822', from: 'surat', to: 'nashik', prio: 'high', wt: 380, st: 'in_transit', v: 7, t: 6, d: 7, risk: 60, name: 'Raymond Apparel Ltd', desc: 'Premium worsted wool fabric bolts', req: 'Dry container' },
  { id: 33, did: 'DEL-033', cust: 'THERMAX-8823', from: 'pune', to: 'mumbai', prio: 'high', wt: 510, st: 'in_transit', v: 10, t: 7, d: 10, risk: 52, name: 'Thermax Clean Energy', desc: 'Heat recovery steam generator valves', req: 'Crane unloader' },
  { id: 34, did: 'DEL-034', cust: 'TCS-DAT-8824', from: 'mumbai', to: 'pune', prio: 'high', wt: 360, st: 'delivered', v: 1, t: 13, d: 1, risk: 0, name: 'Tata Consultancy Services', desc: 'Corporate data center edge servers', req: 'Delivered successfully' },
  { id: 35, did: 'DEL-035', cust: 'EMCURE-8825', from: 'nashik', to: 'pune', prio: 'high', wt: 240, st: 'delivered', v: 2, t: 15, d: 2, risk: 0, name: 'Emcure Pharmaceuticals', desc: 'Antibiotic formulation shipment', req: 'Delivered successfully' },

  // 15 LOW & MEDIUM PRIORITY DELIVERIES (~30%)
  { id: 36, did: 'DEL-036', cust: 'HALDIRAM-9901', from: 'nagpur', to: 'sambhajinagar', prio: 'normal', wt: 350, st: 'in_transit', v: 6, t: 5, d: 6, risk: 45, name: 'Haldiram Foods', desc: 'Packaged snack crates for regional supermarkets', req: 'Dry cargo' },
  { id: 37, did: 'DEL-037', cust: 'PARLE-PRD-9902', from: 'vashi', to: 'thane', prio: 'normal', wt: 210, st: 'in_transit', v: 15, t: 12, d: 14, risk: 12, name: 'Parle Products Ltd', desc: 'Biscuits wholesale carton shipment', req: 'Standard' },
  { id: 38, did: 'DEL-038', cust: 'BRITANNIA-9903', from: 'vashi', to: 'thane', prio: 'normal', wt: 180, st: 'in_transit', v: 15, t: 12, d: 14, risk: 14, name: 'Britannia Industries', desc: 'Bakery retail distribution packs', req: 'Standard' },
  { id: 39, did: 'DEL-039', cust: 'DABUR-IND-9904', from: 'thane', to: 'pune', prio: 'normal', wt: 190, st: 'in_transit', v: 2, t: 4, d: 2, risk: 42, name: 'Dabur India', desc: 'Ayurvedic wellness products', req: 'Standard' },
  { id: 40, did: 'DEL-040', cust: 'MARICO-LTD-9905', from: 'mumbai', to: 'thane', prio: 'low', wt: 120, st: 'delivered', v: 5, t: null, d: 5, risk: 0, name: 'Marico Consumer Goods', desc: 'Edible cooking oils shipment', req: 'Delivered' },
  { id: 41, did: 'DEL-041', cust: 'ITC-LTD-9906', from: 'vashi', to: 'thane', prio: 'normal', wt: 160, st: 'in_transit', v: 15, t: 12, d: 14, risk: 10, name: 'ITC FMCG Division', desc: 'Stationery and packaging supplies', req: 'Standard' },
  { id: 42, did: 'DEL-042', cust: 'CADBURY-9907', from: 'surat', to: 'nashik', prio: 'normal', wt: 240, st: 'in_transit', v: 7, t: 6, d: 7, risk: 56, name: 'Mondelez India', desc: 'Confectionery chocolate boxes', req: 'Climate controlled 18°C' },
  { id: 43, did: 'DEL-043', cust: 'HUL-FMCG-9908', from: 'thane', to: 'sambhajinagar', prio: 'normal', wt: 450, st: 'pending', v: null, t: null, d: null, risk: 10, name: 'Hindustan Unilever', desc: 'Household detergent sacks', req: 'Palletized' },
  { id: 44, did: 'DEL-044', cust: 'INFOSYS-9909', from: 'pune', to: 'mumbai', prio: 'low', wt: 130, st: 'in_transit', v: 10, t: 7, d: 10, risk: 46, name: 'Infosys Facilities', desc: 'Ergonomic office peripherals', req: 'Standard' },
  { id: 45, did: 'DEL-045', cust: 'HDFC-SPL-9910', from: 'mumbai', to: 'thane', prio: 'low', wt: 110, st: 'delivered', v: 5, t: null, d: 5, risk: 0, name: 'HDFC Corporate Stationery', desc: 'Pre-printed forms and envelopes', req: 'Delivered' },
  { id: 46, did: 'DEL-046', cust: 'PRAJ-IND-9911', from: 'pune', to: 'nashik', prio: 'normal', wt: 290, st: 'delivered', v: 2, t: 15, d: 2, risk: 0, name: 'Praj Industries', desc: 'Biofuel fermentation piping flanges', req: 'Delivered' },
  { id: 47, did: 'DEL-047', cust: 'MAGANLAL-9912', from: 'lonavala', to: 'pune', prio: 'low', wt: 90, st: 'in_transit', v: 12, t: 10, d: 12, risk: 18, name: 'Maganlal Chikki Mart', desc: 'Confectionery peanut brittle boxes', req: 'Standard' },
  { id: 48, did: 'DEL-048', cust: 'CROMPTON-9913', from: 'sambhajinagar', to: 'nagpur', prio: 'normal', wt: 340, st: 'in_transit', v: 9, t: 9, d: 9, risk: 32, name: 'Crompton Greaves', desc: 'Submersible water pump motors', req: 'Standard' },
  { id: 49, did: 'DEL-049', cust: 'BLUE-DART-9914', from: 'mumbai', to: 'pune', prio: 'normal', wt: 170, st: 'cancelled', v: null, t: null, d: null, risk: 0, name: 'Express Freight Consolidation', desc: 'Customer cancelled order before pickup', req: 'Cancelled' },
  { id: 50, did: 'DEL-050', cust: 'DELHIVERY-9915', from: 'pune', to: 'nashik', prio: 'low', wt: 80, st: 'cancelled', v: null, t: null, d: null, risk: 0, name: 'E-commerce Returns Hub', desc: 'Rerouted to regional return facility', req: 'Cancelled' },
];

// ==========================================
// 7. INCIDENTS — 15 RECORDS
// ==========================================
export const DEMO_INCIDENTS = [
  // 5 ACTIVE INCIDENTS
  { id: 1, iid: 'INC-001', type: 'accident', sev: 'critical', title: 'Multi-vehicle collision near Khandala Ghat', desc: '3 trucks involved in pileup blocking 2 lanes toward Mumbai. Recovery cranes on site.', city: 'lonavala', road: 'Mumbai-Pune Expressway (KM 42)', delay: 35, st: 'active', src: 'Highway Patrol Alert', veh: ['V001', 'V010'], trp: ['TRP-001', 'TRP-007'] },
  { id: 2, iid: 'INC-002', type: 'road_closure', sev: 'critical', title: 'Landslide clearance on Kasara Ghat', desc: 'Debris and boulder fall after continuous rainfall. One lane open under police pilot.', city: 'nashik', road: 'NH-3 / Samruddhi Kasara Section', delay: 60, st: 'active', src: 'PWD Emergency Dispatch', veh: ['V004', 'V008'], trp: ['TRP-002', 'TRP-003'] },
  { id: 3, iid: 'INC-003', type: 'congestion', sev: 'high', title: 'Heavy freight queue at JNPT Terminal Gate 3', desc: 'System glitch at customs terminal causing 4km backlog of container traffic.', city: 'panvel', road: 'Uran Port Access Corridor', delay: 45, st: 'active', src: 'Port Authority Telematics', veh: ['V014'], trp: ['TRP-011'] },
  { id: 4, iid: 'INC-004', type: 'vehicle_breakdown', sev: 'high', title: 'Disabled flatbed blocking central lane at Alephata', desc: 'Commercial heavy vehicle experienced transmission failure on bridge approach.', city: 'pune', road: 'NH-60 Pune-Nashik Corridor', delay: 25, st: 'active', src: 'Driver Incident Beacon', veh: ['V008'], trp: ['TRP-003'] },
  { id: 5, iid: 'INC-005', type: 'flooding', sev: 'high', title: 'Monsoon waterlogging under Milan Subway', desc: '3 feet standing water on arterial connection. Traffic diverted to SV road flyover.', city: 'mumbai', road: 'Western Express Highway Link', delay: 40, st: 'active', src: 'Municipal Disaster Cell', veh: ['V001', 'V004'], trp: ['TRP-001', 'TRP-002'] },

  // 5 RESOLVED INCIDENTS
  { id: 6, iid: 'INC-006', type: 'accident', sev: 'medium', title: 'Overturned auto-rickshaw cleared from shoulder', desc: 'Vehicle towed away and oil spill neutralized by fire department.', city: 'vashi', road: 'Old Vashi Creek Bridge', delay: 15, st: 'resolved', src: 'Traffic Police Feed', veh: ['V015'], trp: ['TRP-012'] },
  { id: 7, iid: 'INC-007', type: 'construction', sev: 'low', title: 'Night resurfacing completed on Pune Bypass', desc: 'Asphalt paving completed ahead of morning commute. All 3 lanes restored.', city: 'pune', road: 'NH-48 Katraj Bypass', delay: 10, st: 'resolved', src: 'NHAI Notice', veh: ['V002'], trp: ['TRP-004'] },
  { id: 8, iid: 'INC-008', type: 'vehicle_breakdown', sev: 'medium', title: 'Tire replacement completed for container truck', desc: 'Support vehicle arrived on scene and road shoulder cleared.', city: 'panvel', road: 'Panvel-Sion Expressway', delay: 20, st: 'resolved', src: 'Fleet Response Team', veh: ['V014'], trp: ['TRP-011'] },
  { id: 9, iid: 'INC-009', type: 'weather', sev: 'medium', title: 'Gusty crosswinds subside on Bandra-Worli Sea Link', desc: 'Wind speed normalized below 35 km/h. Standard speed limit reinstated.', city: 'mumbai', road: 'Sea Link Corridor', delay: 15, st: 'resolved', src: 'IMD Coastal Station', veh: [], trp: [] },
  { id: 10, iid: 'INC-010', type: 'congestion', sev: 'low', title: 'Morning commuter peak cleared', desc: 'Traffic flow returning to baseline free-flow velocity of 55 km/h.', city: 'mumbai', road: 'Eastern Freeway', delay: 8, st: 'resolved', src: 'TomTom Flow API', veh: [], trp: [] },

  // 5 MONITORING INCIDENTS
  { id: 11, iid: 'INC-011', type: 'weather', sev: 'medium', title: 'Orange alert: Heavy rainfall forecast for Vidarbha', desc: 'IMD predicts intense squalls across Nagpur-Wardha belt over next 12 hours.', city: 'nagpur', road: 'Nagpur-Amravati NH-53', delay: 20, st: 'monitoring', src: 'IMD Weather Bureau', veh: ['V006'], trp: ['TRP-005'] },
  { id: 12, iid: 'INC-012', type: 'public_event', sev: 'medium', title: 'Religious procession scheduled near Nashik City', desc: 'Civic authorities announced traffic diversions between 14:00 and 19:00.', city: 'nashik', road: 'Old Agra Road / Panchavati', delay: 30, st: 'monitoring', src: 'District Administration', veh: ['V007'], trp: ['TRP-006'] },
  { id: 13, iid: 'INC-013', type: 'construction', sev: 'low', title: 'Bridge expansion joint maintenance planned', desc: 'Single-lane closure scheduled for routine bridge bearing inspection.', city: 'thane', road: 'Ghodbunder Road', delay: 15, st: 'monitoring', src: 'MMRDA Advisory', veh: ['V002'], trp: ['TRP-004'] },
  { id: 14, iid: 'INC-014', type: 'flooding', sev: 'medium', title: 'High tide alert in Mumbai harbor belt (4.6m)', desc: 'Low-lying port approach corridors monitored for seawater backflow.', city: 'mumbai', road: 'Sewri-Nhava Sheva Corridor', delay: 25, st: 'monitoring', src: 'BMC Flood Warning', veh: ['V005'], trp: ['TRP-008'] },
  { id: 15, iid: 'INC-015', type: 'road_closure', sev: 'high', title: 'VIP convoy movement scheduled on expressway', desc: 'Rolling 20-minute traffic hold anticipated near Talegaon toll plaza.', city: 'pune', road: 'Mumbai-Pune Expressway', delay: 30, st: 'monitoring', src: 'State Police Command', veh: ['V001', 'V010'], trp: ['TRP-001', 'TRP-007'] },
];

// ==========================================
// 8. ROUTES & ROUTE OPTIONS (For 10 active trips)
// ==========================================
export const DEMO_ROUTES = [
  // Trip 1: Mumbai to Pune
  { id: 1, rid: 'R-001A', trip: 1, name: 'Mumbai-Pune Expressway (Main)', dist: 148, dur: 185, cost: 2100, traf: 'HIGH', risk: 78, inc: 1, feas: true, st: 'CONTINGENCY', act: true },
  { id: 2, rid: 'R-001B', trip: 1, name: 'Old Mumbai-Pune Highway (NH-48)', dist: 162, dur: 175, cost: 2250, traf: 'MODERATE', risk: 38, inc: 0, feas: true, st: 'PREFERRED', act: false },
  { id: 3, rid: 'R-001C', trip: 1, name: 'Khopoli-Pali-Dindori Scenic Bypass', dist: 177, dur: 195, cost: 2400, traf: 'LOW', risk: 25, inc: 0, feas: true, st: 'ALTERNATIVE', act: false },

  // Trip 2: Mumbai to Nagpur
  { id: 4, rid: 'R-002A', trip: 2, name: 'Samruddhi Mahamarg Expressway', dist: 710, dur: 480, cost: 5200, traf: 'MODERATE', risk: 35, inc: 0, feas: true, st: 'PREFERRED', act: true },
  { id: 5, rid: 'R-002B', trip: 2, name: 'Via NH-3 & Dhule Industrial Belt', dist: 780, dur: 560, cost: 5800, traf: 'HIGH', risk: 85, inc: 1, feas: true, st: 'CONTINGENCY', act: false },

  // Trip 3: Nashik to Pune
  { id: 6, rid: 'R-003A', trip: 3, name: 'NH-60 Sangamner-Alephata Direct', dist: 210, dur: 240, cost: 1800, traf: 'HIGH', risk: 71, inc: 1, feas: true, st: 'CONTINGENCY', act: true },
  { id: 7, rid: 'R-003B', trip: 3, name: 'Via Ahmednagar Western Ring Bypass', dist: 240, dur: 255, cost: 2100, traf: 'LOW', risk: 32, inc: 0, feas: true, st: 'PREFERRED', act: false },

  // Trip 4: Thane to Pune
  { id: 8, rid: 'R-004A', trip: 4, name: 'Eastern Freeway & Expressway', dist: 155, dur: 170, cost: 1450, traf: 'MODERATE', risk: 48, inc: 0, feas: true, st: 'PREFERRED', act: true },
  { id: 9, rid: 'R-004B', trip: 4, name: 'Via Mumbra-Panvel Bypass', dist: 165, dur: 185, cost: 1550, traf: 'MODERATE', risk: 42, inc: 0, feas: true, st: 'ALTERNATIVE', act: false },

  // Trip 5: Nagpur to Sambhajinagar
  { id: 10, rid: 'R-005A', trip: 5, name: 'Via NH-53 & Jalna Corridor', dist: 480, dur: 420, cost: 3600, traf: 'MODERATE', risk: 52, inc: 1, feas: true, st: 'PREFERRED', act: true },
  { id: 11, rid: 'R-005B', trip: 5, name: 'Via Karanja-Mehkar Highway', dist: 510, dur: 460, cost: 3900, traf: 'LOW', risk: 36, inc: 0, feas: true, st: 'ALTERNATIVE', act: false },

  // Trip 6: Surat to Nashik
  { id: 12, rid: 'R-006A', trip: 6, name: 'NH-848 via Dharampur Ghat', dist: 280, dur: 320, cost: 2400, traf: 'HIGH', risk: 64, inc: 1, feas: true, st: 'CONTINGENCY', act: true },
  { id: 13, rid: 'R-006B', trip: 6, name: 'Via Navsari & Vansda Highway', dist: 305, dur: 335, cost: 2650, traf: 'LOW', risk: 34, inc: 0, feas: true, st: 'PREFERRED', act: false },

  // Trip 7: Pune to Mumbai
  { id: 14, rid: 'R-007A', trip: 7, name: 'Expressway Direct (Northbound)', dist: 148, dur: 160, cost: 2100, traf: 'MODERATE', risk: 55, inc: 1, feas: true, st: 'PREFERRED', act: true },

  // Trip 8: Navi Mumbai to Pune
  { id: 15, rid: 'R-008A', trip: 8, name: 'Sion-Panvel & Expressway', dist: 138, dur: 150, cost: 1800, traf: 'MODERATE', risk: 32, inc: 0, feas: true, st: 'PREFERRED', act: true },

  // Trip 9: Sambhajinagar to Nagpur
  { id: 16, rid: 'R-009A', trip: 9, name: 'Samruddhi Mahamarg (Eastbound)', dist: 460, dur: 360, cost: 3900, traf: 'LOW', risk: 38, inc: 0, feas: true, st: 'PREFERRED', act: true },

  // Trip 10: Panvel to Nashik
  { id: 17, rid: 'R-010A', trip: 10, name: 'Via Kalyan & Kasara Ghat', dist: 190, dur: 220, cost: 1950, traf: 'MODERATE', risk: 40, inc: 0, feas: true, st: 'PREFERRED', act: true },
];

// ==========================================
// 9. RISK ASSESSMENTS (Deterministic Factor Breakdown)
// ==========================================
export const DEMO_RISK_ASSESSMENTS = [
  { eid: 1, overall: 82, traffic: 32, historical: 18, time: 16, priority: 11, disruption: 5, veh: 0, dist: 0, cap: 0, notes: 'Trip TRP-001 (Mumbai-Pune): Severe congestion near Khandala + tight ICU vaccine deadline' },
  { eid: 2, overall: 85, traffic: 28, historical: 20, time: 18, priority: 12, disruption: 7, veh: 0, dist: 0, cap: 0, notes: 'Trip TRP-002 (Mumbai-Nagpur): Kasara Landslide blockage + high cargo load' },
  { eid: 3, overall: 71, traffic: 24, historical: 16, time: 14, priority: 10, disruption: 7, veh: 0, dist: 0, cap: 0, notes: 'Trip TRP-003 (Nashik-Pune): Alephata breakdown bottleneck on NH-60' },
  { eid: 6, overall: 64, traffic: 22, historical: 14, time: 12, priority: 8, disruption: 8, veh: 0, dist: 0, cap: 0, notes: 'Trip TRP-006 (Surat-Nashik): Monsoon ghat road narrowing near Dharampur' },
  { eid: 7, overall: 55, traffic: 18, historical: 12, time: 12, priority: 8, disruption: 5, veh: 0, dist: 0, cap: 0, notes: 'Trip TRP-007 (Pune-Mumbai): Moderate morning expressway queue' },
];

// ==========================================
// 10. AI RECOMMENDATIONS — 10 SEED RECORDS
// ==========================================
export const DEMO_RECOMMENDATIONS = [
  {
    rid: 'REC-001',
    type: 'reroute',
    priority: 'critical',
    title: 'Reroute V004 via Samruddhi Mahamarg to avoid Kasara landslide',
    description: 'V004 is encountering a 60-minute blockage on NH-3 near Igatpuri. Diverting to the newly opened Samruddhi Kasara bypass reduces predicted delay by 45 minutes.',
    reasoning: 'NH-3 has an active landslide incident (INC-002) with single-lane clearance. The Samruddhi route adds 25 km but maintains 75 km/h free-flow traffic, preventing SLA breach on avionics cargo.',
    veh: ['V004'], del: ['DEL-002', 'DEL-004', 'DEL-016'], trp: ['TRP-002'],
    time: -45, dist: 25.0, cost: 320, riskRed: 35, conf: 92.5
  },
  {
    rid: 'REC-002',
    type: 'reassign',
    priority: 'high',
    title: 'Reassign critical vaccine delivery DEL-001 from V001 to V003',
    description: 'V001 is trapped in Khandala accident queue. V003 is idle at Pune depot with cold-chain power capability and can execute the return leg on time.',
    reasoning: 'V001 predicted delay (+35m) violates MedExpress 2-8°C SLA window. Reassigning delivery to available unit V003 safeguards patient safety.',
    veh: ['V001', 'V003'], del: ['DEL-001'], trp: ['TRP-001'],
    time: -32, dist: -12.0, cost: -180, riskRed: 28, conf: 94.0
  },
  {
    rid: 'REC-003',
    type: 'swap_vehicle',
    priority: 'high',
    title: 'Swap vehicle V013 for scheduled maintenance before long haul dispatch',
    description: 'V013 odometer has reached 105,000 km with preventative inspection overdue. Swap with newly serviced LCV V011 to prevent breakdown on highway.',
    reasoning: 'Preventative maintenance policy triggers mandatory brake inspection at 100k km. Swapping avoids potential high-speed highway mechanical failure.',
    veh: ['V013', 'V011'], del: [], trp: [],
    time: 0, dist: 0.0, cost: 450, riskRed: 40, conf: 96.0
  },
  {
    rid: 'REC-004',
    type: 'consolidate',
    priority: 'medium',
    title: 'Consolidate deliveries DEL-007 and DEL-019 in Pune industrial corridor',
    description: 'Both shipments terminate in Chakan MIDC Phase 2. Combining them onto vehicle V002 saves 18 km deadhead transit.',
    reasoning: 'Combined weight is 840 kg, well within V002 capacity of 1500 kg. Consolidating reduces driver hours and diesel consumption by 4.2 liters.',
    veh: ['V002'], del: ['DEL-007', 'DEL-019'], trp: ['TRP-004'],
    time: -25, dist: -18.0, cost: -350, riskRed: 15, conf: 88.0
  },
  {
    rid: 'REC-005',
    type: 'sequence_change',
    priority: 'medium',
    title: 'Invert urban dropoff sequence: Bandra (DEL-005) before Andheri (DEL-006)',
    description: 'Milan Subway flooding (INC-005) is restricting Northbound access to Andheri. Delivering Bandra first avoids peak congestion window.',
    reasoning: 'Traffic radar shows Milan Subway clearance underway with projected opening in 40 minutes. Servicing Bandra first allows the water to recede without idle waiting.',
    veh: ['V010'], del: ['DEL-005'], trp: ['TRP-007'],
    time: -18, dist: -6.0, cost: -90, riskRed: 12, conf: 89.5
  },
  {
    rid: 'REC-006',
    type: 'avoid_incident',
    priority: 'critical',
    title: 'Divert V001 from Expressway to Old Highway (NH-48) to avoid Khandala crash',
    description: 'Multi-vehicle collision near Khandala (INC-001) has created a 4 km bottleneck. Divert at Khopoli exit to Old Highway.',
    reasoning: 'Old Highway is flowing freely at 52 km/h. Diverting at KM 38 bypasses the entire incident impact zone with an estimated 40-minute net saving.',
    veh: ['V001'], del: ['DEL-001', 'DEL-011', 'DEL-021'], trp: ['TRP-001'],
    time: -40, dist: 14.0, cost: 150, riskRed: 42, conf: 95.0
  },
  {
    rid: 'REC-007',
    type: 'alternate_route',
    priority: 'high',
    title: 'Route V006 Nagpur to Sambhajinagar via Jalna Bypass to avoid roadwork',
    description: 'Local bridge maintenance between Mehkar and Sindkhed is causing single-lane delays. Jalna Bypass maintains multi-lane clearance.',
    reasoning: 'Jalna Bypass adds 8 km but circumvents 35 minutes of stop-and-go construction traffic, protecting heavy truck fuel efficiency.',
    veh: ['V006'], del: ['DEL-009', 'DEL-012', 'DEL-028'], trp: ['TRP-005'],
    time: -30, dist: 8.0, cost: 120, riskRed: 25, conf: 91.0
  },
  {
    rid: 'REC-008',
    type: 'rebalance',
    priority: 'medium',
    title: 'Stage available LCV V016 at Thane regional hub for evening surge',
    description: 'Forecasted inbound e-commerce volume at Thane hub exceeds current available capacity by 1800 kg for 18:00 dispatch.',
    reasoning: 'V016 is currently available with full fuel. Pre-positioning at Thane avoids deadhead delay during evening peak dispatch.',
    veh: ['V016'], del: [], trp: [],
    time: -60, dist: 0.0, cost: 0, riskRed: 20, conf: 86.0
  },
  {
    rid: 'REC-009',
    type: 'priority_dispatch',
    priority: 'high',
    title: 'Advance dispatch priority for cold-chain vaccine batch DEL-010',
    description: 'Customer requested departure advance from 14:00 to 11:30 to avoid evening Pune city traffic entry restrictions.',
    reasoning: 'Pune Municipal Corporation restricts heavy commercial vehicles on internal roads between 17:00 and 20:00. Early dispatch guarantees compliant delivery.',
    veh: ['V003'], del: ['DEL-010'], trp: ['TRP-029'],
    time: -45, dist: 0.0, cost: 200, riskRed: 30, conf: 93.0
  },
  {
    rid: 'REC-010',
    type: 'delay_non_critical',
    priority: 'low',
    title: 'Hold non-critical bulk cement delivery DEL-028 by 60 minutes',
    description: 'Holding bulk cement delivery allows high-priority electronic cargo DEL-009 to take priority at the loading dock.',
    reasoning: 'DEL-028 has a relaxed 24-hour SLA window. Holding it clears dock bay 2 for immediate loading of priority avionics components.',
    veh: ['V006'], del: ['DEL-028'], trp: ['TRP-005'],
    time: 0, dist: 0.0, cost: 0, riskRed: 18, conf: 85.0
  }
];

// ==========================================
// 11. DIGITAL TWIN SIMULATION SCENARIOS (8 Sandboxes)
// ==========================================
export const DEMO_SIMULATION_SCENARIOS = [
  {
    id: 'SIM-SCENARIO-01',
    type: 'VEHICLE_BREAKDOWN',
    name: 'Vehicle Breakdown — V004 Overheating on NH-3',
    desc: 'Simulates complete immobilisation of heavy truck V004 carrying 4100 kg of critical cargo on the Mumbai-Nagpur highway.',
    params: { vehicle_id: 'V004', location: 'Kasara Ghat', severity: 'CRITICAL', cargo_weight_kg: 4100 },
    reasoning: 'Digital Twin simulates immediate fleet recovery by finding nearest available heavy truck V011 in Mumbai, dispatching mobile mechanics, and reallocating time-sensitive shipments.',
    metrics: { predicted_delay_min: 75, affected_deliveries: 4, cost_impact_inr: 4200, mitigation_time_saved_min: 50 }
  },
  {
    id: 'SIM-SCENARIO-02',
    type: 'TRAFFIC_SPIKE',
    name: 'Traffic Spike — Expressway Weekend Congestion (+45m)',
    desc: 'Simulates a sudden 300% increase in passenger vehicles at Lonavala toll plaza creating severe delays for all active fleet units.',
    params: { corridor: 'Mumbai-Pune Expressway', congestion_pct: 85, duration_hours: 3.5 },
    reasoning: 'Evaluates diversion feasibility of active trips TRP-001 and TRP-007 to NH-48 and dynamic staging at Panvel logistics park.',
    metrics: { predicted_delay_min: 45, affected_trips: 3, fuel_waste_liters: 18, mitigation_time_saved_min: 35 }
  },
  {
    id: 'SIM-SCENARIO-03',
    type: 'ROAD_CLOSURE',
    name: 'Road Closure — Kasara Ghat Landslide Debris Fall',
    desc: 'Simulates total closure of Northbound lanes on NH-3 for 6 hours due to rockfall.',
    params: { highway: 'NH-3', location: 'Igatpuri-Kasara', duration_hours: 6.0 },
    reasoning: 'Reroutes all commercial traffic via newly commissioned Samruddhi Mahamarg interchange at Igatpuri.',
    metrics: { predicted_delay_min: 90, affected_deliveries: 6, alternate_route_km: +35, mitigation_time_saved_min: 65 }
  },
  {
    id: 'SIM-SCENARIO-04',
    type: 'URGENT_DELIVERY',
    name: 'Urgent Delivery — Emergency Hospital ICU Replenishment',
    desc: 'Simulates injection of an unplanned, critical 200 kg pharmaceutical delivery with a strict 2-hour delivery window from Pune to Mumbai.',
    params: { priority: 'CRITICAL', origin: 'Pune', destination: 'Mumbai', deadline_minutes: 120 },
    reasoning: 'Identifies available vehicle V003 at Pune depot, pre-allocates toll fast-track credentials, and optimizes departure sequencing.',
    metrics: { eta_minutes: 105, sla_met: true, opportunity_cost_inr: 850, risk_score: 28 }
  },
  {
    id: 'SIM-SCENARIO-05',
    type: 'DRIVER_UNAVAILABLE',
    name: 'Driver Unavailable — Mandatory Shift Timeout at Kalyan',
    desc: 'Simulates driver DR-004 exceeding maximum daily legal driving limit (8 hours) before reaching destination.',
    params: { driver_id: 'DR-004', vehicle_id: 'V004', hours_driven: 8.5 },
    reasoning: 'Simulates handover to backup relief driver staged at Kalyan transit hub without abandoning cargo.',
    metrics: { handover_time_min: 25, compliance_score: 100, delay_incurred_min: 20 }
  },
  {
    id: 'SIM-SCENARIO-06',
    type: 'CAPACITY_REDUCTION',
    name: 'Capacity Reduction — Axle Weight Restriction on V006',
    desc: 'Simulates unexpected axle air-suspension fault reducing maximum safe payload from 6000 kg to 3600 kg.',
    params: { vehicle_id: 'V006', original_cap_kg: 6000, degraded_cap_kg: 3600 },
    reasoning: 'Offloads 1200 kg of non-critical freight to local depot for subsequent consolidation, keeping vehicle safe and road-legal.',
    metrics: { offloaded_weight_kg: 1200, delay_min: 30, safety_compliance: 100 }
  },
  {
    id: 'SIM-SCENARIO-07',
    type: 'DELIVERY_DEADLINE_CHANGE',
    name: 'Delivery Deadline Change — SLA Advanced by 2 Hours',
    desc: 'Simulates customer advancing delivery deadline for electronic components DEL-002 from 18:00 to 16:00.',
    params: { delivery_id: 'DEL-002', old_deadline_h: 18, new_deadline_h: 16 },
    reasoning: 'Recalculates transit speed profile, upgrades route to express highway, and reprioritizes dropoff sequence.',
    metrics: { time_deficit_min: 45, expedited_eta_min: 155, target_achieved: true }
  },
  {
    id: 'SIM-SCENARIO-08',
    type: 'SEVERE_WEATHER',
    name: 'Severe Weather — Flash Flooding in Mumbai West',
    desc: 'Simulates 80mm rainfall in 2 hours inundating low-lying arterial routes in Mumbai-Thane urban zone.',
    params: { precipitation_mm: 80, affected_cities: ['Mumbai', 'Thane'], road_speeds_reduced_pct: 60 },
    reasoning: 'Directs all in-transit urban vans to high-elevation staging points and switches long-haul vehicles to elevated freeway corridors.',
    metrics: { incidents_avoided: 3, vehicle_damage_avoided_inr: 85000, safety_rating: 98 }
  }
];

// ==========================================
// 12. OPTIMIZATION RUNS
// ==========================================
export const DEMO_OPTIMIZATION_RUNS = [
  {
    run_id: 'OPT-001',
    type: 'full_network_optimization',
    trigger_type: 'scheduled',
    recs_gen: 5,
    recs_app: 3,
    time_saved: 95,
    dist_saved: 42.5,
    cost_saved: 1850.0,
    status: 'completed'
  },
  {
    run_id: 'OPT-002',
    type: 'incident_response',
    trigger_type: 'event_driven',
    recs_gen: 3,
    recs_app: 2,
    time_saved: 65,
    dist_saved: 18.0,
    cost_saved: 920.0,
    status: 'completed'
  }
];

// ==========================================
// 13. ACTIVITY & AUDIT LOGS
// ==========================================
export const DEMO_ACTIVITY_LOGS = [
  { action: 'SYSTEM_INITIALIZED', type: 'system', id: null, details: { mode: 'Seed Data / Development Mode', organization: 'MOVA Logistics Demo' } },
  { action: 'FLEET_TELEMETRY_SYNCED', type: 'fleet', id: null, details: { total_units: 20, active_units: 12, data_origin: 'SEED' } },
  { action: 'RISK_CALCULATION_EXECUTED', type: 'trip', id: 1, details: { trip_id: 'TRP-001', score: 82, classification: 'CRITICAL' } },
  { action: 'INCIDENT_DETECTED', type: 'incident', id: 1, details: { incident_id: 'INC-001', severity: 'CRITICAL', title: 'Multi-vehicle collision near Khandala Ghat' } },
  { action: 'RECOMMENDATION_GENERATED', type: 'recommendation', id: 1, details: { rec_id: 'REC-001', title: 'Reroute V004 via Samruddhi Mahamarg' } },
  { action: 'RECOMMENDATION_APPROVED', type: 'recommendation', id: 2, details: { rec_id: 'REC-002', approved_by: 'operations@mova-demo.com' } },
];
