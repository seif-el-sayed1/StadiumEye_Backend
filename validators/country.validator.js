const Joi = require("joi");
const ApiError = require("../utils/ApiError.js");
const { translate } = require("../utils/translation.js");
const asyncHandler = require("express-async-handler");
const joiErrorHandler = require("./joiErrorHandler.js");
const Country = require("../models/country.model.js");
const City = require("../models/city.model.js");

/**
 * CountryValidator class for validating country-related requests.
 *
 * This class contains methods to validate the creation, deletion, and associated cities of countries.
 */
class CountryValidator {
  /**
   * Validates the request body for creating a new country.
   *
   * @param {object} req - The incoming request object containing the country data.
   * @param {object} res - The outgoing response object.
   * @param {function} next - The middleware function to pass control to the next middleware.
   *
   * This method validates:
   * - nameEn: Required, must be a string representing the English name of the country.
   * - nameAr: Required, must be a string representing the Arabic name of the country.
   *
   * @throws {ApiError} - If Joi validation fails.
   */
  validateCountry = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      nameEn: Joi.string().required().messages({
        "any.required": "English name is required"
      }),
      nameAr: Joi.string().optional().messages({
        "any.required": "Arabic name is required"
      })
    });
    joiErrorHandler(schema, req);
    next();
  });

  /**
   * Validates the request to retrieve cities associated with a specific country.
   *
   * @param {object} req - The incoming request object containing the country ID.
   * @param {object} res - The outgoing response object.
   * @param {function} next - The middleware function to pass control to the next middleware.
   *
   * This method checks if the specified country exists. If it does, the country ID is attached to the query parameters.
   *
   * @throws {ApiError} - If the country is not found.
   */
  validateCountryCities = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const country = await Country.findById(id);
    if (!country) return next(new ApiError(translate("Country not found", req.headers.lang), 404));
    req.query.country = id;
    next();
  });

  validateUpdateCountry = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const country = await Country.findById(id);
    if (!country) return next(new ApiError(translate("Country not found", req.headers.lang), 404));
    next();
  });

  validateDeleteCountry = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const countryUsed = await City.findOne({ country: id });
    if (countryUsed) return next(new ApiError(translate("Country is in use", req.headers.lang), 400));
    next();
  });
}

module.exports = new CountryValidator();
