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
export function hashPasswordMD5(password: string): string {
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
  
  // Ensure serializeUser and deserializeUser are registered AFTER passport.initialize()
  // This ensures they override any previous registrations from clientAuth.ts
  console.log('[setupAuth] Registering serializeUser and deserializeUser');

  // Strategy for admin users (from users table)
  passport.use('admin-local',
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !comparePasswordsMD5(password, user.password)) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        if (!user.isActive) {
          return done(null, false, { message: 'Account is deactivated' });
        }
        // Only allow admin users (not staff from users table - deprecated)
        if (user.role !== 'admin') {
          return done(null, false, { message: 'Invalid user type' });
        }
        return done(null, { ...user, userType: 'admin' });
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Strategy for staff users (from staff table)
  passport.use('staff-local',
    new LocalStrategy(async (username, password, done) => {
      try {
        const { db } = await import('./db');
        const { staff } = await import('@shared/schema');
        const { eq, and } = await import('drizzle-orm');
        
        // Find staff by username
        const [staffMember] = await db
          .select()
          .from(staff)
          .where(and(
            eq(staff.username, username),
            eq(staff.isActive, true)
          ))
          .limit(1);
        
        if (!staffMember || !staffMember.password) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        
        if (!comparePasswordsMD5(password, staffMember.password)) {
          return done(null, false, { message: 'Invalid username or password' });
        }
        
        // Return staff with userType flag
        return done(null, { ...staffMember, userType: 'staff' });
      } catch (error) {
        return done(error);
      }
    }),
  );

  // Default strategy (tries admin first, then staff)
  passport.use('local',
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log('[local strategy] 🔍 Attempting login for username:', username);
        
        // First try admin in users table
        const user = await storage.getUserByUsername(username);
        if (user) {
          console.log('[local strategy] 👤 User found in users table:', {
            id: user.id,
            username: user.username,
            role: user.role,
            isActive: user.isActive,
            hasPassword: !!user.password
          });
          
          // Check if it's an admin with correct password
          if (user.role === 'admin' && user.isActive) {
            const passwordMatch = comparePasswordsMD5(password, user.password);
            console.log('[local strategy] 🔐 Admin password match:', passwordMatch);
            
            if (passwordMatch) {
              console.log('[local strategy] ✅ Admin user authenticated:', user.username);
              return done(null, { ...user, userType: 'admin' });
            } else {
              console.log('[local strategy] ❌ Admin password incorrect, trying staff...');
            }
          } else {
            console.log('[local strategy] ⚠️ User found but not admin or inactive, trying staff...');
          }
        } else {
          console.log('[local strategy] 👤 User not found in users table, trying staff...');
        }
        
        // Then try staff in staff table
        const { db } = await import('./db');
        const { staff } = await import('@shared/schema');
        const { eq, and } = await import('drizzle-orm');
        
        const [staffMember] = await db
          .select()
          .from(staff)
          .where(and(
            eq(staff.username, username),
            eq(staff.isActive, true)
          ))
          .limit(1);
        
        if (staffMember) {
          console.log('[local strategy] 👤 Staff found in staff table:', {
            id: staffMember.id,
            username: staffMember.username,
            name: staffMember.name,
            hasPassword: !!staffMember.password,
            isActive: staffMember.isActive
          });
          
          if (staffMember.password) {
            const passwordMatch = comparePasswordsMD5(password, staffMember.password);
            console.log('[local strategy] 🔐 Staff password match:', passwordMatch);
            
            if (passwordMatch) {
              console.log('[local strategy] ✅ Staff user authenticated:', staffMember.username);
              return done(null, { ...staffMember, userType: 'staff' });
            } else {
              console.log('[local strategy] ❌ Staff password incorrect');
            }
          } else {
            console.log('[local strategy] ❌ Staff has no password set');
          }
        } else {
          console.log('[local strategy] ❌ Staff not found in staff table');
        }
        
        // If we get here, neither admin nor staff authentication succeeded
        console.log('[local strategy] ❌ Login failed - user not found in users or staff tables');
        return done(null, false, { message: 'Invalid username or password' });
      } catch (error) {
        console.error('[local strategy] ❌ Error during authentication:', error);
        return done(error);
      }
    }),
  );

  // Unified serializeUser that handles admin, staff, and client
  passport.serializeUser((user: any, done) => {
    // If it's a client, serialize with isClient flag
    if (user.isClient) {
      done(null, { id: user.id, isClient: true, salonId: user.userId });
    } else if (user.userType === 'staff') {
      // For staff from staff table, serialize with staff flag and accessLevel
      console.log('[auth.serializeUser] Serializing staff:', {
        id: user.id,
        userType: user.userType,
        accessLevel: user.accessLevel,
        userId: user.userId
      });
      done(null, { 
        id: user.id, 
        userType: 'staff', 
        userId: user.userId, 
        companyId: user.companyId,
        accessLevel: user.accessLevel || 'staff' // Include accessLevel in session
      });
    } else {
      // For admin users, serialize only the ID (number)
      done(null, user.id);
    }
  });
  
  // Unified deserializeUser that handles both admin and client
  passport.deserializeUser(async (sessionData: any, done) => {
    console.log('[auth.deserializeUser] ===== CALLED =====');
    console.log('[auth.deserializeUser] sessionData:', sessionData);
    console.log('[auth.deserializeUser] sessionData type:', typeof sessionData);
    
    try {
      // ORDEM CRÍTICA: Verificar userType 'staff' PRIMEIRO (antes de tudo)
      // Se sessionData é um objeto com userType 'staff', deve ser tratado primeiro
      if (sessionData && typeof sessionData === 'object' && sessionData.userType === 'staff') {
        console.log('[auth.deserializeUser] 🔍 Detected staff session, loading from staff table...');
        const { db } = await import('./db');
        const { staff } = await import('@shared/schema');
        const { eq } = await import('drizzle-orm');
        
        const [staffMember] = await db
          .select()
          .from(staff)
          .where(eq(staff.id, sessionData.id))
          .limit(1);
        
        if (staffMember) {
          const staffWithType = { 
            ...staffMember, 
            userType: 'staff',
            accessLevel: staffMember.accessLevel || 'staff' // Ensure accessLevel is included
          };
          console.log('[auth.deserializeUser] ✅ Loading staff:', {
            id: staffWithType.id,
            username: staffWithType.username,
            name: staffWithType.name,
            userId: staffWithType.userId,
            companyId: staffWithType.companyId,
            accessLevel: staffWithType.accessLevel,
            userType: staffWithType.userType
          });
          return done(null, staffWithType);
        }
        console.log('[auth.deserializeUser] ❌ Staff not found for id:', sessionData.id);
        return done(null, false);
      }
      
      // If sessionData is an object with isClient flag, it's a client session
      if (sessionData && typeof sessionData === 'object' && sessionData.isClient) {
        console.log('[auth.deserializeUser] 🔍 Detected client session...');
        const { db } = await import('./db');
        const { clients } = await import('@shared/schema');
        const { eq, and } = await import('drizzle-orm');
        
        const [client] = await db
          .select()
          .from(clients)
          .where(and(
            eq(clients.id, sessionData.id),
            eq(clients.userId, sessionData.salonId)
          ))
          .limit(1);
        
        if (client) {
          console.log('[auth.deserializeUser] ✅ Loading client:', { id: client.id });
          return done(null, { ...client, isClient: true });
        }
        return done(null, false);
      }
      
      // If sessionData is a number (user ID from admin auth), load admin user
      if (typeof sessionData === 'number') {
        console.log('[auth.deserializeUser] 🔍 Detected number (admin user ID - formato antigo):', sessionData);
        const user = await storage.getUser(sessionData);
        if (!user) {
          console.log('[auth.deserializeUser] ❌ Admin user not found for id:', sessionData);
          return done(null, false);
        }
        console.log('[auth.deserializeUser] ✅ Loading admin user:', {
          id: user.id,
          username: user.username,
          role: user.role,
          companyId: user.companyId,
          parentUserId: user.parentUserId
        });
        return done(null, { ...user, userType: 'admin' });
      }
      
      // If it's an object with id but not isClient or userType, try to load as admin user (legacy)
      if (sessionData && typeof sessionData === 'object' && sessionData.id && !sessionData.isClient && !sessionData.userType) {
        console.log('[auth.deserializeUser] 🔍 Tentando carregar como admin (legacy) para id:', sessionData.id);
        const user = await storage.getUser(sessionData.id);
        if (user) {
          console.log('[auth.deserializeUser] ✅ Loading admin user from object:', {
            id: user.id,
            username: user.username,
            role: user.role
          });
          return done(null, { ...user, userType: 'admin' });
        }
        console.log('[auth.deserializeUser] ❌ Admin user not found for id:', sessionData.id);
        return done(null, false);
      }
      
      // Unknown session data format
      console.warn('[auth.deserializeUser] ❌ Unknown session data format:', JSON.stringify(sessionData, null, 2));
      done(null, false);
    } catch (error) {
      console.error('[auth.deserializeUser] Error:', error);
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
  app.post("/api/login", async (req, res, next) => {
    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) {
        console.error('❌ Login error:', err);
        return res.status(500).json({ message: "Login failed" });
      }
      if (!user) {
        console.log('❌ Login failed - no user returned:', info?.message || "Invalid credentials");
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      console.log('✅ User authenticated by passport:', {
        id: user.id,
        username: user.username || user.name,
        userType: user.userType,
        role: user.role
      });
      
      // If user is staff (from staff table), use the user object directly
      // If user is admin (from users table), fetch fresh data
      let freshUser = user;
      
      if (user.userType === 'staff') {
        // Staff user - already loaded from staff table, use as is
        console.log('✅ Staff login - using staff data directly from staff table');
        console.log('📋 Staff user object:', {
          id: user.id,
          username: user.username,
          name: user.name,
          accessLevel: user.accessLevel,
          userType: user.userType
        });
        // Ensure userType and accessLevel are set
        freshUser = { 
          ...user, 
          userType: 'staff',
          accessLevel: user.accessLevel || 'staff' // Default to 'staff' if not set
        };
        console.log('📋 Staff freshUser after merge:', {
          id: freshUser.id,
          username: freshUser.username,
          name: freshUser.name,
          accessLevel: freshUser.accessLevel,
          userType: freshUser.userType
        });
      } else if (user.userType === 'admin' || !user.userType) {
        // Admin user - fetch fresh data from users table
        console.log('✅ Admin login - fetching fresh data from users table');
        freshUser = await storage.getUser(user.id);
        if (!freshUser) {
          console.error('❌ Admin user not found in database after authentication');
          return res.status(404).json({ message: "User not found" });
        }
        freshUser = { ...freshUser, userType: 'admin' };
      }
      
      req.login(freshUser, (err) => {
        if (err) {
          console.error('❌ Session login error:', err);
          return res.status(500).json({ message: "Session failed" });
        }
        console.log('✅ Login successful - session created:', {
          id: freshUser.id,
          username: freshUser.username || freshUser.name,
          userType: freshUser.userType,
          role: freshUser.role,
          userId: freshUser.userId // For staff, this is the admin ID
        });
        res.status(200).json(freshUser);
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
    
    // Ensure parentUserId is included in response
    const userResponse = {
      ...freshUser,
      parentUserId: freshUser.parentUserId ?? null, // Explicitly include parentUserId
    };
    
    console.log('📊 GET /api/user - Returning fresh data:', {
      id: userResponse.id,
      username: userResponse.username,
      role: userResponse.role,
      parentUserId: userResponse.parentUserId,
      parentUserIdType: typeof userResponse.parentUserId,
      clinicName: userResponse.clinicName,
      publicLink: userResponse.publicLink
    });
    
    res.json(userResponse);
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

// Check if user is admin (not staff)
export function isAdmin(req: any, res: any, next: any) {
  console.log('[isAdmin] ===== START =====');
  console.log('[isAdmin] isAuthenticated:', req.isAuthenticated());
  console.log('[isAdmin] req.user type:', typeof req.user);
  console.log('[isAdmin] req.user:', req.user);
  console.log('[isAdmin] req.user keys:', req.user ? Object.keys(req.user) : 'no user');
  
  if (!req.isAuthenticated()) {
    console.log('[isAdmin] ❌ Not authenticated');
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = req.user;
  
  if (!user) {
    console.log('[isAdmin] ❌ No user object in req.user');
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  
  // Debug log
  console.log('[isAdmin] Checking user:', {
    id: user?.id,
    username: user?.username,
    role: user?.role,
    roleType: typeof user?.role,
    companyId: user?.companyId,
    parentUserId: user?.parentUserId,
    isAuthenticated: req.isAuthenticated(),
    userStringified: JSON.stringify(user).substring(0, 200)
  });
  
  // Check userType and accessLevel
  // Staff from staff table with accessLevel 'admin' can access admin routes
  // Staff from staff table with accessLevel 'staff' cannot access admin routes
  if (user.userType === 'staff') {
    const accessLevel = user.accessLevel || 'staff';
    if (accessLevel === 'admin') {
      console.log('[isAdmin] ✅ Access granted: staff with admin accessLevel');
      return next();
    } else {
      console.log('[isAdmin] ❌ Access denied: staff with limited access (accessLevel: staff)');
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
  }
  
  // Check if role exists and is a string (for admin users from users table)
  if (!user.role) {
    console.log('[isAdmin] ❌ No role property in user object');
    console.log('[isAdmin] User object:', JSON.stringify(user, null, 2));
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }
  
  // Admin is user with role 'admin' from users table
  const roleStr = String(user.role).toLowerCase().trim();
  const isAdminUser = roleStr === 'admin';
  
  console.log('[isAdmin] Role check:', {
    originalRole: user.role,
    roleStr,
    isAdminUser,
    userType: user.userType
  });
  
  if (isAdminUser || user.userType === 'admin') {
    console.log('[isAdmin] ✅ Access granted: user is admin');
    return next();
  }
  
  // If role is not 'admin' or 'staff', deny access
  console.log('[isAdmin] ❌ Access denied - role is not admin:', {
    role: user?.role,
    roleStr,
    companyId: user?.companyId,
    parentUserId: user?.parentUserId,
    isAdminCheck: isAdminUser
  });
  
  res.status(403).json({ message: "Forbidden: Admin access required" });
}

// Check if user is staff
export function isStaff(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = req.user;
  
  // Staff is user with userType 'staff' (from staff table)
  // All staff from staff table have access only to appointments
  const isStaffUser = user.userType === 'staff';
  
  if (isStaffUser) {
    console.log('[isStaff] ✅ Access granted: user is staff from staff table');
    return next();
  }
  
  console.log('[isStaff] ❌ Access denied: user is not staff', {
    userType: user.userType,
    role: user.role
  });
  
  res.status(403).json({ message: "Forbidden: Staff access required" });
}

// Get effective userId (for staff, use parentUserId; for admin, use own id)
// Get effective company ID - returns the company ID that should be used for data filtering
export function getEffectiveCompanyId(req: any): number | null {
  const user = req.user;
  
  // If user is staff from staff table, use their companyId or get from admin
  if (user.userType === 'staff') {
    if (user.companyId) {
      return user.companyId;
    }
    // If staff doesn't have companyId, get it from their admin (userId)
    // For now, return null and use getEffectiveUserId for filtering
    return null;
  }
  
  // For admin users, use their companyId
  if (user.userType === 'admin' || !user.userType) {
    return user.companyId || null;
  }
  
  return null;
}

// Get effective user ID - returns the user ID that should be used for data filtering
// This maintains backward compatibility while transitioning to company-based structure
export function getEffectiveUserId(req: any): number {
  const user = req.user;
  
  // New structure: Staff users have userType === 'staff' and userId (admin ID)
  if (user.userType === 'staff' && user.userId) {
    // For staff, return the admin's userId (the salon/company owner)
    return user.userId;
  }
  
  // Legacy: staff uses parentUserId (old structure)
  if (user.role === 'staff' && user.parentUserId) {
    return user.parentUserId;
  }
  
  // Admin users: return their own id
  return user.id;
}