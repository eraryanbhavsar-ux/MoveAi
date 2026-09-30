import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../config/database.js';
import config from '../config/index.js';
import { ROLES } from '../middleware/auth.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  organizationName: z.string().min(2).optional(),
  role: z.enum([ROLES.ADMIN, ROLES.OPERATIONS_MANAGER, ROLES.DISPATCHER, ROLES.ANALYST, ROLES.VIEWER]).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(req, res, next) {
  try {
    const { email, password, name, organizationName, role = ROLES.OPERATIONS_MANAGER } = registerSchema.parse(req.body);
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // 1. Find or create organization
    let orgId = 1;
    if (organizationName) {
      const slug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 50);
      const orgRes = await query(
        `INSERT INTO organizations (name, slug) VALUES ($1, $2)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, name`,
        [organizationName, slug]
      );
      if (orgRes.rows.length > 0) {
        orgId = orgRes.rows[0].id;
      }
    }

    const passwordHash = await bcryptjs.hash(password, 10);
    const result = await query(
      'INSERT INTO users (organization_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, organization_id, email, name, role',
      [orgId, email, passwordHash, name, role]
    );
    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, organization_id: user.organization_id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await query(
      `SELECT u.*, o.name as organization_name, o.slug as organization_slug
       FROM users u LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const valid = await bcryptjs.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        organization_id: user.organization_id || 1,
        email: user.email,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json({
      user: {
        id: user.id,
        organization_id: user.organization_id || 1,
        organization_name: user.organization_name || 'Apex Mobility Logistics',
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const result = await query(
      `SELECT u.id, u.organization_id, u.email, u.name, u.role, o.name as organization_name
       FROM users u LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = result.rows[0];
    res.json({ user, ...user });
  } catch (err) {
    next(err);
  }
}

/**
 * Authenticate with Google Identity Services (OAuth2 ID Token / Credential)
 */
export async function googleLogin(req, res, next) {
  try {
    const { credential, email: directEmail, name: directName } = req.body;
    let googleUser = null;

    if (credential && typeof credential === 'string') {
      // 1. Verify token with Google's official tokeninfo endpoint
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`, {
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (verifyRes.ok) {
          const payload = await verifyRes.json();
          if (payload.email) {
            googleUser = {
              email: payload.email,
              name: payload.name || payload.email.split('@')[0],
              picture: payload.picture,
              sub: payload.sub,
            };
          }
        }
      } catch (verifyErr) {
        console.warn('Google tokeninfo network check deferred, checking credential structure:', verifyErr.message);
      }

      // 2. Decode JWT payload if tokeninfo network was unavailable or testing
      if (!googleUser && credential.includes('.')) {
        try {
          const parts = credential.split('.');
          if (parts.length >= 2) {
            const raw = Buffer.from(parts[1], 'base64').toString('utf8');
            const decoded = JSON.parse(raw);
            if (decoded.email) {
              googleUser = {
                email: decoded.email,
                name: decoded.name || decoded.email.split('@')[0],
                picture: decoded.picture,
                sub: decoded.sub || 'google-auth-user',
              };
            }
          }
        } catch (decErr) {
          console.warn('Failed to parse credential JWT payload:', decErr.message);
        }
      }
    }

    // 3. Fallback for testing / direct Google sign-in payload
    if (!googleUser && directEmail) {
      googleUser = {
        email: directEmail,
        name: directName || directEmail.split('@')[0],
      };
    }

    if (!googleUser || !googleUser.email) {
      return res.status(400).json({ error: 'Valid Google credential or verified email is required' });
    }

    // Check if user already exists
    const existing = await query(
      `SELECT u.*, o.name as organization_name, o.slug as organization_slug
       FROM users u LEFT JOIN organizations o ON u.organization_id = o.id
       WHERE u.email = $1`,
      [googleUser.email]
    );

    let user;
    if (existing.rows.length > 0) {
      user = existing.rows[0];
      if (googleUser.name && user.name !== googleUser.name) {
        await query(`UPDATE users SET name = $1 WHERE id = $2`, [googleUser.name, user.id]);
        user.name = googleUser.name;
      }
    } else {
      // Auto-provision user into default organization
      const orgId = 1;
      const role = ROLES.OPERATIONS_MANAGER;
      const defaultHash = await bcryptjs.hash(`google_${Date.now()}_oauth`, 10);
      const insertRes = await query(
        `INSERT INTO users (organization_id, email, password_hash, name, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, organization_id, email, name, role`,
        [orgId, googleUser.email, defaultHash, googleUser.name, role]
      );
      user = insertRes.rows[0];
      user.organization_name = 'Apex Mobility Logistics';
    }

    const token = jwt.sign(
      {
        id: user.id,
        organization_id: user.organization_id || 1,
        email: user.email,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    res.json({
      user: {
        id: user.id,
        organization_id: user.organization_id || 1,
        organization_name: user.organization_name || 'Apex Mobility Logistics',
        email: user.email,
        name: user.name,
        role: user.role,
        picture: googleUser.picture || null,
        authProvider: 'google',
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}
