const mongoose = require("mongoose");
const logger = require("../utils/logger");

mongoose.set("strictQuery", false);
let NODE_ENV = process.env.NODE_ENV;
const PASSWORD =
  NODE_ENV === "development" ? process.env.MONGO_PASSWORD_DEV : process.env.MONGO_PASSWORD;
let MONGO_URI = NODE_ENV === "development" ? process.env.MONGO_URI_DEV : process.env.MONGO_URI;
const DB = MONGO_URI.replace("<PASSWORD>", PASSWORD);
module.exports = (_) => {
  mongoose.connect(DB).then((conn) => {
    console.log(`Database Connected: ${conn.connection.host}`.green.bold);
    logger.info(`Database Connected: ${conn.connection.host}`);
  });
};