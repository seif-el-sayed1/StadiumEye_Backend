const Joi = require("joi");
const asyncHandler = require("express-async-handler");
const joiErrorHandler = require("./joiErrorHandler");
const { objectIdValidator, phoneNumberValidator } = require("./validatorComponents");
const ApiError = require("../utils/ApiError");
const { checkIfPhoneStartsWithPlus2 } = require("../middlewares/phoneNumberChecker.middleware");

class ManagerValidator {
    validateAddManager = asyncHandler(async (req, res, next) => {
        const schema = Joi.object({
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            phone: Joi.string()
                .custom(phoneNumberValidator)
                .required()
                .messages({
                    "any.required": "Phone is required",
                    "string.pattern.base": "Invalid Phone Number"
            }),
            email: Joi.string().email().required(),
        });
        joiErrorHandler(schema, req);
        checkIfPhoneStartsWithPlus2(req);
        next();
    });

    validateUpdateManager = asyncHandler(async (req, res, next) => {
        const schema = Joi.object({
            firstName: Joi.string().optional(),
            lastName: Joi.string().optional(),
            phone: Joi.string()
                .custom(phoneNumberValidator)
                .optional()
                .messages({
                    "any.required": "Phone is required",
                    "string.pattern.base": "Invalid Phone Number"
            }),
            email: Joi.string().email().optional(),
        });
        joiErrorHandler(schema, req);
        checkIfPhoneStartsWithPlus2(req);
        next();
    });
}


module.exports = new ManagerValidator();