const mongoose = require("mongoose");
const { STADIUM_AREA, TICKET_STATUS,
    TICKET_PRIORITIES, TICKET_TYPES
} = require("../utils/constants");

const ticketSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    stadium: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Stadium",
        required: true
    },
    area: {
        type: String,
        enum: STADIUM_AREA,
        required: true
    },
    ticketType: {
        type: String,
        enum: TICKET_TYPES,
        required: true
    },
    status: {
        type: String,
        enum: TICKET_STATUS,
        default: "open"
    },
    observations: {
        type: String,
        required: [true, "Observations are required"]
    },
    challenges: String,
    lessonsLearned: String,
    ticketVideos: [String],
    ticketImages: [String],
    priority: {
        type: String,
        enum: TICKET_PRIORITIES,
        default: "medium"
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    visibility: {
        type: String,
        enum: ["public", "private"],
        default: "public"
    },  
    beforeAfterImages: {
        before: [String],
        after: [String],
    },
    locationLink: {
        type: String,
        required: true
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
            type: [Number], // [lng, lat]
            default: [0, 0]
        }
    },
    
}, { timestamps: true });


ticketSchema.pre(/\bfind/, async function (next) {
    this.populate({
        path: "stadium",
        model: "Stadium",
        select: "stadiumName"
    });
    this.populate({
        path: "createdBy",
        model: "User",
        select: "firstName lastName email"
    });
    next();
});


module.exports = mongoose.model("Ticket", ticketSchema);