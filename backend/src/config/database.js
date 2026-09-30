import pg from 'pg';
import config from '../config/index.js';
import { memoryDb } from '../db/memoryDb.js';

const { Pool } = pg;

let pool = null;
let useMemoryDb = !config.databaseUrl;

if (config.databaseUrl) {
  try {
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseUrl?.includes('supabase') ? { rejectUnauthorized: false } : false,
      max: 10,
      connectionTimeoutMillis: 3000,
    });

    pool.on('error', (err) => {
      console.warn('PostgreSQL pool error, falling back to in-memory store:', err.message);
      useMemoryDb = true;
    });

    // Test connection
    pool.query('SELECT 1').then(() => {
      console.log('✓ Connected to PostgreSQL');
    }).catch(err => {
      console.warn('⚠ PostgreSQL unreachable (' + err.message + '). Using In-Memory database.');
      useMemoryDb = true;
    });
  } catch (err) {
    console.warn('⚠ Could not initialize PostgreSQL pool:', err.message);
    useMemoryDb = true;
  }
} else {
  console.log('ℹ No DATABASE_URL provided. Initialized MOVA In-Memory Store with full seed dataset.');
}

export const query = async (text, params) => {
  if (useMemoryDb || !pool) {
    return memoryDb.query(text, params);
  }
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.warn('PostgreSQL query error, delegating to in-memory store:', err.message);
    return memoryDb.query(text, params);
  }
};

export const getClient = async () => {
  if (useMemoryDb || !pool) {
    return {
      query: (t, p) => memoryDb.query(t, p),
      release: () => {},
    };
  }
  try {
    return await pool.connect();
  } catch (err) {
    return {
      query: (t, p) => memoryDb.query(t, p),
      release: () => {},
    };
  }
};

export default { query, getClient };
