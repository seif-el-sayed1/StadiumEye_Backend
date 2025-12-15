const Joi = require("joi");
const joiErrorHandler = require("./joiErrorHandler.js");
const { objectIdValidator } = require("./validatorComponents.js");
const { SERVICES_LIST } = require("../utils/constants");
const extractLatLong = require("../utils/extractCoordinates.js");

class StadiumValidator {
    addStadiumValidator(req, res, next) {
        let { locationLink } = req.body;

        if (!locationLink) {
            return res.status(400).json({
                success: false,
                message: "locationLink is required"
            });
        }

        const latLong = extractLatLong(locationLink);
        if (!latLong) {
            return res.status(400).json({
                success: false,
                message: "Invalid Google Maps link"
            });
        }

        const schema = Joi.object({
            stadiumName: Joi.string().required(),
            city: Joi.string().custom(objectIdValidator).required(),
            stadiumImages: Joi.array().items(Joi.string()).optional(),
            capacity: Joi.number().positive().required(),
            positives: Joi.array().items(Joi.string()).required(),
            negatives: Joi.array().items(Joi.string()).required(),
            tickets: Joi.array()
                .items(Joi.string().custom(objectIdValidator))
                .optional(),
            stadiumVideos: Joi.array().items(Joi.string()).optional(),
            services: Joi.array()
                .items(Joi.string().valid(...SERVICES_LIST))
                .required(),
            locationLink: Joi.string().required()
        });
        
        joiErrorHandler(schema, req);

        req.body.location = {
            name: `${req.body.stadiumName} Location`,
            lat: latLong.lat,
            lng: latLong.long,
            type: "Point",
            address: locationLink.trim(),
            coordinates: [latLong.long, latLong.lat] // GeoJSON format [lng, lat]
        };

        next();
    }

    updateStadiumValidator(req, res, next) {
        let { locationLink } = req.body;

        let latLong = null;
        if (locationLink) {
            latLong = extractLatLong(locationLink);
            if (!latLong) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Google Maps link"
                });
            }
        }

        const schema = Joi.object({
            stadiumName: Joi.string().optional(),
            city: Joi.string().custom(objectIdValidator).optional(),
            stadiumImages: Joi.array().items(Joi.string().uri()).optional(),
            capacity: Joi.number().positive().optional(),
            positives: Joi.array().items(Joi.string()).optional(),
            negatives: Joi.array().items(Joi.string()).optional(),
            tickets: Joi.array()
                .items(Joi.string().custom(objectIdValidator))
                .optional(),
            stadiumVideos: Joi.array().items(Joi.string().uri()).optional(),
            services: Joi.array()
                .items(Joi.string().valid(...SERVICES_LIST))
                .optional(),
            locationLink: Joi.string().optional()
        });

        joiErrorHandler(schema, req);

        if (locationLink && latLong) {
            req.body.location = {
                name: `${req.body.stadiumName || "Stadium"} Location`,
                lat: latLong.lat,
                lng: latLong.long,
                type: "Point",
                address: locationLink.trim(),
                coordinates: [latLong.long, latLong.lat] 
            };
        }

        next();
    }

}

module.exports = new StadiumValidator();
