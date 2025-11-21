const appRouter = require("express").Router();
const BASE_URL = "/api/v1";

const ApiError = require("../utils/ApiError");
// let adminRoutes = require("./admin.routes");
let adminAuthRoutes = require("./adminAuth.routes");
let cityRoutes = require("./city.routes");
let countryRoutes = require("./country.routes");
let userAuthRoutes = require("./userAuth.routes")
let stadiumRoutes = require("./stadium.routes");

const { app } = require("firebase-admin");

// appRouter.use(`${BASE_URL}/admins`, adminRoutes);
appRouter.use(`${BASE_URL}/admins/auth`, adminAuthRoutes);

appRouter.use(`${BASE_URL}/users/auth`, userAuthRoutes);
appRouter.use(`${BASE_URL}/countries`, countryRoutes);
appRouter.use(`${BASE_URL}/cities`, cityRoutes);
appRouter.use(`${BASE_URL}/stadiums`, stadiumRoutes);



appRouter.get("/", (req, res, next) => {
  res.status(200).json({
    status: true,
    message: "You're Server is up and running!"
  });
});

// Not Found Route
appRouter.use((req, res, next) => {
  next(new ApiError(`This Route (${req.originalUrl}) is not found`, 404));
});


module.exports = appRouter;
