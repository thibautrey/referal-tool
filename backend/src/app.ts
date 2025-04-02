import express, { Application, NextFunction, Request, Response } from "express";

import analyticsRoutes from "./routes/analytics";
import cors from "cors";
import dotenv from "dotenv";
import { handleRedirection } from "./controllers/link";
import helmet from "helmet";
import linkRoutes from "./routes/link";
import morgan from "morgan";
import path from "path";
// Import routes
import userRoutes from "./routes/user";

// Configuration
dotenv.config();
const app: Application = express();

// Configuration de Morgan avec un format personnalisé plus détaillé
morgan.token("body", (req: Request) => JSON.stringify(req.body));
morgan.token("params", (req: Request) => JSON.stringify(req.params));
morgan.token("query", (req: Request) => JSON.stringify(req.query));

const morganFormat =
  process.env.NODE_ENV === "production"
    ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'
    : ":method :url :status :response-time ms - :res[content-length] - Params: :params - Query: :query - Body: :body";

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  })
); // Sécurité
app.use(morgan(morganFormat)); // Logging avancé
app.use(cors()); // CORS
app.use(express.json()); // Parse JSON bodies

// Middleware de logging pour toutes les requêtes
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log("Headers:", JSON.stringify(req.headers));
  if (req.body && Object.keys(req.body).length > 0) {
    // Masquer les mots de passe dans les logs
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = "********";
    if (sanitizedBody.currentPassword)
      sanitizedBody.currentPassword = "********";
    if (sanitizedBody.newPassword) sanitizedBody.newPassword = "********";
    console.log("Body:", JSON.stringify(sanitizedBody));
  }
  next();
});

// Routes API - should be checked first
app.use("/api/users", userRoutes);
app.use("/api/links", linkRoutes);
app.use("/api/analytics", analyticsRoutes);

// Chemin vers le build de l'application React
const frontendBuildPath = path.resolve(__dirname, "../../frontend/dist");

// Configurer les types MIME explicitement
express.static.mime.define({
  "application/javascript": ["js", "mjs"],
  "text/css": ["css"],
  "font/woff2": ["woff2"],
  "font/woff": ["woff"],
});

// Route spécifique pour les assets de l'application
app.use(
  "/app/assets",
  (req, res, next) => {
    const ext = req.path.split(".").pop()?.toLowerCase();
    if (ext === "js" || ext === "mjs") {
      res.type("application/javascript");
    } else if (ext === "css") {
      res.type("text/css");
    }
    next();
  },
  express.static(path.join(frontendBuildPath, "assets"))
);

// Handle /app routes - protected frontend routes
app.get("/app/*", (req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

app.get("/images/*", (req, res) => {
  res.sendFile(path.join(frontendBuildPath, req.path));
});

// Landing page route - must be exact match for /
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

// Handle redirects - this should catch any other single-segment path
// This must come after all other routes to not interfere with /app or /api
app.get("/:path([a-zA-Z0-9-_]+)", (req, res, next) => {
  if (req.params.path === "app" || req.params.path === "api") {
    next();
    return;
  }
  handleRedirection(req, res);
});

// Error handling middleware avec logs détaillés
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${err.message}`);
  console.error(`Request: ${req.method} ${req.url}`);
  console.error(`Request IP: ${req.ip}`);
  console.error(`User Agent: ${req.get("user-agent")}`);
  console.error("Stack trace:");
  console.error(err.stack);

  res.status(500).json({
    message: "Une erreur est survenue",
    error:
      process.env.NODE_ENV === "production"
        ? {}
        : {
            message: err.message,
            stack: err.stack,
          },
    timestamp,
  });
});

export default app;
