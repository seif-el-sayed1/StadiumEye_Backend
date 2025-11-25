const Joi = require("joi");
const asyncHandler = require("express-async-handler");
const joiErrorHandler = require("./joiErrorHandler");
const { objectIdValidator, phoneNumberValidator } = require("./validatorComponents");
const ApiError = require("../utils/ApiError");
const { translate } = require("../utils/translation");
// const City = require("../models/city.model");
const User = require("../models/user.model");
const {
  GENDER_LIST_EN,
  GENDER_LIST_AR,
  LOGIN_TYPE_PLATFORM_LIST,
  LANGS
} = require("../utils/constants");
const { checkIfPhoneStartsWithPlus2 } = require("../middlewares/phoneNumberChecker.middleware");

/**
 * UserValidator class for validating user registration requests.
 *
 * This class contains methods for validating user data during the registration process using Joi and additional checks.
 */
class UserValidator {
  /**
   * Validates the incoming registration request for user creation.
   *
   * @param {object} req - The incoming request object containing the user's registration data.
   * @param {object} res - The outgoing response object.
   * @param {function} next - The middleware function to pass control to the next middleware.
   *
   * This method uses Joi to validate the following fields:
   * - firstName: Required string between 2-32 characters.
   * - lastName: Required string between 2-32 characters.
   * - type: Required, must be one of the values from USER_TYPE_LIST.
   * - email: Required, must be a valid email.
   * - phone: Required, must match the pattern for an Egyptian phone number.
   * - city: Required, must be a valid ObjectId.
   * - country: Required, must be a valid ObjectId.
   * - region: Required string.
   * - genderEn: Required, must be one of the values from GENDER_LIST_EN.
   * - genderAr: Optional, must be one of the values from GENDER_LIST_AR.
   * - dateOfBirth: Required, must be a valid date.
   * - taxNumber: Optional, must be a number.
   * - password: Required, minimum of 6 characters.
   * - confirmPassword: Required, must match the `password` field.
   * - services: Required if `type` is "Entity", otherwise optional.
   *
   * The schema uses Joi's custom validation for ObjectId fields, such as city and country.
   *
   * After the Joi validation, a database check is performed to ensure the city exists in the database.
   * If the city is not found, an ApiError is thrown with a 400 status code.
   *
   * @throws {ApiError} - If the city is invalid or Joi validation fails.
   */
  validateRegisterUser = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
        firstName: Joi.string()
            .when("loginType", {
                is: Joi.valid(...LOGIN_TYPE_PLATFORM_LIST),
                then: Joi.optional().allow(""),
                otherwise: Joi.required()
            })
            .min(2)
            .max(32)
            .messages({ "any.required": "First Name is required" }),

        lastName: Joi.string()
            .when("loginType", {
                is: Joi.valid(...LOGIN_TYPE_PLATFORM_LIST),
                then: Joi.optional().allow(""),
                otherwise: Joi.required()
            })
            .min(2)
            .max(32)
            .messages({ "any.required": "Last Name is required" }),

        email: Joi.string()
            .email()
            .required()
            .messages({
                "any.required": "Email is required",
                "string.email": "Invalid Email Address"
            }),

        phone: Joi.string()
            .custom(phoneNumberValidator)
            .required()
            .messages({
                "any.required": "Phone is required",
                "string.pattern.base": "Invalid Phone Number"
            }),

        city: Joi.string()
            .custom(objectIdValidator)
            .required()
            .messages({ "any.required": "City is required" }),
          
        country: Joi.string()
            .custom(objectIdValidator)
            .required()
            .messages({ "any.required": "Country is required" }),

        profilePicture: Joi.string()
            .optional(),

        genderEn: Joi.string()
            .valid(...GENDER_LIST_EN)
            .required()
            .messages({ "any.required": "Gender is required" }),

        genderAr: Joi.string()
            .valid(...GENDER_LIST_AR)
            .optional(),

        dateOfBirth: Joi.date()
            .required()
            .messages({ "any.required": "Date of Birth is required" }),

        loginType: Joi.string()
            .optional(),

        password: Joi.string()
            .min(6)
            .when("loginType", { is: Joi.exist(), then: Joi.optional() })
            .messages({
                "string.min": "Password must be at least 6 characters",
                "any.required": "Password is required"
            }),

        confirmPassword: Joi.string()
            .valid(Joi.ref("password"))
            .when("loginType", { is: Joi.exist(), then: Joi.optional() })
            .messages({
                "any.required": "Confirm Password is required",
                "any.only": "Passwords do not match"
            }),

        notificationToken: Joi.string()
            .optional()
    });

    joiErrorHandler(schema, req);
    checkIfPhoneStartsWithPlus2(req);
    next();
  });



  validateUpdateUser = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      firstName: Joi.string().optional().min(2).max(32),
      lastName: Joi.string().optional().min(2).max(32),
      profilePicture: Joi.string().optional(),
      dateOfBirth: Joi.date().optional(),
      phone: Joi.string().custom(phoneNumberValidator).optional().messages({
        "string.pattern.base": "Phone number must start with '0' and contain exactly 11 digits",
        "any.required": "Phone number is required"
      }),
      email: Joi.string().email().optional(),
      city: Joi.custom(objectIdValidator).optional(),
      country: Joi.custom(objectIdValidator).optional(),
      // region: Joi.custom(objectIdValidator).optional(),
      genderEn: Joi.string()
        .valid(...GENDER_LIST_EN)
        .optional(),
      genderAr: Joi.string()
        .valid(...GENDER_LIST_AR)
        .optional(),
      dateOfBirth: Joi.date().optional(),
      // Validate location using the defined schema
    });
    joiErrorHandler(schema, req);
    // Check city existence
    let { city, genderEn } = req.body;
    if (city) {
      const existingCity = await City.findById(city).populate("country").lean();
      if (!existingCity) return next(new ApiError(translate("Invalid city", req.headers.lang), 400));
    }
    if (genderEn) {
      switch (genderEn.toLowerCase()) {
        case "male":
          req.body.genderAr = "ذكر";
          break;
        case "female":
          req.body.genderAr = "أنثى";
          break;
      }
    }
    checkIfPhoneStartsWithPlus2(req);
    let { phone, email } = req.body;
    if (phone) {
      if (phone !== req.user.phone) {
        let user = await User.findOne({
          $or: [{ phone }, { unverifiedPhone: phone }],
          _id: { $ne: req.user._id }
        });
        if (user) return next(new ApiError(translate("Duplicated Phone Number", req.headers.lang), 400));
      } else return next(new ApiError(translate("This Phone Number Has Been Verified Before", req.headers.lang), 400));
    } else if (email) {
      if (email !== req.user.email) {
        let user = await User.findOne({
          $or: [{ email }, { unverifiedEmail: email }],
          _id: { $ne: req.user._id }
        });
        if (user) return next(new ApiError(translate("Duplicated Email", req.headers.lang), 400));
      } else return next(new ApiError(translate("This Email Has Been Verified Before", req.headers.lang), 400));
    }
    next();
  });

  validateUserBlock = asyncHandler(async (req, res, next) => {
    let { id } = req.params;
    if (id.toString() === req.userId.toString())
      return next(new ApiError(translate("You Can't Block Yourself", req.headers.lang), 400));
    let user = await User.findById(id, null, { skipPopulation: true });
    if (!user) return next(new ApiError(translate("User Not Found!", req.headers.lang), 404));
    next();
  });

  checkUserExistence = asyncHandler(async (req, res, next) => {
    let { id } = req.params;
    let user = await User.findById(id);
    if (!user) return next(new ApiError(translate("User Not Found!", req.headers.lang), 404));
    req.requestedUser = user; // this is the intendedUser to add action on him
    next();
  });

  validateDeleteImages = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      deletedPhotos: Joi.array().items(Joi.string()).required(), // Limiting images to a maximum of 4,
      type: Joi.string()
        .required()
        .valid(...USER_TYPE_LIST)
    });
    joiErrorHandler(schema, req);

    let { id: _id } = req.params;
    let requestedUser = await User.findById(_id, null, { skipPopulation: true });
    if (!requestedUser) return next(new ApiError(translate("User Not Found!", req.headers.lang), 404));
    req.requestedUser = requestedUser;
    next();
  });

  validateLanguageUpdate = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      lang: Joi.string()
        .required()
        .valid(...LANGS)
    });
    joiErrorHandler(schema, req);
    next();
  });
}

module.exports = new UserValidator();
