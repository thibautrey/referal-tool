require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Import routes
const apiRoutes = require("./routes/api");

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration de Morgan avec un format personnalisé plus détaillé
morgan.token('body', (req) => JSON.stringify(req.body));
morgan.token('params', (req) => JSON.stringify(req.params));
morgan.token('query', (req) => JSON.stringify(req.query));

const morganFormat = process.env.NODE_ENV === 'production'
  ? ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'
  : ':method :url :status :response-time ms - :res[content-length] - Params: :params - Query: :query - Body: :body';

// Middleware
app.use(helmet()); // Sécurité
app.use(morgan(morganFormat)); // Logging avancé
app.use(cors()); // CORS
app.use(express.json()); // Parse JSON bodies

// Middleware de logging pour toutes les requêtes
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Headers:', JSON.stringify(req.headers));
  if (req.body && Object.keys(req.body).length > 0) {
    // Masquer les mots de passe dans les logs
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '********';
    if (sanitizedBody.currentPassword) sanitizedBody.currentPassword = '********';
    if (sanitizedBody.newPassword) sanitizedBody.newPassword = '********';
    console.log('Body:', JSON.stringify(sanitizedBody));
  }
  next();
});

// Routes
app.use("/api", apiRoutes);

// Error handling middleware avec logs détaillés
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR: ${err.message}`);
  console.error(`Request: ${req.method} ${req.url}`);
  console.error(`Request IP: ${req.ip}`);
  console.error(`User Agent: ${req.get('user-agent')}`);
  console.error('Stack trace:');
  console.error(err.stack);

  res.status(500).json({
    message: "Une erreur est survenue",
    error: process.env.NODE_ENV === "production" ? {} : {
      message: err.message,
      stack: err.stack
    },
    timestamp
  });
});

// Start server
app.listen(PORT, () => {