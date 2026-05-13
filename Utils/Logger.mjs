import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirName = path.dirname(fileURLToPath(import.meta.url));

const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

export default class Logger {
  #level;
  #logFile;

  constructor() {
    this.#level = (process.env.LOG_LEVEL ?? "INFO").toUpperCase();

    const logsDir = path.join(__dirName, "../Logs");
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

    this.#logFile = fs.createWriteStream(path.join(logsDir, "app.log"), {
      flags: "a",
    });
  }

  #write(level, message) {
    if ((LEVELS[level] ?? 0) < (LEVELS[this.#level] ?? 0)) return;

    const line = `[${new Date().toISOString()}] [${level.padEnd(5)}] ${message}\n`;
    process.stdout.write(line);
    this.#logFile.write(line);
  }

  debug(message) { this.#write("DEBUG", message); }
  info(message)  { this.#write("INFO",  message); }
  warn(message)  { this.#write("WARN",  message); }
  error(message) { this.#write("ERROR", message); }
}

export const logger = new Logger();
