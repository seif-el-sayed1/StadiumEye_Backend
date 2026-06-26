const mongoose = require("mongoose");
const { SERVICES_LIST } = require("../utils/constants");

const stadiumSchema = new mongoose.Schema({
    stadiumName: {
        type: String,
    },
    city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "City",
    },
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    stadiumImages: {
        type: [String],
    }, 
    capacity: {
        type: Number,
    },
    positives: {
        type: [String],
    },
    negatives: {
        type: [String],
    },
    ticketsCounts: {
        type: Number,
        default: 0   
    },
    isActive: {
        type: Boolean,
        default: true
    },
    stadiumVideos: {
        type: [String],
    },
    locationLink: {
        type: String,
        required: [true, "Location link is required"]
    },
    location: {
        name: String,
        lat: Number,
        lng: Number,
        //GeoJSON
        type: {
            type: String,
            default: "Point",
            enum: ["Point"]
        },
        address: String,
        coordinates: {
            type: [Number], //[lng, lat]
            default: [0, 0]
        }
    },
    ratingsAverage: {
        type: Number,
        default: 0,
        min: [0, "A Rating must be above 1.0"],
        max: [5, "A Rating must be below 5.0"],
        set: (val) => Math.round(val * 10) / 10 // 4.666666 => 46.6666 => 47 => 4.7
    },
    reviewsQuantity: {
        type: Number,
        default: 0
    },

}, { timestamps: true });


stadiumSchema.index({ stadiumName: 1 });

module.exports = mongoose.model("Stadium", stadiumSchema);