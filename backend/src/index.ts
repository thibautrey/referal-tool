import app from "./app";
import dotenv from "dotenv";

// Configuration
dotenv.config();
const PORT: number = parseInt(process.env.PORT || "3001", 10);

// Start server
app.listen(PORT, () => {
  console.log(
    `[${new Date().toISOString()}] 🚀 Server running on port ${PORT}`
  );
  console.log(
    `[${new Date().toISOString()}] Environment: ${
      process.env.NODE_ENV || "development"
    }`
  );
  console.log(
    `[${new Date().toISOString()}] Frontend available at http://localhost:${PORT}/app`
  );
});
