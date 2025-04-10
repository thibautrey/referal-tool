const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const DATA_DIR = process.env.ILA_DATA_DIR || path.join(process.cwd(), "data");
const TMP_DIR = process.env.ILA_TMP_DATA_DIR || path.join(process.cwd(), "tmp");

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  console.log(`Created data directory: ${DATA_DIR}`);
}

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
  console.log(`Created temporary directory: ${TMP_DIR}`);
}

// Set environment variables for IP Location API
process.env.ILA_DATA_DIR = DATA_DIR;
process.env.ILA_TMP_DATA_DIR = TMP_DIR;
process.env.ILA_FIELDS = "country,city";
process.env.ILA_LICENSE_KEY = process.env.ILA_LICENSE_KEY;

async function startApp() {
  try {
    // Start the main application
    console.log("Starting application...");
    console.log(`IP location data directory: ${DATA_DIR}`);
    console.log(`IP location temp directory: ${TMP_DIR}`);

    const app = spawn("node", [path.join(__dirname, "index.js")], {
      stdio: "inherit",
      env: process.env,
    });

    app.on("close", (code) => {
      console.log(`Application exited with code ${code}`);
      process.exit(code);
    });

    // Handle signals to properly terminate the child process
    ["SIGINT", "SIGTERM"].forEach((signal) => {
      process.on(signal, () => {
        console.log(`Received ${signal}, shutting down...`);
        app.kill(signal);
      });
    });
  } catch (error) {
    console.error("Failed to start application:", error);
    process.exit(1);
  }
}

startApp();
