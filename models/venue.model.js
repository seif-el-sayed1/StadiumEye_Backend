const mongoose = require("mongoose");

const venueSchema = new mongoose.Schema(
    {
        apiId: { type: Number, required: true, unique: true },
        name: { type: String, required: true },
        address: { type: String, default: null },
        city: { type: String, default: null },
        country: { type: String, required: true },
        capacity: { type: Number, default: null },
        surface: { type: String, default: null },
        image: { type: String, default: null }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Venue", venueSchema);