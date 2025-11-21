const express = require("express");

// Auth middlewares
const { protect, allowedTo } = require("../middlewares/auth.middleware");

// Constants
const {  ADMIN } = require("../utils/constants");

// Classes
const CountryController = require("../controllers/country.controller");
const CountryValidator = require("../validators/country.validator");

// Router
const router = express.Router({ mergeParams: true });

// Routes
router
  .route("/")
  .get(CountryController.getAllCountries)
  .post(
    protect,
    CountryValidator.validateCountry,
    CountryController.addCountry
  );

router
  .route("/:id")
  .patch(
    protect,
    CountryValidator.validateUpdateCountry,
    CountryController.updateCountry
  );

router
  .route("/:id")
  .delete(
    protect,
    CountryValidator.validateDeleteCountry,
    CountryController.deleteCountry
  );

module.exports = router;
