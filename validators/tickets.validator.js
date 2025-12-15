const Joi = require("joi");
const joiErrorHandler = require("./joiErrorHandler.js");
const { objectIdValidator } = require("./validatorComponents.js");
const { STADIUM_AREA, TICKET_TYPES } = require("../utils/constants.js");
const Tickets = require("../models/ticket.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("express-async-handler");

class TicketsValidator {
    addTicketValidator(req, res, next) {

        const schema = Joi.object({
            createdBy: Joi.custom(objectIdValidator).required(),
            stadium: Joi.custom(objectIdValidator).required(),
            area: Joi.string().valid(...STADIUM_AREA).required(),
            ticketType: Joi.string().valid(...TICKET_TYPES).required(),
            observations: Joi.string().required(),
            challenges: Joi.string().optional(),
            lessonsLearned: Joi.string().optional(),

            ticketVideos: Joi.array().items(Joi.string()).optional(),
            ticketImages: Joi.array().items(Joi.string()).optional(),
            ticketVoices: Joi.array().items(Joi.string()).optional(),

            modelType: Joi.string()
                .valid("safety", "visualPollution")
                .when("ticketImages", {
                    is: Joi.array().min(1),
                    then: Joi.required(),
                })
                .when("ticketVideos", {
                    is: Joi.array().min(1),
                    then: Joi.required(),
                }),
        });

        req.body.createdBy = req.user._id;

        joiErrorHandler(schema, req);

        next();
    }

    checkIfTicketIsOpen = asyncHandler(async (req, res, next) => {
        const ticket = await Tickets.findById(req.params.id);

        if (!ticket) {
            return next(new ApiError("Ticket not found", 404));
        }

        if (ticket.status !== "open") {
            return next(
                new ApiError(`Ticket is ${ticket.status} You can't update`, 400)
            );
        }

        next();
    });

    updateTicketValidator(req, res, next) {
        const schema = Joi.object({
            area: Joi.string().valid(...STADIUM_AREA).optional(),
            ticketType: Joi.string().valid(...TICKET_TYPES).optional(),
            observations: Joi.string().optional(),
            challenges: Joi.string().optional(),
            lessonsLearned: Joi.string().optional(),
            ticketVideos: Joi.array().items(Joi.string().uri()).optional(),
            ticketImages: Joi.array().items(Joi.string().uri()).optional(),
            ticketVoices: Joi.array().items(Joi.string().uri()).optional(),
        });

        joiErrorHandler(schema, req);

        next();
    }

}


module.exports = new TicketsValidator();