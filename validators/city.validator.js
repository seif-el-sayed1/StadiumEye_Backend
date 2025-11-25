const Joi = require("joi");
const User = require("../models/user.model.js");
const Country = require("../models/country.model.js");
const ApiError = require("../utils/ApiError.js");
const { translate } = require("../utils/translation.js");
const asyncHandler = require("express-async-handler");
const joiErrorHandler = require("./joiErrorHandler.js");
const { objectIdValidator } = require("./validatorComponents.js");

/**
 * CityValidator class for validating city-related requests.
 *
 * This class provides methods to validate the creation and deletion of cities.
 */
class CityValidator {
  /**
   * Validates the request body for creating a new city.
   *
   * @param {object} req - The incoming request object containing the city data.
   * @param {object} res - The outgoing response object.
   * @param {function} next - The middleware function to pass control to the next middleware.
   *
   * This method validates:
   * - nameEn: Required, must be a string representing the city's name in English.
   * - nameAr: Required, must be a string representing the city's name in Arabic.
   * - country: Required, must be a valid ObjectId referencing the country where the city is located.
   *
   * Custom validation:
   * - Ensures that the `country` field contains a valid country ID.
   *
   * @throws {ApiError} - If Joi validation fails or the country does not exist.
   */
  validateCity = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      nameEn: Joi.string().required().messages({
        "any.required": "English name is required"
      }),
      nameAr: Joi.string().optional().messages({
        "any.required": "Arabic name is required"
      }),
      country: Joi.string().custom(objectIdValidator).required()
    });
    joiErrorHandler(schema, req);
    const countryExists = await Country.findById(req.body.country);
    if (!countryExists) return next(new ApiError(translate("Invalid country", req.headers.lang), 404));
    next();
  });
  /**
   * Validates if a city can be deleted.
   *
   * @param {object} req - The incoming request object containing the city ID.
   * @param {object} res - The outgoing response object.
   * @param {function} next - The middleware function to pass control to the next middleware.
   *
   * This method checks if the city is being used by any user. If so, deletion is blocked.
   *
   * @throws {ApiError} - If the city is in use by any user.
   */
  validateDeleteCity = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const cityUsed = await User.findOne({ city: id }, { options: { skipPopulation: false } });
    if (cityUsed) return next(new ApiError(translate("City is in use", req.headers.lang), 400));
    next();
  });
}

module.exports = new CityValidator();
