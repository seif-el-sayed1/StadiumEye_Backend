const mongoose = require("mongoose");
const { translate } = require("../utils/translation");

/**
 * Validates whether the given value is a valid MongoDB ObjectId.
 *
 * @param {string} value - The value to be validated as an ObjectId.
 * @param {object} helpers - A Joi helper object used for error handling.
 * @returns {string} - Returns the validated value if valid, or an error message if invalid.
 *
 * The function uses Mongoose's `Types.ObjectId.isValid()` method to check if the provided value is a valid ObjectId.
 * If the value is invalid, it generates an error message with the name of the field being validated using `helpers.message()`.
 * Otherwise, it returns the valid ObjectId value.
 */

exports.objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message(
      translate(
        `Invalid ${helpers.state.path[0]} id`,
        helpers.prefs.context.lang || "en"
      )
    );
  }
  return value;
};


exports.phoneNumberValidator = (value, helpers) => {
  const phonePattern = /^0\d{10}$/;
  if (!phonePattern.test(value)) {
    return helpers.message(
      translate("Invalid phone number format", helpers.prefs.context.lang || "en")
    );
  }
  return value;
};

