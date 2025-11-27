const Joi = require("joi");
const asyncHandler = require("express-async-handler");
const joiErrorHandler = require("./joiErrorHandler");
const { objectIdValidator, phoneNumberValidator } = require("./validatorComponents");
const ApiError = require("../utils/ApiError");
const { translate } = require("../utils/translation");
const City = require("../models/city.model");

const { checkIfPhoneStartsWithPlus2 } = require("../middlewares/phoneNumberChecker.middleware");


class StaffValidator {
    validateAddStaff = asyncHandler(async (req, res, next) => {
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
            team: Joi.custom(objectIdValidator).required(), 
        });
        joiErrorHandler(schema, req);
        checkIfPhoneStartsWithPlus2(req);
        next();
    });
}


module.exports = new StaffValidator();