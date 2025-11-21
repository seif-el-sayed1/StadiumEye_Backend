const path = require("path");
const cors = require("cors");
const express = require("express");
const bodyParser = require("body-parser");
const compression = require("compression");
const expressWinston = require("express-winston");
const { transports, format } = require("winston");
const AppRoutes = require("../routes/index.routes");
const globalError = require("../middlewares/error.middleware");

module.exports = (app) => {
  // Middlewares
  app.use(cors());
  app.use(compression());
  
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  // Use multer for handling form-data
  app.use(express.json({ limit: "25kb" }));
  app.use(express.static(path.join(__dirname, "uploads")));

  app.use((req, res, next) => {
    if (
      req.method.toLowerCase() === "post" ||
      req.method.toLowerCase() === "patch" ||
      req.method.toLowerCase() === "delete"
    ) {
      if (req.files)
        console.log(`🚀 ~ Logging ~ req.files: ${req.method} ${req.path}\n`, req.files);
      console.log(`🚀 ~ Logging ~ req.body: ${req.method} ${req.path}\n`, req.body);
    } else if (req.method.toLowerCase() === "get") {
      console.log(`🚀 ~ Logging ~ req.query: ${req.method} ${req.path}\n`, req.query);
    }
    next();
  });

  // All App Routes
  app.use(AppRoutes);

  const myLogFormat = format.printf(({ level, meta, timestamps }) => {
    return `${timestamps} ${level}: ${meta.message}`;
  });

  if (process.env.NODE_ENV !== "production") {
    app.use(
      expressWinston.errorLogger({
        transports: [
          new transports.File({
            filename: "1. logs/internalErrorLogs.log"
          })
        ],
        format: format.combine(
          format.errors({ stack: true }),
          format.json(),
          format.timestamp(),
          myLogFormat
        )
      })
    );
  } else {
    app.use(
      expressWinston.errorLogger({
        transports: [
          new transports.Console(),
          new transports.File({
            filename: path.join(__dirname, "1. logs", "app.log")
          })
        ],
        format: format.combine(
          format.errors({ stack: true }),
          format.json(),
          format.timestamp(),
          myLogFormat
        )
      })
    );
  }

  // Global Error Handler
  app.use(globalError);
};
