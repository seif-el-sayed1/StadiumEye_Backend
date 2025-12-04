const Joi = require("joi");
const asyncHandler = require("express-async-handler");
const joiErrorHandler = require("./joiErrorHandler");
const { objectIdValidator, phoneNumberValidator } = require("./validatorComponents");
const ApiError = require("../utils/ApiError");
const Team = require("../models/teams.model");
const { checkIfPhoneStartsWithPlus2 } = require("../middlewares/phoneNumberChecker.middleware");

class StaffValidator {
    validateAddStaff = asyncHandler(async (req, res, next) => {
        const { team } = req.body;
        const teamExists = await Team.findById(team);
        if (!teamExists) return next(new ApiError("Team does not exist", 400));
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

    validateUpdateStaff = asyncHandler(async (req, res, next) => {
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
            team: Joi.custom(objectIdValidator).optional(), 
        });
        joiErrorHandler(schema, req);
        checkIfPhoneStartsWithPlus2(req);
        next();
    });
}


module.exports = new StaffValidator();