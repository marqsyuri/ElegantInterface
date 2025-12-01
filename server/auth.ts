import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { createHash } from "crypto";
import { storage } from "./storage";
import { User, users } from "@shared/schema";
import { db } from "./db";
import { eq, and, ne } from "drizzle-orm";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

// MD5 hash function for passwords
function hashPasswordMD5(password: string): string {
  return createHash('md5').update(password).digest('hex');
}

function comparePasswordsMD5(supplied: string, stored: string): boolean {
  const hashedSupplied = createHash('md5').update(supplied).digest('hex');
  return hashedSupplied === stored;
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'estetica-pro-secret-key-2025',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !comparePasswordsMD5(password, user.password)) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        if (!user.isActive) {
          return done(null, false, { message: 'Account is deactivated' });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  // Register route
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password, firstName, lastName, language, currency } = req.body;
      
      // Validação simples sem Zod
      if (!username || !email || !password) {
        return res.status(400).json({ message: "Username, email and password are required" });
      }
      
      // Validação de idioma (opcional, com default)
      const validLanguages = ['pt-BR', 'en-NZ', 'en-US', 'es-ES'];
      const userLanguage = language && validLanguages.includes(language) ? language : 'pt-BR';
      
      // Validação de moeda (opcional, com default)
      const validCurrencies = ['BRL', 'NZD', 'USD', 'EUR', 'GBP', 'MXN', 'ARS', 'CLP', 'COP', 'CAD', 'AUD', 'CHF', 'NOK', 'SEK'];
      const userCurrency = currency && validCurrencies.includes(currency) ? currency : 'BRL';
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create new user with MD5 hashed password
      const user = await storage.createUser({
        username,
        email,
        password: hashPasswordMD5(password),
        firstName,
        lastName,
        language: userLanguage,
        currency: userCurrency,
        isActive: true,
        role: 'user'
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login route
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          console.error('Session login error:', err);
          return res.status(500).json({ message: "Session failed" });
        }
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  // Logout route
  app.post("/api/logout", (req: any, res, next) => {
    req.logout((err: any) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }
      req.session.destroy((err: any) => {
        if (err) {
          console.error('Session destroy error:', err);
          return res.status(500).json({ message: "Session cleanup failed" });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });

  // User info route
  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Fetch fresh data from database to avoid session cache issues
    const userId = req.user.id;
    const freshUser = await storage.getUser(userId);
    
    if (!freshUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    console.log('📊 GET /api/user - Returning fresh data:', {
      id: freshUser.id,
      clinicName: freshUser.clinicName,
      publicLink: freshUser.publicLink
    });
    
    res.json(freshUser);
  });

  // Update user profile route
  app.put("/api/auth/user", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user.id;
      const updates = req.body;
      
      console.log('👤 Updating user profile:', { userId, updates });
      
      // Auto-generate publicLink from clinicName if clinicName is being updated
      if (updates.clinicName && !updates.publicLink) {
        // Sanitize clinic name to create URL-friendly link
        const sanitizedLink = updates.clinicName
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')  // Replace spaces with hyphens
          .replace(/[^a-z0-9-]/g, '')  // Remove special characters
          .replace(/-+/g, '-')  // Replace multiple hyphens with single
          .replace(/^-|-$/g, '')  // Remove leading/trailing hyphens
          .substring(0, 50);  // Limit length
        
        // Check if this link is already taken by another user
        const [existing] = await db.select()
          .from(users)
          .where(and(
            eq(users.publicLink, sanitizedLink),
            ne(users.id, userId)
          ));
        
        // If not taken, use it; otherwise add a number suffix
        if (!existing) {
          updates.publicLink = sanitizedLink;
        } else {
          // Add random number to make it unique
          const randomSuffix = Math.floor(Math.random() * 9999);
          updates.publicLink = `${sanitizedLink}-${randomSuffix}`;
        }
        
        console.log(`✨ Auto-generated public link: ${updates.publicLink} from clinic name: ${updates.clinicName}`);
      }
      
      // Update user in database
      const updatedUser = await storage.updateUser(userId, updates);
      console.log('✅ User updated in database:', updatedUser);
      
      // Update session with new user data
      req.login(updatedUser, (err: any) => {
        if (err) {
          console.error('❌ Session update error:', err);
          return res.status(500).json({ message: "Failed to update session" });
        }
        console.log('✅ Session updated successfully');
        console.log('📝 Updated user data:', {
          id: updatedUser.id,
          clinicName: updatedUser.clinicName,
          publicLink: updatedUser.publicLink
        });
        res.json(updatedUser);
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });
}

// Authentication middleware
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}