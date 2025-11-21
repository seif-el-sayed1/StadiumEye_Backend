const express = require("express");

// Auth middlewares
const { protect, allowedTo } = require("../middlewares/auth.middleware");

// Constants
const { ADMIN } = require("../utils/constants");

// Classes
const CityController = require("../controllers/city.controller");
const CityValidator = require("../validators/city.validator");

// Router
const router = express.Router({ mergeParams: true });

// Routes
router
  .route("/")
  .get(CityController.getAllCities)
  .post(
    protect,
    CityValidator.validateCity,
    CityController.addCity
  );

router
  .route("/:id")
  .patch(
    protect,
    CityValidator.validateCity,
    CityController.updateCity
  )
  .delete(
    protect,
    CityValidator.validateDeleteCity,
    CityController.deleteCity
  );

module.exports = router;
