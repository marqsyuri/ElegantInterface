import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import crypto from "crypto";
import { db } from "./db";
import { clients } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Hash password with MD5 (matching admin auth pattern)
function hashPassword(password: string): string {
  return crypto.createHash('md5').update(password).digest('hex');
}

// Serialize client for session
passport.serializeUser((user: any, done) => {
  // Use different namespace for client vs admin
  if (user.isClient) {
    done(null, { id: user.id, isClient: true, salonId: user.userId });
  } else {
    done(null, { id: user.id, isClient: false });
  }
});

// Deserialize client from session
passport.deserializeUser(async (sessionData: any, done) => {
  try {
    if (sessionData.isClient) {
      // Deserialize client
      const [client] = await db
        .select()
        .from(clients)
        .where(and(
          eq(clients.id, sessionData.id),
          eq(clients.userId, sessionData.salonId)
        ))
        .limit(1);
      
      if (client) {
        done(null, { ...client, isClient: true });
      } else {
        done(null, false);
      }
    } else {
      // Let admin auth handle admin users
      done(null, sessionData);
    }
  } catch (error) {
    done(error);
  }
});

// Client login strategy
const clientStrategy = new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  async (req: any, email: string, password: string, done) => {
    try {
      const { salonId } = req.body; // Must pass salonId (userId) for multi-tenant
      
      if (!salonId) {
        return done(null, false, { message: 'Salon ID is required' });
      }

      // Find client by email AND salonId (multi-tenant security)
      const [client] = await db
        .select()
        .from(clients)
        .where(and(
          eq(clients.email, email),
          eq(clients.userId, parseInt(salonId))
        ))
        .limit(1);

      if (!client) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      if (!client.password) {
        return done(null, false, { message: 'Account has no password set. Please register first.' });
      }

      // Verify password
      const hashedPassword = hashPassword(password);
      if (hashedPassword !== client.password) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      // Update last login
      await db
        .update(clients)
        .set({ lastLogin: new Date() })
        .where(eq(clients.id, client.id));

      // Mark as client for session serialization
      return done(null, { ...client, isClient: true });
    } catch (error) {
      console.error('Client login error:', error);
      return done(error);
    }
  }
);

passport.use('client-local', clientStrategy);

// Middleware to check if client is authenticated
export function isClientAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated() && req.user?.isClient) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized. Client login required.' });
}

export { hashPassword };

