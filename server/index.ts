import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeScheduler } from "./scheduler";
import { initNotificationStream } from "./realtime";
import "./clientAuth"; // Initialize client authentication strategies

const app = express();
// Increase payload limits for image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  await initNotificationStream(server);

  // Middleware para garantir que rotas /api sempre retornem JSON
  app.use('/api', (req, res, next) => {
    // Garantir que erros sempre retornem JSON
    const originalSend = res.send;
    res.send = function(body) {
      if (res.get('Content-Type')?.includes('text/html')) {
        res.set('Content-Type', 'application/json');
        return originalSend.call(this, JSON.stringify({ 
          message: "Internal Server Error",
          error: "Non-JSON response detected" 
        }));
      }
      return originalSend.call(this, body);
    };
    next();
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Garantir que rotas /api sempre retornem JSON
    if (_req.path.startsWith('/api')) {
      return res.status(status).json({ message });
    }
    
    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const nodeEnv = (process.env.NODE_ENV || "").trim();
  const isDevelopment = nodeEnv === "development" || (!nodeEnv || nodeEnv === "");
  log(`Environment: "${nodeEnv}", isDevelopment: ${isDevelopment}`);
  if (isDevelopment) {
    try {
      await setupVite(app, server);
      log("Vite dev server setup complete");
    } catch (error) {
      log(`Error setting up Vite: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  // Use localhost for Windows compatibility (0.0.0.0 causes ENOTSUP error)
  const host = process.platform === 'win32' ? 'localhost' : '0.0.0.0';
  server.listen(port, host, () => {
    log(`serving on ${host}:${port}`);
    // Initialize scheduled tasks
    initializeScheduler();
  });
})();
