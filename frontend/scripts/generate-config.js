#!/usr/bin/env node

// This script generates runtime configuration based on environment variables
const fs = require("fs");
const path = require("path");

// Get environment variables
const apiUrl = process.env.REACT_APP_API_URL || "https://rflnk.com/api";
const env = process.env.REACT_APP_ENV || "production";

// Create config content
const configContent = `
// Runtime configuration that can be updated without rebuilding the app
window.APP_CONFIG = {
  API_URL: "${apiUrl}",
  ENV: "${env}"
};
`;

// Write to public directory
fs.writeFileSync(
  path.join(__dirname, "../public/config.js"),
  configContent.trim()
);

console.log("Runtime config generated successfully");
