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
            required: [true, "Stadium coordinates are required"],
            validate: {
                validator: function (v) {
                    return (
                        Array.isArray(v) &&
                        v.length === 2 &&
                        !(v[0] === 0 && v[1] === 0) &&
                        v[0] >= -180 && v[0] <= 180 &&
                        v[1] >= -90 && v[1] <= 90
                    );
                },
                message: "Invalid or missing coordinates for stadium location."
            }
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
stadiumSchema.index({ stadiumName: 1 });
stadiumSchema.index({ "location.coordinates": "2dsphere" }); 


module.exports = mongoose.model("Stadium", stadiumSchema);