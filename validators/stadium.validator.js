const Joi = require("joi");
const joiErrorHandler = require("./joiErrorHandler.js");
const { objectIdValidator } = require("./validatorComponents.js");
const {  MANAGER } = require("../utils/constants");
const { SERVICES_LIST } = require("../utils/constants");
const { phoneNumberValidator } = require("./validatorComponents.js");
const extractLatLong = require("../utils/extractCoordinates.js");
const User = require("../models/user.model.js");

class StadiumValidator {
    async addStadiumValidator(req, res, next) {
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
            services: Joi.array()
            .items(Joi.string().valid(...SERVICES_LIST))
            .required(),
            stadiumImages: Joi.array().items(Joi.string()).optional(),
            capacity: Joi.number().positive().required(),
            positives: Joi.array().items(Joi.string()).required(),
            negatives: Joi.array().items(Joi.string()).required(),
            tickets: Joi.array()
                .items(Joi.string().custom(objectIdValidator))
                .optional(),
            stadiumVideos: Joi.array().items(Joi.string()).optional(),
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

    async updateStadiumValidator(req, res, next) {
        let { locationLink, manager } = req.body; 
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
            manager: Joi.string().custom(objectIdValidator).optional(),
            city: Joi.string().custom(objectIdValidator).optional(),
            stadiumImages: Joi.array().items(Joi.string().uri()).optional(),
            isActive: Joi.boolean().optional(),
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

        if (manager) {
            const managerUser = await User.findById(manager); 
            if (!managerUser || managerUser.role !== MANAGER) {
                return res.status(400).json({
                    success: false,
                    message: "Manager not found"
                });
            }
        }

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

        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                if (file.mimetype.startsWith("image")) {
                    req.body.stadiumImages = req.body.stadiumImages || [];
                    req.body.stadiumImages.push(`/uploads/images/${file.filename}`);
                }
                if (file.mimetype.startsWith("video")) {
                    req.body.stadiumVideos = req.body.stadiumVideos || [];
                    req.body.stadiumVideos.push(`/uploads/videos/${file.filename}`);
                }
            });
        }

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        if (req.body.stadiumImages) {
            req.body.stadiumImagesFull = req.body.stadiumImages.map(img => `${baseUrl}${img}`);
        }
        if (req.body.stadiumVideos) {
            req.body.stadiumVideosFull = req.body.stadiumVideos.map(vid => `${baseUrl}${vid}`);
        }

        next();
    }

}

module.exports = new StadiumValidator();
