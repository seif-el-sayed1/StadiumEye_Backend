const args = require("minimist")(process.argv.slice(2));

require("colors");
require("dotenv").config();
const express = require("express");
const logger = require("./utils/logger");

// Express app
const app = express();
const server = require("http").createServer(app);

// Port Number
const PORT = args.port || process.env.PORT || 8000;

// Startup
require("./startup/logging")(app);
require("./startup/app")(app);
require("./startup/db")();
require("./startup/createSuperAdmin")();
// Server
server.listen(PORT, (_) => {
    console.log(`🚀 ~ Server  Running on port ~ ${PORT}`.blue.bold);
    logger.info(`Server (${process.env.NODE_ENV}) started on Port ${PORT} at ${new Date()}`);
});

module.exports = server;
