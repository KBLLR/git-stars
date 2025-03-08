import fs from "fs"; // Import fs using ES module syntax

// Define log levels with icons for better readability
const logLevels = {
  info: "ℹ️ [INFO]",
  success: "✅ [SUCCESS]",
  warning: "⚠️ [WARNING]",
  error: "❌ [ERROR]",
};

// Function to log messages
export function log(message, level = "info") {
  // Use export
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${logLevels[level] || "[LOG]"} ${message}`;

  // Print to console
  console.log(logMessage);

  // Append logs to a file for debugging purposes
  fs.appendFileSync("generator.log", logMessage + "\n", "utf8");
}
