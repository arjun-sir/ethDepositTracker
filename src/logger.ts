import * as dotenv from "dotenv";
import winston from "winston";

dotenv.config();

const logger = winston.createLogger({
    level: "debug", // Set log level to debug for higher verbosity
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: "eth-deposit-tracker-ts" },
    transports: [
        // Comment out file logging for now to focus on console output
        // new winston.transports.File({ filename: "error.log", level: "error" }),
        // new winston.transports.File({ filename: "combined.log" }),
    ],
});

logger.add(
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.timestamp(),
            winston.format.printf(({ timestamp, level, message }) => {
                return `${timestamp} [${level}]: ${message}`;
            })
        ),
    })
);

export default logger;

// Test the logger in the console
logger.debug("Debug log - should appear in the console");
logger.info("Info log - should appear in the console");
logger.error("Error log - should appear in the console");
