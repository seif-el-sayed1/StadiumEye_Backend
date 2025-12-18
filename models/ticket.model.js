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
    stadiumStatus: {
        type: String,
        enum: ["active", "inActive", "deleted"],
        default: "active"
    },
    observations: {
        type: String,
        required: [true, "Observations are required"]
    },
    challenges: String,
    lessonsLearned: String,
    ticketVideos: [String],
    ticketImages: [String],
    ticketVoices:[String],
    priority: {
        type: String,
        enum: TICKET_PRIORITIES,
        default: "medium"
    },
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    assignedTo: {   
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    closedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
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
    ticketDetections: [
        {
            url: String,       
            type: { type: String, enum: ["image", "video"] },
            modelType: { type: String, enum: ["safety", "visualPollution"] }, 
            detections: [
                {
                    Id: Number,
                    ClassName: String,
                    confidence: Number,
                    x: Number,
                    y: Number,
                    width: Number,
                    height: Number
                }
            ]
        }
    ]
    
}, { timestamps: true });


ticketSchema.post("save", async function(doc, next) {
    await mongoose.model("Stadium").findByIdAndUpdate(
        doc.stadium,
        { $inc: { ticketsCounts: 1 } }
    );
    next();
});

ticketSchema.pre(/^find/, async function (next) {
    this.populate({
        path: "stadium",
        model: "Stadium",
        select: "stadiumName"
    });
    this.populate({
        path: "rejectedBy",
        model: "User",
        select: "firstName lastName email"
    }),
    this.populate({
        path: "closedBy",
        model: "User",
        select: "firstName lastName email"
    })
    this.populate({
        path: "createdBy",
        model: "User",
        select: "firstName lastName email"
    });
    this.populate({
        path: "assignedTo",
        model: "Team",
        select: "teamName teamType staff"
    });
    this.populate({
        path: "assignedBy",
        model: "User",
        select: "firstName lastName email"
    });
    next();
});


module.exports = mongoose.model("Ticket", ticketSchema);