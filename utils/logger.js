const winston = require("winston");
require("winston-mongodb");
let LOG_URI =
  process.env.NODE_ENV === "development" ? process.env.LOG_URI_DEV : process.env.LOG_URI;
const logger = winston.createLogger({
  transports:
    process.env.NODE_ENV === "production"
      ? [
          new winston.transports.File({ filename: "logfile.log" }),
          new winston.transports.MongoDB({
            db: LOG_URI,
            options: { useUnifiedTopology: true },
            level: "info"
          })
        ]
      : [new winston.transports.File({ filename: "logfile.log" })]
});

module.exports = logger;
