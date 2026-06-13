const Joi = require("joi");
const joiErrorHandler = require("./joiErrorHandler.js");
const { objectIdValidator } = require("./validatorComponents.js");
const { STADIUM_AREA, TICKET_TYPES } = require("../utils/constants.js");
const Tickets = require("../models/ticket.model");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("express-async-handler");

class TicketsValidator {

    addTicketValidator = asyncHandler(async (req, res, next) => {
        const schema = Joi.object({
            createdBy: Joi.custom(objectIdValidator).required(),
            stadium: Joi.custom(objectIdValidator).required(),
            area: Joi.string().valid(...STADIUM_AREA).required(),
            ticketType: Joi.string().valid(...TICKET_TYPES).required(),

            // Determines whether the ticket is created via AI detection or manual user input
            mode: Joi.string().valid("manual", "ai").required(),

            // Required only in manual mode — in AI mode the AI provides the findings
            observations: Joi.string().when("mode", {
                is: "manual",
                then: Joi.required(),
                otherwise: Joi.optional(),
            }),

            challenges: Joi.string().optional(),
            lessonsLearned: Joi.string().optional(),

            ticketVideos: Joi.array().items(Joi.string()).optional(),
            ticketImages: Joi.array().items(Joi.string()).optional(),
            ticketVoices: Joi.array().items(Joi.string()).optional(),

            // Required when mode is "ai" and forbidden in manual mode since AI is not involved
            modelType: Joi.string()
                .valid("safety", "visualPollution")
                .when("mode", {
                    is: "ai",
                    then: Joi.required(),
                    otherwise: Joi.forbidden(),
                }),
        });
        req.body.createdBy = req.user._id;
        joiErrorHandler(schema, req);
        next();
    });

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

    updateTicketValidator = asyncHandler(async (req, res, next) => {
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

        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                if (file.mimetype.startsWith("image")) {
                    req.body.ticketImages = req.body.ticketImages || [];
                    req.body.ticketImages.push(`/uploads/images/${file.filename}`);
                }
                if (file.mimetype.startsWith("video")) {
                    req.body.ticketVideos = req.body.ticketVideos || [];
                    req.body.ticketVideos.push(`/uploads/videos/${file.filename}`);
                }
                if (file.mimetype.startsWith("audio")) {
                    req.body.ticketVoices = req.body.ticketVoices || [];
                    req.body.ticketVoices.push(`/uploads/voices/${file.filename}`);
                }
            });
        }

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        if (req.body.ticketImages) {
            req.body.ticketImagesFull = req.body.ticketImages.map(img => `${baseUrl}${img}`);
        }
        if (req.body.ticketVideos) {
            req.body.ticketVideosFull = req.body.ticketVideos.map(vid => `${baseUrl}${vid}`);
        }
        if (req.body.ticketVoices) {
            req.body.ticketVoicesFull = req.body.ticketVoices.map(audio => `${baseUrl}${audio}`);
        }

        next();
    });


}


module.exports = new TicketsValidator();