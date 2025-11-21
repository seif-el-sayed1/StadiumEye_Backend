const morgan = require("morgan");
const { createLogger, transports, format } = require("winston");
const expressWinston = require("express-winston");
require("winston-mongodb");
let LOG_URI =
  process.env.NODE_ENV === "development" ? process.env.LOG_URI_DEV : process.env.LOG_URI;
module.exports = (app) => {
  // Create a winston logger instance
  if (process.env.NODE_ENV !== "production") {
    const logger = createLogger({
      transports: [
        new transports.File({
          level: "warn",
          filename: "1. logs/warningLogs.log"
        }),
        new transports.File({
          level: "error",
          filename: "1. logs/errorLogs.log"
        }),
        new transports.File({
          level: "info",
          filename: "1. logs/infoLogs.log"
        }),
        new transports.MongoDB({
          level: "error",
          db: LOG_URI,
          options: { useUnifiedTopology: true }
        }),
        new transports.MongoDB({
          level: "warn",
          db: LOG_URI,
          options: { useUnifiedTopology: true }
        })
      ],
      format: format.combine(
        format.errors({ stack: true }),
        format.json(),
        format.timestamp(),
        format.metadata()
        // format.prettyPrint()
      ),
      statusLevels: true
    });

    // Use express-winston middleware for logging
    app.use(
      expressWinston.logger({
        transports: logger.transports, // Reuse the same transports
        format: logger.format, // Reuse the same format
        statusLevels: true
      })
    );
  }
  console.log(`Mode: ${process.env.NODE_ENV}`.blue.bold);

  // Production-specific settings for uncaught exceptions and unhandled rejections
  // if (process.env.NODE_ENV !== "production") {
  // 	expressWinston.logger.exceptions.handle(
  // 		new transports.File({ filename: "1. logs/uncaughtExceptions.log" })
  // 	);

  // 	process.on("unhandledRejection", (ex) => {
  // 		expressWinston.logger.error(ex.message, ex);
  // 		throw ex;
  // 	});
  // }

  app.use(morgan("dev"));
};
