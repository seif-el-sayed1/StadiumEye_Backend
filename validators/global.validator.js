const Joi = require("joi");
const asyncHandler = require("express-async-handler");
const joiErrorHandler = require("./joiErrorHandler");
const User = require("../models/user.model");
const { LOGIN_TYPE_LIST, LOGIN_TYPE_PLATFORM_LIST, LANGS } = require("../utils/constants");
const ApiError = require("../utils/ApiError");
const { translate } = require("../utils/translation");
const { checkIfPhoneStartsWithPlus2 } = require("../middlewares/phoneNumberChecker.middleware");
const { phoneNumberValidator } = require("./validatorComponents");

class GlobalValidator {
  validateLogin = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      email: Joi.string().email().required(), 
      loginType: Joi.string()
        .valid(...LOGIN_TYPE_LIST)
        .optional(),
      password: Joi.when("loginType", {
        is: Joi.string().valid(...LOGIN_TYPE_PLATFORM_LIST),
        then: Joi.string().optional().allow(""),
        otherwise: Joi.string().min(8).required()
      }).messages({
        "string.min": "Password must be at least 8 characters long",
        "any.required": "Password is required"
      }),
      notificationToken: Joi.string().optional()
    }).messages({
      "any.required": "Email is required",
      "string.email": "Invalid Email Address"
    });

    joiErrorHandler(schema, req);
    next();
  });

  validateNewPassword = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      password: Joi.string().min(8).required().messages({
        "string.min": "Password must be at least 8 characters long",
        "any.required": "Password is required"
      }),
      confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
        "any.only": "Confirm password must match password",
        "any.required": "Confirm password is required"
      })
    });
    joiErrorHandler(schema, req);
    next();
  });

  validateChangePassword = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      currentPassword: Joi.string().required().messages({
        "any.required": "Current password is required"
      }),
      newPassword: Joi.string().min(8).required().messages({
        "string.min": "New Password must be at least 8 characters long",
        "any.required": "Password is required"
      }),
      confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({
        "any.only": "Confirm password must match password",
        "any.required": "Confirm password is required"
      })
    });
    joiErrorHandler(schema, req);
    next();
  });

  forgetPasswordValidator = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      email: Joi.string().email().required()
    })
      .messages({
        "any.required": "Email must be provided"
      });
    joiErrorHandler(schema, req);
    const { email } = req.body;
    // Check User
    let user;
    let errorMessage;
    if (email) {
      user = await User.findOne({ email });
      errorMessage = "Invalid Email Address";
    }
    if (!user) return next(new ApiError(translate(errorMessage, req.headers.lang), 404));
    if (user.loginType !== "email")
      return next(
        new ApiError(
          `This Account Has logged in with ${user.loginType}, so you can't reset your password`,
          400
        )
      );
    req.requestedUser = user;
    next();
  });


  resetPasswordCodeValidator = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      code: Joi.string().required()
    }).messages({
      "any.required": "Email must be provided",
      "string.email": "Invalid Email Address"
    });

    joiErrorHandler(schema, req);

    const { email } = req.body;
    // Check User
    let user = await User.findOne({ email });
    if (!user) return next(new ApiError(translate("Invalid Email Address", req.headers.lang), 404));

    req.requestedUser = user;
    next();
  });


  resetPasswordValidator = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      newPassword: Joi.string().min(6).required(),
      confirmNewPassword: Joi.string().valid(Joi.ref("newPassword")).required()
    }).messages({
      "any.required": "Email must be provided",
      "string.email": "Invalid Email Address"
    });

    joiErrorHandler(schema, req);

    const { email } = req.body;
    // Check User
    let user = await User.findOne({ email });
    if (!user) return next(new ApiError(translate("Invalid Email Address", req.headers.lang), 404));

    // Check reset code verified field
    if (!user.passwordResetCodeVerified)
      return next(new ApiError(translate("Reset code is not verified", req.headers.lang), 401));

    req.requestedUser = user;
    next();
  });


  deactivateAccountValidator = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      hardDeleted: Joi.bool().optional(),
      explanation: Joi.string().allow("", null).optional()
    });
    joiErrorHandler(schema, req);
    // let user = req.user;
    // let { password } = req.body;
    // // Check Password
    // if (!(await user.comparePassword(password)))
    //   return next(new ApiError("Incorrect password", 401));
    next();
  });

  sendOtpValidator = asyncHandler(async (req, res, next) => {
    const schema = Joi.object({
      phone: Joi.string().custom(phoneNumberValidator).optional(),
      email: Joi.string().email().optional()
    }).xor("email", "phone");
    joiErrorHandler(schema, req);
    checkIfPhoneStartsWithPlus2(req);
    next();
  });

  updateUserLangValidator = asyncHandler(async (req, res, next) => {
    let lang = req.headers.lang?.toLowerCase();
    req.body.lang = lang;
    const schema = Joi.object({
      lang: Joi.string()
        .valid(...LANGS)
        .required()
        .messages({
          "string.valid": "Invalid language",
          "any.required": "Language is required"
        })
    });
    joiErrorHandler(schema, req);
    next();
  });
}

module.exports = new GlobalValidator();
